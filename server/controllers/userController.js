import User from "../models/User.js";
import bcrypt from "bcryptjs";

// 🔹 Common helper function — top par rakho
const fetchUser = (user) => {
  if (!user) return null;

  return {
    id: user.user_id,
    username: user.username,
    name: user.name,
    address: user.address,
    contact: user.contact,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
  };
};

// 🔹 getById (callback)
// export const getById = (req, res) => {
//   const userId = req.params.id;

//   User.findByUserId(userId, (err, result) => {
//     if (err) return res.status(500).json({ message: "DB error", error: err.message });

//     const user = fetchUser(result[0]);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.status(200).json(user);
//   });
// };

// 🔹 getUserById 
export const getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await User.findById(userId);
    const user = fetchUser(result);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: "DB error", error: err.message });
  }
};

export const getAllUsers = (req, res) => {
  User.findAll((err, users) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(users);
  });
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const newData = { ...req.body };

    // Prevent changing role/status/id
    delete newData.role;
    delete newData.status;
    delete newData.id;

    const currentUser = await User.findById(id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const updatedData = {
      username: newData.username || currentUser.username,
      password: newData.password ? await bcrypt.hash(newData.password, await bcrypt.genSalt(10)) : currentUser.password,
      name: newData.name || currentUser.name,
      address: newData.address || currentUser.address,
      contact: newData.contact || currentUser.contact,
    };

    const updated = await User.update(id, updatedData); 
    if (!updated) return res.status(500).json;

    res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};


