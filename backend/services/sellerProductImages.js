const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const uploadDirectory = path.resolve(__dirname, "../uploads");
const imageTypes = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif", "image/bmp": ".bmp" };

const uploadSellerProductImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedExtension = imageTypes[file.mimetype];
    callback(expectedExtension && extension === expectedExtension ? null : new Error("Upload a supported JPEG, PNG, WebP, GIF, AVIF, or BMP product image."), Boolean(expectedExtension && extension === expectedExtension));
  },
}).single("image");

function hasValidSignature(file) {
  if (file.mimetype === "image/jpeg") return file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  if (file.mimetype === "image/png") return file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === "image/webp") return file.buffer.subarray(0, 4).toString() === "RIFF" && file.buffer.subarray(8, 12).toString() === "WEBP";
  if (file.mimetype === "image/gif") return ["GIF87a", "GIF89a"].includes(file.buffer.subarray(0, 6).toString());
  if (file.mimetype === "image/avif") return file.buffer.subarray(4, 8).toString() === "ftyp" && ["avif", "avis"].includes(file.buffer.subarray(8, 12).toString());
  if (file.mimetype === "image/bmp") return file.buffer.subarray(0, 2).toString() === "BM";
  return false;
}

async function saveSellerProductImage(file) {
  if (!file) return null;
  if (!hasValidSignature(file)) throw new Error("Product image content does not match its declared type.");
  await fs.mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomUUID()}${imageTypes[file.mimetype]}`;
  await fs.writeFile(path.join(uploadDirectory, filename), file.buffer, { flag: "wx" });
  return filename;
}

module.exports = { saveSellerProductImage, uploadSellerProductImage };
