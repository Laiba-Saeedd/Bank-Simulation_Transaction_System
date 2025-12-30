# 🏦 Bank Transaction Simulation System

## 📌 Overview

This project is a **Bank Transaction Simulation System** designed to mimic core banking operations in a secure and user-friendly way. It allows users to manage accounts, perform transactions, and download bank statements, similar to a real-world digital banking application. The system focuses on **security**, **data integrity**, and **smooth user experience**.

The application is built with a modern tech stack, following best practices for authentication, authorization, and transactional consistency.

---

## 🚀 Features

### 👤 User Authentication & Security

* User registration and login
* JWT-based authentication (access & refresh tokens)
* Secure password hashing using **bcrypt**
* **Forgot Password** functionality with email reset link
* Reset password link expires after **15 minutes** for enhanced security

### 💳 Account Management

* Create and manage bank accounts
* View account details and balance
* Support for multiple account types (e.g., savings, current)

### 💸 Transactions

* Deposit funds
* Withdraw funds
* Transfer money between accounts
* Real-time balance updates
* Transaction validation to prevent invalid operations

### 📄 Transaction History & Statements

* View complete transaction history
* Filter statements by date range
* Download bank statements in:

  * PDF format
  * Excel format
  * CSV format

### ⚠️ Dispute Management

* Raise disputes against transactions
* Store dispute reasons and status in the database
* Admin-side support for dispute resolution (if applicable)

---

## 🛠️ Tech Stack

### Frontend

* **Next.js (React)**
* TypeScript
* Tailwind CSS / Custom CSS
* Fetch API for backend communication

### Backend

* **Node.js** with Express.js
* RESTful APIs
* JWT Authentication
* Cron jobs for background tasks (if enabled)

### Database

* MySQL
* Proper relational schema for users, accounts, transactions, and disputes

### Email Service

* Nodemailer (or custom email service)
* Used for password reset and notifications (e. deposit, transfer, withdraw, monthly bank statement, user registration, account creation etc)

---

## 🔐 Forgot Password Flow

1. User clicks on **Forgot Password**
2. Enters registered email address
3. System generates a secure reset token
4. Token is hashed and stored in the database with expiry time
5. Reset link is sent via email
6. User clicks the link and sets a new password
7. If the link is expired (after 15 minutes), user is asked to request a new one

---

## 📊 Database Highlights

* Users table with secure password and reset token storage
* Transactions table with full audit trail
* Account balances updated atomically to avoid inconsistencies
* Disputes table for transaction issue tracking

---

## ✅ Key Objectives

* Simulate real banking workflows
* Ensure data security and validation
* Provide a clean and intuitive user experience
* Practice real-world backend and frontend integration

---

## 📌 Conclusion

This Bank Transaction Simulation System demonstrates a complete banking workflow, covering authentication, transactions, security, and reporting. It is suitable for learning, demos, and showcasing full‑stack development skills with real-world use cases.

---

