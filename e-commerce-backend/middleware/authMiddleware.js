import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * protect — verifies the Bearer JWT in the Authorization header.
 * Attaches the full user document to req.user for downstream handlers.
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch {
    res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

/**
 * adminOnly — must be used AFTER protect.
 * Blocks access for non-admin users.
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ message: "Access denied: admins only" });
};