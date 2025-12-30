// controllers/authController.js
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Token from "../models/Token.js";
import db from "../config/db.js";
import { registerUserService } from "../services/registerService.js";
import { sendEmail } from "../services/emailService.js";
const hashToken = async (token) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(token, salt);
};

export const registerUser = async (req, res) => {
  const { username, password, name, address, contact, role, status } = req.body;

  try {
    // 1️⃣ Check if username exists
    const existing = await User.findByUser(username);
    if (existing.length) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // 3️⃣ Call service
    const result = await registerUserService({
      username,
      password,
      name,
      address,
      contact,
      role: role || "user",
      status: status || "active",
    });

    // 4️⃣ Respond
    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
      user: result.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

const generateAccessToken = (user) =>
  jwt.sign({ id: user.user_id, username: user.username, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.user_id ,   role: user.role,}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRE });


export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Await the Promise returned by findByUsername
    const users = await User.findByUser(username);
    if (users.length === 0) return res.status(400).json({ message: "User not found" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Calculate expiresAt (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const hashedAccessToken = await hashToken(accessToken);
    const hashedRefreshToken = await hashToken(refreshToken);

    await Token.createOrUpdate(user.user_id, hashedAccessToken, hashedRefreshToken, expiresAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        id: user.user_id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// REFRESH TOKEN
export const refreshToken = (req, res) => {
  const oldToken = req.cookies.refreshToken;
  if (!oldToken) return res.status(401).json({ message: "No refresh token provided" });

  let payload;
  try {
    payload = jwt.verify(oldToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    return res.status(401).json();
  }

  // Find hashed token in DB
  db.query("SELECT * FROM tokens WHERE user_id = ?", [payload.id], async (err, results) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    if (!results || results.length === 0) return res.status(401).json({ message: "Refresh token not found" });

    const tokenRow = results[0];

    // Compare plain token from cookie with hashed token in DB
    const isValid = await bcrypt.compare(oldToken, tokenRow.refresh_token);
    if (!isValid) return res.status(401).json({ message: "Invalid refresh token" });

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { id: payload.id, role: payload.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
    );

    const newRefreshToken = jwt.sign(
      { id: payload.id, role: payload.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
    );

    const hashedNewRefreshToken = await hashToken(newRefreshToken);
    const hashedNewAccessToken = await hashToken(newAccessToken);

    // Update DB
    db.query(
      "UPDATE tokens SET access_token = ?, refresh_token = ?, expires_at = ? WHERE user_id = ?",
      [hashedNewAccessToken, hashedNewRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), payload.id],
      (err2) => {
        if (err2) return res.status(500).json({ message: "DB update error", error: err2.message });

        // Set new refresh cookie
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({ accessToken: newAccessToken });
      }
    );
  });
};
// ✅ Request Forgot Password Link
export const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // DB query (callback style)
  db.query("SELECT * FROM users WHERE contact = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!results.length) return res.status(404).json({ message: "User not found" });

    const user = results[0];

    // Generate token & hash
    const token = crypto.randomBytes(32).toString("hex");
    bcrypt.hash(token, 10, (err, hashedToken) => {
      if (err) return res.status(500).json({ message: "Hashing error" });
const expires = new Date(Date.now() + 15 * 60 * 1000);
db.query(
  "UPDATE users SET reset_token=?, reset_token_expiry=? WHERE contact=?",
  [hashedToken, expires, email],
        async (err) => {
          if (err) return res.status(500).json({ message: "DB error" });

          const resetLink = `http://localhost:3000/forgot-password?token=${token}&email=${email}`;

          // Send email using your emailService
          try {
            await sendEmail({
              to: user.contact,
              subject: "Reset your password",
              html: `Click the link below to reset your password:<br><a href="${resetLink}">${resetLink}</a>`,
            });

            res.json({ message: "Reset link sent to your email" });
          } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to send email" });
          }
        }
      );
    });
  });
};

export const resetPassword = (req, res) => {
  const { email, token, password } = req.body;

  if (!email || !token || !password)
    return res.status(400).json({ message: "Missing fields" });

  db.query(
    "SELECT reset_token, reset_token_expiry FROM users WHERE contact=?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (!results.length)
        return res.status(400).json({ message: "Invalid reset link" });

      const user = results[0];

      // ⏱️ EXPIRY CHECK
      if (!user.reset_token_expiry || Date.now() > user.reset_token_expiry) {
        return res.status(410).json({
          message: "Reset link has expired. Please request a new one.",
        });
      }
      // 🔑 TOKEN MATCH
      const isMatch = await bcrypt.compare(token, user.reset_token);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid reset link" });

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "UPDATE users SET password=?, reset_token=NULL, reset_token_expiry=NULL WHERE contact=?",
        [hashedPassword, email],
        () => {
          res.json({ message: "Password reset successful" });
        }
      );
    }
  );
};


// LOGOUT & DELETE USER
export const logoutUser = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(400).json({ message: "No refresh token provided" });

  // Step 1: Delete refresh token from DB
  Token.deleteByRefreshToken(token, (err) => {
    if (err) return res.status(500).json({ message: "DB error while deleting refresh token" });

    // Step 2: Delete all tokens of user by user_id
    const userId = req.user?.id; // optional chaining to avoid undefined
    if (!userId) return res.status(400).json({ message: "User not identified" });

    Token.deleteByUserId(userId, (err2, result) => {
      if (err2) return res.status(500).json({ message: "DB error while deleting user's tokens" });

      res.clearCookie("refreshToken", { path: "/" });
      res.status(200).json({ message: "Logged out and user tokens deleted successfully" });
    });
  });
};


export const getLoggedInUser = (req, res) => {
  try {
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id;

    User.findByUserId(userId, (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (!result || result.length === 0)
        return res.status(404).json({ message: "User not found" });

      const user = result[0];

      res.json({
        id: user.user_id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
      });
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
