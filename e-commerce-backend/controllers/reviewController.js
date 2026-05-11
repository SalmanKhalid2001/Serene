import Review from "../models/Review.js";
import Order from "../models/Order.js";

// @route  POST /api/reviews
// @access Private
export const createReview = async (req, res) => {
  const { product, rating, title, comment } = req.body;

  // Prevent duplicate reviews (also enforced by DB unique index)
  const existing = await Review.findOne({ user: req.user._id, product });
  if (existing) return res.status(400).json({ message: "You have already reviewed this product" });

  // Check if user has purchased this product (verified purchase badge)
  const hasBought = await Order.findOne({
    user:    req.user._id,
    "items.product": product,
    isPaid:  true,
  });

  const review = await Review.create({
    user:               req.user._id,
    product,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!hasBought,
  });

  const populated = await review.populate("user", "name avatar");
  res.status(201).json(populated);
};

// @route  GET /api/reviews/product/:productId
// @access Public
export const getProductReviews = async (req, res) => {
  const { page = 1, limit = 10, sort = "newest" } = req.query;
  const sortMap = { newest: { createdAt: -1 }, highest: { rating: -1 }, lowest: { rating: 1 } };

  const filter = { product: req.params.productId };
  const skip   = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name avatar")
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  res.json({ reviews, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

// @route  DELETE /api/reviews/:id
// @access Private — owner or admin
export const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });

  const isOwner = review.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin")
    return res.status(403).json({ message: "Not authorized" });

  await review.deleteOne();  // triggers post('remove') hook to recalculate rating
  res.json({ message: "Review removed" });
};

// @route  PATCH /api/reviews/:id/helpful
// @access Private — marks a review as helpful (+1)
export const markHelpful = async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id, { $inc: { helpful: 1 } }, { new: true }
  );
  if (!review) return res.status(404).json({ message: "Review not found" });
  res.json(review);
};