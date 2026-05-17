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
};

const AVATAR_BUCKET = "avatars";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [currency, setCurrency] = useState("PHP");
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("System (Auto)");

  const [orderUpdates, setOrderUpdates] = useState(true);
  const [ticketReplies, setTicketReplies] = useState(true);
  const [promotions, setPromotions] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const displayInitial = useMemo(() => {
    const source = username || firstname || email || "A";
    return source.charAt(0).toUpperCase();
  }, [username, firstname, email]);

  async function loadProfile() {
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

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("SETTINGS_PROFILE_ERROR:", error.message);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const profileData = data as Profile;
    setProfile(profileData);
    setFirstname(profileData.firstname || "");
    setLastname(profileData.lastname || "");
    setUsername(profileData.username || "");
    setAvatarUrl(profileData.avatar_url || null);
    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveProfile() {
    if (!profile?.id) return;

    setSavingProfile(true);
    setMessage("");
    setErrorMessage("");

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");

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
    await loadProfile();
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !profile?.id) return;

    setMessage("");
    setErrorMessage("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Please upload JPG, PNG, or WEBP image only.");
      return;
    }

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMessage("Profile picture must be 2MB or smaller.");
      return;
    }

    setUploadingAvatar(true);

    const fileExt = file.name.split(".").pop() || "png";
    const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

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
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      console.error("AVATAR_SAVE_ERROR:", updateError.message);
      setErrorMessage(updateError.message);
      setUploadingAvatar(false);
      return;
    }

    setAvatarUrl(publicUrl);
    setMessage("Profile picture updated. Refresh other pages if the avatar does not update instantly.");
    setUploadingAvatar(false);
  }

  async function removeAvatar() {
    if (!profile?.id) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", profile.id);

    if (error) {
      console.error("REMOVE_AVATAR_ERROR:", error.message);
      setErrorMessage(error.message);
      return;
    }

    setAvatarUrl(null);
    setMessage("Profile picture removed.");
  }

  async function sendPasswordReset() {
    setMessage("");
    setErrorMessage("");

    if (!email) {
      setErrorMessage("Email address not found.");
      return;
    }

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
          <div>
            <h1 className="text-3xl font-black text-slate-950">Settings</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Manage your account settings and preferences
            </p>
          </div>

          {(message || errorMessage) && (
            <div className="mt-5 grid gap-3">
              {message && (
                <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
                  <CheckCircle2 size={18} />
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  <XCircle size={18} />
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.05fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Account Settings</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Manage your profile information
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg ring-1 ring-slate-200">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt="Profile picture"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-50 text-5xl font-black text-blue-600">
                        {displayInitial}
                      </div>
                    )}

                    <div className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow ring-1 ring-slate-200">
                      <Camera size={17} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800">Profile Picture</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      JPG, PNG or WEBP. Max size 2MB.
                    </p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                        <Upload size={17} />
                        {uploadingAvatar ? "Uploading..." : "Upload New Photo"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={uploadAvatar}
                          disabled={uploadingAvatar}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={removeAvatar}
                        disabled={!avatarUrl || uploadingAvatar}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-5 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                        Remove Photo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <FormField label="First Name">
                    <input
                      value={firstname}
                      onChange={(event) => setFirstname(event.target.value)}
                      placeholder="First name"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </FormField>

                  <FormField label="Last Name">
                    <input
                      value={lastname}
                      onChange={(event) => setLastname(event.target.value)}
                      placeholder="Last name"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </FormField>

                  <FormField label="Username">
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="username"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </FormField>

                  <FormField label="Email">
                    <input
                      value={email}
                      readOnly
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500 outline-none"
                    />
                  </FormField>
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={savingProfile || loading}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={17} />
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Security</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Manage your security settings
                  </p>
                </div>

                <div className="mt-5 divide-y divide-slate-100">
                  <SecurityRow
                    icon={Lock}
                    iconClass="bg-green-100 text-green-600"
                    title="Change Password"
                    text="Update your password regularly"
                    buttonText="Change Password"
                    onClick={sendPasswordReset}
                  />

                  <SecurityLinkRow
                    icon={Shield}
                    iconClass="bg-blue-100 text-blue-600"
                    title="API Key"
                    text="View and manage your API key"
                    buttonText="Manage API"
                    href="/dashboard/api"
                  />

                  <SecurityRow
                    icon={Monitor}
                    iconClass="bg-purple-100 text-purple-600"
                    title="Active Sessions"
                    text="Manage your active login sessions"
                    buttonText="Logout"
                    onClick={logout}
                  />
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Preferences</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Customize your experience
                  </p>
                </div>

                <div className="mt-5 divide-y divide-slate-100">
                  <PreferenceRow
                    icon={Coins}
                    iconClass="bg-purple-100 text-purple-600"
                    title="Currency"
                    text="Choose your preferred currency"
                  >
                    <select
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:w-72"
                    >
                      <option value="PHP">PHP - Philippine Peso</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="THB">THB - Thai Baht</option>
                    </select>
                  </PreferenceRow>

                  <PreferenceRow
                    icon={Globe2}
                    iconClass="bg-blue-100 text-blue-600"
                    title="Language"
                    text="Select your language"
                  >
                    <select
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:w-72"
                    >
                      <option>English</option>
                      <option>Filipino</option>
                    </select>
                  </PreferenceRow>

                  <PreferenceRow
                    icon={Moon}
                    iconClass="bg-indigo-100 text-indigo-600"
                    title="Theme"
                    text="Choose your theme"
                  >
                    <select
                      value={theme}
                      onChange={(event) => setTheme(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:w-72"
                    >
                      <option>System (Auto)</option>
                      <option>Light</option>
                      <option>Dark</option>
                    </select>
                  </PreferenceRow>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Notifications</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Manage your notification preferences
                  </p>
                </div>

                <div className="mt-5 divide-y divide-slate-100">
                  <ToggleRow
                    icon={Mail}
                    iconClass="bg-blue-100 text-blue-600"
                    title="Order Updates"
                    text="Get notified about your order status"
                    checked={orderUpdates}
                    onChange={() => setOrderUpdates((current) => !current)}
                  />

                  <ToggleRow
                    icon={Bell}
                    iconClass="bg-green-100 text-green-600"
                    title="Ticket Replies"
                    text="Get notified when your tickets are replied"
                    checked={ticketReplies}
                    onChange={() => setTicketReplies((current) => !current)}
                  />

                  <ToggleRow
                    icon={Mail}
                    iconClass="bg-purple-100 text-purple-600"
                    title="Promotions"
                    text="Receive updates about promos and offers"
                    checked={promotions}
                    onChange={() => setPromotions((current) => !current)}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                <div>
                  <h2 className="text-xl font-black text-red-600">Danger Zone</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Irreversible and sensitive actions
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50/40 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <Trash2 size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Delete Account</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Account deletion is disabled. Contact support for help.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="h-11 rounded-xl border border-red-200 bg-white px-5 text-sm font-black text-red-400 opacity-60"
                  >
                    Delete Account
                  </button>
                </div>
              </section>
            </div>
          </div>

          <p className="py-8 text-center text-sm font-semibold text-slate-400">
            © 2026 Ascend Service. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function SecurityRow({
  icon: Icon,
  iconClass,
  title,
  text,
  buttonText,
  onClick,
}: {
  icon: any;
  iconClass: string;
  title: string;
  text: string;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{text}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        {buttonText}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function SecurityLinkRow({
  icon: Icon,
  iconClass,
  title,
  text,
  buttonText,
  href,
}: {
  icon: any;
  iconClass: string;
  title: string;
  text: string;
  buttonText: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{text}</p>
        </div>
      </div>

      <Link
        href={href}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        {buttonText}
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function PreferenceRow({
  icon: Icon,
  iconClass,
  title,
  text,
  children,
}: {
  icon: any;
  iconClass: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{text}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  iconClass,
  title,
  text,
  checked,
  onChange,
}: {
  icon: any;
  iconClass: string;
  title: string;
  text: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{text}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={`relative h-8 w-14 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
