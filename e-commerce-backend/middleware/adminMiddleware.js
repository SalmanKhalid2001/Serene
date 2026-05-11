import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @route  POST /api/auth/register
// @access Public
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Please provide name, email and password" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already registered" });

  const user = await User.create({ name, email, password });
  res.status(201).json({ user, token: generateToken(user._id) });
};

// @route  POST /api/auth/login
// @access Public
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Please provide email and password" });

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: "Invalid email or password" });

  if (!user.isActive)
    return res.status(403).json({ message: "Account deactivated. Contact support." });

  res.json({ user, token: generateToken(user._id) });
};

// @route  GET /api/auth/profile
// @access Private
export const getProfile = async (req, res) => {
  res.json(req.user);
};

// @route  PUT /api/auth/profile
// @access Private
export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, email, password, avatar, address } = req.body;

  if (name)    user.name    = name;
  if (email)   user.email   = email;
  if (avatar)  user.avatar  = avatar;
  if (address) user.address = { ...user.address.toObject(), ...address };
  if (password) user.password = password; // pre-save hook re-hashes

  const updated = await user.save();
  res.json({ user: updated, token: generateToken(updated._id) });
};

// @route  GET /api/auth/users          (admin)
// @route  PATCH /api/auth/users/:id    (admin - toggle active / change role)
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
};

export const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const { role, isActive } = req.body;
  if (role !== undefined)     user.role     = role;
  if (isActive !== undefined) user.isActive = isActive;
  const updated = await user.save();
  res.json(updated);
};

// @route  GET /api/auth/wishlist        Private
// @route  POST /api/auth/wishlist/:id   Private  (toggle)
export const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.json(user.wishlist);
};

export const toggleWishlist = async (req, res) => {
  const user  = await User.findById(req.user._id);
  const pid   = req.params.id;
  const index = user.wishlist.indexOf(pid);
  if (index === -1) {
    user.wishlist.push(pid);
  } else {
    user.wishlist.splice(index, 1);
  }
  await user.save();
  res.json({ wishlist: user.wishlist });
};