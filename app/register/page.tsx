"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { welcomeEmail } from "@/lib/email";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        username,
        firstname: firstName,
        lastname: lastName,
        email,
        role: "user",
        plan: "starter",
        balance: 0,
      });
    }

    await fetch("/api/email/welcome", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username,
      }),
    });

    setMessage("Account created successfully! Redirecting to login...");

    setUsername("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-xl mx-auto bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8">
          <h1 className="text-4xl font-black mb-3">
            Create Account
          </h1>

          <p className="text-zinc-400 mb-8">
            Join Ascend Service and start growing today.
          </p>

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <div className="grid md:grid-cols-2 gap-5">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <div className="grid md:grid-cols-2 gap-5">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-black border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <label className="flex items-center gap-3 text-zinc-300">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-blue-500"
                />

                I&apos;m not a robot
              </label>

              <div className="text-xs text-zinc-500 text-right">
                <p>reCAPTCHA</p>
                <p>Privacy - Terms</p>
              </div>
            </div>

            {message && (
              <p className="text-sm text-blue-400">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition"
            >
              Create Account
            </button>
          </form>

          <p className="text-zinc-400 text-sm mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-blue-400 hover:text-blue-300">
              Login
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}