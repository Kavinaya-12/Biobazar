const Profile = require("../models/profileModel");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

exports.getProfile = async (req, res) => {

  try {

    const { userId } = req.params;

    const profile = await Profile.findOne({
      userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

exports.createProfile = async (req, res) => {

  try {

    const {
      userId,
      fullName,
      bio,
      location,
      profilePicture,
    } = req.body;

    if (!userId || !isNonEmptyString(fullName)) {
      return res.status(400).json({
        success: false,
        message: "User ID and full name are required",
      });
    }

    if (!req.user || !req.user.user_id || req.user.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to create this profile",
      });
    }

    const exists = await Profile.findOne({
      userId,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Profile already exists",
      });
    }

    const profile = await Profile.create({
      userId,
      fullName,
      bio,
      location,
      profilePicture,
    });

    return res.status(201).json({
      success: true,
      profile,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

exports.updateProfile = async (req, res) => {

  try {

    const { userId } = req.params;

    if (!req.user || !req.user.user_id || req.user.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this profile",
      });
    }

    const { fullName, bio, location, profilePicture } = req.body;

    if (fullName !== undefined && !isNonEmptyString(fullName)) {
      return res.status(400).json({
        success: false,
        message: "Full name cannot be empty",
      });
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProfile) {

      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });

    }

    return res.status(200).json({
      success: true,
      profile: updatedProfile,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};