"use client";
import { useState } from "react";
const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const submit = async () => {
    await fetch("http://localhost:5000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    alert("If email exists, reset link sent");
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={submit}>Send Reset Link</button>
    </div>
  );
};

export default ForgotPassword;
