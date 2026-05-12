"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [refundEnabled, setRefundEnabled] = useState(true);
  const [message, setMessage] = useState("");

  async function loadSettings() {
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "refund_enabled")
      .single();

    setRefundEnabled(data?.value === "true");
  }

  async function updateRefundSetting(value: boolean) {
    setRefundEnabled(value);
    setMessage("Saving refund setting...");

    const { error } = await supabase
      .from("platform_settings")
      .update({ value: value ? "true" : "false" })
      .eq("key", "refund_enabled");

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      value
        ? "Refunds are now enabled."
        : "Refunds are now disabled."
    );
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <AdminGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <h2 className="text-4xl font-black mb-4">System Settings</h2>

        <p className="text-zinc-400 mb-8">
          Configure platform settings, payment methods, security, and automation.
        </p>

        {message && (
          <p className="text-sm text-blue-400 mb-4">{message}</p>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
            <h3 className="text-2xl font-black mb-6">Platform Settings</h3>

            <div className="flex flex-col gap-5">
              <input
                type="text"
                placeholder="Website Name"
                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="email"
                placeholder="Support Email"
                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />

              <button className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition">
                Save Changes
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
            <h3 className="text-2xl font-black mb-6">Order Refunds</h3>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="font-semibold text-white">
                    Refund System
                  </p>

                  <p className="text-sm text-zinc-500 mt-1">
                    When disabled, refund buttons will be hidden everywhere.
                  </p>
                </div>

                <button
                  onClick={() => updateRefundSetting(!refundEnabled)}
                  className={`rounded-xl px-5 py-3 font-semibold transition ${
                    refundEnabled
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {refundEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 lg:col-span-2">
            <h3 className="text-2xl font-black mb-6">Security</h3>

            <div className="grid md:grid-cols-3 gap-5">
              <button className="border border-zinc-800 hover:border-blue-500 rounded-xl py-3 font-semibold transition">
                Enable Maintenance Mode
              </button>

              <button className="border border-zinc-800 hover:border-blue-500 rounded-xl py-3 font-semibold transition">
                Force Logout All Users
              </button>

              <button className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 rounded-xl py-3 font-semibold transition">
                Emergency System Lock
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}