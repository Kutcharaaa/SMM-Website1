"use client";

import { supabase } from "@/lib/supabase";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function LoginContent() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setMessage("Email verified successfully. You can now log in.");
    }

    if (searchParams.get("error")) {
      setMessage(
        "Email verification failed. Please request a new verification email."
      );
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!identifier || !password) {
      setMessage("Please enter your email/username and password.");
      return;
    }

    setMessage("Logging in...");

    let loginEmail = identifier.trim();

    if (!loginEmail.includes("@")) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", loginEmail)
        .single();

      if (profileError || !profile?.email) {
        setMessage("Username not found.");
        return;
      }

      loginEmail = profile.email;
    }

    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!loginData.user) {
      setMessage("Login failed. Please try again.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email_verified")
      .eq("id", loginData.user.id)
      .single();

    if (profileError) {
      await supabase.auth.signOut();
      setMessage("Unable to verify your account status.");
      return;
    }

    if (!profile?.email_verified) {
      await supabase.auth.signOut();
      setMessage("Please verify your email before logging in.");
      return;
    }

    setMessage("Login successful!");
    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-md mx-auto bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8">
          <h1 className="text-4xl font-black mb-3">Welcome Back</h1>

          <p className="text-zinc-400 mb-8">
            Login using your email or username.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <input
              type="text"
              placeholder="Email or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            {message && <p className="text-sm text-blue-400">{message}</p>}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition"
            >
              Login
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}