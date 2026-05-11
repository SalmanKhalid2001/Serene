import express from "express";
import {
  createOrder, markOrderPaid, getMyOrders,
  getOrderById, getAllOrders, updateOrderStatus, getOrderSummary,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ⚠️ Specific routes PEHLE — /:id se pehle hone chahiye
router.get("/summary",      protect, adminOnly, getOrderSummary);
router.get("/myorders",     protect, getMyOrders);
router.get("/",             protect, adminOnly, getAllOrders);
router.post("/",            protect, createOrder);

// /:id wale routes HAMESHA LAST mein
router.get ("/:id",         protect, getOrderById);
router.put ("/:id/pay",     protect, markOrderPaid);
router.put ("/:id/status",  protect, adminOnly, updateOrderStatus);

export default router;