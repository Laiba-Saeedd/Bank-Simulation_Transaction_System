"use client";

import { useState, useEffect } from "react";
import ManageAccounts from "./ManageAccounts"; 
import ManageUsers from "./ManageUsers";  
import { refreshAccessToken  } from "../../lib/apiClient"; 
    // the users component we just finalized

export default function AdminDashboard({ currentUser }: { currentUser: any }) {
  const [activeSection, setActiveSection] = useState<"accounts" | "users">("accounts");
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
  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb", padding: 16}}>
      {/* ---------- TAB BUTTONS ---------- */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setActiveSection("accounts")}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            background: activeSection === "accounts" ? "linear-gradient(90deg,#667eea,#764ba2)" : "#fff",
            color: activeSection === "accounts" ? "#fff" : "#333",
            border: "1px solid #ddd"
          }}
        >
          Manage Accounts
        </button>
        <button
          onClick={() => setActiveSection("users")}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            background: activeSection === "users" ? "linear-gradient(90deg,#667eea,#764ba2)" : "#fff",
            color: activeSection === "users" ? "#fff" : "#333",
            border: "1px solid #ddd"
          }}
        >
          Manage Users
        </button>
      </div>

      {/* ---------- ACTIVE SECTION ---------- */}
      <div style={{ marginTop: 16 }}>
        {activeSection === "accounts" ? <ManageAccounts /> : <ManageUsers />}
      </div>
    </div>
  );
}
