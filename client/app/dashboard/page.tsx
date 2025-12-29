// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import UserDashboard from "../../components/UserDashboard";
import AdminDashboard from "../../components/AdminDashboard";
import { apiFetch, refreshAccessToken } from "../../lib/apiClient";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------- FETCH CURRENT USER -----------------
async function fetchMe() {
  setLoading(true);
  setError(null);

  let token = localStorage.getItem("accessToken");
  if (!token) {
    // try refresh
    token = await refreshAccessToken();
    if (!token) {
      setError("Session expired. Please login again.");
      router.push("/login");
      return;
    }
  }

  try {
    const data = await apiFetch("/auth/me", { method: "GET" });
    setUser(data);
  } catch (err: any) {
    console.error("FetchMe error:", err);
    localStorage.removeItem("accessToken");
    setError("Session expired. Please login again.");
    router.push("/login");
  } finally {
    setLoading(false);
  }
}


  // ----------------- TOKEN REFRESH -----------------
  useEffect(() => {
    fetchMe();

    // periodic refresh every 10 minutes
    const iv = setInterval(async () => {
      try {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          localStorage.removeItem("accessToken");
          router.push("/login");
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
        localStorage.removeItem("accessToken");
        router.push("/login");
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(iv);
  }, []);

  // ----------------- LOGOUT -----------------
  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

  // ----------------- LOADING -----------------
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  // ----------------- ERROR -----------------
  if (error) return <div style={{ padding: 40, color: "red" }}>{error}</div>;

  // ----------------- DASHBOARD RENDER -----------------
  return (
    <div>
      <Navbar user={user} onLogout={handleLogout} />
      <main style={{ padding: 20, maxWidth: 1200, margin: "20px auto" }}>
        {!user ? (
          <div>Please login.</div>
        ) : user.role === "admin" ? (
          <AdminDashboard currentUser={user} />
        ) : (
          <UserDashboard currentUser={user} />
        )}
      </main>
    </div>
  );
} 