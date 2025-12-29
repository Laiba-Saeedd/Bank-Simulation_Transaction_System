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

// Register a new user
// export const registerUser = async (req, res) => {
//   const { username, password, name, address, contact, role, status } = req.body;

//   try {
//     // 1. Check if username already exists
//     User.findByUsername(username, async (err, existingUser) => {
//       if (err) {
//         console.error("DB Error:", err);
//         return res.status(500).json({ message: "Database error", error: err.message });
//       }

//       if (existingUser.length > 0) {
//         return res.status(400).json({ message: "Username already exists" });
//       }

//       // 2. Hash the password
//       const hashedPassword = await bcrypt.hash(password, 10);

//       // 3. Create new user object
//       const newUser = {
//         username,
//         password: hashedPassword,
//         name,
//         address,
//         contact,
//         role:  role||"user",      
//         status: status || "active", // default to active
//         created_at: new Date(),     // current timestamp
//       };

//       // 4. Save user to database
//       User.create(newUser, (err) => {
//         if (err) {
//           console.error("DB Error:", err);
//           return res.status(500).json({ message: "Failed to register user", error: err.message });
//         }

//         res.status(201).json({ message: "User registered successfully!" });
//       });
//     });
//   } catch (error) {
//     console.error("Unexpected Error:", error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
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


// LOGIN
// export const loginUser = (req, res) => {
//   const { username, password } = req.body;

//   User.findByUsername(username, async (err, users) => {
//     if (err) return res.status(500).json({ message: "Database error", error: err.message });
//     if (users.length === 0) return res.status(400).json({ message: "User not found" });

//     const user = users[0];
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     // Calculate expiresAt (7 days for refresh token)
//     const expiresAt = new Date();
//     expiresAt.setDate(expiresAt.getDate() + 7);

// const accessToken = generateAccessToken(user);
// const refreshToken = generateRefreshToken(user);

// // Hash both tokens before saving
// const hashedAccessToken = await hashToken(accessToken);
// const hashedRefreshToken = await hashToken(refreshToken);

// // Save hashed tokens in DB
// Token.createOrUpdate(user.user_id, hashedAccessToken, hashedRefreshToken, expiresAt, (err) => {
//   if (err) console.error("Token DB Error:", err);
// });

// // Send plain tokens to client
// res.cookie("refreshToken", refreshToken, {
//   httpOnly: true,
//   secure: false, // true in prod
//   sameSite: "lax",
//   path: "/",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// });
// res.cookie("accessToken", accessToken, {
//   httpOnly: true,
//   secure: false, // true in prod
//   sameSite: "lax",
//   path: "/",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// });

// res.status(200).json({
//   message: "Login successful",
//   accessToken,    // plain JWT
//   refreshToken,   // plain JWT
//   expiresAt,
//       user: {
//         id: user.user_id,
//         username: user.username,
//         name: user.name,
//         role: user.role,
//         status: user.status,
//       },
//     });
//   });
// };
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


export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "Email is required" });

  const [users] = db.query(
    "SELECT id, email FROM users WHERE email = ?",
    [email]
  );

  // Always return same response (security)
  if (users.length === 0) {
    return res.json({
      message: "If account exists, reset link sent",
    });
  }

  const user = users[0];

  // 🔹 Generate RAW token (sent in email)
  const rawToken = crypto.randomBytes(32).toString("hex");

  // 🔹 Hash token using bcrypt (YOUR logic)
  const hashedToken = await hashToken(rawToken);

  // 🔹 Expiry (15 minutes)
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  db.query(
    `UPDATE users 
     SET reset_token = ?, reset_token_expiry = ?
     WHERE id = ?`,
    [hashedToken, expiry, user.id]
  );

  const resetLink = `http://localhost:3000/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset Your Password",
    html: `
      <p>Password reset requested.</p>
      <p>This link is valid for <b>15 minutes</b>.</p>
      <a href="${resetLink}">Reset Password</a>
    `,
  });

  res.json({ message: "Reset link sent" });
};
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ message: "Invalid request" });

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  // 🔹 Get user with active reset token
  const [users] = db.query(
    `SELECT id, reset_token, reset_token_expiry
     FROM users
     WHERE reset_token IS NOT NULL`
  );

  if (users.length === 0)
    return res.status(400).json({ message: "Invalid or expired link" });

  // 🔹 Find matching token using bcrypt.compare
  let matchedUser = null;

  for (const user of users) {
    const isMatch = await bcrypt.compare(token, user.reset_token);
    if (isMatch) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser)
    return res.status(400).json({ message: "Invalid or expired link" });

  // 🔹 Expiry check
  if (new Date(matchedUser.reset_token_expiry) < new Date()) {
    return res.status(400).json({ message: "Reset link expired" });
  }

  // 🔹 Hash new password (bcrypt)
  const hashedPassword = await bcrypt.hash(newPassword, 10);
 db.query(
    `UPDATE users
     SET password = ?, reset_token = NULL, reset_token_expiry = NULL
     WHERE id = ?`,
    [hashedPassword, matchedUser.id]
  );

  res.json({ message: "Password changed successfully" });
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
