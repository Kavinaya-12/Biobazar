const mongoose = require("mongoose");
const Profile = require("../models/profileModel");

// Create profile
exports.createProfile = async (req, res) => {
  const { userId, fullName, bio, location, profilePicture } = req.body;
  try {
    const newProfile = new Profile({
      userId,
      fullName,
      bio,
      location,
      profilePicture
    });
    await newProfile.save();
    res.status(200).json({ message: "Profile created successfully", profile: newProfile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.status(200).json({ profile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { fullName, bio, location, profilePicture } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { fullName, bio, location, profilePicture },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
