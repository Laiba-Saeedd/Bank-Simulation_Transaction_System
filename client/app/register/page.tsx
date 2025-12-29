// app/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", name: "", address: "", contact: "", role: "user", status: "active" });
  const [errors, setErrors] = useState({ username: "", password: "", name: "", contact: "", general: "" });
  const [success, setSuccess] = useState("");

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "username": return value.length < 3 ? "Username must be at least 3 characters" : "";
      case "password": return value.length < 6 ? "Password must be at least 6 characters" : "";
      case "name": {
        const nameRegex = /^[A-Za-z\s]+$/;
        if (value.trim() === "") return "Full name is required";
        if (!nameRegex.test(value)) return "Full name can only contain letters and spaces";
        return "";
      }
      case "contact": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Enter a valid email";

        return "";
      }
      default: return "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name in errors) setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrs = {
      username: validateField("username", form.username),
      password: validateField("password", form.password),
      name: validateField("name", form.name),
      contact: validateField("contact", form.contact),
    };
    setErrors({ ...errors, ...newErrs });
    if (Object.values(newErrs).some(Boolean)) return;

   try {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(form),
  });

  setSuccess("Registered! Redirecting to login...");
  setTimeout(() => router.push("/login"), 1200);

} catch (err: any) {
  setErrors((p) => ({
    ...p,
    general: err.message || "Registration failed",
  }));
}

  };

  return (
    <div style={pageWrap}>
      <form onSubmit={handleSubmit} style={card}>
      <div style={{ textAlign: "center", marginBottom: 15 }}>
  <img
    src="https://cdn-icons-png.flaticon.com/512/295/295128.png"
    alt="register icon"
    style={{
      width: 70,
      height: 70,
      marginBottom: 10,
      opacity: 0.9,
      display: "block",
      marginLeft: "auto",
      marginRight: "auto",
    }}
  />

  <h2
    style={{
      margin: 0,
      fontSize: 26,
      fontWeight: 700,
      color: "#444",
    }}
  >
    Create Account
  </h2>

  <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
    Register a new account to get started
  </p>
</div>

        {success && <p style={{ color: "green" }}>{success}</p>}
        {errors.general && <p style={{ color: "red" }}>{errors.general}</p>}

        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} style={inputStyle} required />
        {errors.username && <p style={errorStyle}>{errors.username}</p>}
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} style={inputStyle} required />
        {errors.password && <p style={errorStyle}>{errors.password}</p>}
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} style={inputStyle} required />
        {errors.name && <p style={errorStyle}>{errors.name}</p>}
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} style={inputStyle} />
        <input name="contact" placeholder="Email" value={form.contact} onChange={handleChange} style={inputStyle} required />
        {errors.contact && <p style={errorStyle}>{errors.contact}</p>}

        {/* {form.role === "user" && (
          <select name="status" value={form.status} onChange={handleChange} style={selectStyle}>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        )} */}

        <select name="role" value={form.role} onChange={handleChange} style={selectStyle}>
          <option value="user">User</option>
          {/* <option value="admin">Admin</option> */}
        </select>

        <button type="submit" style={submitBtn}>Register</button>
           {/* ✅Login Account Link */}
      <p style={{ marginTop: 10, fontSize: 14, textAlign: "center" }}>
        Already have an account?{" "}
        <a
          href="/login"
          style={{
            color: "#667eea",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
         Signin
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
const card: React.CSSProperties = {
  background: "#fff",
  padding: 36,
  borderRadius: 12,
  width: "100%",
  maxWidth: 480,
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
const inputStyle: React.CSSProperties = { padding: "12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 16 };
const selectStyle: React.CSSProperties = { padding: "12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 16 };
const submitBtn: React.CSSProperties = { padding: "12px 14px", background: "linear-gradient(90deg,#667eea,#764ba2)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer" };
const errorStyle: React.CSSProperties = { color: "red", fontSize: 13, margin: 0 };
