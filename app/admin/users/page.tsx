"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Profile = {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  plan: string;
  balance: number;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setUsers(data || []);

    const { data: authData } = await supabase.auth.getUser();

    if (authData.user) {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (currentProfile?.role) {
        setCurrentUserRole(currentProfile.role);
      }
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function getRoleData(role: string) {
    if (role === "super_admin") {
      return {
        label: "Developer",
        style: "bg-purple-500/10 text-purple-400",
      };
    }

    if (role === "head_admin") {
      return {
        label: "Head Administrator",
        style: "bg-yellow-500/10 text-yellow-400",
      };
    }

    if (role === "admin") {
      return {
        label: "Administrator",
        style: "bg-green-500/10 text-green-400",
      };
    }

    return {
      label: "User",
      style: "bg-blue-500/10 text-blue-400",
    };
  }

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();

    return (
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  async function confirmRoleChange() {
    if (!selectedUser || !newRole) return;

    if (currentUserRole !== "super_admin") {
      setMessage("Only Developer can manage user roles.");
      return;
    }

    const confirmUpdate = confirm(
      `Change ${selectedUser.username}'s role to ${getRoleData(newRole).label}?`
    );

    if (!confirmUpdate) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", selectedUser.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: selectedUser.id,
      title: "Account Role Updated",
      message: `Your account role has been updated to ${
        getRoleData(newRole).label
      }.`,
      type: "role_updated",
      is_read: false,
    });

    setMessage("User role updated successfully.");
    setSelectedUser(null);
    setNewRole("");
    loadUsers();
  }

  return (
    <AdminGuard allowedRoles={["admin", "head_admin", "super_admin"]}>
      <AdminLayout>
        <h2 className="text-4xl font-black mb-4">Users</h2>

        <p className="text-zinc-400 mb-8">
          Search users, review account details, and manage account roles.
        </p>

        {message && (
          <p className="text-sm text-blue-400 mb-4">
            {message}
          </p>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xl bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/60 text-zinc-500">
              <tr>
                <th className="text-left p-5">Username</th>
                <th className="text-left p-5">Name</th>
                <th className="text-left p-5">Email</th>
                <th className="text-left p-5">Plan</th>
                <th className="text-left p-5">Balance</th>
                <th className="text-left p-5">Role</th>
                <th className="text-left p-5">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-zinc-900">
                  <td className="p-5 font-medium">
                    {user.username || "No username"}
                  </td>

                  <td className="p-5 text-zinc-400">
                    {user.firstname} {user.lastname}
                  </td>

                  <td className="p-5 text-zinc-400">
                    {user.email || "No email"}
                  </td>

                  <td className="p-5 text-blue-400 capitalize">
                    {user.plan}
                  </td>

                  <td className="p-5 text-green-400 font-semibold">
                    ${Number(user.balance || 0).toFixed(2)}
                  </td>

                  <td className="p-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        getRoleData(user.role).style
                      }`}
                    >
                      {getRoleData(user.role).label}
                    </span>
                  </td>

                  <td className="p-5">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      {currentUserRole === "super_admin"
                        ? "Manage User"
                        : "View Details"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black">
                    {currentUserRole === "super_admin"
                      ? "Manage User"
                      : "User Details"}
                  </h3>

                  <p className="text-sm text-zinc-500">
                    Review account details
                    {currentUserRole === "super_admin"
                      ? " and update account role."
                      : "."}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-zinc-500 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <p className="text-sm text-zinc-500">Username</p>
                  <p className="font-semibold">{selectedUser.username}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Full Name</p>
                  <p className="font-semibold">
                    {selectedUser.firstname} {selectedUser.lastname}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Email</p>
                  <p className="font-semibold">{selectedUser.email}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Current Balance</p>
                  <p className="font-semibold text-green-400">
                    ${Number(selectedUser.balance || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Current Plan</p>
                  <p className="font-semibold capitalize">
                    {selectedUser.plan}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Current Role</p>

                  <span
                    className={`inline-block mt-1 rounded-full px-3 py-1 text-xs ${
                      getRoleData(selectedUser.role).style
                    }`}
                  >
                    {getRoleData(selectedUser.role).label}
                  </span>
                </div>

                {currentUserRole === "super_admin" && (
                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">
                      Change Role
                    </label>

                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                      <option value="head_admin">Head Administrator</option>
                      <option value="super_admin">Developer</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="border border-zinc-800 hover:border-zinc-600 rounded-xl px-5 py-3 font-semibold transition"
                >
                  Close
                </button>

                {currentUserRole === "super_admin" && (
                  <button
                    onClick={confirmRoleChange}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition"
                  >
                    Confirm Change
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}