const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireApprovedSeller } = require("../middleware/seller");
const sellerController = require("../controllers/sellerController");
const sellerProductController = require("../controllers/sellerProductController");
const { uploadSellerDocuments } = require("../services/privateSellerDocuments");
const { uploadSellerProductImage } = require("../services/sellerProductImages");

const router = express.Router();
router.use(authenticate);
const handleUpload = (upload) => (req, res, next) => upload(req, res, (error) => {
  if (error) return res.status(400).json({ success: false, message: error.message || "File upload failed." });
  next();
});

router.get("/me", sellerController.getMe);
router.post("/applications", handleUpload(uploadSellerDocuments), sellerController.createApplication);
router.patch("/applications/draft", handleUpload(uploadSellerDocuments), sellerController.saveDraft);
router.post("/applications/submit", sellerController.submit);
router.get("/applications/status", sellerController.getStatus);
router.post("/applications/resubmit", sellerController.resubmit);
router.delete("/documents/:storageKey", sellerController.removeDocument);
router.get("/documents/:storageKey", sellerController.getDocument);

router.get("/dashboard", requireApprovedSeller, sellerProductController.dashboard);
router.patch("/settings", requireApprovedSeller, sellerController.updateSettings);
router.get("/products", requireApprovedSeller, sellerProductController.list);
router.post("/products", requireApprovedSeller, handleUpload(uploadSellerProductImage), sellerProductController.create);
router.get("/products/:id", requireApprovedSeller, sellerProductController.get);
router.patch("/products/:id", requireApprovedSeller, handleUpload(uploadSellerProductImage), sellerProductController.update);
router.delete("/products/:id", requireApprovedSeller, sellerProductController.archive);
router.patch("/products/:id/inventory", requireApprovedSeller, sellerProductController.inventory);

router.get("/orders", requireApprovedSeller, sellerProductController.commerceUnavailable("Seller orders"));
router.get("/orders/:id", requireApprovedSeller, sellerProductController.commerceUnavailable("Seller orders"));
router.patch("/orders/:id/fulfilment", requireApprovedSeller, sellerProductController.commerceUnavailable("Order fulfilment"));
router.get("/earnings/summary", requireApprovedSeller, sellerProductController.commerceUnavailable("Seller earnings"));
router.get("/earnings/transactions", requireApprovedSeller, sellerProductController.commerceUnavailable("Seller earnings transactions"));
router.get("/payouts", requireApprovedSeller, sellerProductController.payoutStatus);
router.post("/payouts/onboarding", requireApprovedSeller, sellerProductController.startPayoutOnboarding);

module.exports = router;
