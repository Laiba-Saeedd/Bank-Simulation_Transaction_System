// lib/apiClient.ts
"use client";
// import { useRouter } from "next/navigation";

/**
 * Refresh access token using refresh token cookie
 */
export async function refreshAccessToken() {
  try {
    const res = await fetch("http://localhost:5000/api/auth/refresh-token", {
      method: "POST",
      credentials: "include", // crucial to send cookie
    });
    if (!res.ok) throw new Error("Failed to refresh token");
    const data = await res.json();
    if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
    return data.accessToken;
  } catch (err) {
    console.error("Refresh token error:", err);
    return null;
  }
}

/**
 * apiFetch: like fetch but attaches access token and auto-refreshes on 401
 * @param url API endpoint (e.g., "/api/me")
 * @param options fetch options
 */
export async function apiFetch(url: string, options: RequestInit = {}, timeout = 20000): Promise<any> {
  const token = localStorage.getItem("accessToken");

  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const opts: RequestInit = {
    ...options,
    headers,
    credentials: "include", 
    signal: controller.signal,
  };

  let res: Response;
  try {
    console.log("Fetching:", url, "with options:", opts);
    res = await fetch(`http://localhost:5000/api${url}`, opts); // use url parameter
    clearTimeout(id);
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error(`Fetch timeout after ${timeout}ms`);
    }
    console.error("Network error:", err);
    throw new Error("Network error. Please check backend server.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${res.status}`);
  }

  return res.json();
}






