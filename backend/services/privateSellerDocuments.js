const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const privateDocumentDirectory = path.resolve(process.env.PRIVATE_UPLOAD_DIR || path.join(__dirname, "../private-uploads/seller-verification"));
const publicUploadDirectory = path.resolve(__dirname, "../uploads");
const privateRelativeToPublic = path.relative(publicUploadDirectory, privateDocumentDirectory);
if (privateRelativeToPublic === "" || (!privateRelativeToPublic.startsWith(`..${path.sep}`) && privateRelativeToPublic !== ".." && !path.isAbsolute(privateRelativeToPublic))) {
  throw new Error("PRIVATE_UPLOAD_DIR must be outside the public product uploads directory.");
}
const extensionsByType = { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png" };
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENTS_PER_REQUEST = 4;
const MAX_DOCUMENTS_PER_APPLICATION = 8;

const uploadSellerDocuments = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_BYTES, files: MAX_DOCUMENTS_PER_REQUEST },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowed = extensionsByType[file.mimetype] && extension === extensionsByType[file.mimetype];
    callback(allowed ? null : new Error("Upload a PDF, JPEG, or PNG verification document."), Boolean(allowed));
  },
}).array("documents", 4);

const matchesFileSignature = (file) => {
  if (file.mimetype === "application/pdf") return file.buffer.subarray(0, 5).toString() === "%PDF-";
  if (file.mimetype === "image/png") return file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === "image/jpeg") return file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  return false;
};

function validateSellerDocument(file) {
  if (!file || !extensionsByType[file.mimetype] || path.extname(file.originalname).toLowerCase() !== extensionsByType[file.mimetype]) throw new Error("Upload a PDF, JPEG, or PNG verification document.");
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("Each verification document must be 5 MB or smaller.");
  if (!matchesFileSignature(file)) throw new Error("A verification document did not match its declared file type.");
  return true;
}

async function savePrivateSellerDocuments(files = []) {
  await fs.mkdir(privateDocumentDirectory, { recursive: true, mode: 0o700 });
  const saved = [];
  try {
    for (const file of files) {
      validateSellerDocument(file);
      const extension = extensionsByType[file.mimetype];
      const storageKey = `${randomUUID()}${extension}`;
      await fs.writeFile(path.join(privateDocumentDirectory, storageKey), file.buffer, { flag: "wx", mode: 0o600 });
      const safeOriginalName = path.win32.basename(path.basename(file.originalname.replace(/\\/g, "/"))).replace(/[\r\n]/g, "").slice(0, 180);
      saved.push({ storageKey, originalName: safeOriginalName, contentType: file.mimetype, size: file.size, uploadedAt: new Date() });
    }
    return saved;
  } catch (error) {
    await Promise.all(saved.map((document) => fs.rm(path.join(privateDocumentDirectory, document.storageKey), { force: true })));
    throw error;
  }
}

async function readPrivateSellerDocument(storageKey) {
  if (!/^[0-9a-f-]{36}\.(pdf|jpg|png)$/.test(storageKey || "")) return null;
  try {
    return await fs.readFile(path.join(privateDocumentDirectory, storageKey));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

module.exports = { MAX_DOCUMENT_BYTES, MAX_DOCUMENTS_PER_APPLICATION, MAX_DOCUMENTS_PER_REQUEST, matchesFileSignature, privateDocumentDirectory, readPrivateSellerDocument, savePrivateSellerDocuments, uploadSellerDocuments, validateSellerDocument };
