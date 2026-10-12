const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const User = require("../models/userModel");

async function main() {
  const email = process.argv[2];
  if (!email || process.argv.length !== 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: npm run promote-admin -- <registered-email>");
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be set in backend/.env.");
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("_id email role");
  if (!user) throw new Error("No registered account found for that email; no account was created.");
  if (user.role === "admin") {
    console.log(`Account ${user.email} is already an administrator.`);
    return;
  }
  user.role = "admin";
  await user.save();
  console.log(`Promoted existing account ${user.email} to administrator.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});
