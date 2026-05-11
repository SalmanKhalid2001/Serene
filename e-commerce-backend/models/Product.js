import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  size:     { type: String },          // e.g. S, M, L, XL  or  128GB, 256GB
  color:    { type: String },
  stock:    { type: Number, default: 0 },
  sku:      { type: String },
});

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },
    salePrice:   { type: Number, default: null },          // null = no sale
    category:    { type: String, required: true, index: true },
    brand:       { type: String, default: "" },
    images:      [{ type: String }],                       // Cloudinary URLs
    variants:    [variantSchema],
    stock:       { type: Number, required: true, default: 0 },
    sold:        { type: Number, default: 0 },
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    numReviews:  { type: Number, default: 0 },
    isFeatured:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    tags:        [{ type: String }],
  },
  { timestamps: true }
);

// Full-text search index on name + description
productSchema.index({ name: "text", description: "text", tags: "text" });

// Virtual: effective price (sale price if set, else regular)
productSchema.virtual("effectivePrice").get(function () {
  return this.salePrice !== null && this.salePrice < this.price ? this.salePrice : this.price;
});

const Product = mongoose.model("Product", productSchema);
export default Product;