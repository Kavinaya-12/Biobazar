const User = require("../models/userModel");
const Profile = require("../models/profileModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const isValidEmail = (email) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

exports.createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !username.trim() || !email || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        error: "Username, email, and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    const existingUserByEmail = await User.findOne({ email: normalizedEmail });
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
      });
    }

    const existingUserByUsername = await User.findOne({ username: normalizedUsername });
    if (existingUserByUsername) {
      return res.status(409).json({
        success: false,
        error: "Username already taken",
      });
    }

    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
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

    // Create JWT Immediately
    const token = jwt.sign(
      {
        user_id: newUser._id,
        email: newUser.email,
      },
      process.env.JWT_SECRET || "secret_token",
      {
        expiresIn: "1h",
      }
    );

    return res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      token,
      userId: newUser._id,
      email: newUser.email,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


exports.getUser = async (req, res) => {
  try {

    const users = await User.find().select("-password");

    return res.status(200).json({
      success: true,
      users,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      error: error.message,
    });

  }
};

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {

      return res.status(404).json({
        success: false,
        error: "No user found with this email",
      });

    }

    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched) {

      return res.status(401).json({
        success: false,
        error: "Incorrect password",
      });

    }

    const token = jwt.sign(
      {
        user_id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET || "secret_token",
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      userId: user._id,
      email: user.email,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });

  }

};

exports.logout = async (req, res) => {

  return res.status(200).json({
    success: true,
    message: "Logged Out Successfully",
  });

};

exports.delete = async (req, res) => {

  try {

    const { email } = req.body;

    const deletedUser = await User.findOneAndDelete({ email });

    if (!deletedUser) {

      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });

    }

    return res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      error: error.message,
    });

  }

};