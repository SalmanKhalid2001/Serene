import express from "express";
import {
  createReview, getProductReviews, deleteReview, markHelpful,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post  ("/",                      protect, createReview);
router.get   ("/product/:productId",             getProductReviews);
router.delete("/:id",                   protect, deleteReview);
router.patch ("/:id/helpful",           protect, markHelpful);

export default router;