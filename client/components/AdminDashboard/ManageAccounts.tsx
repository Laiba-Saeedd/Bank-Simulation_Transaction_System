"use client";

import { useEffect, useState } from "react";
import { apiFetch, refreshAccessToken } from "../../lib/apiClient";

type Account = {
  id: number;
  user_id: number;
  account_number: string;
  account_type: string;
  balance: number;
  created_at?: string;
};

export default function AdminDashboard() {
  // ------------------- State -------------------
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState({ accountId: "", accountNumber: "", userId: "" });
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showModal, setShowModal] = useState<null | "bankstatement" | "edit" | "create">(null);

  // Create & Update Forms
  const [updateForm, setUpdateForm] = useState({ account_number: "", balance: "", account_type: "Saving" });
  const [createForm, setCreateForm] = useState({ user_id: "", account_number: "", balance: "", account_type: "Saving" });

  // Modal-specific messages
  const [updateFormMsg, setUpdateFormMsg] = useState<string | null>(null);
  const [createFormMsg, setCreateFormMsg] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloadFormat, setDownloadFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 15;
  const totalPages = Math.ceil(accounts.length / entriesPerPage);
const [statementTarget, setStatementTarget] = useState<string | number | null>(null); 

const [disputes, setDisputes] = useState<any[]>([]);
const [showDisputeModal, setShowDisputeModal] = useState(false);
const [disputeLoading, setDisputeLoading] = useState(false);
const [processingDisputeId, setProcessingDisputeId] = useState<number | null>(null);
const [disputeMsg, setDisputeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ------------------- Effects -------------------
  useEffect(() => {
    const interval = setInterval(refreshAccessToken, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);
   useEffect(() => {
    if (disputeMsg) {
      const timer = setTimeout(() => setDisputeMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [disputeMsg]);


  // ------------------- Functions -------------------
  const clearMessages = () => setMsg(null);

  const fetchAccounts = async () => {
    setLoading(true);
    clearMessages();
    try {
      const data: Account[] = await apiFetch("/accounts");
      setAccounts(data.sort((a, b) => (b.created_at?.localeCompare(a.created_at ?? "") ?? 0)));
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to fetch accounts" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSearch = async () => {
    clearMessages();
    setLoading(true);
    try {
      let queryUrl = "/accounts";
      if (searchQuery.accountId) queryUrl = `/accounts/${searchQuery.accountId}`;
      else if (searchQuery.userId) queryUrl = `/accounts/user/${searchQuery.userId}`;
      else if (searchQuery.accountNumber) queryUrl = `/accounts/number/${searchQuery.accountNumber}`;

      const data: Account | Account[] = await apiFetch(queryUrl);
      if (Array.isArray(data)) setAccounts(data);
      else setAccounts([data]);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Search failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await apiFetch(`/accounts/${id}`, { method: "DELETE" });
      setMsg({ type: "success", text: `Account ${id} deleted successfully` });
      fetchAccounts();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Delete failed" });
    }
  };

  const handleEdit = (acc: Account) => {
    setSelectedAccount(acc);
    setUpdateForm({
      account_number: acc.account_number,
      balance: String(acc.balance),
      account_type: acc.account_type,
    });
    setUpdateFormMsg(null);
    setShowModal("edit");
  };

  const validateAccountNumber = (accNum: string, idToIgnore?: number) => {
    if (!accNum.startsWith("ACC")) return "Account number must start with 'ACC'";
    if (accounts.some(a => a.account_number === accNum && a.id !== idToIgnore)) return "Account number already exists";
    return null;
  };

  const handleUpdate = async () => {
    if (!selectedAccount) return;

    const accError = validateAccountNumber(updateForm.account_number, selectedAccount.id);
    if (accError) return setUpdateFormMsg(accError);
    if (Number(updateForm.balance) < 0) return setUpdateFormMsg("Balance cannot be negative");

    try {
      const payload = {
        account_number: updateForm.account_number,
        balance: Number(updateForm.balance),
        account_type: updateForm.account_type,
      };
      await apiFetch(`/accounts/${selectedAccount.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setUpdateFormMsg("Account updated successfully");
      fetchAccounts();
      setTimeout(() => setShowModal(null), 1000); // Close after showing message
    } catch (err: any) {
      setUpdateFormMsg(err.message || "Update failed");
    }
  };

  const handleCreate = async () => {
    if (!createForm.user_id) return setCreateFormMsg("User ID is required");
    if (!createForm.account_number) return setCreateFormMsg("Account number is required");

    const accError = validateAccountNumber(createForm.account_number);
    if (accError) return setCreateFormMsg(accError);
    if (Number(createForm.balance) < 0) return setCreateFormMsg("Balance cannot be negative");

    // Check if user exists
    try {
      await apiFetch(`/users/${createForm.user_id}`);
    } catch {
      return setCreateFormMsg("User ID does not exist");
    }

    try {
      await apiFetch("/accounts", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setCreateFormMsg("Account created successfully");
      fetchAccounts();
      setTimeout(() => {
        setShowModal(null);
        setCreateForm({ user_id: "", account_number: "", balance: "", account_type: "Saving" });
      }, 1000);
    } catch (err: any) {
      setCreateFormMsg(err.message || "Create failed");
    }
  };

 const handleDownload = async () => {
  if (!fromDate || !toDate || !statementTarget) {
    alert("Please select an account or 'All Accounts' and date range");
    return;
  }

  try {
    const accountNumberParam = statementTarget === "all" ? "" : statementTarget;
    const endpoint =
      downloadFormat === "pdf"
        ? "http://localhost:5000/api/accounts/statement/pdf"
        : downloadFormat === "excel"
        ? "http://localhost:5000/api/accounts/statement/excel"
        : "http://localhost:5000/api/accounts/statement/csv";

    const url = `${endpoint}?accountNumber=${accountNumberParam}&fromDate=${fromDate}&toDate=${toDate}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    });

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `statement_${statementTarget === "all" ? "all_accounts" : statementTarget}.${downloadFormat}`;
    link.click();
  } catch (err) {
    console.error(err);
    alert("Failed to download statement");
  }
};
const handleReviewDispute = async (disputeId: number, approve: boolean) => {
  try {
    setProcessingDisputeId(disputeId);
    setDisputeMsg(null); // reset message

    await apiFetch(`/disputes/${disputeId}/review`, {
      method: "POST",
      body: JSON.stringify({ approve }),
    });

    // Update status locally
    setDisputes(prev =>
      prev.map(d =>
        d.id === disputeId ? { ...d, status: approve ? "approved" : "rejected" } : d
      )
    );

    // ✅ Show modal-specific message
    setDisputeMsg({
      type: "success",
      text: `Dispute ${approve ? "approved" : "rejected"} successfully`,
    });
  } catch (err: any) {
    setDisputeMsg({
      type: "error",
      text: err.message || "Failed to review dispute",
    });
  } finally {
    setProcessingDisputeId(null);
  }
};

// ------------------- Fetch disputes function -------------------
const fetchDisputes = async () => {
  setDisputeLoading(true);
  setShowDisputeModal(true); // open modal immediately
  try {
    const data: any[] = await apiFetch("/disputes/view"); // Make sure this matches your backend route
    setDisputes(data);
  } catch (err: any) {
    alert(err.message || "Failed to fetch disputes");
  } finally {
    setDisputeLoading(false);
  }
};
  // ------------------- JSX -------------------
  return (
    <div style={{ padding: 16}}>
      {msg && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 6,
            backgroundColor: msg.type === "success" ? "#e6ffed" : msg.type === "error" ? "#ffe6e6" : "#e6f0ff",
            color: msg.type === "success" ? "green" : msg.type === "error" ? "red" : "blue",
            border: "1px solid",
            borderColor: msg.type === "success" ? "green" : msg.type === "error" ? "red" : "blue",
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Search & Create */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Account ID"
          value={searchQuery.accountId}
          onChange={(e) => setSearchQuery((p) => ({ ...p, accountId: e.target.value }))}
          style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", flex: 1 }}
        />
        <input
          placeholder="Account Number"
          value={searchQuery.accountNumber}
          onChange={(e) => setSearchQuery((p) => ({ ...p, accountNumber: e.target.value }))}
          style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", flex: 1 }}
        />
        <input
          placeholder="User ID"
          value={searchQuery.userId}
          onChange={(e) => setSearchQuery((p) => ({ ...p, userId: e.target.value }))}
          style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", flex: 1 }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{ padding: "8px 16px", borderRadius: "4px", border: "none", backgroundColor: "#007bff", color: "#fff", cursor: "pointer" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
        <button
          onClick={() => {
            setCreateFormMsg(null);
            setShowModal("create");
          }}
          style={{ padding: "8px 16px", borderRadius: 4, backgroundColor: "#28a745", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Create Account
        </button>
         <button
    onClick={() => setShowModal("bankstatement")}
    style={{ padding: "8px 16px", borderRadius: 4, backgroundColor: "#0d6efd", color: "#fff", border: "none", cursor: "pointer" }}
  >
    ⤓ Statement
  </button>
  <button
  onClick={fetchDisputes}
  style={{
    padding: "8px 16px",
    borderRadius: 4,
    backgroundColor: "#ffc107",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  }}
>
  Review Disputes
</button>

      </div>
      {/* Accounts Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #ccc" }}>
        <thead style={{ backgroundColor: "#f2f2f2" }}>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>User ID</th>
            <th style={thStyle}>Account #</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Balance</th>
            <th style={thStyle}>Created At</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc, idx) => (
            <tr key={acc.id} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9", transition: "0.2s", cursor: "pointer" }}>
              <td style={tdStyle}>{idx+1}</td>
              <td style={tdStyle}>{acc.user_id}</td>
              <td style={tdStyle}>{acc.account_number}</td>
              <td style={tdStyle}>{acc.account_type}</td>
              <td style={tdStyle}>{Number(acc.balance).toFixed(2)}</td>
              <td style={tdStyle}>{acc.created_at || "-"}</td>
              <td style={tdStyle}>
                <button onClick={() => handleEdit(acc)}>✏️</button>{" "}
                <button onClick={() => handleDelete(acc.id)}>🗑️</button>{" "}
                {/* <button onClick={() => { setSelectedAccount(acc); setShowModal("bankstatement"); }}>💳</button> */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8 }}>
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} style={paginationBtnStyle}>Prev</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} style={paginationBtnStyle}>Next</button>
      </div>
{showDisputeModal && (
  <Modal title="Review Disputes" onClose={() => setShowDisputeModal(false)} width="1200px">
    {disputeMsg && (
      <div
        style={{
          marginBottom: 12,
          padding: 12,
          borderRadius: 6,
          backgroundColor: disputeMsg.type === "success" ? "#e6ffed" : "#ffe6e6",
          color: disputeMsg.type === "success" ? "green" : "red",
          border: "1px solid",
          borderColor: disputeMsg.type === "success" ? "green" : "red",
        }}
      >
        {disputeMsg.text}
      </div>
    )}

    {disputeLoading ? (
      <p>Loading disputes...</p>
    ) : disputes.filter(d => d.status === "pending").length === 0 ? (
      <p>No pending disputes found.</p>
    ) : (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
         <thead>
  <tr style={{ backgroundColor: "#f2f2f2" }}>
    <th style={thStyle}>ID</th>
    <th style={thStyle}>User ID</th>
    <th style={thStyle}>Account ID</th>
    <th style={thStyle}>Type</th>
    <th style={thStyle}>Amount</th>
    <th style={thStyle}>Reason</th>
    <th style={thStyle}>Dispute Date</th>
    <th style={thStyle}>Transaction Date</th>
    <th style={thStyle}>Status</th>
    <th style={thStyle}>Actions</th>
  </tr>
</thead>
<tbody>
  {disputes
    .filter(d => d.status === "pending")
    .map((d, index) => {
      const isProcessing = processingDisputeId === d.id;
      return (
        <tr key={d.id} style={{ borderBottom: "1px solid #ddd", backgroundColor: "#fff", transition: "0.2s" }}>
          <td style={tdStyle}>{index + 1}</td>
          <td style={tdStyle}>{d.user_id}</td>
          <td style={tdStyle}>{d.account?.id ?? "-"}</td>
          <td style={tdStyle}>{d.account?.type ?? "-"}</td>
          <td style={tdStyle}>{d.account?.amount ? Number(d.account.amount).toFixed(2) : "-"}</td>
          <td style={tdStyle}>{d.reason}</td>
          <td style={tdStyle}>{new Date(d.dispute_date).toLocaleString()}</td>
          <td style={tdStyle}>{d.account?.transaction_date ? new Date(d.account.transaction_date).toLocaleString() : "-"}</td>
          <td style={tdStyle}>{d.status}</td>
          <td style={{ display: "flex", gap: 4, padding: 8 }}>
            <button
              onClick={() => handleReviewDispute(d.id, true)}
              disabled={isProcessing}
              style={{
                ...actionBtnStyle("green"),
                opacity: isProcessing ? 0.5 : 1,
                cursor: isProcessing ? "not-allowed" : "pointer",
              }}
            >
              {isProcessing ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => handleReviewDispute(d.id, false)}
              disabled={isProcessing}
              style={{
                ...actionBtnStyle("red"),
                opacity: isProcessing ? 0.5 : 1,
                cursor: isProcessing ? "not-allowed" : "pointer",
              }}
            >
              {isProcessing ? "Processing..." : "Reject"}
            </button>
          </td>
        </tr>
      );
    })}
</tbody>
        </table>
      </div>
    )}
  </Modal>
)}

      {/* ---------------- Create Modal ---------------- */}
      {showModal === "create" && (
        <Modal title="Create Account" onClose={() => setShowModal(null)}>
          {createFormMsg && <div className="mb-2 text-center text-green-600">{createFormMsg}</div>}
          <div className="mb-4">
            <label>User ID</label>
            <input type="number" value={createForm.user_id} onChange={(e) => setCreateForm(p => ({ ...p, user_id: e.target.value }))} className="w-full border rounded-md px-3 py-2"/>
          </div>
          <div className="mb-4">
            <label>Account Number</label>
            <input type="text" value={createForm.account_number} onChange={(e) => setCreateForm(p => ({ ...p, account_number: e.target.value }))} className="w-full border rounded-md px-3 py-2" placeholder="Must start with ACC"/>
          </div>
          <div className="mb-4">
            <label>Account Type</label>
            <select value={createForm.account_type} onChange={(e) => setCreateForm(p => ({ ...p, account_type: e.target.value }))} className="w-full border rounded-md px-3 py-2">
              <option value="Saving">Saving</option>
              <option value="Current">Current</option>
            </select>
          </div>
          <div className="mb-4">
            <label>Balance</label>
            <input type="number" value={createForm.balance} onChange={(e) => setCreateForm(p => ({ ...p, balance: e.target.value }))} className="w-full border rounded-md px-3 py-2" min={0}/>
          </div>
          <div className="flex justify-center">
            <button onClick={handleCreate} className="bg-green-600 text-white px-6 py-2 rounded-md">Create</button>
          </div>
        </Modal>
      )}

      {/* ---------------- Edit Modal ---------------- */}
      {showModal === "edit" && selectedAccount && (
        <Modal title="Edit Account" onClose={() => setShowModal(null)}>
          {updateFormMsg && <div className="mb-2 text-center text-green-600">{updateFormMsg}</div>}
          <div className="mb-4">
            <label>Account Number</label>
            <input className="w-full border rounded-md px-3 py-2" value={updateForm.account_number} onChange={(e) => setUpdateForm(p => ({ ...p, account_number: e.target.value }))}/>
          </div>
          <div className="mb-4">
            <label>Account Type</label>
            <select className="w-full border rounded-md px-3 py-2" value={updateForm.account_type} onChange={(e) => setUpdateForm(p => ({ ...p, account_type: e.target.value }))}>
              <option value="Saving">Saving</option>
              <option value="Current">Current</option>
            </select>
          </div>
          <div className="mb-4">
            <label>Balance</label>
            <input className="w-full border rounded-md px-3 py-2" value={updateForm.balance} onChange={(e) => setUpdateForm(p => ({ ...p, balance: e.target.value }))}/>
          </div>
          <div className="flex justify-center">
            <button onClick={handleUpdate} className="bg-green-600 text-white px-6 py-2 rounded-md">Update</button>
          </div>
        </Modal>
      )}

      {/* ---------------- Bank Statement Modal ---------------- */}
{showModal === "bankstatement" && (
  <Modal title="Bank Statement" onClose={() => setShowModal(null)}>
    
    {/* Select Account or All */}
    <div className="mb-4">
      <label>Select Account</label>
      <select
        value={statementTarget ?? ""}
        onChange={(e) => setStatementTarget(e.target.value)}
        className="w-full border rounded-md px-3 py-2"
      >
        <option value="">-- Select Account --</option>
        <option value="all">All Accounts</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.account_number}>
            {acc.account_number} - User {acc.user_id}
          </option>
        ))}
      </select>
    </div>

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
    {/* Format selection */}
    <div className="mb-4">
      <label>Format</label>
      <select value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value as any)} className="w-full border rounded-md px-3 py-2">
        <option value="csv">CSV</option>
        <option value="excel">Excel</option>
        <option value="pdf">PDF</option>
      </select>
    </div>

    {/* Download button */}
    <div className="flex justify-center">
      <button
        disabled={!fromDate || !toDate || !statementTarget}
        onClick={handleDownload}
        className="bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md"
      >
        Download Statement
      </button>
    </div>
  </Modal>
)}

    </div>
  );
}

// ------------------- Modal Component -------------------
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string; // optional width
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, width = "800px" }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div
      className="bg-white rounded-lg shadow-lg p-6 relative"
      style={{ width, maxHeight: "90vh", overflowY: "auto" }}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl font-bold"
      >
        ✕
      </button>
      <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
      {children}
    </div>
  </div>
);


// ------------------- Table Styles -------------------
const thStyle: React.CSSProperties = { borderBottom: "1px solid #ccc", padding: 8, textAlign: "left", fontWeight: 700 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #eee", padding: 8 };
const paginationBtnStyle: React.CSSProperties = { padding: "4px 8px", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer", backgroundColor: "#fff" };
const actionBtnStyle = (color: "green" | "red"): React.CSSProperties => ({
  backgroundColor: color,
  color: "white",
  padding: "6px 10px",
  borderRadius: 4,
  border: "none",
  cursor: "pointer",
  fontSize: 12,
});
