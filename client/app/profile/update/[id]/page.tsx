"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
interface User {
  id: number;
  username: string;
  name: string;
  address: string;
  contact: string;
  role: string;
  status: string;
  password?: string;
}

export default function UpdateProfilePopup() {
  const [form, setForm] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg] = useState("");

  const params = useParams();
  const router = useRouter();

  /* ================= FETCH USER ================= */
 useEffect(() => {
  const fetchUser = async () => {
    try {
      const loggedInUserId = Number(localStorage.getItem("userId"));
      const role = localStorage.getItem("role");
      const routeUserId = Number(params.id);

      if (!loggedInUserId || !role) {
        throw new Error("Not logged in");
      }

      // Access control
      if (role !== "admin" && loggedInUserId !== routeUserId) {
        throw new Error("Unauthorized access");
      }

      const data = await apiFetch(`/users/${routeUserId}`);

      setForm(data);
    } catch (err: any) {
      setError(err.message || "Unauthorized");
      setTimeout(() => router.back(), 1500);
    } finally {
      setLoading(false);
    }
  };

  fetchUser();
}, [params.id, router]);

  /* ================= HANDLERS ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) =>
      prev ? { ...prev, [e.target.name]: e.target.value } : prev
    );
  };

  const handleClose = () => {
    router.back(); // SAFEST way to close popup
  };

 const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();

  // 🔴 CLOSE POPUP IMMEDIATELY
  router.back();

  try {
    await fetch(
      `http://localhost:5000/api/users/update/${params.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(form),
      }
    );
  } catch (error) {
    console.error("Update failed:", error);
  }
};

  /* ================= UI ================= */
  if (loading) return <div style={overlay}>Loading...</div>;
  if (error) return <div style={overlay}>Error: {error}</div>;

  return (
    <div style={overlay}>
      <div style={modal}>
        <button style={closeBtn} onClick={handleClose}>
          ×
        </button>

        <h2 style={title}>Update Profile</h2>

        {successMsg && (
          <div
            style={{
              padding: "10px 12px",
              marginBottom: 8,
              borderRadius: 6,
              backgroundColor: "#e6ffed",
              color: "green",
              fontWeight: 600,
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} style={formStyle}>
          <label style={label}>Username</label>
          <input
            name="username"
            value={form?.username || ""}
            onChange={handleChange}
            style={input}
          />

          <label style={label}>Name</label>
          <input
            name="name"
            value={form?.name || ""}
            onChange={handleChange}
            style={input}
          />

          <label style={label}>Address</label>
          <input
            name="address"
            value={form?.address || ""}
            onChange={handleChange}
            style={input}
          />

          <label style={label}>Contact</label>
          <input
            name="contact"
            value={form?.contact || ""}
            onChange={handleChange}
            style={input}
          />

          <label style={label}>
            Password (Leave blank to keep unchanged)
          </label>
          <input
            name="password"
            type="password"
            value={form?.password || ""}
            onChange={handleChange}
            style={input}
          />

          <label style={label}>Role (Not Editable)</label>
          <input
            value={form?.role || ""}
            disabled
            style={{ ...input, background: "#f3f3f3" }}
          />

          <label style={label}>Status (Not Editable)</label>
          <input
            value={form?.status || ""}
            disabled
            style={{ ...input, background: "#f3f3f3" }}
          />

          <button type="submit" style={saveBtn}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  position: "relative",
  width: 450,
  padding: 24,
  borderRadius: 12,
  background: "#fff",
  display: "flex",
  flexDirection: "column",
  maxHeight: "90vh",
  overflowY: "auto",
};

const closeBtn: React.CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  border: "none",
  background: "transparent",
  fontSize: 24,
  cursor: "pointer",
};

const title: React.CSSProperties = {
  fontSize: 22,
  marginBottom: 16,
  background: "linear-gradient(90deg,#667eea,#764ba2)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  fontWeight: 700,
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const label: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 14,
};

const saveBtn: React.CSSProperties = {
  marginTop: 12,
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(90deg,#667eea,#764ba2)",
  color: "#fff",
  fontSize: 16,
  cursor: "pointer",
};
