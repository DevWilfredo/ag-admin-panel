"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { registerUser } from "@/services/auth-service";
import { getErrorMessage } from "@/services/api-errors";
import type { UserRole } from "@/services/session-service";
import { listUsers, type UserDirectoryItem } from "@/services/users-service";
import { EmptyTable, Field, Modal, Notice, PageHeading, PrimaryButton, SelectField, formatValue, managementHeader } from "./management-ui";

const roles: UserRole[] = ["ADMIN", "BUYER", "PRODUCER", "LENDER", "WAREHOUSE_KEEPER"];

export function UsersClient() {
  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await listUsers({ limit: 100 })); setError(undefined); }
    catch (cause) { setError(getErrorMessage(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await registerUser({
        email: String(data.get("email") || "").trim(), password: String(data.get("password") || ""),
        fullName: String(data.get("fullName") || "").trim(), role: String(data.get("role")) as UserRole,
        phone: String(data.get("phone") || "").trim() || undefined,
      });
      setOpen(false);
      setNotice(response.message || "User created successfully.");
      await load();
    } catch (cause) { setError(getErrorMessage(cause)); }
    finally { setSaving(false); }
  }

  return <AppShell activeNav="users" header={managementHeader("Users")}>
    <PageHeading title="Users" description="Create accounts and review the role assigned by the backend." action={<PrimaryButton onClick={() => setOpen(true)}>New user</PrimaryButton>} />
    {notice ? <Notice message={notice} /> : null}
    {error ? <Notice error message={`${error} The documented GET /api/users route currently returns 404, so the directory cannot be displayed.`} /> : null}
    {!users.length ? <EmptyTable loading={loading} label="users" onRetry={load} /> : (
      <div className="overflow-x-auto rounded-[8px] border border-[#e4e4e7] bg-white"><table className="w-full min-w-[700px] text-left">
        <thead className="bg-[#f8f9fb] text-[10px] uppercase tracking-wider text-[#85858d]"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Status</th></tr></thead>
        <tbody>{users.map((user) => <tr className="border-t border-[#ececee] text-[12px]" key={user.id}><td className="px-5 py-4 font-semibold">{user.fullName}</td><td className="px-5 py-4">{user.email}</td><td className="px-5 py-4">{user.role.replaceAll("_", " ")}</td><td className="px-5 py-4">{formatValue(user.phone)}</td><td className="px-5 py-4">{user.isActive === false ? "Inactive" : "Active"}</td></tr>)}</tbody>
      </table></div>
    )}
    {open ? <Modal title="Create user" description="The backend validates email uniqueness, password policy and the assigned role." onClose={() => setOpen(false)}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={create}>
        <Field name="fullName" label="Full name" required /><Field name="email" label="Email" type="email" required />
        <Field name="password" label="Temporary password" type="password" required /><Field name="phone" label="Phone" />
        <SelectField name="role" label="Role" options={roles.map((role) => ({ value: role, label: role.replaceAll("_", " ") }))} required />
        <div className="flex justify-end sm:col-span-2"><PrimaryButton type="submit" disabled={saving}>{saving ? "Creating…" : "Create user"}</PrimaryButton></div>
      </form>
    </Modal> : null}
  </AppShell>;
}
