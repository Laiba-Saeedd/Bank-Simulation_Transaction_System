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
}

export default function ViewProfilePopup() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams(); // get ID from URL
  const router = useRouter();

 useEffect(() => {
  const fetchUser = async () => {
    try {
      const loggedInUserId = Number(localStorage.getItem("userId"));
      const role = localStorage.getItem("role"); // "user" or "admin"
      const routeUserId = Number(params.id);

      if (!loggedInUserId || !role) {
        throw new Error("Not logged in");
      }

      // Allow access only if user is viewing their own profile
      if (loggedInUserId !== routeUserId) {
        throw new Error("Unauthorized access");
      }

      const data = await apiFetch(`/users/${routeUserId}`);

      setUser(data);

    } catch (err: any) {
      setError(err.message || "Unauthorized");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  fetchUser();
}, [params.id]);


  if (loading) return <div style={overlay}>Loading...</div>;
  if (error) return <div style={overlay}>Error: {error}</div>;

  const handleClose = () => {
    router.push("/dashboard"); // redirect back to dashboard
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <button style={closeBtn} onClick={handleClose}>×</button>
        <h2 style={title}>Profile Details</h2>
        {user && (
          <div style={card}>
            <div style={field}><strong>Username:</strong> {user.username}</div>
            <div style={field}><strong>Name:</strong> {user.name}</div>
            <div style={field}><strong>Address:</strong> {user.address}</div>
            <div style={field}><strong>Contact:</strong> {user.contact}</div>
            <div style={field}><strong>Role:</strong> {user.role}</div>
            <div style={field}><strong>Status:</strong> {user.status}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
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
  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
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

const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const field: React.CSSProperties = {
  fontSize: 16,
  color: "#333",
};
