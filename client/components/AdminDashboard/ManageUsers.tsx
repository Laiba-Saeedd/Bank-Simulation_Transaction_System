"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshAccessToken } from "../../lib/apiClient";

type User = {
  user_id: number;
  username: string;
  name: string;
  contact: string;
  role: string;
  status: string;
  created_at?: string;
};

export default function ManageUsers() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userId, setUserId] = useState("");
  const [updateForm, setUpdateForm] = useState({ username: "", name: "", contact: "", role: "user", status: "active" });

  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

  const clearMsg = () => setMsg(null);

  // ---------------- Refresh token ----------------
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshAccessToken();
      } catch (err) {
        console.error("Failed to refresh token:", err);
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function callApi<T>(url: string, options: RequestInit = {}): Promise<T | null> {
    setLoading(true);
    clearMsg();
    try {
      let token = localStorage.getItem("accessToken") || (await refreshAccessToken());
      if (!token) throw new Error("Session expired. Login again.");

      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(url, { ...options, headers, credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }
      return (await res.json()) as T;
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Something went wrong" });
      return null;
    } finally {
      setLoading(false);
    }
  }

  // ---------------- View all users ----------------
  async function handleViewAll() {
    const data = await callApi<User[]>("http://localhost:5000/admin/users");
    if (data) {
      setAllUsers(data);
      setSelectedUser(null);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    handleViewAll();
  }, []);

  // ---------------- Search user by ID ----------------
  async function handleViewById() {
    const idNum = Number(userId);
    if (isNaN(idNum) || idNum <= 0) return setMsg({ type: "error", text: "Invalid User ID" });

    const data = await callApi<User>(`http://localhost:5000/admin/users/${idNum}`);
    if (data) {
      setAllUsers([data]);
    } else {
      setAllUsers([]);
      setMsg({ type: "error", text: "User not found" });
    }
  }

  // ---------------- Update user ----------------
  async function handleUpdate(user_id?: number) {
    const targetId = user_id || selectedUser?.user_id;
    if (!targetId) return setMsg({ type: "error", text: "Enter a valid User ID" });

    const data = await callApi<{ message: string }>(`http://localhost:5000/admin/users/${targetId}`, {
      method: "PUT",
      body: JSON.stringify(updateForm),
    });

    if (data?.message) {
      setMsg({ type: "success", text: data.message });
      setUpdateForm({ username: "", name: "", contact: "", role: "user", status: "active" });
      setSelectedUser(null);
      setIsModalOpen(false);
      await handleViewAll();
    }
  }

  // ---------------- Delete user ----------------
  async function handleDelete(user_id: number) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const data = await callApi<{ message: string }>(`http://localhost:5000/admin/users/${user_id}`, { method: "DELETE" });

    if (data?.message) {
      setMsg({ type: "success", text: data.message });
      await handleViewAll();
    }
  }

  // ---------------- Prefill update form ----------------
  useEffect(() => {
    if (selectedUser) {
      setUpdateForm({
        username: selectedUser.username,
        name: selectedUser.name,
        contact: selectedUser.contact,
        role: selectedUser.role,
        status: selectedUser.status,
      });
      setIsModalOpen(true);
    }
  }, [selectedUser]);

  // ---------------- Pagination ----------------
  const paginatedUsers = allUsers.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const totalPages = Math.ceil(allUsers.length / entriesPerPage);

  return (
    <div style={{ padding: 16 }}>
      {msg && (
        <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: msg.type === "error" ? "#fff0f0" : "#e6fff3", color: msg.type === "error" ? "#b00020" : "#0b7a58" }}>
          {msg.text}
        </div>
      )}

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID"
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
        />
        <button onClick={handleViewById} style={btnStyle("#667eea")}>Search</button>
      </div>

      {/* Users Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
        <thead style={{ backgroundColor: "#f2f2f2" }}>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>User ID</th>
            <th style={thStyle}>Username</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Contact</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Created At</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((u, idx) => (
            <tr key={u.user_id} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9" }}>
              <td style={tdStyle}>{idx+1}</td>
              <td style={tdStyle}>{u.user_id}</td>
              <td style={tdStyle}>{u.username}</td>
              <td style={tdStyle}>{u.name}</td>
              <td style={tdStyle}>{u.contact}</td>
              <td style={tdStyle}>{u.role}</td>
              <td style={tdStyle}>{u.status}</td>
              <td style={tdStyle}>{u.created_at || "-"}</td>
              <td style={tdStyle}>
                <button onClick={() => setSelectedUser(u)}>✏️</button> 
                <button onClick={() => handleDelete(u.user_id)}>🗑️</button> 
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

      {/* Update Modal */}
      {isModalOpen && selectedUser && (
  <div style={modalOverlayStyle} onClick={() => setIsModalOpen(false)}>
    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
      <h3>Update User #{selectedUser.user_id}</h3>

      {/* Read-only fields */}
      <input  style={{ ...inputStyle, backgroundColor: "#f5f5f5", color: "#555" }} value={updateForm.username} disabled placeholder="Username" />
      <input  style={{ ...inputStyle, backgroundColor: "#f5f5f5", color: "#555" }} value={updateForm.name} disabled placeholder="Name" />
      <input  style={{ ...inputStyle, backgroundColor: "#f5f5f5", color: "#555" }} value={updateForm.contact} disabled placeholder="Contact" />
      <input  style={{ ...inputStyle, backgroundColor: "#f5f5f5", color: "#555" }} value={updateForm.role} disabled placeholder="Role" />

      {/* Editable status */}
      <select
        style={inputStyle}
        value={updateForm.status}
        onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}
      >
        <option value="active">Active</option>
        <option value="blocked">Blocked</option>
      </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleUpdate()} style={btnStyle("#667eea")}>Update</button>
              <button onClick={() => setIsModalOpen(false)} style={btnStyle("#999")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------- Styles -------------------
const thStyle: React.CSSProperties = { borderBottom: "1px solid #ccc", padding: 8, fontWeight: 600, textAlign: "left" };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #eee", padding: 8 };
const inputStyle: React.CSSProperties = { marginBottom: 8, padding: 6, width: "100%", borderRadius: 6, border: "1px solid #ddd" };
const btnStyle = (bgColor: string, padding: number = 8) => ({ padding, borderRadius: 6, background: bgColor, color: "#fff", border: "none", cursor: "pointer" });
const paginationBtnStyle: React.CSSProperties = { padding: "4px 8px", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer", backgroundColor: "#fff" };
const modalOverlayStyle: React.CSSProperties = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 };
const modalContentStyle: React.CSSProperties = { background: "#fff", padding: 20, borderRadius: 8, width: 400, maxWidth: "90%" };
