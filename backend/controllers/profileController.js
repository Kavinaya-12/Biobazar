const Profile = require("../models/profileModel");

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

    const exists = await Profile.findOne({
      userId,
    });

    if (exists) {

      return res.status(400).json({
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

    const updatedProfile = await Profile.findOneAndUpdate(
      {
        userId,
      },
      req.body,
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