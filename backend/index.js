const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/user", userRoutes);
app.use("/profile", profileRoutes);

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "dist"); // Vite build folder
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(frontendPath, "index.html"));
  });
}

const PORT = process.env.PORT || 8000;

console.log("Mongo URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" Connected to database");
    app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
  })
  .catch((err) => console.log("Failed to connect:", err));
