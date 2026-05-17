"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Coins,
  Globe2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Save,
  Shield,
  Trash2,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Profile = {
  id: string;
  email?: string | null;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  balance?: number | string | null;
  preferred_currency?: string | null;
  preferred_language?: string | null;
  preferred_theme?: string | null;
};

type CurrencyRow = {
  id?: string | number;
  currency_code?: string | null;
  code?: string | null;
  currency_name?: string | null;
  name?: string | null;
  symbol?: string | null;
  panel_rate?: number | string | null;
  rate_to_php?: number | string | null;
  market_rate?: number | string | null;
  is_active?: boolean | null;
  is_enabled?: boolean | null;
  status?: string | null;
};

const AVATAR_BUCKET = "avatars";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fil", label: "Filipino" },
  { value: "th", label: "Thai" },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light Mode" },
  { value: "dark", label: "Dark Mode" },
  { value: "system", label: "System Default" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [preferredCurrency, setPreferredCurrency] = useState("PHP");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [preferredTheme, setPreferredTheme] = useState("light");

  const [orderUpdates, setOrderUpdates] = useState(true);
  const [ticketReplies, setTicketReplies] = useState(true);
  const [promotions, setPromotions] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const displayInitial = useMemo(() => {
    const source = username || firstname || email || "A";
    return source.charAt(0).toUpperCase();
  }, [username, firstname, email]);

  const selectedCurrency = useMemo(() => {
    return currencies.find(
      (currency) => getCurrencyCode(currency) === preferredCurrency,
    );
  }, [currencies, preferredCurrency]);

  async function loadSettings() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("Please login again to manage your settings.");
      setLoading(false);
      return;
    }

    setEmail(user.email || "");

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("SETTINGS_PROFILE_ERROR:", profileError.message);
      setErrorMessage(profileError.message);
      setLoading(false);
      return;
    }

    const { data: currencyData, error: currencyError } = await supabase
      .from("exchange_rates")
      .select("*")
      .order("currency_code", { ascending: true });

    if (currencyError) {
      console.warn("SETTINGS_CURRENCIES_ERROR:", currencyError.message);
      setCurrencies([
        {
          currency_code: "PHP",
          currency_name: "Philippine Peso",
          symbol: "₱",
          panel_rate: 1,
          is_active: true,
        },
      ]);
    } else {
      const activeCurrencies = ((currencyData || []) as CurrencyRow[]).filter(
        (currency) => {
          const status = String(currency.status || "").toLowerCase();

          if (currency.is_active === false) return false;
          if (currency.is_enabled === false) return false;
          if (status && status !== "active" && status !== "enabled") return false;

          return Boolean(getCurrencyCode(currency));
        },
      );

      const hasPhp = activeCurrencies.some(
        (currency) => getCurrencyCode(currency) === "PHP",
      );

      setCurrencies(
        hasPhp
          ? activeCurrencies
          : [
              {
                currency_code: "PHP",
                currency_name: "Philippine Peso",
                symbol: "₱",
                panel_rate: 1,
                is_active: true,
              },
              ...activeCurrencies,
            ],
      );
    }

    const profile = profileData as Profile;

    setProfile(profile);
    setFirstname(profile.firstname || "");
    setLastname(profile.lastname || "");
    setUsername(profile.username || "");
    setAvatarUrl(profile.avatar_url || null);
    setPreferredCurrency(profile.preferred_currency || "PHP");
    setPreferredLanguage(profile.preferred_language || "en");
    setPreferredTheme(profile.preferred_theme || "light");
    setLoading(false);
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function saveProfile() {
    if (!profile?.id) return;

    setSavingProfile(true);
    setMessage("");
    setErrorMessage("");

    const cleanUsername = username.trim().replace(/\s+/g, "");

    if (!cleanUsername) {
      setErrorMessage("Username is required.");
      setSavingProfile(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        username: cleanUsername,
        full_name: `${firstname.trim()} ${lastname.trim()}`.trim(),
      })
      .eq("id", profile.id);

    if (error) {
      console.error("SAVE_PROFILE_ERROR:", error.message);
      setErrorMessage(error.message);
      setSavingProfile(false);
      return;
    }

    setUsername(cleanUsername);
    setMessage("Profile updated successfully.");
    setSavingProfile(false);
    await loadSettings();
  }

  async function savePreferences() {
    if (!profile?.id) return;

    setSavingPreferences(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        preferred_currency: preferredCurrency,
        preferred_language: preferredLanguage,
        preferred_theme: preferredTheme,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("SAVE_PREFERENCES_ERROR:", error.message);
      setErrorMessage(error.message);
      setSavingPreferences(false);
      return;
    }

    setMessage("Preferences saved successfully.");
    setSavingPreferences(false);
    await loadSettings();
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !profile?.id) return;

    setUploadingAvatar(true);
    setMessage("");
    setErrorMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file.");
      setUploadingAvatar(false);
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage("Image must be below 4MB.");
      setUploadingAvatar(false);
      return;
    }

    const fileExtension = file.name.split(".").pop() || "png";
    const filePath = `${profile.id}/avatar-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("AVATAR_UPLOAD_ERROR:", uploadError.message);
      setErrorMessage(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: publicData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("AVATAR_UPDATE_ERROR:", updateError.message);
      setErrorMessage(updateError.message);
      setUploadingAvatar(false);
      return;
    }

    setAvatarUrl(publicUrl);
    setMessage("Profile picture updated successfully.");
    setUploadingAvatar(false);
    await loadSettings();
  }

  async function removeAvatar() {
    if (!profile?.id) return;

    setUploadingAvatar(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("REMOVE_AVATAR_ERROR:", error.message);
      setErrorMessage(error.message);
      setUploadingAvatar(false);
      return;
    }

    setAvatarUrl(null);
    setMessage("Profile picture removed.");
    setUploadingAvatar(false);
    await loadSettings();
  }

  async function sendPasswordReset() {
    if (!email) {
      setErrorMessage("Email address not found.");
      return;
    }

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Password reset link sent to your email.");
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-[#f6f9fc] text-slate-950">
      <DashboardSidebar />

      <section className="min-h-screen lg:ml-72">
        <DashboardTopbar />

        <div className="p-4 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-950">
                Settings
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Manage your profile, preferences, security, and notifications.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              <Shield size={17} />
              Account protected
            </div>
          </div>

          {(message || errorMessage) && (
            <div
              className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
                errorMessage
                  ? "border-red-100 bg-red-50 text-red-600"
                  : "border-green-100 bg-green-50 text-green-600"
              }`}
            >
              {errorMessage ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
              {errorMessage || message}
            </div>
          )}

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="lg:w-72">
                  <h2 className="text-xl font-black text-slate-950">
                    Account Settings
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Update your profile picture and public account information.
                  </p>

                  <div className="mt-6 flex flex-col items-center rounded-2xl bg-slate-50 p-5">
                    <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-white text-4xl font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        displayInitial
                      )}

                      {uploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 text-xs font-black text-white">
                          Uploading...
                        </div>
                      )}
                    </div>

                    <label className="mt-5 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                      <Camera size={17} />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadAvatar}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={removeAvatar}
                      disabled={!avatarUrl || uploadingAvatar}
                      className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Remove Photo
                    </button>

                    <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-400">
                      Recommended: square JPG or PNG image below 4MB.
                    </p>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="First Name"
                      value={firstname}
                      onChange={setFirstname}
                      placeholder="Enter first name"
                    />

                    <InputField
                      label="Last Name"
                      value={lastname}
                      onChange={setLastname}
                      placeholder="Enter last name"
                    />

                    <InputField
                      label="Username"
                      value={username}
                      onChange={setUsername}
                      placeholder="Enter username"
                      helper="Username casing is preserved exactly as you type it."
                    />

                    <InputField
                      label="Email Address"
                      value={email}
                      onChange={setEmail}
                      placeholder="Email address"
                      disabled
                      helper="Email is managed by your login account."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={savingProfile || loading}
                    className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={17} />
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Account Overview
              </h2>

              <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#1557f6] via-[#3155f5] to-[#7c2df0] p-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/60 bg-white/10 text-xl font-black">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      displayInitial
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xl font-black">
                      {username || "User"}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-blue-100">
                      {email || "No email"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <OverviewMiniCard
                    label="Wallet Base"
                    value="PHP"
                    icon={Coins}
                  />
                  <OverviewMiniCard
                    label="Display Currency"
                    value={preferredCurrency}
                    icon={Globe2}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <QuickLink
                  href="/dashboard/api"
                  icon={KeyRound}
                  title="API Settings"
                  text="Manage your API key and documentation."
                />
                <QuickLink
                  href="/dashboard/tickets"
                  icon={Mail}
                  title="Support Tickets"
                  text="Contact support or view ticket replies."
                />
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.85fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Globe2 size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Preferences
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Save how your dashboard should display currency, language, and theme.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <SelectField
                  label="Display Currency"
                  value={preferredCurrency}
                  onChange={setPreferredCurrency}
                  options={currencies.map((currency) => {
                    const code = getCurrencyCode(currency);
                    const name = getCurrencyName(currency);
                    const symbol = currency.symbol ? ` ${currency.symbol}` : "";

                    return {
                      value: code,
                      label: `${code}${symbol} - ${name}`,
                    };
                  })}
                  helper={
                    selectedCurrency
                      ? `Rate: ${formatRate(getPanelRate(selectedCurrency))}`
                      : "Wallet stays PHP. This only changes display later."
                  }
                />

                <SelectField
                  label="Language"
                  value={preferredLanguage}
                  onChange={setPreferredLanguage}
                  options={LANGUAGE_OPTIONS}
                  helper="UNAVAILABLE"
                />

                <SelectField
                  label="Theme"
                  value={preferredTheme}
                  onChange={setPreferredTheme}
                  options={THEME_OPTIONS}
                  helper="UNAVAILABLE"
                />
              </div>

              <button
                type="button"
                onClick={savePreferences}
                disabled={savingPreferences || loading}
                className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {savingPreferences ? "Saving..." : "Save Preferences"}
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <Bell size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Notifications
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Control which updates you want to receive.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <ToggleRow
                  title="Order updates"
                  text="Receive updates when your orders change status."
                  checked={orderUpdates}
                  onChange={setOrderUpdates}
                />
                <ToggleRow
                  title="Ticket replies"
                  text="Receive notifications when support replies."
                  checked={ticketReplies}
                  onChange={setTicketReplies}
                />
                <ToggleRow
                  title="Promotions"
                  text="Receive occasional discounts and campaign updates."
                  checked={promotions}
                  onChange={setPromotions}
                />
              </div>

              <p className="mt-4 text-xs font-semibold text-slate-400">
                Notification preferences are UI-ready. Email delivery rules can be
                connected later.
              </p>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <Lock size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Security
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Keep your account safe and manage access.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <ActionRow
                  icon={Mail}
                  title="Password Reset"
                  text="Send a reset password link to your email."
                  button="Send Reset Link"
                  onClick={sendPasswordReset}
                />
                <ActionRow
                  icon={KeyRound}
                  title="API Access"
                  text="Manage API key, examples, and endpoints."
                  button="Open API"
                  href="/dashboard/api"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <LogOut size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Danger Zone
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Sign out from your current account session.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
              >
                <LogOut size={17} />
                Logout Account
              </button>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helper?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-black text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />
      {helper && (
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  helper?: string;
}) {
  return (
    <div>
      <label className="text-sm font-black text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
      >
        {options.length <= 0 ? (
          <option value="PHP">PHP - Philippine Peso</option>
        ) : (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        )}
      </select>
      {helper && (
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function ToggleRow({
  title,
  text,
  checked,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-100 hover:bg-blue-50"
    >
      <div>
        <p className="text-sm font-black text-slate-800">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {text}
        </p>
      </div>

      <span
        className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function ActionRow({
  icon: Icon,
  title,
  text,
  button,
  onClick,
  href,
}: {
  icon: any;
  title: string;
  text: string;
  button: string;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={21} />
        </div>

        <div>
          <p className="text-sm font-black text-slate-800">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {text}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-black text-blue-600">
        {button}
        <ChevronRight size={16} />
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-100 hover:bg-blue-50"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-100 hover:bg-blue-50"
    >
      {content}
    </button>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  text,
}: {
  href: string;
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-100 hover:bg-blue-50"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Icon size={21} />
        </div>

        <div>
          <p className="text-sm font-black text-slate-800">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {text}
          </p>
        </div>
      </div>

      <ChevronRight size={17} className="text-slate-400" />
    </Link>
  );
}

function OverviewMiniCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <Icon size={20} className="text-blue-100" />
      <p className="mt-3 text-xs font-semibold text-blue-100">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function getCurrencyCode(currency: CurrencyRow) {
  return String(currency.currency_code || currency.code || "").toUpperCase();
}

function getCurrencyName(currency: CurrencyRow) {
  return (
    currency.currency_name ||
    currency.name ||
    getCurrencyCode(currency) ||
    "Currency"
  );
}

function getPanelRate(currency: CurrencyRow) {
  const rate = Number(
    currency.panel_rate ||
      currency.rate_to_php ||
      currency.market_rate ||
      (getCurrencyCode(currency) === "PHP" ? 1 : 0),
  );

  return Number.isFinite(rate) && rate > 0 ? rate : 1;
}

function formatRate(rate: number) {
  return rate.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
