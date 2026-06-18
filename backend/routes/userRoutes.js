const express = require("express");
const userRouter = express.Router();
const { authenticate, upload } = require("../middleware/auth");
const userController = require("../controllers/userController");

userRouter.get("/",userController.getUser);
userRouter.post("/", userController.createUser);
userRouter.post("/login", userController.login);
userRouter.post("/logout",userController.logout);
userRouter.delete("/signout",userController.delete);


module.exports = userRouter