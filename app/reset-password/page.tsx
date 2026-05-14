"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    const token = searchParams.get("token");

    if (!token) {
      setMessage("Invalid reset link. Please request a new one.");
      return;
    }

    if (!password || !confirmPassword) {
      setMessage("Please complete both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setMessage("Updating password...");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.message || "Failed to reset password.");
      return;
    }

    setMessage("Password updated successfully. Redirecting to login...");

    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-md mx-auto bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8">
          <h1 className="text-4xl font-black mb-3">Create New Password</h1>

          <p className="text-zinc-400 mb-8">
            Enter your new password below.
          </p>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            {message && <p className="text-sm text-blue-400">{message}</p>}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition"
            >
              Update Password
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}