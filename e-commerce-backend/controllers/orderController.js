//import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Customer ──────────────────────────────────────────────────────────────

// @route  POST /api/orders
// Creates an order and a Stripe PaymentIntent in one step.
export const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod = "stripe" } = req.body;
  if (!items || items.length === 0)
    return res.status(400).json({ message: "No order items" });

  // Verify products and build order items from DB (never trust client prices)
  const orderItems = [];
  let itemsPrice = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive)
      return res.status(404).json({ message: `Product ${item.product} not found` });
    if (product.stock < item.quantity)
      return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

    const price = product.salePrice ?? product.price;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || "",
      price,
      quantity: item.quantity,
      variant: item.variant || {},
    });
    itemsPrice += price * item.quantity;
  }

  const shippingPrice = itemsPrice > 100 ? 0 : 9.99;        // free over $100
  const taxPrice      = Math.round(itemsPrice * 0.08 * 100) / 100; // 8% tax
  const totalPrice    = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

  // Create Stripe PaymentIntent
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount:   Math.round(totalPrice * 100), // Stripe uses cents
  //   currency: "usd",
  //   metadata: { userId: req.user._id.toString() },
  // });
  const paymentIntent = { id: "demo_" + Date.now(), client_secret: "demo_secret" };

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    paymentResult: { stripePaymentId: paymentIntent.id },
  });

  // Reserve stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, sold: item.quantity },
    });
  }

  res.status(201).json({ order, clientSecret: paymentIntent.client_secret });
};

// @route  PUT /api/orders/:id/pay
// Called after Stripe payment is confirmed on the frontend.
export const markOrderPaid = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Verify ownership (admin can also confirm)
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin")
    return res.status(403).json({ message: "Not authorized" });

  order.isPaid  = true;
  order.paidAt  = Date.now();
  order.status  = "processing";
  order.paymentResult.status = "succeeded";
  order.paymentResult.paidAt = Date.now();

  const updated = await order.save();
  res.json(updated);
};

// @route  GET /api/orders/myorders
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @route  GET /api/orders/:id
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Only the owner or an admin may view
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin")
    return res.status(403).json({ message: "Not authorized" });

  res.json(order);
};

// ─── Admin ─────────────────────────────────────────────────────────────────

// @route  GET /api/orders
export const getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status ? { status } : {};
  const skip   = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

// @route  PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  const { status, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = status;
  if (status === "delivered") order.deliveredAt = Date.now();
  if (trackingNumber) order.shippingAddress.trackingNumber = trackingNumber;

  const updated = await order.save();
  res.json(updated);
};

// @route  GET /api/orders/summary   (admin dashboard stats)
export const getOrderSummary = async (req, res) => {
  const [revenue, statusCounts, recentOrders] = await Promise.all([
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name"),
  ]);
  res.json({
    totalRevenue:  revenue[0]?.total || 0,
    statusCounts,
    recentOrders,
  });
};