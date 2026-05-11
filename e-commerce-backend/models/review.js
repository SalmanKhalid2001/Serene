import mongoose from "mongoose";
import Product from "./Product.js";

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    title:   { type: String, required: true, trim: true },
    comment: { type: String, required: true },
    isVerifiedPurchase: { type: Boolean, default: false }, // checked against Orders
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Recalculate product rating after save / delete
async function updateProductRating(productId) {
  const stats = await mongoose.model("Review").aggregate([
    { $match: { product: productId } },
    { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating:     Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { rating: 0, numReviews: 0 });
  }
}

reviewSchema.post("save", function () { updateProductRating(this.product); });
reviewSchema.post("remove", function () { updateProductRating(this.product); });

const Review = mongoose.model("Review", reviewSchema);
export default Review;