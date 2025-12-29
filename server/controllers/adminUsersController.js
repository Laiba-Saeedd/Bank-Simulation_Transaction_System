// server/controllers/adminUsersController.js
import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getUserById = async (req, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid user id" });

  try {
    const user = await User.findUserByIdWithRole(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateUser = async (req, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid user id" });

  const { username, name, address, contact, role, status, password } = req.body;

  try {
    // Optional: enforce unique username (if user is changing username)
    if (username) {
      const existing = await User.findByUsername(username);
      if (existing && existing.user_id !== id) {
        return res.status(409).json({ message: "Username already exists" });
      }
    }

    const result = await User.updateById(id, { username, name, address, contact, role, status, password });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found or nothing to update" });

    return res.json({ message: "User updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all accounts of this user
    const accounts = await Account.findByUserId(id);

    // Delete each account (and its transactions)
    for (const acc of accounts) {
      await Account.deleteById(acc.id);
    }

    // Now delete user
    const result = await User.deleteById(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// controllers/adminUsersController.js
export const blockUser = async (req, res) => {
  const id = req.params.id;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  try {
    const result = await User.updateStatusById(id, "blocked");

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User blocked successfully" });
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err });
  }
};

export const unblockUser = async (req, res) => {
  const id = req.params.id;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  try {
    const result = await User.updateStatusById(id, "active");

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err });
  }
};

