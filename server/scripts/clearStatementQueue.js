// server/scripts/clearStatementQueue.js
import { Queue } from "bullmq";
import { redisConfig } from "../config/redis.js";

const queue = new Queue("statementQueue", { connection: redisConfig });

async function clearQueue() {
  await queue.drain(); // removes waiting jobs
  await queue.clean(0, 0, "active"); // removes active jobs
  await queue.clean(0, 0, "pending"); // optional, clear completed
  await queue.clean(0, 0, "failed"); // optional, clear failed
  console.log("✅ Queue cleared");
  process.exit(0);
}

clearQueue();
