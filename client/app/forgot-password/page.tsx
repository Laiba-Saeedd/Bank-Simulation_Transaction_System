"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

export default function ResetPassword() {
  const router = useRouter();
  const params = useSearchParams();

  const token = params.get("token");
  const email = params.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔍 basic link validation
  useEffect(() => {
    if (!token || !email) {
      alert("Invalid or broken reset link");
      router.push("/forgot-password");
    }
  }, [token, email, router]);

  const submit = async () => {
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      // ⏱️ LINK EXPIRED
      if (res.status === 410) {
        setExpired(true);
        setError(data.message);
        return;
      }

      if (!res.ok) throw new Error(data.message);

      alert("Password reset successful");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={heading}>Reset Password</h2>

        {error && <p style={errorStyle}>{error}</p>}

        {expired ? (
          <button style={btn} onClick={() => router.push("/login")}>
            Go to Forgot Password
          </button>
        ) : (
          <>
            {/* New password */}
            <div style={inputWrap}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={input}
              />
              <span style={eye} onClick={() => setShowPass(!showPass)}>
                {showPass ? <AiFillEyeInvisible /> : <AiFillEye />}
              </span>
            </div>

            {/* Confirm password */}
            <div style={inputWrap}>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={input}
              />
              <span style={eye} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <AiFillEyeInvisible /> : <AiFillEye />}
              </span>
            </div>

            <button style={btn} onClick={submit} disabled={loading}>
              {loading ? "Updating..." : "Continue"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const container: React.CSSProperties = {
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
  maxWidth: 420,
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const heading: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 700,
};

const inputWrap: React.CSSProperties = {
  position: "relative",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 40px 12px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
};

const eye: React.CSSProperties = {
  position: "absolute",
  right: 10,
  top: 12,
  cursor: "pointer",
};

const btn: React.CSSProperties = {
  marginTop: 10,
  padding: "12px 14px",
  background: "linear-gradient(90deg,#667eea,#764ba2)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  color: "red",
  fontSize: 13,
};
