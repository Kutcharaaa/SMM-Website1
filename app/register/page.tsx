"use client";

import PublicNavbar from "@/components/PublicNavbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AtSign,
  BarChart3,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

const benefits = [
  {
    title: "Fast Delivery",
    text: "Lightning fast delivery for all services",
    icon: Rocket,
  },
  {
    title: "Secure & Safe",
    text: "Protected payments and data",
    icon: ShieldCheck,
  },
  {
    title: "24/7 Support",
    text: "Dedicated support whenever you need",
    icon: Headphones,
  },
  {
    title: "Real Results",
    text: "Proven growth and satisfaction",
    icon: BarChart3,
  },
];

type ReferrerData = {
  id: string;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const referralCode = searchParams.get("ref")?.trim() || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);

  const [referrerPreview, setReferrerPreview] = useState<ReferrerData | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function checkCurrentSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.replace("/dashboard");
        return;
      }

      setCheckingSession(false);
    }

    checkCurrentSession();
  }, [router]);

  useEffect(() => {
    async function previewReferrer() {
      if (!referralCode) return;

      try {
        const referrer = await resolveReferrer(referralCode);
        setReferrerPreview(referrer);
      } catch {
        setReferrerPreview(null);
      }
    }

    previewReferrer();
  }, [referralCode]);

  async function checkEmailExists(cleanEmail: string) {
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (!response.ok) return false;

      const result = await response.json();

      return Boolean(result.exists);
    } catch {
      return false;
    }
  }

  async function resolveReferrer(
    refCode: string,
  ): Promise<ReferrerData | null> {
    if (!refCode) return null;

    const response = await fetch("/api/auth/resolve-referrer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: refCode }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to verify referral link.");
    }

    if (!result.found || !result.referrer?.id) {
      throw new Error(
        "Invalid referral link. Please ask your referrer for a new link.",
      );
    }

    return result.referrer as ReferrerData;
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFirstName) {
      setErrorMessage("Please enter your first name.");
      return;
    }

    if (!cleanLastName) {
      setErrorMessage("Please enter your last name.");
      return;
    }

    if (!cleanUsername) {
      setErrorMessage("Please choose a username.");
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage("Username must be at least 3 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
      setErrorMessage(
        "Username can only contain letters, numbers, dots, and underscores.",
      );
      return;
    }

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please create a password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Confirm password does not match.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const emailExists = await checkEmailExists(cleanEmail);

      if (emailExists) {
        setErrorMessage("Email already exists. Please login instead.");
        setLoading(false);
        return;
      }

      let referrer: ReferrerData | null = null;

      if (referralCode) {
        referrer = await resolveReferrer(referralCode);
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            firstname: cleanFirstName,
            lastname: cleanLastName,
            referred_by: referrer?.id || null,
          },
        },
      });

      if (error) {
        const message = error.message.toLowerCase();

        if (
          message.includes("already registered") ||
          message.includes("already exists")
        ) {
          setErrorMessage("Email already exists. Please login instead.");
        } else {
          setErrorMessage(error.message);
        }

        setLoading(false);
        return;
      }

      if (data.user) {
        const referredBy =
          referrer && referrer.id !== data.user.id ? referrer.id : null;

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          email: cleanEmail,
          username: cleanUsername,
          firstname: cleanFirstName,
          lastname: cleanLastName,
          role: "user",
          plan: "starter",
          balance: 0,
          referred_by: referredBy,
          referred_at: referredBy ? new Date().toISOString() : null,
        });

        if (profileError) {
          setErrorMessage(profileError.message);
          setLoading(false);
          return;
        }
      }

      localStorage.setItem("ascend_remember_me", "true");
      sessionStorage.setItem("ascend_session_login", "true");

      if (data.session) {
        setSuccessMessage(
          "Account created successfully. Redirecting to dashboard...",
        );

        setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 700);

        return;
      }

      setSuccessMessage(
        "Account created successfully. Please check your email to confirm your account.",
      );

      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );

      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "facebook" | "github") {
    setErrorMessage("");
    setSuccessMessage(
      "Social signup is not fully enabled yet. Please use email registration for now.",
    );

    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/dashboard`,
      },
    });

    if (error) {
      setSuccessMessage("");
      setErrorMessage(error.message);
    }
  }

  function handleTelegramSignup() {
    setSuccessMessage("");
    setErrorMessage(
      "Telegram signup is not enabled yet. Please use email registration for now.",
    );
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[#f6f9ff] text-slate-950">
        <PublicNavbar />

        <div className="flex min-h-[calc(100vh-96px)] items-center justify-center px-5">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="mt-4 text-sm font-bold text-slate-500">
              Checking your session...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <PublicNavbar />

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,#e8f3ff_0%,transparent_30%),radial-gradient(circle_at_bottom_right,#dcecff_0%,transparent_28%),linear-gradient(135deg,#ffffff_0%,#f7fbff_45%,#eef6ff_100%)]">
        <div className="absolute inset-0 opacity-[0.4]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#2563eb12_1px,transparent_1px),linear-gradient(to_bottom,#2563eb12_1px,transparent_1px)] bg-[size:42px_42px]" />
        </div>

        <div className="absolute -left-28 top-28 h-[360px] w-[360px] rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-[420px] w-[420px] rounded-full bg-cyan-200/35 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-600 shadow-sm">
              <UserPlus size={17} />
              Join Thousands of Happy Users!
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
              Create Your <span className="text-blue-600">Account</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-slate-600 md:text-lg">
              Start your journey with Ascend Service and grow your social media
              presence.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl">
            <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur-xl sm:p-9">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
                  <UserPlus size={34} />
                </div>

                <h2 className="mt-6 text-2xl font-black text-slate-950">
                  Create Your Account
                </h2>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Fill in the details to get started
                </p>
              </div>

              {referralCode && referrerPreview && (
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600">
                  Referral applied from{" "}
                  {referrerPreview.username ||
                    `${referrerPreview.firstname || ""} ${
                      referrerPreview.lastname || ""
                    }`.trim() ||
                    "Ascend user"}
                  .
                </div>
              )}

              {referralCode && !referrerPreview && (
                <div className="mt-6 rounded-2xl border border-yellow-100 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-700">
                  Referral link detected. It will be verified when you create
                  your account.
                </div>
              )}

              {errorMessage && (
                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-600">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleRegister} className="mt-7 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-black text-slate-700">
                      First Name
                    </label>

                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                      <User size={20} className="shrink-0 text-slate-400" />

                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-700">
                      Last Name
                    </label>

                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                      <User size={20} className="shrink-0 text-slate-400" />

                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">
                    Username
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                    <AtSign size={20} className="shrink-0 text-slate-400" />

                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">
                    Email Address
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                    <Mail size={20} className="shrink-0 text-slate-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">
                    Password
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                    <Lock size={20} className="shrink-0 text-slate-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="shrink-0 text-slate-400 transition hover:text-blue-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">
                    Confirm Password
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                    <Lock size={20} className="shrink-0 text-slate-400" />

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="shrink-0 text-slate-400 transition hover:text-blue-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 text-sm font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span>
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="font-black text-blue-600 hover:text-blue-700"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-black text-blue-600 hover:text-blue-700"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserPlus size={20} />
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <p className="text-xs font-bold text-slate-400">
                  or sign up with
                </p>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="mt-6 grid grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <GoogleIcon size={23} />
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth("facebook")}
                  className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <FacebookIcon size={23} />
                </button>

                <button
                  type="button"
                  onClick={handleTelegramSignup}
                  className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <TelegramIcon size={23} />
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth("github")}
                  className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <GitHubIcon size={23} />
                </button>
              </div>

              <p className="mt-7 text-center text-sm font-semibold text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-black text-blue-600 transition hover:text-blue-700"
                >
                  Login now
                </Link>
              </p>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-xl shadow-blue-950/5 backdrop-blur-xl md:grid-cols-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className={`flex items-center gap-4 p-6 ${
                    index !== benefits.length - 1
                      ? "border-b border-slate-100 md:border-b-0 md:border-r"
                      : ""
                  }`}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={26} />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-950">
                      {benefit.title}
                    </h3>

                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                      {benefit.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 px-5 py-12 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <img
              src="/logo.png"
              alt="Ascend Service"
              className="h-12 w-auto"
            />

            <p className="mt-5 max-w-sm text-sm font-medium leading-7 text-slate-400">
              Ascend Service is a trusted SMM panel built to help you grow your
              online presence with quality, speed, and security.
            </p>

            <div className="mt-5 flex gap-3">
              {[TelegramIcon, FacebookIcon, InstagramIcon, YouTubeIcon].map(
                (Icon, index) => (
                  <div
                    key={index}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300"
                  >
                    <Icon size={18} />
                  </div>
                ),
              )}
            </div>
          </div>

          {[
            {
              title: "Company",
              links: ["About Us", "Blog", "Careers", "Contact Us"],
            },
            {
              title: "Services",
              links: [
                "TikTok Services",
                "Instagram Services",
                "YouTube Services",
                "Facebook Services",
              ],
            },
            {
              title: "Support",
              links: [
                "Help Center",
                "How to Order",
                "Payment Methods",
                "Ticket Support",
              ],
            },
            {
              title: "Legal",
              links: [
                "Terms of Service",
                "Privacy Policy",
                "Refund Policy",
                "DMCA Policy",
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <h3 className="text-base font-black text-white">
                {group.title}
              </h3>

              <div className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-sm font-semibold text-slate-400 transition hover:text-blue-400"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-slate-800 pt-7 text-sm font-semibold text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Ascend Service. All rights reserved.</p>
          <p>Fast. Reliable. Built for growth.</p>
        </div>
      </footer>
    </main>
  );
}

function GoogleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M233.5 130.6c0-8.4-.8-16.5-2.2-24.3H128v45.9h59.1c-2.5 13.7-10.3 25.3-21.9 33.1v27h35.5c20.8-19.2 32.8-47.5 32.8-81.7Z"
      />
      <path
        fill="#34A853"
        d="M128 238c29.7 0 54.6-9.8 72.8-26.7l-35.5-27c-9.8 6.6-22.4 10.5-37.3 10.5-28.6 0-52.9-19.3-61.6-45.3H29.7v27.8C47.8 213.2 85 238 128 238Z"
      />
      <path
        fill="#FBBC05"
        d="M66.4 149.5c-2.2-6.6-3.5-13.7-3.5-21.5s1.3-14.9 3.5-21.5V78.7H29.7C22.3 93.6 18 110.3 18 128s4.3 34.4 11.7 49.3l36.7-27.8Z"
      />
      <path
        fill="#EA4335"
        d="M128 61.2c16.2 0 30.7 5.6 42.1 16.5l31.5-31.5C182.6 28.5 157.7 18 128 18 85 18 47.8 42.8 29.7 78.7l36.7 27.8C75.1 80.5 99.4 61.2 128 61.2Z"
      />
    </svg>
  );
}

function FacebookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="#1877F2">
      <path d="M232 128a104 104 0 1 0-120.25 102.7v-72.65H85.35V128h26.4v-22.9c0-26.05 15.52-40.45 39.25-40.45 11.36 0 23.25 2.03 23.25 2.03v25.55h-13.1c-12.9 0-16.9 8-16.9 16.2V128h28.75l-4.6 30.05h-24.15v72.65A104.03 104.03 0 0 0 232 128Z" />
    </svg>
  );
}

function TelegramIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="#229ED9">
      <path d="M226.6 35.7 18.9 115.8c-14.2 5.7-14.1 13.7-2.6 17.2l53.3 16.6 20.4 62.6c2.6 7.1 1.3 9.9 8.8 9.9 5.8 0 8.4-2.6 11.6-5.8l27.9-27.1 58 42.8c10.7 5.9 18.4 2.8 21.1-9.9l38.2-179.9c3.9-15.7-6-22.8-19-16.5ZM79.9 145.8l121.4-76.5c6.1-3.7 11.7-1.7 7.1 2.4L104.4 165.6l-4 42.9-20.5-62.7Z" />
    </svg>
  );
}

function GitHubIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
      <path d="M128 20C68.4 20 20 68.4 20 128c0 47.7 30.9 88.2 73.8 102.5 5.4 1 7.4-2.3 7.4-5.2v-20c-30 6.5-36.3-12.8-36.3-12.8-4.9-12.5-12-15.8-12-15.8-9.8-6.7.7-6.6.7-6.6 10.8.8 16.5 11.1 16.5 11.1 9.6 16.5 25.2 11.7 31.4 9 1-7 3.8-11.7 6.9-14.4-24-2.7-49.2-12-49.2-53.4 0-11.8 4.2-21.4 11.1-29-1.1-2.7-4.8-13.8 1.1-28.7 0 0 9.1-2.9 29.7 11.1 8.6-2.4 17.8-3.6 27-3.6s18.4 1.2 27 3.6c20.6-14 29.7-11.1 29.7-11.1 5.9 14.9 2.2 26 1.1 28.7 6.9 7.6 11.1 17.2 11.1 29 0 41.5-25.3 50.6-49.4 53.3 3.9 3.4 7.4 10 7.4 20.2v29.4c0 2.9 1.9 6.2 7.5 5.1C205.1 216.1 236 175.6 236 128c0-59.6-48.4-108-108-108Z" />
    </svg>
  );
}

function InstagramIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="#E4405F">
      <path d="M128 82.7A45.3 45.3 0 1 0 173.3 128 45.35 45.35 0 0 0 128 82.7Zm0 74.7a29.4 29.4 0 1 1 29.4-29.4 29.43 29.43 0 0 1-29.4 29.4ZM176.6 80.9a10.6 10.6 0 1 1 10.6 10.6 10.6 10.6 0 0 1-10.6-10.6ZM224 128c0-30.5-.1-34.3-.7-46.2-.6-11.9-2.4-20-5.2-27a55.1 55.1 0 0 0-31-31c-7-2.8-15.1-4.6-27-5.2C148.3 18.1 144.5 18 128 18s-20.3.1-32.1.6c-11.9.6-20 2.4-27 5.2a55.1 55.1 0 0 0-31 31c-2.8 7-4.6 15.1-5.2 27C32.1 93.7 32 97.5 32 128s.1 34.3.7 46.2c.6 11.9 2.4 20 5.2 27a55.1 55.1 0 0 0 31 31c7 2.8 15.1 4.6 27 5.2 11.8.5 15.6.6 32.1.6s20.3-.1 32.1-.6c11.9-.6 20-2.4 27-5.2a55.1 55.1 0 0 0 31-31c2.8-7 4.6-15.1 5.2-27 .6-11.9.7-15.7.7-46.2Z" />
    </svg>
  );
}

function YouTubeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="#FF0000">
      <path d="M234.3 73.1a29.2 29.2 0 0 0-20.5-20.6C195.7 47.6 128 47.6 128 47.6s-67.7 0-85.8 4.9a29.2 29.2 0 0 0-20.5 20.6C16.8 91.3 16.8 128 16.8 128s0 36.7 4.9 54.9a29.2 29.2 0 0 0 20.5 20.6c18.1 4.9 85.8 4.9 85.8 4.9s67.7 0 85.8-4.9a29.2 29.2 0 0 0 20.5-20.6c4.9-18.2 4.9-54.9 4.9-54.9s0-36.7-4.9-54.9ZM105.8 162.6V93.4L164 128l-58.2 34.6Z" />
    </svg>
  );
}