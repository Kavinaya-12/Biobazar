const express = require("express");
const userRouter = express.Router();
const { authenticate, upload } = require("../middleware/auth");
const userController = require("../controllers/userController");

userRouter.get("/", userController.getUser);
userRouter.get("/me", authenticate, userController.getCurrentUser);
userRouter.post("/", userController.createUser);
userRouter.post("/login", userController.login);
userRouter.post("/logout", userController.logout);
userRouter.delete("/delete-account", authenticate, userController.delete);


module.exports = userRouter