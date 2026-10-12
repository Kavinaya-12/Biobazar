const User = require("../models/userModel");

const requireAdmin = async (req, res, next) => {
  const userId = req.user && (req.user.user_id || req.user._id || req.user.id);
  if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
  try {
    const user = await User.findById(userId).select("role").lean();
    if (!user || user.role !== "admin") return res.status(403).json({ success: false, message: "Administrator access required." });
    next();
  } catch (error) { next(error); }
};
module.exports = { requireAdmin };
