const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateSellerApplication } = require("../services/sellerApplicationValidation");
const { MAX_DOCUMENT_BYTES, MAX_DOCUMENTS_PER_APPLICATION, MAX_DOCUMENTS_PER_REQUEST, matchesFileSignature, validateSellerDocument } = require("../services/privateSellerDocuments");
const SellerProfile = require("../models/sellerProfileModel");
const User = require("../models/userModel");
const { requireApprovedSeller } = require("../middleware/seller");
const { requireAdmin } = require("../middleware/admin");
const { mutableFields } = require("../controllers/sellerProductController");
const sellerProductController = require("../controllers/sellerProductController");
const { agreementAcceptanceUpdates } = require("../controllers/sellerController");
const { productCategoryValues } = require("../services/productCategories");
const { validClassification } = require("../services/productClassification");
const productController = require("../controllers/productController");
const AdminAuditLog = require("../models/adminAuditLogModel");

const application = {
  storeName: "Green Goods",
  contactEmail: "seller@example.com",
  contactPhone: "+919876543210",
  address: { line1: "1 Main Road", city: "Pune", region: "MH", postalCode: "411001", country: "IN" },
};

const mockResponse = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("validates individual seller applications", () => {
  const result = validateSellerApplication({ ...application, sellerType: "individual", individual: { legalName: "A Seller" } });
  assert.deepEqual(result.errors, []);
  assert.equal(result.data.slug, "green-goods");
  assert.equal(result.data.individual.legalName, "A Seller");
});

test("validates registered business details without requiring optional tax ID", () => {
  const result = validateSellerApplication({ ...application, sellerType: "business", business: { legalName: "Green Goods Limited", registrationNumber: "REG-42" } });
  assert.deepEqual(result.errors, []);
  assert.equal(result.data.business.taxId, "");
});

test("rejects missing legal details and unsupported operating countries", () => {
  const missingLegal = validateSellerApplication({ ...application, sellerType: "business", business: {} });
  assert.ok(missingLegal.errors.some((error) => error.includes("legal name and registration number")));
  const unsupportedCountry = validateSellerApplication({ ...application, sellerType: "individual", individual: { legalName: "A Seller" }, address: { ...application.address, country: "US" } }, ["IN"]);
  assert.ok(unsupportedCountry.errors.some((error) => error.includes("not enabled for US")));
  const unsupportedRegistration = validateSellerApplication({ ...application, sellerType: "individual", individual: { legalName: "A Seller" }, address: { ...application.address, country: "US" } });
  assert.ok(unsupportedRegistration.errors.some((error) => error.includes("not enabled for US")));
});

test("rejects verification file signature mismatches", () => {
  const validPdf = { mimetype: "application/pdf", buffer: Buffer.from("%PDF-1.7 sample") };
  const fakePdf = { mimetype: "application/pdf", buffer: Buffer.from("not a pdf") };
  assert.equal(matchesFileSignature(validPdf), true);
  assert.equal(matchesFileSignature(fakePdf), false);
});

test("seller document validation enforces formats, signatures, and actual size/count limits", () => {
  const valid = { originalname: "identity.pdf", mimetype: "application/pdf", size: 512, buffer: Buffer.from("%PDF-1.7 sample") };
  assert.equal(validateSellerDocument(valid), true);
  assert.throws(() => validateSellerDocument({ ...valid, originalname: "identity.exe" }), /PDF, JPEG, or PNG/);
  assert.throws(() => validateSellerDocument({ ...valid, size: MAX_DOCUMENT_BYTES + 1 }), /5 MB or smaller/);
  assert.throws(() => validateSellerDocument({ ...valid, buffer: Buffer.from("not pdf") }), /did not match/);
  assert.equal(MAX_DOCUMENTS_PER_REQUEST, 4);
  assert.equal(MAX_DOCUMENTS_PER_APPLICATION, 8);
});

test("seller declaration acknowledgement records versions and accepted timestamps without duplicate saves", () => {
  const firstAcceptedAt = new Date("2026-01-10T10:00:00Z");
  const first = agreementAcceptanceUpdates(null, "2026-01", firstAcceptedAt);
  assert.equal(first.agreementVersion, "2026-01");
  assert.equal(first.agreementAcceptedAt, firstAcceptedAt);
  assert.equal(first.agreementHistory.length, 1);

  const saved = agreementAcceptanceUpdates({ agreementAccepted: true, ...first }, "2026-01", new Date("2026-02-01T00:00:00Z"));
  assert.equal(saved.agreementHistory.length, 1);
  assert.equal(saved.agreementAcceptedAt, firstAcceptedAt);

  const nextVersion = agreementAcceptanceUpdates({ agreementAccepted: true, ...saved }, "2026-02", new Date("2026-02-10T10:00:00Z"));
  assert.deepEqual(nextVersion.agreementHistory.map((entry) => entry.version), ["2026-01", "2026-02"]);
});

test("seller application schema supports the additional-information review state", () => {
  assert.ok(SellerProfile.schema.path("status").enumValues.includes("action_required"));
});

test("unapproved accounts cannot enter seller product APIs", async () => {
  const originalFindOne = SellerProfile.findOne;
  SellerProfile.findOne = async () => null;
  try {
    const response = mockResponse();
    let continued = false;
    await requireApprovedSeller({ user: { user_id: "customer-id" } }, response, () => { continued = true; });
    assert.equal(response.statusCode, 403);
    assert.equal(response.body.code, "SELLER_APPROVAL_REQUIRED");
    assert.equal(continued, false);
  } finally { SellerProfile.findOne = originalFindOne; }
});

test("pending, information-requested, and rejected applicants remain blocked from seller management", async () => {
  const originalFindOne = SellerProfile.findOne;
  for (const status of ["draft", "pending", "action_required", "rejected", "suspended"]) {
    SellerProfile.findOne = async (filter) => {
      assert.deepEqual(filter, { userId: "customer-id", status: "approved" });
      return null;
    };
    const response = mockResponse();
    let continued = false;
    await requireApprovedSeller({ user: { user_id: "customer-id" } }, response, () => { continued = true; });
    assert.equal(response.statusCode, 403, `${status} must not get seller management access`);
    assert.equal(continued, false);
  }
  SellerProfile.findOne = async (filter) => {
    assert.deepEqual(filter, { userId: "customer-id", status: "approved" });
    return { _id: "approved-profile" };
  };
  try {
    const response = mockResponse();
    let continued = false;
    await requireApprovedSeller({ user: { user_id: "customer-id" } }, response, () => { continued = true; });
    assert.equal(continued, true);
  } finally { SellerProfile.findOne = originalFindOne; }
});

test("legacy Home & Living category paths resolve to the canonical Household category", () => {
  assert.ok(productCategoryValues("Household").includes("Household"));
  assert.ok(productCategoryValues("Home & Living").includes("Household"));
  assert.ok(productCategoryValues("home").includes("Home Living"));
  assert.deepEqual(productCategoryValues("unknown-category"), []);
});

test("category product API matches legacy aliases through the same public product filter", async () => {
  const originalFind = require("../models/productModel").find;
  const originalDistinct = SellerProfile.distinct;
  let query;
  require("../models/productModel").find = async (filter) => { query = filter; return []; };
  SellerProfile.distinct = async () => [];
  try {
    const response = mockResponse();
    await productController.getCollectionProducts({ params: { collec: "Home & Living" } }, response, (error) => { throw error; });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(query.$and[1], { collec: { $in: productCategoryValues("Household") } });
    assert.deepEqual(query.$and[0].$and[1], { $or: [{ status: { $exists: false } }, { status: "published" }] });
  } finally {
    require("../models/productModel").find = originalFind;
    SellerProfile.distinct = originalDistinct;
  }
});

test("all storefront category slugs query their canonical stored values with the public visibility filter", async () => {
  const Product = require("../models/productModel");
  const originalFind = Product.find;
  const originalDistinct = SellerProfile.distinct;
  const queries = [];
  Product.find = async (filter) => { queries.push(filter); return []; };
  SellerProfile.distinct = async () => ["approved-profile"];
  const categories = [
    ["foods", "Foods"],
    ["personalcare", "PersonalCare"],
    ["household", "Household"],
    ["lifestyle", "Lifestyle"],
  ];
  try {
    for (const [slug, value] of categories) {
      const response = mockResponse();
      await productController.getCollectionProducts({ params: { collec: slug } }, response, (error) => { throw error; });
      assert.equal(response.statusCode, 200);
      assert.deepEqual(response.body, { success: true, products: [] });
    }
    assert.equal(queries.length, categories.length);
    for (let index = 0; index < categories.length; index += 1) {
      assert.deepEqual(queries[index].$and[1], { collec: { $in: productCategoryValues(categories[index][1]) } });
      assert.deepEqual(queries[index].$and[0].$and[0].$or[2], { sellerProfile: { $in: ["approved-profile"] } });
      assert.deepEqual(queries[index].$and[0].$and[1], { $or: [{ status: { $exists: false } }, { status: "published" }] });
    }
  } finally {
    Product.find = originalFind;
    SellerProfile.distinct = originalDistinct;
  }
});

test("seller audit history supports recording an existing application resubmission", () => {
  assert.ok(AdminAuditLog.schema.path("action").enumValues.includes("seller.resubmitted"));
});

test("development sample definitions keep stable IDs, internal SKU markers, and 20 products per category", () => {
  const { samples, categories } = require("../scripts/seed-development-products");
  assert.equal(samples.length, 80);
  assert.equal(new Set(samples.map((sample) => sample.id)).size, 80);
  assert.equal(new Set(samples.map((sample) => sample.sku)).size, 80);
  assert.ok(samples.every((sample) => !sample.name.startsWith("[DEV SAMPLE] ")));
  assert.ok(samples.every((sample) => sample.description && !/\b(?:fictional|development|catalog(?:ue)?|sorting|testing|price filters|comparison testing|product-grid layouts)\b/i.test(sample.description)));
  assert.ok(samples.every((sample) => sample.sku.startsWith("BB-DEV-SAMPLE-") && (/^https:\/\//.test(sample.image) || sample.image.startsWith("data:image/svg+xml,"))));
  assert.ok(samples.filter((sample) => sample.image.startsWith("data:image/svg+xml,")).every((sample) => !decodeURIComponent(sample.image.slice("data:image/svg+xml,".length)).includes("FICTIONAL DEVELOPMENT SAMPLE · NOT FOR SALE")));
  assert.deepEqual(categories.map((category) => [category.category, category.products.length]), [["Foods", 20], ["PersonalCare", 20], ["Household", 20], ["Lifestyle", 20]]);
  assert.ok(samples.every((sample) => validClassification(sample) && sample.packageQuantity > 0 && sample.packageUnit));
  const dimension = (unit) => ["g", "kg"].includes(unit) ? "mass" : ["ml", "l"].includes(unit) ? "volume" : "count";
  const cohorts = new Map();
  for (const sample of samples) {
    const key = [sample.collec, sample.productCategory, sample.productType, dimension(sample.packageUnit)].join("/");
    cohorts.set(key, (cohorts.get(key) || 0) + 1);
  }
  assert.deepEqual([...cohorts].filter(([, count]) => count >= 4).map(([key]) => key).sort(), [
    "Foods/snacks/packaged_snack/mass",
    "Household/cleaning/surface_cleaner/volume",
    "PersonalCare/skin_care/cleanser/volume",
    "PersonalCare/skin_care/moisturizer/mass",
  ]);
});

const parseCsvRow = (row) => {
  const columns = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"') {
      if (quoted && row[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      columns.push(field);
      field = "";
    } else {
      field += character;
    }
  }
  columns.push(field);
  return columns;
};

test("sample image manifest maps URLs and records uncreated local asset slots", () => {
  const { samples } = require("../scripts/seed-development-products");
  const manifestPath = path.join(__dirname, "../sample-product-images/manifest.csv");
  const rows = fs.readFileSync(manifestPath, "utf8").trim().split(/\r?\n/);
  const headers = parseCsvRow(rows[0]);
  const entries = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, parseCsvRow(row)[index]])));
  const samplesBySku = new Map(samples.map((sample) => [sample.sku, sample]));

  assert.equal(entries.length, 80);
  assert.equal(new Set(entries.map((entry) => entry.sku)).size, 80);
  assert.equal(new Set(entries.map((entry) => entry.planned_asset)).size, 80, JSON.stringify(entries.slice(0, 3)));
  for (const entry of entries) {
    const sample = samplesBySku.get(entry.sku);
    assert.ok(sample, `Unknown manifest SKU ${entry.sku}`);
    assert.equal(entry.product, sample.name);
    assert.equal(entry.category, sample.collec);
    if (entry.image_url) {
      assert.equal(sample.image, entry.image_url);
      assert.equal(entry.source_page, entry.image_url);
      assert.equal(entry.license, "UNVERIFIED");
      assert.equal(entry.status, "USER_URL_RIGHTS_UNVERIFIED");
    } else {
      assert.equal(entry.status, "NOT_CREATED_SOURCE_UNVERIFIED");
    }
    assert.equal(fs.existsSync(path.join(path.dirname(manifestPath), entry.planned_asset)), false);
  }
  const linkedEntries = entries.filter((entry) => entry.image_url);
  assert.equal(linkedEntries.length, 40);
  assert.equal(new Set(linkedEntries.map((entry) => entry.image_url)).size, 40);
  assert.equal(linkedEntries.filter((entry) => entry.category === "Foods").length, 20);
  assert.equal(linkedEntries.filter((entry) => entry.category === "PersonalCare").length, 20);
  assert.ok(linkedEntries.every((entry) => /^https:\/\//.test(entry.image_url)));
});

test("admin authorization reads the current database role", async () => {
  const originalFindById = User.findById;
  User.findById = () => ({ select: () => ({ lean: async () => ({ role: "user" }) }) });
  try {
    const denied = mockResponse();
    let continued = false;
    await requireAdmin({ user: { user_id: "customer-1" } }, denied, () => { continued = true; });
    assert.equal(denied.statusCode, 403);
    assert.equal(continued, false);

    User.findById = () => ({ select: () => ({ lean: async () => ({ role: "admin" }) }) });
    await requireAdmin({ user: { user_id: "admin-1" } }, mockResponse(), () => { continued = true; });
    assert.equal(continued, true);
  } finally { User.findById = originalFindById; }
});

test("seller product mutations ignore client-supplied owner and protected fields", () => {
  const data = mutableFields({ name: "Soap", price: "250", inventoryQuantity: "4", userId: "someone-else", sellerProfile: "forged", reviewedBy: "forged", commissionRate: 0, paymentStatus: "paid" });
  assert.equal(data.name, "Soap");
  assert.equal(data.price, 250);
  assert.equal(data.inventoryQuantity, 4);
  assert.equal("userId" in data, false);
  assert.equal("sellerProfile" in data, false);
  assert.equal("reviewedBy" in data, false);
  assert.equal("commissionRate" in data, false);
  assert.equal("paymentStatus" in data, false);
});

test("seller product classification and package fields validate without requiring legacy records to have them", () => {
  const legacy = mutableFields({ name: "Legacy listing" });
  assert.equal(legacy.productCategory, undefined);
  assert.equal(legacy.packageQuantity, undefined);
  const valid = mutableFields({ collec: "Foods", productCategory: "breakfast_cereals", productType: "porridge", packageQuantity: "500", packageUnit: "g" });
  assert.equal(valid.packageQuantity, 500);
  assert.equal(valid.packageUnit, "g");
  assert.throws(() => mutableFields({ collec: "Foods", productCategory: "breakfast_cereals", productType: "surface_cleaner" }), /belong to the selected main category/);
  assert.throws(() => mutableFields({ collec: "Foods", productCategory: "breakfast_cereals" }), /belong to the selected main category/);
  assert.throws(() => mutableFields({ packageQuantity: "0", packageUnit: "g" }), /positive finite amount/);
  assert.throws(() => mutableFields({ packageQuantity: "250" }), /both package quantity and package unit/);
  assert.throws(() => mutableFields({ packageQuantity: "250", packageUnit: "cup" }), /supported package unit/);
});

test("seller can classify an existing unclassified product using its unchanged main category", () => {
  const data = mutableFields({ productCategory: "cleaning", productType: "surface_cleaner" }, "Household");
  assert.equal(data.productCategory, "cleaning");
  assert.equal(data.productType, "surface_cleaner");
});

test("approved seller product creation stores the authenticated owner, approved profile, category, image, and publication status", async () => {
  const Product = require("../models/productModel");
  const originalCreate = Product.create;
  let saved;
  Product.create = async (record) => { saved = record; return { _id: "created-product", ...record }; };
  try {
    const response = mockResponse();
    await sellerProductController.create({
      body: {
        name: "Handmade Soap", type: "Personal care", description: "A valid test product description.",
        collec: "PersonalCare", productCategory: "skin_care", productType: "soap", price: "250", inventoryQuantity: "4", status: "published",
        imageUrl: "https://example.com/soap.jpg",
      },
      user: { user_id: "authenticated-user" },
      sellerProfile: { _id: "approved-seller-profile" },
    }, response, (error) => { throw error; });
    assert.equal(response.statusCode, 201);
    assert.equal(response.body.product._id, "created-product");
    assert.equal(saved.userId, "authenticated-user");
    assert.equal(saved.sellerProfile, "approved-seller-profile");
    assert.equal(saved.collec, "PersonalCare");
    assert.equal(saved.status, "published");
    assert.equal(saved.image, "https://example.com/soap.jpg");
    assert.equal(saved.price, 250);
    assert.equal(saved.inventoryQuantity, 4);
  } finally { Product.create = originalCreate; }
});

test("legacy Add Product accepts an upload already validated by the shared image service", async () => {
  const Product = require("../models/productModel");
  const sellerProductImages = require("../services/sellerProductImages");
  const originalCreate = Product.create;
  const originalSaveImage = sellerProductImages.saveSellerProductImage;
  let saved;
  Product.create = async (record) => { saved = record; return { _id: "uploaded-product", ...record }; };
  sellerProductImages.saveSellerProductImage = async (file) => {
    assert.equal(file.mimetype, "image/jpeg");
    return "validated-upload.jpg";
  };
  try {
    const response = mockResponse();
    await productController.sellProduct({
      body: { name: "Uploaded Soap", type: "Personal care", description: "A valid test product description.", collec: "PersonalCare", productCategory: "skin_care", productType: "soap", price: "250", inventoryQuantity: "2" },
      user: { user_id: "authenticated-user" },
      sellerProfile: { _id: "approved-seller-profile" },
      file: { mimetype: "image/jpeg" },
    }, response);
    assert.equal(response.statusCode, 201);
    assert.equal(response.body.product._id, "uploaded-product");
    assert.equal(saved.image, "validated-upload.jpg");
    assert.equal(saved.userId, "authenticated-user");
    assert.equal(saved.sellerProfile, "approved-seller-profile");
    assert.equal(saved.status, "published");
  } finally {
    Product.create = originalCreate;
    sellerProductImages.saveSellerProductImage = originalSaveImage;
  }
});

test("public Shop All and search filters allow published products from approved sellers and exclude drafts", async () => {
  const Product = require("../models/productModel");
  const originalFind = Product.find;
  const originalDistinct = SellerProfile.distinct;
  const filters = [];
  Product.find = async (filter) => { filters.push(filter); return []; };
  SellerProfile.distinct = async (field, filter) => {
    assert.equal(field, "_id");
    assert.deepEqual(filter, { status: "approved" });
    return ["approved-profile"];
  };
  try {
    await productController.getProducts({}, mockResponse(), (error) => { throw error; });
    await productController.searchProducts({ query: { keyword: "soap" } }, mockResponse(), (error) => { throw error; });
    for (const filter of filters) {
      const publicFilter = filter.$and[0]?.$and ? filter.$and[0] : filter;
      assert.deepEqual(publicFilter.$and[0].$or[2], { sellerProfile: { $in: ["approved-profile"] } });
      assert.deepEqual(publicFilter.$and[1], { $or: [{ status: { $exists: false } }, { status: "published" }] });
    }
  } finally {
    Product.find = originalFind;
    SellerProfile.distinct = originalDistinct;
  }
});
