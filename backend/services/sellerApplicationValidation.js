const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s().-]{6,29}$/;
const SELLER_TYPES = new Set(["individual", "business"]);
const configuredCountries = (process.env.SELLER_ALLOWED_COUNTRIES || "IN").split(",").map((country) => country.trim().toUpperCase()).filter((country) => /^[A-Z]{2}$/.test(country));
const SELLER_REGISTRATION_COUNTRIES = Object.freeze(configuredCountries.length ? [...new Set(configuredCountries)] : ["IN"]);

const text = (value, maxLength = 200) => typeof value === "string" ? value.trim().slice(0, maxLength) : "";
const slugify = (value) => text(value, 100).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);

function validateSellerApplication(input, allowedCountries = SELLER_REGISTRATION_COUNTRIES) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) return { errors: ["Application data is required."], data: null };

  const sellerType = input.sellerType;
  if (!SELLER_TYPES.has(sellerType)) errors.push("Choose individual or registered business.");
  const storeName = text(input.storeName, 100);
  if (storeName && !slugify(storeName)) errors.push("Store name must include at least one letter or number.");
  const description = text(input.description, 2000);
  const contactEmail = text(input.contactEmail, 254).toLowerCase();
  const contactPhone = text(input.contactPhone, 30);
  if (storeName.length < 2) errors.push("Store name must contain at least 2 characters.");
  if (!EMAIL_PATTERN.test(contactEmail)) errors.push("Enter a valid contact email address.");
  if (!PHONE_PATTERN.test(contactPhone)) errors.push("Enter a valid contact phone number.");

  const sourceAddress = input.address && typeof input.address === "object" ? input.address : {};
  const address = {
    line1: text(sourceAddress.line1, 160),
    line2: text(sourceAddress.line2, 160),
    city: text(sourceAddress.city, 80),
    region: text(sourceAddress.region, 80),
    postalCode: text(sourceAddress.postalCode, 20),
    country: text(sourceAddress.country, 2).toUpperCase(),
  };
  if (!address.line1 || !address.city || !address.region || !address.postalCode) errors.push("Complete the business/contact address.");
  if (!allowedCountries.includes(address.country)) errors.push(`Seller registration is not enabled for ${address.country || "this country"}. Choose one of the configured seller registration countries and try again.`);

  const individual = { legalName: text(input.individual?.legalName, 120) };
  const business = {
    legalName: text(input.business?.legalName, 160),
    registrationNumber: text(input.business?.registrationNumber, 80),
    taxId: text(input.business?.taxId, 80),
  };
  if (sellerType === "individual" && individual.legalName.length < 2) errors.push("Enter the individual's legal name.");
  if (sellerType === "business" && (business.legalName.length < 2 || business.registrationNumber.length < 2)) errors.push("Business legal name and registration number are required.");

  return {
    errors,
    data: errors.length ? null : {
      sellerType,
      storeName,
      slug: slugify(storeName),
      description,
      contactEmail,
      contactPhone,
      address,
      individual: sellerType === "individual" ? individual : { legalName: "" },
      business: sellerType === "business" ? business : { legalName: "", registrationNumber: "", taxId: "" },
    },
  };
}

module.exports = { SELLER_REGISTRATION_COUNTRIES, slugify, validateSellerApplication };
