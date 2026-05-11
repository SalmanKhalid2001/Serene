import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:      { type: String, required: true },   // snapshot at time of order
  image:     { type: String },
  price:     { type: Number, required: true },   // snapshot price
  quantity:  { type: Number, required: true, min: 1 },
  variant:   { size: String, color: String },    // chosen variant
});

const shippingSchema = new mongoose.Schema({
  street:     { type: String, required: true },
  city:       { type: String, required: true },
  state:      { type: String, required: true },
  zip:        { type: String, required: true },
  country:    { type: String, required: true },
  trackingNumber: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items:          [orderItemSchema],
    shippingAddress: shippingSchema,
    itemsPrice:     { type: Number, required: true },  // subtotal
    shippingPrice:  { type: Number, required: true, default: 0 },
    taxPrice:       { type: Number, required: true, default: 0 },
    totalPrice:     { type: Number, required: true },
    paymentMethod:  { type: String, required: true, default: "stripe" },
    paymentResult: {
      stripePaymentId: { type: String },
      status:          { type: String },
      paidAt:          { type: Date },
    },
    isPaid:         { type: Boolean, default: false },
    paidAt:         { type: Date },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    deliveredAt: { type: Date },
    notes:       { type: String, default: "" },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;