// app/login/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({ username: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // if logged in redirect
    const token = localStorage.getItem("accessToken");
    if (token) router.push("/dashboard");
  }, []);

  const validateField = (name: string, value: string) => {
    if (name === "username") return value.length < 3 ? "Username must be at least 3 chars" : "";
    if (name === "password") return value.length < 6 ? "Password must be at least 6 chars" : "";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errObj = {
      username: validateField("username", form.username),
      password: validateField("password", form.password),
    };
    setErrors({ ...errors, ...errObj });
    if (errObj.username || errObj.password) return;

    try {
      setLoading(true);
     const res = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // backend must set HttpOnly cookie
  body: JSON.stringify(form),
});

const data = await res.json();
if (!res.ok) throw new Error(data.message || "Login failed");


    // ✅ IMPORTANT: SAVE ACCESS TOKEN
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
       localStorage.setItem("userId", String(data.user.id)); // Save user ID
       localStorage.setItem("role", data.user.role);  
       localStorage.setItem("role", data.user.name);  
    }

    // Small delay so dashboard can read token
    setTimeout(() => router.push("/dashboard"), 50);

  } catch (err: any) {
    setErrors((p) => ({ ...p, general: err.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrap}>
      <form onSubmit={handleSubmit} style={card}>
     <div style={{ textAlign: "center", marginBottom: 10 }}>
          {/* Icon */}
         <img
    src="https://cdn-icons-png.flaticon.com/512/18144/18144795.png"
  alt="login icon"
  style={{
    width: 50,
    height: 50,
    marginBottom: 10,
    opacity: 0.9,
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  }}
/>

          {/* Centered Nice Heading */}
          <h2 style={heading}>Welcome Back</h2>
          <p style={{ margin: 0, color: "#666", fontSize: 14 }}>Login to your account</p>
        </div>

        {errors.general && <p style={errorStyle}>{errors.general}</p>}

        <input name="username" value={form.username} onChange={handleChange} placeholder="Username" style={inputStyle} required />
        {errors.username && <p style={errorStyle}>{errors.username}</p>}

        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" style={inputStyle} required />
        {errors.password && <p style={errorStyle}>{errors.password}</p>}

        <button type="submit" style={submitBtn} disabled={loading}>{loading ? "Logging..." : "Login"}</button>
          <p style={{ marginTop: 10, fontSize: 14, textAlign: "center" }}>  <a
          href="#"
          style={{
            color: "#667eea",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Forgot Password?
        </a></p>
         {/* ✅ Create Account Link */}
      <p style={{ marginTop: 10, fontSize: 14, textAlign: "center" }}>
        Don’t have an account?{" "}
        <a
          href="/register"
          style={{
            color: "#667eea",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Create an account
        </a>
      </p>
      </form>
    </div>
  );
}

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(to right,#667eea,#764ba2)",
  padding: 20,
};

const heading: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 700,
  color: "#444",
};


const card: React.CSSProperties = {
  background: "#fff",
  padding: 36,
  borderRadius: 12,
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
};

const submitBtn: React.CSSProperties = {
  marginTop: 6,
  padding: "12px 14px",
  background: "linear-gradient(90deg,#667eea,#764ba2)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = { color: "red", fontSize: 13, margin: 0 };
