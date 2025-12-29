"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }

    setChecking(false); // IMPORTANT FIX
  }, [router]);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Redirecting...
      </div>
    );
  }

  return null;
}
