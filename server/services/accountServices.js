import { sendEmail } from "./emailService.js";
import { 
  welcomeEmailTemplate, 
} from "../templates/emailTemplates.js";
import Account from "../models/Account.js"; // your DB model

export const createAccountService = async ({ user_id, account_number, balance = 0, account_type = "Saving" }) => {
  // Create account (DB logic is in Account.js)
  const result = await Account.create({ user_id, account_number, balance, account_type });

  // Fetch user info for email
  const user = {
    user_id,
    ...result.user, // result.user should contain name and contact
  };

  const account = {
    account_number,
    balance,
    account_type,
  };

  // Send welcome email
  if (user.contact?.includes("@")) {
    await sendEmail({
      to: user.contact,
      subject: "Welcome to HBL Bank!",
      html: welcomeEmailTemplate(user, account), // dynamic template
    });
  }

  return result;
};
