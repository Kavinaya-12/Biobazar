const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { authenticate } = require("../middleware/auth");
router.get("/:userId", authenticate, profileController.getProfile);
router.put("/:userId", authenticate, profileController.updateProfile);
router.post("/", authenticate, profileController.createProfile);
module.exports = router;