"use client";
import { useEffect, useState } from "react";
import { apiFetch, refreshAccessToken } from "../lib/apiClient";

interface Transaction {
  transaction_id: number;
  account_id: number;
  target_account_id?: number;
  target_account_number?: string;
  type: "deposit" | "withdraw" | "transfer";
  amount: number;
  description?: string;
  date: string;
  balance: number;
   is_disputed?: boolean;
}

interface UserAccount {
  id: number;
  user_id: number;
  account_number: string;
  balance: number;
}

export default function UserDashboard({ currentUser }: { currentUser: any }) {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputedTransactionIds, setDisputedTransactionIds] = useState<number[]>([]);

  const [showModal, setShowModal] = useState<null | "deposit" | "withdraw" | "transfer" | "bankstatement" | "searchTransactions">(null);
  const [amount, setAmount] = useState<number>(0);
  const [target, setTarget] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloadFormat, setDownloadFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [searchDate, setSearchDate] = useState("");
  const [searchedTransactions, setSearchedTransactions] = useState<Transaction[]>([]);
  const [disputeModal, setDisputeModal] = useState<null | { transactionId: number }>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const isBlocked = currentUser?.status === "blocked";

  // ---------------- Refresh token every 10 minutes ----------------
  useEffect(() => {
    const interval = setInterval(async () => {
      try { await refreshAccessToken(); } 
      catch (err) { console.error("Failed to refresh token:", err); }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ---------------- Load accounts ----------------
  useEffect(() => {
    async function loadAccounts() {
      const userId = currentUser?.user_id || currentUser?.id;
      if (!userId) return;
      try {
        await refreshAccessToken();
        const data: UserAccount[] = await apiFetch(`/accounts/user/${userId}`);
        const accountsData = data.map(a => ({ ...a, balance: Number(a.balance) || 0 }));
        setAccounts(accountsData);
        if (accountsData.length > 0) setSelectedAccount(accountsData[0]);
      } catch (err) { console.error("Failed to load accounts:", err); }
    }
    loadAccounts();
  }, [currentUser]);

  // ---------------- Load transactions + disputes ----------------
const loadTransactions = async () => {
  if (!selectedAccount) return;

  try {
    const data: Transaction[] = await apiFetch(`/transactions/${selectedAccount!.id}`);
    const formatted = data.map(t => ({ ...t, amount: Number(t.amount) }));
    setTransactions(formatted);
  } catch (err) {
    console.error("Failed to load transactions:", err);
  }
};

// Call it whenever selectedAccount changes
useEffect(() => {
  loadTransactions();
}, [selectedAccount]);

  // ---------------- Deposit ----------------
  const handleDeposit = async () => {
    if (isBlocked || !selectedAccount || amount <= 0) return alert("Invalid action");
    try {
      const data = await apiFetch("/transactions/deposit", {
        method: "POST",
        body: JSON.stringify({ accountId: selectedAccount.id, amount }),
      });
      updateAccountBalance(data.balance);
      setAmount(0);
      setShowModal(null);
      alert("Deposit successful!");
      loadTransactions();
    } catch (err: any) { alert(err.message || "Deposit failed"); }
  };

  // ---------------- Withdraw ----------------
  const handleWithdraw = async () => {
    if (isBlocked || !selectedAccount || amount <= 0) return alert("Invalid action");
    try {
      const data = await apiFetch("/transactions/withdraw", {
        method: "POST",
        body: JSON.stringify({ accountId: selectedAccount.id, amount }),
      });
      updateAccountBalance(data.balance);
      setAmount(0);
      setShowModal(null);
      alert("Withdraw successful!");
      loadTransactions();
    } catch (err: any) { alert(err.message || "Withdraw failed"); }
  };

  // ---------------- Transfer ----------------
  const handleTransfer = async () => {
    if (isBlocked || !selectedAccount || amount <= 0 || !target) return alert("Fill all fields");
    try {
      const data = await apiFetch("/transactions/transfer", {
        method: "POST",
        body: JSON.stringify({ fromAccountId: selectedAccount.id, amount, toAccountNumber: target }),
      });
      setAccounts(prev => prev.map(a => {
        if (a.id === selectedAccount.id) return { ...a, balance: data.fromBalance };
        if (a.account_number === target) return { ...a, balance: data.toBalance };
        return a;
      }));
      setSelectedAccount(prev => prev ? { ...prev, balance: data.fromBalance } : prev);
      setAmount(0); setTarget(""); setShowModal(null);
      alert("Transfer successful!");
      loadTransactions();
    } catch (err: any) { alert(err.message || "Transfer failed"); }
  };

  const updateAccountBalance = (balance: number) => {
    setAccounts(prev => prev.map(a => a.id === selectedAccount?.id ? { ...a, balance } : a));
    setSelectedAccount(prev => prev ? { ...prev, balance } : prev);
  };

useEffect(() => {
  setTransactions(prev =>
    prev.map(t => {
      const isDisputed = disputedTransactionIds.includes(t.transaction_id);
      if (t.is_disputed !== isDisputed) {
        return { ...t, is_disputed: isDisputed };
      }
      return t;
    })
  );
}, [disputedTransactionIds]); 


  // ---------------- Bank Statement ----------------
  const handleDownload = async () => {
  if (!fromDate || !toDate || !selectedAccount) {
    alert("Select date range");
    return;
  }

  try {
    const endpoint =
      downloadFormat === "pdf"
        ? "http://localhost:5000/api/accounts/statement/pdf"
        : downloadFormat === "excel"
        ? "http://localhost:5000/api/accounts/statement/excel"
        : "http://localhost:5000/api/accounts/statement/csv";

    const url = `${endpoint}?accountNumber=${selectedAccount.account_number}&fromDate=${fromDate}&toDate=${toDate}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.ok) throw new Error("Failed");

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `statement_${selectedAccount.account_number}.${downloadFormat}`;
    link.click();
  } catch (err) {
    console.error(err);
    alert("Failed to download statement");
  }
};

  // ---------------- Search by date ----------------
const fetchTransactionsByDate = async () => {
  if (!searchDate || !selectedAccount) return;

  const data: Transaction[] = await apiFetch(
    `/transactions/${selectedAccount.id}/date?fromDate=${searchDate}&toDate=${searchDate}`
  );

  setSearchedTransactions(data);
};


  // ---------------- Raise Dispute ----------------
  const handleRaiseDispute = async () => {
    if (!disputeModal || !disputeReason.trim()) return alert("Enter dispute reason");
    try {
      await apiFetch("/disputes", { method: "POST", body: JSON.stringify({ transactionId: disputeModal.transactionId, reason: disputeReason }) });
      alert("Dispute raised successfully!");
      setDisputedTransactionIds(prev => [...prev, disputeModal.transactionId]);
      setDisputeModal(null); setDisputeReason("");
    } catch { alert("Failed to raise dispute"); }
  };
useEffect(() => {
  if (!selectedAccount) return;

  const loadDisputes = async () => {
    const data = await apiFetch(`/disputes/account/${selectedAccount.id}`);

    setDisputedTransactionIds(Array.isArray(data) ? data : []);
  };

  loadDisputes();
}, [selectedAccount]);

  // ---------------- Render ----------------
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
      {/* Left column: Accounts */}
      <div style={{ border: "1px solid #e6e6e6", padding: 16, borderRadius: 8 }}>
        <h3>Profile</h3>
        <div>{currentUser.name}</div>
        <div style={{ fontSize: 13, color: "#666" }}>{currentUser.contact}</div>

        <h4 style={{ marginTop: 12 }}>Accounts</h4>
        <ul>
          {accounts.length === 0 && <li>No accounts found</li>}
          {accounts.map(a => (
            <li key={a.id} style={{ marginBottom: 8 }}>
              <button
                style={{
                  background: selectedAccount?.id === a.id ? "#667eea" : "#fff",
                  color: selectedAccount?.id === a.id ? "#fff" : "#333",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  width: "100%",
                  textAlign: "left",
                }}
                onClick={() => setSelectedAccount(a)}
              >
                {a.account_number} — Rs. {a.balance?.toFixed(2) ?? "0.00"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Right column */}
      <div style={{ border: "1px solid #e6e6e6", padding: 16, borderRadius: 8 }}>
        {!selectedAccount ? <div>Select an account</div> : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: "#666" }}>Account</div>
                <div style={{ fontWeight: 600 }}>{selectedAccount.account_number}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#666" }}>Balance</div>
                <div style={{ fontWeight: 600 }}>Rs.{selectedAccount.balance?.toFixed(2) ?? "0.00"}</div>
              </div>
            </div>

            {/* Buttons */}
            {!isBlocked ? (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button style={actionBtn} onClick={() => setShowModal("deposit")}>Deposit</button>
                <button style={{ ...actionBtn, background: "#f59e0b" }} onClick={() => setShowModal("withdraw")}>Withdraw</button>
                <button style={{ ...actionBtn, background: "#2563eb" }} onClick={() => setShowModal("transfer")}>Transfer</button>
                <button style={{ ...actionBtn, background: "#2563eb" }} onClick={() => setShowModal("bankstatement")}>Get Bank Statement</button>
              <button onClick={() => { setSearchedTransactions([]); setShowModal("searchTransactions"); }} style={actionBtn}>Search</button>
              </div>
            ) : (
              <div style={{ color: "red", marginBottom: 12 }}>Your account is blocked. You cannot perform operations.</div>
            )}

            {/* Transactions */}
            <h4>Transactions (recent)</h4>
           <div style={{ maxHeight: 300 }}>
  {transactions.length === 0 && <div>No transactions</div>}
  {transactions
   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // latest first
  .slice(0, 5)
    .map(t => (
      <div key={t.transaction_id} style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
        <div style={{ fontWeight: 600 }}>{t.type.toUpperCase()}</div>
        <div style={{ fontSize: 13, color: "#666" }}>
          Rs.{t.amount?.toFixed(2) ?? "0.00"} {t.target_account_number ? `→ ${t.target_account_number}` : ""} • {new Date(t.date).toLocaleString()}
        </div>
      </div>
    ))
  }
</div>
          </>
        )}
      </div>
    
      {/* SEARCH MODAL */}
      {showModal === "searchTransactions" && selectedAccount && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[520px] p-6 relative">
            <button onClick={() => setShowModal(null)} className="absolute top-3 right-3 text-gray-500 text-xl">✕</button>
            <h2 className="text-xl font-semibold mb-4 text-center">Search Transactions</h2>
            <input type="date" value={searchDate} max={new Date().toISOString().split("T")[0]} onChange={e => setSearchDate(e.target.value)} className="w-full border px-3 py-2 rounded-md mb-3" />
            <button onClick={fetchTransactionsByDate} className="bg-blue-600 text-white px-4 py-2 rounded-md w-full mb-4">Search</button>
            <div className="max-h-60 overflow-y-auto">
              {searchedTransactions.length === 0 ? (
  <div className="text-center text-gray-500">No transactions found</div>
) : (
  searchedTransactions.map(t => {
    // Check if transaction is disputed
    const isDisputed = disputedTransactionIds.includes(t.transaction_id);

    return (
      <div key={t.transaction_id} className="flex justify-between items-center border-b py-2">
        <div>
          <div className="font-semibold">{t.type.toUpperCase()}</div>
          <div className="text-sm text-gray-600">
            Rs.{t.amount} • {new Date(t.date).toLocaleString()}
          </div>
        </div>

        <div>
          <button
            disabled={isDisputed}
            onClick={() => setDisputeModal({ transactionId: t.transaction_id })}
            className={`px-3 py-1 rounded-md text-white ${isDisputed ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-400 hover:bg-yellow-700"}`}
          >
            {isDisputed ? "Dispute Raised" : "Raise Dispute"}
          </button>
        </div>
      </div>
    );
  })
)}

            </div>
          </div>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {disputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-[420px] p-6 relative">
            <button onClick={() => { setDisputeModal(null); setDisputeReason(""); }} className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-xl font-bold">✕</button>
            <h3 className="text-xl font-semibold mb-4 text-center">Raise Dispute</h3>
            <textarea value={disputeReason} onChange={e=>setDisputeReason(e.target.value)} placeholder="Explain issue..." rows={4} className="w-full border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"/>
            <div className="flex justify-center">
              <button onClick={handleRaiseDispute} disabled={!disputeReason.trim()} className="bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">Submit Dispute</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedAccount && !isBlocked && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 8, minWidth: 300 }}>
            <h3>{showModal.charAt(0).toUpperCase() + showModal.slice(1)}</h3>

            {(showModal === "deposit" || showModal === "withdraw") && (
              <>
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc", width: "100%", marginBottom: 12 }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={showModal === "deposit" ? handleDeposit : handleWithdraw} style={actionBtn}>Confirm</button>
                  <button
                    onClick={() => { setShowModal(null); setAmount(0); }}
                    style={{ ...actionBtn, background: "#888" }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {showModal === "transfer" && (
              <>
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc", width: "100%", marginBottom: 12 }}
                />
                <input
                  type="text"
                  placeholder="Target account number"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc", width: "100%", marginBottom: 12 }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={handleTransfer} style={actionBtn}>Confirm</button>
                  <button
                    onClick={() => { setShowModal(null); setAmount(0); setTarget(""); }}
                    style={{ ...actionBtn, background: "#888" }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            
       {showModal === "bankstatement" && selectedAccount && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-[420px] p-6 relative">

      <button
        onClick={() => setShowModal(null)}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl font-bold"
      >
        ✕
      </button>

      <h2 className="text-xl font-semibold mb-4 text-center">
        Bank Statement
      </h2>

      {/* Date selection */}
   <div className="flex gap-2 mb-4">
  <div className="flex-1">
    <label>From Date</label>
    <input
      type="date"
      value={fromDate}
      max={toDate || new Date().toISOString().split("T")[0]} // cannot be after To Date or today
      onChange={(e) => {
        const val = e.target.value;
        if (!toDate || val <= toDate) setFromDate(val); // prevent From > To
      }}
      className="w-full border rounded-md px-3 py-2"
    />
  </div>

  <div className="flex-1">
    <label>To Date</label>
    <input
      type="date"
      value={toDate}
      min={fromDate || ""} 
      max={new Date().toISOString().split("T")[0]} 
      onChange={(e) => {
        const val = e.target.value;
        const today = new Date().toISOString().split("T")[0];
        if ((!fromDate || val >= fromDate) && val <= today) setToDate(val); 
      }}
      className="w-full border rounded-md px-3 py-2"
    />
  </div>
</div>
      {/* Format */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Download Format
        </label>
        <select
          value={downloadFormat}
          onChange={e => setDownloadFormat(e.target.value as any)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      {/* Download */}
      <div className="flex justify-center">
       <button
  disabled={!fromDate || !toDate}
  onClick={handleDownload}
  className="bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md"
>
  Download Statement
</button>

      </div>
    </div>
  </div>
)}
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "#10b981",
  color: "#fff",
  cursor: "pointer"
};
