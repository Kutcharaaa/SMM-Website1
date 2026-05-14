"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }

    setMessage("Sending reset link...");

const response = await fetch("/api/auth/request-password-reset", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email,
  }),
});

const result = await response.json();

setMessage(result.message || "Password reset link sent. Please check your email.");

    setMessage("Password reset link sent. Please check your email.");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-md mx-auto bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8">
          <h1 className="text-4xl font-black mb-3">Reset Password</h1>

          <p className="text-zinc-400 mb-8">
            Enter your email and we&apos;ll send you a password reset link.
          </p>

          <form onSubmit={handleReset} className="flex flex-col gap-5">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            {message && <p className="text-sm text-blue-400">{message}</p>}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition"
            >
              Send Reset Link
            </button>
          </form>

          <p className="text-zinc-400 text-sm mt-6">
            Remember your password?{" "}
            <a href="/login" className="text-blue-400 hover:text-blue-300">
              Back to login
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}