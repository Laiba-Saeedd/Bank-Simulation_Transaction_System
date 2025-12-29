import { sendEmail } from "./emailService.js";
import bcrypt from "bcryptjs";
import { 
  registerEmailTemplate, 
} from "../templates/emailTemplates.js";
import User from "../models/User.js";

export const registerUserService = async (userData) => {
  // 1️⃣ Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const newUser = {
    ...userData,
    password: hashedPassword,
    role: userData.role || "user",
    status: userData.status || "active",
  };

  // 2️⃣ Call DB create function
  const result = await User.create(newUser);

  // 3️⃣ Send welcome email if contact includes "@"
  if (newUser.contact?.includes("@")) {
    try {
      await sendEmail({
        to: newUser.contact,
        subject: "Welcome to HBL Bank!",
        html: registerEmailTemplate(newUser),
      });
    } catch (err) {
      console.error("Failed to send registration email:", err);
    }
  }
  return result;
};