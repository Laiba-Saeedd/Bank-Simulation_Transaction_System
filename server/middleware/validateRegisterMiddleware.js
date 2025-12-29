// middlewares/validateRegisterMiddleware.js

export const validateRegister = (req, res, next) => {
  const { username, password, name, contact, role, status } = req.body;

  // Username validation
  if (!username || username.length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters" });
  }

  // Password validation
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  // Full name validation (only alphabets + space)
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Full name is required" });
  }
  if (!nameRegex.test(name)) {
    return res.status(400).json({
      message: "Full name can only contain letters and spaces",
    });
  }

  // Contact validation (email or phone)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,15}$/;

  if (!emailRegex.test(contact) && !phoneRegex.test(contact)) {
    return res.status(400).json({
      message: "Enter a valid email or phone number",
    });
  }

  // Status validation (only if role=user)
  if (role === "user") {
    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }
  }

  next(); // All validations passed
};
