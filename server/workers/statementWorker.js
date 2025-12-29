// workers/statementWorker.js
import { Worker } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { generatePDF } from "../services/statement.service.js";
import { sendEmail } from "../services/emailService.js";
import { statementEmailTemplate } from "../templates/emailTemplates.js";
import {
  getUserById,
  logStatement,
  getLatestStatementLog,
} from "../config/queries.js";

console.log("✅ Statement Worker started");

new Worker(
  "statementQueue",
  async (job) => {
    const { userId } = job.data;
    console.log("🚀 Processing userId:", userId);

    try {
      /* =========================
         0️⃣ Get latest log
      =========================== */
      const latestLog = await getLatestStatementLogAsync(userId);
      console.log("🧪 Latest log:", latestLog);

      // ⛔ If already pending, don't start another
      if (latestLog?.status === "pending") {
        console.log("⏭️ Job already pending, skipping");
        return true;
      }

      // ⏱️ If sent recently, wait 10 minutes
      if (
        latestLog?.status === "sent" &&
        !canResendUsingSentAt(latestLog.sent_at)
      ) {
        console.log("⏭️ Email sent recently, waiting 10 minutes");
        return true;
      }

      if (latestLog?.status === "sent") {
        console.log("🔁 10 minutes passed, resending email");
      }

      /* =========================
         1️⃣ Mark pending
      =========================== */
      await safeLogStatement(userId, "pending");

      /* =========================
         2️⃣ Date range (today)
      =========================== */
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      /* =========================
         3️⃣ Fetch user
      =========================== */
      const user = await getUserByIdAsync(userId);
      if (!user || !user.contact) {
        console.warn("❌ Invalid user:", userId);
        await safeLogStatement(userId, "failed");
        return true;
      }

      console.log("👤 User fetched:", user.name);

      /* =========================
         4️⃣ Generate PDF
      =========================== */
      const pdfPath = await generatePDFAsync(
        userId,
        startOfDay,
        endOfDay
      );
      console.log("📄 PDF generated:", pdfPath);

      /* =========================
         5️⃣ Send Email
      =========================== */
      console.log("📨 Sending email to:", user.contact);

      await sendEmail({
        to: user.contact,
        subject: "Your Daily Bank Statement",
        html: statementEmailTemplate({
          userName: user.name,
          month: new Date().toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
        }),
        attachments: [
          { filename: "statement.pdf", path: pdfPath },
        ],
      });

      console.log("✅ Email sent to:", user.contact);

      /* =========================
         6️⃣ Mark SENT (updates sent_at)
      =========================== */
      await safeLogStatement(userId, "sent");

      console.log("🎉 Job completed for userId:", userId);
      return true;

    } catch (err) {
      console.error("❌ Worker failed:", err);
      await safeLogStatement(userId, "failed");
      throw err; // BullMQ needs this
    }
  },
  {
    connection: redisConfig,
    concurrency: 1,
    lockDuration: 5 * 60 * 1000,
    stalledInterval: 30 * 1000,
    removeOnComplete: true,
    removeOnFail: false,
  }
);

/* =========================
   HELPERS
=========================== */

// ⏱️ Check if 10 minutes passed using sent_at
function canResendUsingSentAt(sentAt) {
  if (!sentAt) return true;

  const lastSent = new Date(sentAt).getTime();
  const now = Date.now();

  const diffMinutes = (now - lastSent) / (1000 * 60);
  return diffMinutes >= 10;
}

function safeLogStatement(userId, status) {
  return new Promise((resolve, reject) => {
    logStatement(userId, status, (err) => {
      if (err) {
        console.error(
          `❌ Failed to log "${status}" for userId ${userId}`,
          err
        );
        reject(err);
      } else {
        console.log(`ℹ️ Status "${status}" saved for userId ${userId}`);
        resolve();
      }
    });
  });
}

function getUserByIdAsync(userId) {
  return new Promise((resolve, reject) => {
    getUserById(userId, (err, user) => {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

function getLatestStatementLogAsync(userId) {
  return new Promise((resolve, reject) => {
    getLatestStatementLog(userId, (err, log) => {
      if (err) reject(err);
      else resolve(log);
    });
  });
}

function generatePDFAsync(userId, start, end) {
  return new Promise((resolve, reject) => {
    generatePDF(userId, start, end, (pdfPath) => {
      if (!pdfPath) reject(new Error("PDF generation failed"));
      else resolve(pdfPath);
    });
  });
}
