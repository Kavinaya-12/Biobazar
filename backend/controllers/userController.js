const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Profile = require("../models/profileModel");


exports.createUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "Email already registered" });
    }

    const newUser = new User({
      username,
      email,
      password,
    });
    await newUser.save();

    const newProfile = new Profile({
      userId: newUser._id,
      fullName: username,
      bio: "",
      location: "",
      profilePicture: "",
    });
    await newProfile.save();

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Error in createUser:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const users = await User.find().select("-password"); 
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: "No user found with this email" });
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(400).json({ success: false, error: "Incorrect password" });
    }

    const token = jwt.sign(
      { user_id: user._id, email: user.email },
      process.env.JWT_SECRET || "secret_token", 
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      userId: user._id.toString(),
      email: user.email,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

exports.delete = async (req, res) => {
  const { email } = req.body;

  try {
    const deletedUser = await User.findOneAndDelete({ email });
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
