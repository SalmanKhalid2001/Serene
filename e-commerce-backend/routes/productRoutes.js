import express from "express";
import {
  getProducts, getFeaturedProducts, getCategories,
  getProductById, createProduct, updateProduct,
  deleteProduct, updateStock,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/",           getProducts);
router.get("/featured",   getFeaturedProducts);
router.get("/categories", getCategories);
router.get("/:id",        getProductById);

// Admin
router.post  ("/",              protect, adminOnly, createProduct);
router.put   ("/:id",           protect, adminOnly, updateProduct);
router.delete("/:id",           protect, adminOnly, deleteProduct);
router.patch ("/:id/stock",     protect, adminOnly, updateStock);

export default router;