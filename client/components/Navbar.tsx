"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { refreshAccessToken } from "../lib/apiClient";

export default function Navbar({ user, onLogout }: { user: any; onLogout: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
const storedUser = {
  id: Number(localStorage.getItem("userId")),
  role: localStorage.getItem("role") || "user",
  name: localStorage.getItem("name") || "User",
  accessToken: localStorage.getItem("accessToken"),
};
  // ---------------- Refresh token every 10 minutes ----------------
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
const menuItems = storedUser?.id ? [
  { 
    label: "View Profile", 
    onClick: () => router.push(`/profile/view/${storedUser.id}`) 
  },
  { 
    label: "Update Profile",  
    onClick: () => router.push(`/profile/update/${storedUser.id}`)  
  },
  {
    label: "Logout",
    onClick: async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${storedUser.accessToken}`,
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Logout failed");

        // Clear localStorage & redirect
        localStorage.clear();
        router.push("/login");
      } catch (err) {
        console.error(err);
        alert("Logout failed");
      }
    },
  },
] : [];
  return (
    <header style={headerStyle}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Banking Dashboard</h1>
      <div style={{ position: "relative" }}>
        {user ? (
          <>
            {/* USER NAME */}
            <div
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              onClick={() => setOpen(!open)}
            >
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 12 }}>{user.role}</div>
              </div>

              {/* Settings Icon */}
              <Settings size={22} color="#fff" style={{ cursor: "pointer" }} />
            </div>

            {/* DROPDOWN MENU */}
            {open && (
              <div style={dropdownMenu}>
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    style={{
                      ...ddItem,
                      background: hoveredIndex === index ? "#f5f5f5" : "#fff",
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={() => router.push("/login")} style={smallBtn}>Login</button>
            <button onClick={() => router.push("/register")} style={smallBtn}>Register</button>
          </>
        )}
      </div>
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 20px",
  background: "linear-gradient(90deg,#667eea,#764ba2)",
  color: "#fff",
};

const smallBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "#fff",
  color: "#333",
  border: "none",
  cursor: "pointer",
};

const dropdownMenu: React.CSSProperties = {
  position: "absolute",
  right: 0,
  top: "110%",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  overflow: "hidden",
  minWidth: 160,
  zIndex: 1000,
};

const ddItem: React.CSSProperties = {
  padding: "10px 14px",
  width: "100%",
  background: "#fff",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontSize: 14,
  color: "#333",
};
