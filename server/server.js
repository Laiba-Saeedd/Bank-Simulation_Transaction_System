// server.js
import express from "express";
import cors from "cors";
import { startCron } from "./cron/statementCron.js";
import "./workers/statementWorker.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import accountsRoutes from "./routes/accountsRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import adminUsersRoutes from "./routes/adminUsersRoutes.js";
import disputesRoutes from "./routes/disputesRoutes.js";
const app = express();


app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
// start cron jobs
startCron();
// Auth routes
app.use("/api/auth", authRoutes);
//User Routes
app.use("/api/users", userRoutes);
// Transaction Routes
app.use("/api/transactions", transactionRoutes);
// Account Routes
app.use("/api", accountsRoutes);
// Admnin User Management ROutes
app.use("/admin", adminUsersRoutes);  
// Dispute Routes
app.use("/api/disputes", disputesRoutes);

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
