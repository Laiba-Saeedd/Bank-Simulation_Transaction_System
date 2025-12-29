import nodemailer from "nodemailer";
import { emailHeader, emailFooter } from "../templates/emailLayout.js";
import dotenv from "dotenv";
dotenv.config();

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// export const sendEmail = async ({ to, subject, html }) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
//       to,
//       subject,
//       html: `${emailHeader()}${html}${emailFooter()}`, 
//       attachments: [
//         {
//           filename: "HBL_logo.png",
//           path: "./public/images/HBL_logo.png",
//           cid: "hblLogo",
//         },
//           ...attachments,
//       ],
//     });
//     // console.log("Email sent:", info.messageId);
//   } catch (err) {
//     console.error("Error sending email:", err);
//   }
// };
// export const sendEmail = async ({
//   to,
//   subject,
//   html,
//   attachments = [],
// }) => {
//   try {
//     await transporter.sendMail({
//       from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
//       to,
//       subject,
//       html: `${emailHeader()}${html}${emailFooter()}`,
//       attachments: [
//         {
//           filename: "HBL_logo.png",
//           path: "./public/images/HBL_logo.png",
//           cid: "hblLogo",
//         },
//         ...attachments,
//       ],
//     });
//   } catch (err) {
//     console.error("❌ Email send failed:", err);
//     throw err; 
//   }
// };
export const sendEmail = async ({
  to,
  subject,
  html,
  attachments = [],
}) => {
  try {
    await transporter.verify(); // 🔥 ensure connection ready

    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html: `${emailHeader()}${html}${emailFooter()}`,
      attachments: [
        {
          filename: "HBL_logo.png",
          path: "./public/images/HBL_logo.png",
          cid: "hblLogo",
        },
        ...attachments,
      ],
    });

    console.log("📧 Email messageId:", info.messageId);

    transporter.close(); // 🔥 VERY IMPORTANT
  } catch (err) {
    console.error("❌ Email send failed:", err);
    throw err;
  }
};
