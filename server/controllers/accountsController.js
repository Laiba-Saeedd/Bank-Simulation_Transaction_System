// controllers/accountsController.js
import db from "../config/db.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { Parser } from "json2csv";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { createAccountService } from "../services/accountServices.js";

// ---------- CREATE ACCOUNT ----------
export const createAccountController = async (req, res) => {
  try {
    const { user_id, account_number, balance = 0, account_type = "Saving" } = req.body;

    const result = await createAccountService({ user_id, account_number, balance, account_type });

    // Response
    res.status(201).json({
      message: "Account created successfully",
      accountId: result.insertId,
    });
  } catch (err) {
    // Handle errors
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Account number already exists" });
    }
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ---------- GET ALL ACCOUNTS ----------
export const getAllAccounts = async (req, res) => {
  try {
    const results = await Account.findAll();
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ---------- GET ACCOUNT BY ID ----------
export const getAccountById = async (req, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid account ID" });

  try {
    const account = await Account.findById(id);
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ---------- GET ACCOUNTS BY USER ID ----------
export const getAccountsByUserId = async (req, res) => {
  const userId = Number(req.params.id); 
  if (!userId || isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

  try {
    const results = await Account.findByUserId(userId);
    if (!results.length) return res.status(404).json({ message: "No accounts found for this user" });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
export const getAccountsByAccountNumber = async (req, res) => {
  const account_number = req.params.number; 

  if (!account_number) 
    return res.status(400).json({ message: "Invalid Account Number" });

  try {
    const results = await Account.findByAccountNumber(account_number);
    if (!results.length) 
      return res.status(404).json({ message: "No accounts found for this account number" });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ---------- UPDATE ACCOUNT BY ID ----------
export const updateAccountById = async (req, res) => {
  const accountId = Number(req.params.id);
  const { account_number, balance ,account_type} = req.body;

  if (!accountId || isNaN(accountId)) return res.status(400).json({ message: "Invalid account ID" });

  try {
    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ message: "Account not found" });

    const updatedData = {
      account_number: account_number ?? account.account_number,
      balance: balance !== undefined ? balance : account.balance,
      account_type:account_type?? account.account_type,
    };

    await Account.updateById(accountId, updatedData);
    res.json({ message: "Account updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ---------- UPDATE FIRST ACCOUNT BY USER ID ----------
export const updateAccountByUserId = async (req, res) => {
  const userId = Number(req.params.userId);
  const { account_number, balance, account_type } = req.body;

  if (!userId || isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

  try {
    const accounts = await Account.findByUserId(userId);
    if (!accounts.length) return res.status(404).json({ message: "No accounts found for this user" });

    const account = accounts[0];
    const updatedData = {
      account_number: account_number ?? account.account_number,
      balance: balance !== undefined ? balance : account.balance,
       account_type:account_type?? account.account_type,
    };

    await Account.updateById(account.id, updatedData);
    res.json({ message: `Account #${account.id} updated successfully for user ${userId}` });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ---------- DELETE ACCOUNT BY ID ----------
export const deleteAccountById = async (req, res) => {
  const accountId = Number(req.params.id);
  if (!accountId || isNaN(accountId)) return res.status(400).json({ message: "Invalid account ID" });

  try {
    const result = await Account.deleteById(accountId);
    if (!result || result.affectedRows === 0) return res.status(404).json({ message: "Account not found" });
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete by ID error:", err);
    res.status(500).json({ message: "Server error", error: err.message || err });
  }
};

// Delete accounts by User ID
export const deleteAccountsByUserId = async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId || isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

  try {
    const result = await Account.deleteByUserId(userId);
    if (!result || result.affectedRows === 0) return res.status(404).json({ message: "No accounts found for this user" });
    res.json({ message: `Deleted ${result.affectedRows} account(s) for user ${userId}` });
  } catch (err) {
    console.error("Delete by User ID error:", err);
    res.status(500).json({ message: "Server error", error: err.message || err });
  }
};

// ---------- GET USER ACCOUNT (for dashboard) ----------
export const getUserAccount = async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const accounts = await Account.findByUserId(userId);
    if (!accounts.length) {
      return res.status(404).json({ message: "No accounts found for this user" });
    }
    res.json(accounts);
  } catch (err) {
    console.error("Get user account error:", err);
    res.status(500).json({ message: "Server error", error: err.message || err });
  }
};
// // --- Helper to fetch statement data ---
async function getStatementData(accountNumber, fromDate, toDate) {
  if (!accountNumber) throw new Error("Invalid account number");

  // Fetch account
  const account = await Account.findWithUser(accountNumber);
  if (!account) throw new Error("Account not found");

  const holderName = account.holder_name || "Unknown";

 const start = new Date(fromDate);
start.setHours(0, 0, 0, 0);

const end = new Date(toDate);
end.setHours(23, 59, 59, 999);

const startStr = start
  .toISOString()
  .slice(0, 19)
  .replace("T", " ");

const endStr = end
  .toISOString()
  .slice(0, 19)
  .replace("T", " ");



  // ---------- OPENING BALANCE (before fromDate) ----------
  const openingResult = await new Promise((resolve, reject) => {
    const query = `
      SELECT IFNULL(SUM(
        CASE
          WHEN t.type = 'deposit' THEN t.amount
          WHEN t.type = 'withdraw' THEN -t.amount
          WHEN t.type = 'transfer' AND t.account_id = ? THEN -t.amount
          WHEN t.type = 'transfer' AND t.target_account_id = ? THEN t.amount
          ELSE 0
        END
      ), 0) AS openingBalance
      FROM transactions t
      WHERE t.date < ?
        AND (t.account_id = ? OR t.target_account_id = ?)
    `;

    db.query(
      query,
      [account.id, account.id, startStr, account.id, account.id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });

  const openingBalance = Number(openingResult.openingBalance || 0);

  // ---------- TRANSACTIONS (ONLY DB DATA, ONLY PERIOD) ----------
  const transactions = await Transaction.findStatementByAccountId(
    account.id,
    startStr,
    endStr
  );

  let runningBalance = openingBalance;

  const formattedTxns = transactions.map(t => {
    let debit = "";
    let credit = "";

    if (t.type === "withdraw") debit = t.amount;
    if (t.type === "deposit") credit = t.amount;

    if (t.type === "transfer") {
      if (t.account_id === account.id) debit = t.amount;
      if (t.target_account_id === account.id) credit = t.amount;
    }

    runningBalance += Number(credit || 0) - Number(debit || 0);

    return {
      date: t.date,
      description: t.description || t.type,
      debit,
      credit,
      balance: runningBalance.toFixed(2),
    };
  });

  return {
    bankName: "HBL Bank",
    statementTitle: "Account Statement",
    period: { from: fromDate, to: toDate },
    accountDetails: {
      accountHolderName: holderName,
      accountNumber: account.account_number,
      accountType: account.account_type || "Unknown",
    },
    openingBalance: openingBalance.toFixed(2),
    closingBalance: runningBalance.toFixed(2),
    transactions: formattedTxns, // ✅ ONLY DB ROWS
  };
}


async function getAllAccountsStatementData(fromDate, toDate) {
  const accounts = await Account.findAll();

  if (!accounts.length) {
    throw new Error("No accounts found");
  }

  const allStatements = [];

  for (const acc of accounts) {
    const statement = await getStatementData(
      acc.account_number,
      fromDate,
      toDate
    );
    allStatements.push(statement);
  }

  return allStatements;
}


// --- JSON Statement ---
export const getAccountStatement = async (req, res) => {
  try {
    let { accountNumber, fromDate, toDate } = req.query;
    accountNumber = accountNumber?.toString().trim();

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔹 ALL ACCOUNTS
    if (!accountNumber) {
      const statements = await getAllAccountsStatementData(fromDate, toDate);
      return res.json({ statements });
    }

    // 🔹 SINGLE ACCOUNT
    const statement = await getStatementData(accountNumber, fromDate, toDate);
    res.json(statement);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// --- CSV Statement ---
export const getAccountStatementCSV = async (req, res) => {
  try {
    let { accountNumber, fromDate, toDate } = req.query;
    accountNumber = accountNumber?.toString().trim();

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const rows = [];
    rows.push(["=============================="]);
    rows.push(["HBL Bank"]);
    rows.push(["Account Statement"]);
    rows.push([`Period: ${fromDate} - ${toDate}`]);
    rows.push(["=============================="]);
    rows.push([]);

    // 🔹 ALL ACCOUNTS
    if (!accountNumber) {
      const statements = await getAllAccountsStatementData(fromDate, toDate);

      statements.forEach((st, index) => {
        rows.push([`Account ${index + 1}`]);
        rows.push(["Account Holder", st.accountDetails.accountHolderName]);
        rows.push(["Account Number", st.accountDetails.accountNumber]);
        rows.push(["Account Type", st.accountDetails.accountType]);
        rows.push(["Opening Balance", st.openingBalance]);
        rows.push(["Closing Balance", st.closingBalance]);
        rows.push([]);
        rows.push([]);
        rows.push(["Date", "Description", "Debit", "Credit", "Balance"]);

        st.transactions.forEach(t => {
          rows.push([t.date, t.description, t.debit || "", t.credit || "", t.balance]);
        });

        rows.push([]);
      });

      const parser = new Parser({ header: false });
      const csv = parser.parse(rows);

      res.header("Content-Type", "text/csv");
      res.attachment("statement_all_accounts.csv");
      return res.send(csv);
    }

    // 🔹 SINGLE ACCOUNT
    const statement = await getStatementData(accountNumber, fromDate, toDate);

    rows.push(["Account Holder", statement.accountDetails.accountHolderName]);
    rows.push(["Account Number", statement.accountDetails.accountNumber]);
    rows.push(["Account Type", statement.accountDetails.accountType]);
    rows.push(["Opening Balance", statement.openingBalance]);
    rows.push(["Closing Balance", statement.closingBalance]);
    rows.push([]);
    rows.push([]);
    rows.push(["Date", "Description", "Debit", "Credit", "Balance"]);

    statement.transactions.forEach(t => {
      rows.push([t.date, t.description, t.debit || "", t.credit || "", t.balance]);
    });

    const parser = new Parser({ header: false });
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`statement_${accountNumber}.csv`);
    res.send(csv);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// --- Excel Statement ---
export const getAccountStatementExcel = async (req, res) => {
  try {
    let { accountNumber, fromDate, toDate } = req.query;
    accountNumber = accountNumber?.toString().trim();

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("All Accounts Statement");

    // ---------- GLOBAL STYLES ----------
    const titleStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: "center" }
    };

    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" }
      },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      }
    };

    const cellBorder = {
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      }
    };

    let currentRow = 1;

    // ---------- BANK TITLE ----------
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = "HBL Bank";
    sheet.getCell(`A${currentRow}`).style = titleStyle;
    currentRow++;

    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = "Account Statement";
    sheet.getCell(`A${currentRow}`).style = titleStyle;
    currentRow++;

    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = `Period: ${fromDate} - ${toDate}`;
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: "center" };
    currentRow += 2;

    // ---------- ALL ACCOUNTS ----------
    const statements = accountNumber
      ? [await getStatementData(accountNumber, fromDate, toDate)]
      : await getAllAccountsStatementData(fromDate, toDate);

    for (let i = 0; i < statements.length; i++) {
      const st = statements[i];

      // ---- ACCOUNT INFO ----
      sheet.getCell(`A${currentRow}`).value = "Account Holder";
      sheet.getCell(`B${currentRow}`).value = st.accountDetails.accountHolderName;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value = "Account Number";
      sheet.getCell(`B${currentRow}`).value = st.accountDetails.accountNumber;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value = "Account Type";
      sheet.getCell(`B${currentRow}`).value = st.accountDetails.accountType;
      currentRow++;
      // ---- BALANCES (moved here) ----
      sheet.getCell(`A${currentRow}`).value = "Opening Balance";
      sheet.getCell(`B${currentRow}`).value = st.openingBalance;
      currentRow++;

      sheet.getCell(`A${currentRow}`).value = "Closing Balance";
      sheet.getCell(`B${currentRow}`).value = st.closingBalance;
      currentRow++;

      currentRow++;

      // ---- TABLE HEADER ----
      const headerRow = sheet.addRow([
        "Date",
        "Description",
        "Debit",
        "Credit",
        "Balance"
      ]);
      headerRow.eachCell(cell => Object.assign(cell, headerStyle));
      currentRow++;

      // ---- TRANSACTIONS ----
      st.transactions.forEach(t => {
        const row = sheet.addRow([
          new Date(t.date).toLocaleDateString(),
          t.description,
          t.debit || "",
          t.credit || "",
          t.balance
        ]);
        row.eachCell(cell => Object.assign(cell, cellBorder));
        currentRow++;
      });
    
      currentRow += 1;
    }

    // ---------- COLUMN WIDTH ----------
    sheet.columns = [
      { width: 15 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    // ---------- RESPONSE ----------
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      accountNumber
        ? `attachment; filename=statement_${accountNumber}.xlsx`
        : "attachment; filename=statement_all_accounts.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// --- PDF Statement ---
export const getAccountStatementPDF = async (req, res) => {
  try {
    let { accountNumber, fromDate, toDate } = req.query;
    accountNumber = accountNumber?.toString().trim();

    // Fetch either a single account or all accounts
    const statements = accountNumber
      ? [await getStatementData(accountNumber, fromDate, toDate)]
      : await getAllAccountsStatementData(fromDate, toDate);

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      accountNumber
        ? `attachment; filename=statement_${accountNumber}.pdf`
        : "attachment; filename=statement_all_accounts.pdf"
    );

    doc.pipe(res);

    // ---------- BANK TITLE ----------
    doc.fontSize(18).text("HBL Bank", { align: "center" });
    doc.fontSize(14).text("Account Statement", { align: "center" });
    doc.fontSize(10).text(`Period: ${fromDate} - ${toDate}`, { align: "center" });
    doc.moveDown(2);

    const startX = 40;
    const ROW_HEIGHT = 30;
    const colWidths = [70, 180, 80, 80, 90];
    let startY = doc.y; // get current Y position

    for (let st of statements) {
      // ---------- ACCOUNT INFO (simple text, no box) ----------
     // Set left margin for account info
const infoStartX = 40;

// ---------- ACCOUNT INFO (always left-aligned) ----------
doc.x = infoStartX;
doc.font("Helvetica-Bold").text("Account Holder: ", { continued: true });
doc.font("Helvetica").text(st.accountDetails.accountHolderName);

doc.x = infoStartX;
doc.font("Helvetica-Bold").text("Account Number: ", { continued: true });
doc.font("Helvetica").text(st.accountDetails.accountNumber);

doc.x = infoStartX;
doc.font("Helvetica-Bold").text("Account Type: ", { continued: true });
doc.font("Helvetica").text(st.accountDetails.accountType);

doc.x = infoStartX;
doc.font("Helvetica-Bold").text("Opening Balance: ", { continued: true });
doc.font("Helvetica").text(st.openingBalance);

doc.x = infoStartX;
doc.font("Helvetica-Bold").text("Closing Balance: ", { continued: true });
doc.font("Helvetica").text(st.closingBalance);
doc.moveDown();


      // Update startY to current doc position before drawing table
      startY = doc.y;

      // ---------- TABLE HEADER ----------
      if (startY + ROW_HEIGHT > 750) {
        doc.addPage();
        startY = 50;
      }

      // Draw header background
      doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), ROW_HEIGHT)
         .fillAndStroke("#f0f0f0", "#000");

      ["Date", "Description", "Debit", "Credit", "Balance"].forEach((text, i) => {
        doc.fillColor("#000").font("Helvetica-Bold").text(text, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, startY + 8, {
          width: colWidths[i] - 10,
          align: "left"
        });
      });

      startY += ROW_HEIGHT;
      doc.font("Helvetica").fontSize(10);

      // ---------- TRANSACTIONS ----------
      st.transactions.forEach(t => {
        if (startY + ROW_HEIGHT > 750) {
          doc.addPage();
          startY = 50;
        }

        const row = [
          new Date(t.date).toLocaleDateString(),
          t.description,
          t.debit || "",
          t.credit || "",
          t.balance
        ];

        let currentX = startX;
        row.forEach((cell, i) => {
          doc.rect(currentX, startY, colWidths[i], ROW_HEIGHT).stroke();
          doc.text(cell.toString(), currentX + 5, startY + 8, {
            width: colWidths[i] - 10,
            align: "left"
          });
          currentX += colWidths[i];
        });

        startY += ROW_HEIGHT;
      });

      startY += 25; 
      doc.y = startY; 
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

