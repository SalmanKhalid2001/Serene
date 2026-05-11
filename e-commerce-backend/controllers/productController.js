import Product from "../models/Product.js";

// ─── Public ────────────────────────────────────────────────────────────────

// @route  GET /api/products
// Supports: ?keyword=shirt&category=clothing&minPrice=10&maxPrice=500&page=1&limit=12&sort=price_asc
export const getProducts = async (req, res) => {
  const { keyword, category, minPrice, maxPrice, page = 1, limit = 12, sort } = req.query;

  const filter = { isActive: true };

  if (keyword) filter.$text = { $search: keyword };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc:   { price: 1 },
    price_desc:  { price: -1 },
    rating_desc: { rating: -1 },
    newest:      { createdAt: -1 },
    popular:     { sold: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

// @route  GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true }).limit(8);
  res.json(products);
};

// @route  GET /api/products/categories
export const getCategories = async (req, res) => {
  const categories = await Product.distinct("category", { isActive: true });
  res.json(categories);
};

// @route  GET /api/products/:id
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive)
    return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

// ─── Admin ─────────────────────────────────────────────────────────────────

// @route  POST /api/products
export const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

// @route  PUT /api/products/:id
export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

// @route  DELETE /api/products/:id  (soft delete — keeps order history intact)
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id, { isActive: false }, { new: true }
  );
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product removed" });
};

// @route  PATCH /api/products/:id/stock
export const updateStock = async (req, res) => {
  const { stock } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id, { stock }, { new: true }
  );
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};