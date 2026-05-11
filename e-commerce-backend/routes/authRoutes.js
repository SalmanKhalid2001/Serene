import express from "express";
import {
  register, login, getProfile, updateProfile,
  getAllUsers, updateUser, getWishlist, toggleWishlist,
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.post("/register", register);
router.post("/login",    login);

// Private
router.get ("/profile",         protect, getProfile);
router.put ("/profile",         protect, updateProfile);
router.get ("/wishlist",        protect, getWishlist);
router.post("/wishlist/:id",    protect, toggleWishlist);

// Admin
router.get ("/users",           protect, adminOnly, getAllUsers);
router.patch("/users/:id",      protect, adminOnly, updateUser);

export default router;