import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../src/models/User.js";
import Provider from "../src/models/Provider.js";
import sendMail from "../utils/email.js";

// Generate JWT
// Generate JWT (include role)
const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};


// --------------------- SIGNUP ---------------------
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "USER",
    });

 const token = signToken(user);

    // check if a Provider already exists for this user (unlikely immediately after signup,
    // but safe if you ever create provider records elsewhere)
    const provider = await Provider.findOne({ userId: user._id }).lean();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      provider: provider || null // include provider if present
    });
  } catch (err) {
    console.error("signup", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --------------------- LOGIN ---------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);

    // find provider profile (if any) and attach
    const provider = await Provider.findOne({ userId: user._id }).lean();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      provider: provider || null
    });
  } catch (err) {
    console.error("login", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --------------------- FORGOT PASSWORD ---------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ error: "Missing email" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "No user with that email" });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(
      email
    )}`;

    await sendMail({
      to: user.email,
      subject: "Password Reset",
      html: `
        <p>You requested a password reset.</p>
        <p>Click here: <a href="${resetUrl}">${resetUrl}</a></p>
      `,
    });

    res.json({ ok: true, message: "Password reset email sent" });
  } catch (err) {
    console.error("forgotPassword", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --------------------- RESET PASSWORD ---------------------
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Password Updated",
      html: "<p>Your password was changed successfully.</p>",
    });

    res.json({ ok: true, message: "Password updated" });
  } catch (err) {
    console.error("resetPassword", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const getMe = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // also check if they have a provider profile
    const provider = await Provider.findOne({ userId: user._id }).lean();

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        phone: user.phone,
        address: user.address,
        lat: user.lat,
        lng: user.lng
      },
      provider: provider
        ? {
            id: provider._id.toString(),
            name: provider.name,
            category: provider.category,
            rating: provider.rating,
            reviewCount: provider.reviewCount,
            hourlyRate: provider.hourlyRate,
            imageUrl: provider.imageUrl,
            phone: provider.phone,
            location: provider.location,
            isVerified: provider.isVerified
          }
        : null,
    });
  } catch (err) {
    console.error('getMe', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// --------------------- UPDATE ME (current user profile) ---------------------
export const updateMe = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Allowed fields to update
    const { name, phone, address, lat, lng } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (lat !== undefined) user.lat = Number(lat);
    if (lng !== undefined) user.lng = Number(lng);

    await user.save();

    // include provider summary in response, like getMe
    const provider = await Provider.findOne({ userId: user._id }).lean();

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        phone: user.phone,
        address: user.address,
        lat: user.lat,
        lng: user.lng
      },
      provider: provider
        ? {
            id: provider._id.toString(),
            name: provider.name,
            category: provider.category,
            rating: provider.rating,
            reviewCount: provider.reviewCount,
            hourlyRate: provider.hourlyRate,
            imageUrl: provider.imageUrl,
            phone: provider.phone,
            location: provider.location,
            isVerified: provider.isVerified
          }
        : null,
    });
  } catch (err) {
    console.error('updateMe', err);
    return res.status(500).json({ error: 'Server error' });
  }
};