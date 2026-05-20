"use client";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  Home,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PublicPanel = {
  id: string;
  panel_name: string;
  panel_slug: string;
  support_email: string | null;
  logo_url: string | null;
  primary_color: string | null;
  status: string;
};

function getReadableError(value: unknown) {
  return String(value || "Something went wrong. Please try again.");
}

function sanitizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAccentShadow(color: string) {
  return `0 20px 55px ${color}45`;
}

function setDynamicFavicon(iconUrl?: string | null) {
  if (!iconUrl) return;

  const existing =
    document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
    document.createElement("link");

  existing.rel = "icon";
  existing.href = iconUrl;

  if (!existing.parentElement) {
    document.head.appendChild(existing);
  }
}

export default function ChildPanelRegisterPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  const slug = String(params?.slug || "");

  const [panel, setPanel] = useState<PublicPanel | null>(null);
  const [loadingPanel, setLoadingPanel] = useState(true);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const primaryColor = panel?.primary_color || "#ff4f8b";

  const canSubmit = useMemo(() => {
    return Boolean(
      firstname.trim() &&
        lastname.trim() &&
        username.trim().length >= 3 &&
        isValidEmail(email.trim()) &&
        password.length >= 8 &&
        confirmPassword.length >= 8 &&
        acceptedTerms,
    );
  }, [
    firstname,
    lastname,
    username,
    email,
    password,
    confirmPassword,
    acceptedTerms,
  ]);

  async function loadPanel() {
    setLoadingPanel(true);

    try {
      const response = await fetch(
        `/api/child-panel/public?slug=${encodeURIComponent(slug)}`,
      );

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "Panel not found.");
        setLoadingPanel(false);
        return;
      }

      setPanel(result.panel);
      document.title = `Register | ${result.panel.panel_name}`;
      setDynamicFavicon(result.panel.logo_url);
      setLoadingPanel(false);
    } catch {
      setMessage("Failed to load panel.");
      setLoadingPanel(false);
    }
  }

  useEffect(() => {
    loadPanel();
  }, [slug]);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setMessage("");

    if (!panel) {
      setMessage("Panel not found.");
      return;
    }

    if (!firstname.trim() || !lastname.trim()) {
      setMessage("Please enter your first name and last name.");
      return;
    }

    if (username.trim().length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setMessage("Please agree to the terms before creating an account.");
      return;
    }

    setSubmitting(true);

    try {
const response = await fetch("/api/child-panel/customers/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    slug: panel.panel_slug,
    firstname,
    lastname,
    username,
    email,
    password,
  }),
});

const responseText = await response.text();

let result: any = null;

try {
  result = JSON.parse(responseText);
} catch {
  setMessage(
    `Register API returned non-JSON response. Status: ${response.status}. Make sure /api/child-panel/customers/register is deployed.`,
  );
  setSubmitting(false);
  return;
}

if (!response.ok || !result.success) {
  setMessage(getReadableError(result.message));
  setSubmitting(false);
  return;
}

      setMessage("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        router.push(`/child/${panel.panel_slug}/login`);
      }, 900);
    } catch {
      setMessage("Failed to create account.");
      setSubmitting(false);
    }
  }

  if (loadingPanel) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050716] px-4 text-white">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-8 py-7 text-center shadow-2xl backdrop-blur">
          <div
            className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-white/10"
            style={{ borderTopColor: primaryColor }}
          />

          <p className="mt-4 text-sm font-bold text-white/60">
            Loading registration...
          </p>
        </div>
      </main>
    );
  }

  if (!panel) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050716] px-4 text-white">
        <div className="max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-300">
            <Lock size={28} />
          </div>

          <h1 className="mt-5 text-3xl font-black">Panel Unavailable</h1>

          <p className="mt-3 text-sm font-semibold leading-6 text-white/55">
            {message || "This panel is not available right now."}
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050716] text-white">
      <div
        className="absolute inset-0 opacity-95"
        style={{
          background: `
            radial-gradient(circle at 18% 15%, ${primaryColor}38, transparent 30%),
            radial-gradient(circle at 85% 20%, ${primaryColor}28, transparent 28%),
            radial-gradient(circle at 50% 95%, ${primaryColor}30, transparent 34%),
            linear-gradient(135deg, #050716 0%, #090b1f 45%, #060815 100%)
          `,
        }}
      />

      <div className="absolute left-[-12%] top-[38%] h-[360px] w-[130%] rotate-[-7deg] opacity-70 blur-[1px]">
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${primaryColor}22 22%, ${primaryColor}80 48%, #7c3aed70 66%, transparent 100%)`,
            clipPath:
              "polygon(0 38%, 18% 26%, 37% 44%, 52% 33%, 72% 48%, 100% 24%, 100% 56%, 76% 76%, 53% 59%, 34% 73%, 16% 53%, 0 66%)",
          }}
        />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-15" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href={`/child/${panel.panel_slug}`}
            className="flex min-w-0 items-center gap-3"
          >
            {panel.logo_url ? (
              <img
                src={panel.logo_url}
                alt={panel.panel_name}
                className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: getAccentShadow(primaryColor),
                }}
              >
                {panel.panel_name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-tight">
                {panel.panel_name}
              </p>
              <p className="truncate text-xs font-bold text-white/45">
                Social Growth Platform
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/child/${panel.panel_slug}`}
              className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/80 transition hover:bg-white/[0.08] sm:inline-flex"
            >
              Home
            </Link>

            <Link
              href={`/child/${panel.panel_slug}/login`}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
            >
              Login
            </Link>
          </div>
        </nav>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:py-16">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.15em]"
              style={{
                borderColor: `${primaryColor}55`,
                backgroundColor: `${primaryColor}12`,
                color: "#ffffff",
              }}
            >
              <Sparkles size={15} style={{ color: primaryColor }} />
              Create Your Account
            </div>

            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Join{" "}
              <span style={{ color: primaryColor }}>{panel.panel_name}</span>{" "}
              and start growing today.
            </h1>

            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-white/62">
              Create your customer account to access social media growth
              services, manage orders, track progress, and grow your online
              presence from one clean dashboard.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <Zap size={20} style={{ color: primaryColor }} />
                <p className="mt-3 text-sm font-black">Fast Start</p>
                <p className="mt-1 text-xs font-semibold text-white/45">
                  Create an account in seconds.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <ShieldCheck size={20} style={{ color: primaryColor }} />
                <p className="mt-3 text-sm font-black">Secure Access</p>
                <p className="mt-1 text-xs font-semibold text-white/45">
                  Your data stays protected.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <Headphones size={20} style={{ color: primaryColor }} />
                <p className="mt-3 text-sm font-black">Support</p>
                <p className="mt-1 text-xs font-semibold text-white/45">
                  Help is available when needed.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl">
            <form
              onSubmit={handleRegister}
              className="rounded-[28px] border border-white/10 bg-[#090b1d]/80 p-5 shadow-2xl sm:p-7"
            >
              <div className="text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl"
                  style={{
                    backgroundColor: `${primaryColor}18`,
                    color: primaryColor,
                    boxShadow: getAccentShadow(primaryColor),
                  }}
                >
                  <UserPlus size={28} />
                </div>

                <h2 className="mt-5 text-2xl font-black">
                  Create Your Account
                </h2>

                <p className="mt-2 text-sm font-semibold text-white/50">
                  Fill in your details to get started.
                </p>
              </div>

              {message && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white/75">
                  {message}
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-white/80">
                    First Name
                  </label>

                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                    <User size={17} className="text-white/35" />
                    <input
                      value={firstname}
                      onChange={(event) => setFirstname(event.target.value)}
                      placeholder="John"
                      className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-white/80">
                    Last Name
                  </label>

                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                    <User size={17} className="text-white/35" />
                    <input
                      value={lastname}
                      onChange={(event) => setLastname(event.target.value)}
                      placeholder="Doe"
                      className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-black text-white/80">
                  Username
                </label>

                <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                  <User size={17} className="text-white/35" />
                  <input
                    value={username}
                    onChange={(event) =>
                      setUsername(sanitizeUsername(event.target.value))
                    }
                    placeholder="johndoe_123"
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
                  />
                </div>

                <p className="mt-2 text-xs font-semibold text-white/40">
                  Letters, numbers, and underscore only.
                </p>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-black text-white/80">
                  Email Address
                </label>

                <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                  <Mail size={17} className="text-white/35" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-black text-white/80">
                  Password
                </label>

                <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                  <Lock size={17} className="text-white/35" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-white/45 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-black text-white/80">
                  Confirm Password
                </label>

                <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                  <Lock size={17} className="text-white/35" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm password"
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="text-white/45 transition hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/[0.05]"
                />

                <span className="text-sm font-semibold leading-6 text-white/55">
                  I agree to the Terms of Service and Privacy Policy of{" "}
                  <span className="font-black text-white">
                    {panel.panel_name}
                  </span>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)`,
                  boxShadow: getAccentShadow(primaryColor),
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="mt-5 text-center text-sm font-semibold text-white/45">
                Already have an account?{" "}
                <Link
                  href={`/child/${panel.panel_slug}/login`}
                  className="font-black"
                  style={{ color: primaryColor }}
                >
                  Login
                </Link>
              </p>
            </form>
          </div>
        </section>

        <div className="pb-8">
          <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Secure & Safe", "Your account data stays protected."],
              ["Instant Start", "Create your account and start ordering."],
              ["24/7 Support", "Get help whenever you need it."],
              ["Premium Quality", "Access reliable social growth services."],
            ].map(([title, text]) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${primaryColor}18`,
                    color: primaryColor,
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-white/45">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 text-center text-xs font-semibold text-white/35 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <Link
              href={`/child/${panel.panel_slug}`}
              className="inline-flex items-center justify-center gap-2 text-white/45 transition hover:text-white"
            >
              <Home size={14} />
              Back to Home
            </Link>

            <p>© {new Date().getFullYear()} {panel.panel_name}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </main>
  );
}