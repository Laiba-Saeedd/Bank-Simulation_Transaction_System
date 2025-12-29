// Queue for bank statements
import { Queue } from "bullmq";
import { redisConfig } from "../config/redis.js";

/**
 * Statement Queue
 * - Cron job is queue me job push karega
 * - Worker is queue se job pick karke process karega
 */

export const statementQueue = new Queue("statementQueue", {
  connection: redisConfig,
});
