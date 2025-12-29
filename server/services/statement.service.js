import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import db from "../config/db.js"; 

export const generatePDF = (userId, start, end, callback) => {
  console.log("📄 generatePDF called for user:", userId);

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const pdfPath = path.join(tempDir, `statement_${userId}.pdf`);
  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Step 0: Fetch user info
  db.query("SELECT name FROM users WHERE user_id = ?", [userId], (err, users) => {
    if (err || !users.length) {
      console.error("Failed to fetch user:", err);
      doc.text("User not found.");
      doc.end();
      return callback(null);
    }
    const user = users[0];

    // Step 1: Fetch account info
    db.query("SELECT * FROM accounts WHERE user_id = ?", [userId], (err, accounts) => {
      if (err || !accounts.length) {
        console.error("Failed to fetch account info:", err);
        doc.text("No account found for this user.");
        doc.end();
        return callback(null);
      }
      const account = accounts[0];
      const accountId = account.id;

      const startStr = start.toISOString().slice(0, 19).replace("T", " ");
      const endStr = end.toISOString().slice(0, 19).replace("T", " ");

      // Step 2: Fetch all previous transactions to calculate opening balance
      db.query(
        "SELECT * FROM transactions WHERE account_id = ? AND date < ? ORDER BY date ASC",
        [accountId, startStr],
        (err, prevTxns) => {
          if (err) {
            console.error("DB query error for opening balance:", err);
            doc.end();
            return callback(null);
          }

          let openingBalance = account.opening_balance || 0;
          prevTxns.forEach(t => {
            const amt = Number(t.amount) || 0;
            if (t.type === "deposit" || (t.type === "transfer" && t.target_account_number === account.account_number)) {
              openingBalance += amt;
            } else if (t.type === "withdraw" || (t.type === "transfer" && t.target_account_number !== account.account_number)) {
              openingBalance -= amt;
            }
          });

          // Step 3: Fetch period transactions
          db.query(
            "SELECT * FROM transactions WHERE account_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC",
            [accountId, startStr, endStr],
            (err, transactions) => {
              if (err) {
                console.error("DB query error:", err);
                doc.end();
                return callback(null);
              }

              // Calculate closing balance
              let closingBalance = openingBalance;
              transactions.forEach(t => {
                const amt = Number(t.amount) || 0;
                if (t.type === "deposit" || (t.type === "transfer" && t.target_account_number === account.account_number)) {
                  closingBalance += amt;
                } else if (t.type === "withdraw" || (t.type === "transfer" && t.target_account_number !== account.account_number)) {
                  closingBalance -= amt;
                }
              });

              // ---------- PDF HEADER ----------
              doc.fontSize(18).text("HBL Bank", { align: "center" });
              doc.fontSize(14).text("Account Statement", { align: "center" });
              doc.fontSize(10).text(`Period: ${start.toDateString()} - ${end.toDateString()}`, { align: "center" });
              doc.moveDown(2);

              // ---------- ACCOUNT INFO ----------
              const infoX = 40;
              doc.x = infoX;
              doc.font("Helvetica-Bold").text("Account Holder: ", { continued: true });
              doc.font("Helvetica").text(user.name);

              doc.x = infoX;
              doc.font("Helvetica-Bold").text("Account Number: ", { continued: true });
              doc.font("Helvetica").text(account.account_number);

              doc.x = infoX;
              doc.font("Helvetica-Bold").text("Account Type: ", { continued: true });
              doc.font("Helvetica").text(account.account_type);

              doc.x = infoX;
              doc.font("Helvetica-Bold").text("Opening Balance: ", { continued: true });
              doc.font("Helvetica").text(openingBalance.toFixed(2));

              doc.x = infoX;
              doc.font("Helvetica-Bold").text("Closing Balance: ", { continued: true });
              doc.font("Helvetica").text(closingBalance.toFixed(2));
              doc.moveDown(2);

              // ---------- TABLE HEADER ----------
              const startX = 40;
              let startY = doc.y;
              const ROW_HEIGHT = 25;
              const colWidths = [40, 120, 80, 80, 80]; // Serial, Type, Debit, Credit, Balance

              doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), ROW_HEIGHT).fillAndStroke("#f0f0f0", "#000");
              ["#", "Type", "Debit", "Credit", "Balance"].forEach((text, i) => {
                doc.fillColor("#000").font("Helvetica-Bold").text(text, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, startY + 8, {
                  width: colWidths[i] - 10,
                  align: "left"
                });
              });

              startY += ROW_HEIGHT;
              doc.font("Helvetica").fontSize(10);

              // ---------- TRANSACTIONS ----------
              let txnBalance = openingBalance;
              if (!transactions.length) {
                doc.text("No transactions for this period.", startX, startY);
              } else {
                transactions.forEach((t, idx) => {
                  if (startY + ROW_HEIGHT > 750) {
                    doc.addPage();
                    startY = 50;
                  }

                  const amt = Number(t.amount) || 0;
                  let debit = "", credit = "";

                  // Assign correct debit/credit for deposit, withdraw, transfer
                  if (t.type === "deposit") {
                    credit = amt.toFixed(2);
                    txnBalance += amt;
                  } else if (t.type === "withdraw") {
                    debit = amt.toFixed(2);
                    txnBalance -= amt;
                  } else if (t.type === "transfer") {
                    if (t.target_account_number === account.account_number) {
                      credit = amt.toFixed(2); // incoming
                      txnBalance += amt;
                    } else {
                      debit = amt.toFixed(2); // outgoing
                      txnBalance -= amt;
                    }
                  }

                  const row = [
                    (idx + 1).toString(),
                    t.type,
                    debit,
                    credit,
                    txnBalance.toFixed(2)
                  ];

                  let currentX = startX;
                  row.forEach((cell, i) => {
                    doc.rect(currentX, startY, colWidths[i], ROW_HEIGHT).stroke();
                    doc.text(cell.toString(), currentX + 5, startY + 8, { width: colWidths[i] - 10, align: "left" });
                    currentX += colWidths[i];
                  });

                  startY += ROW_HEIGHT;
                });
              }

              doc.end();

              stream.on("finish", () => {
                console.log("PDF generated at:", pdfPath);
                callback(pdfPath);
              });

              stream.on("error", (err) => {
                console.error("PDF generation error:", err);
                callback(null);
              });
            }
          );
        }
      );
    });
  });
};



