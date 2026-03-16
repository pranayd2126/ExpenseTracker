import express from "express";
import {
  register,
  login,
  logout,
  changePassword,
  getAllUsers,
  getUserById,
  getUserProfile,
  updateUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/verifyToken.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes
router.post("/changePassword", protect, changePassword);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUser);
router.get("/all", protect, getAllUsers);
router.get("/:id", protect, getUserById);

export default router;
