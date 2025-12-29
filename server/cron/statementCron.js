import cron from "node-cron";
import { getActiveUsers } from "../config/queries.js";
import { statementQueue } from "../queues/statementQueue.js";

let cronStarted = false;

const runJob = () => {
   console.log("🕒 Cron running at", new Date()); 
  getActiveUsers((err, users) => {
    if (err) return console.error("Error fetching users:", err);

    console.log("Queueing jobs for active users:", users.length);

    users.forEach(user => {
      console.log("Queueing job for user:", user.user_id);
     statementQueue.add(
  "generate-statement",
  { userId: user.user_id },
  {
    attempts: 3,
    jobId: `statement-${user.user_id}-${Date.now()}`,
    removeOnComplete: true,
  }
);

      // statementQueue.add("generate-statement", { userId: user.user_id }, {  backoff: { type: "exponential", delay: 60000 } });
    });
  });
};

export const startCron = () => {
  if (cronStarted) return console.log("⚠️ Cron already started");

  cronStarted = true;

  if (process.env.MODE === "TEST") {
    cron.schedule(" 0 */10  * * *", runJob);
    console.log("🕒 Test cron started (every 10 hour)");
  } else {
    cron.schedule("0 0 1 * *", runJob); // 1st of every month
    console.log("🕒 Production cron started (monthly)");
  }
};
