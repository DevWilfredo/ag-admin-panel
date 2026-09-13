"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuthenticatedUser } from "@/features/auth/auth-context";
import { registerUser } from "@/services/auth-service";
import { getErrorMessage } from "@/services/api-errors";
import type { UserRole } from "@/services/session-service";
import {
  deactivateUser, getUser, listUsersPage, reactivateUser, updateUser,
  type UserDirectoryItem,
} from "@/services/users-service";
import {
  EmptyTable, Field, Modal, Notice, PageHeading, PrimaryButton,
  SecondaryButton, SelectField, formatValue, managementHeader,
} from "./management-ui";

const roles: UserRole[] = ["ADMIN", "BUYER", "PRODUCER", "LENDER", "WAREHOUSE_KEEPER"];

export function UsersClient() {
  const currentUser = useAuthenticatedUser();
  const params = useSearchParams();
  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<UserDirectoryItem>();
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState(params.get("search") || "");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listUsersPage({
        limit: 20, page, role: role ? role as UserRole : undefined,
        search: query || undefined,
      });
      setUsers(response.users);
      setPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
      setError(undefined);
    } catch (cause) { setError(getErrorMessage(cause)); }
    finally { setLoading(false); }
  }, [page, query, role]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) || "").trim();
    setSaving(true); setError(undefined);
    try {
      if (modal === "edit" && selected) {
        const password = text("password");
        const response = await updateUser(selected.id, {
          fullName: text("fullName"), phone: text("phone"),
          role: text("role") as UserRole, ...(password ? { password } : {}),
        });
        setNotice(response.message || "User updated successfully.");
      } else {
        const response = await registerUser({
          email: text("email"), password: text("password"),
          fullName: text("fullName"), role: text("role") as UserRole,
          phone: text("phone") || undefined,
        });
        setNotice(response.message || "User created successfully.");
      }
      setModal(null); await load();
    } catch (cause) { setError(getErrorMessage(cause)); }
    finally { setSaving(false); }
  }

  async function edit(user: UserDirectoryItem) {
    setError(undefined);
    try { setSelected(await getUser(user.id)); setModal("edit"); }
    catch (cause) { setError(getErrorMessage(cause)); }
  }

  async function toggle(user: UserDirectoryItem) {
    const active = user.isActive !== false;
    if (active && !window.confirm(`Deactivate ${user.fullName || user.email}? They will no longer be able to sign in.`)) return;
    setSaving(true); setError(undefined);
    try {
      const response = active ? await deactivateUser(user.id) : await reactivateUser(user.id);
      setNotice(response.message || `User ${active ? "deactivated" : "reactivated"}.`);
      await load();
    } catch (cause) { setError(getErrorMessage(cause)); }
    finally { setSaving(false); }
  }

  return <AppShell activeNav="users" header={managementHeader("Users")}>
    <PageHeading title="Users" description="Create, edit, deactivate and reactivate platform accounts." action={<PrimaryButton onClick={() => { setSelected(undefined); setModal("create"); }}>New user</PrimaryButton>} />
    <div className="grid max-w-[760px] gap-3 sm:grid-cols-[1fr_220px]">
      <label className="grid gap-1.5 text-[11px] font-semibold text-[#585961]">Search users<input aria-label="Search users" className="h-10 rounded-[7px] border border-[#dedef2] px-3 text-[12px] outline-none focus:border-[#3971ad]" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search by name or email" /></label>
      <SelectField label="Filter by role" value={role} onChange={(value) => { setRole(value); setPage(1); }} options={[{ value: "", label: "All roles" }, ...roles.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))]} />
    </div>
    {notice ? <Notice message={notice} /> : null}
    {error ? <Notice error message={error} /> : null}
    {!users.length ? <EmptyTable loading={loading} error={error} label="users" prompt={query ? "No users match this search" : undefined} onRetry={() => void load()} /> : <UserTable users={users} currentUserId={currentUser?.id} saving={saving} onEdit={edit} onToggle={toggle} />}
    <div className="flex items-center justify-between text-[11px] text-[#777b83]"><span>{total} users · Page {page} of {pages}</span><div className="flex gap-2"><SecondaryButton disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</SecondaryButton><SecondaryButton disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</SecondaryButton></div></div>
    {modal ? <UserModal modal={modal} selected={selected} saving={saving} onClose={() => setModal(null)} onSubmit={submit} /> : null}
  </AppShell>;
}

function UserTable({ users, currentUserId, saving, onEdit, onToggle }: { users: UserDirectoryItem[]; currentUserId?: string; saving: boolean; onEdit: (user: UserDirectoryItem) => void; onToggle: (user: UserDirectoryItem) => void }) {
  return <div className="overflow-x-auto rounded-[8px] border border-[#e4e4e7] bg-white"><table className="w-full min-w-[900px] text-left">
    <thead className="bg-[#f8f9fb] text-[10px] uppercase tracking-wider text-[#85858d]"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
    <tbody>{users.map((user) => <tr className={`border-t border-[#ececee] text-[12px] ${user.isActive === false ? "bg-[#fafafa] text-[#878990]" : ""}`} key={user.id}>
      <td className="px-5 py-4 font-semibold">{user.fullName}</td><td className="px-5 py-4">{user.email}</td><td className="px-5 py-4">{user.role.replaceAll("_", " ")}</td><td className="px-5 py-4">{formatValue(user.phone)}</td>
      <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${user.isActive === false ? "bg-[#eceef1] text-[#71747b]" : "bg-[#e8f6ec] text-[#087d2f]"}`}>{user.isActive === false ? "Inactive" : "Active"}</span></td>
      <td className="px-5 py-4"><div className="flex justify-end gap-2"><SecondaryButton onClick={() => onEdit(user)}>Edit</SecondaryButton><SecondaryButton danger={user.isActive !== false} disabled={saving || user.id === currentUserId} onClick={() => onToggle(user)}>{user.id === currentUserId ? "Current account" : user.isActive === false ? "Reactivate" : "Deactivate"}</SecondaryButton></div></td>
    </tr>)}</tbody>
  </table></div>;
}

function UserModal({ modal, selected, saving, onClose, onSubmit }: { modal: "create" | "edit"; selected?: UserDirectoryItem; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Modal title={modal === "edit" ? "Edit user" : "Create user"} description={modal === "edit" ? "Only enter a password when you intend to reset it." : "The backend validates email uniqueness, password policy and role."} onClose={onClose}>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit} key={`${modal}-${selected?.id || "new"}`}>
      <Field name="fullName" label="Full name" defaultValue={selected?.fullName} required />
      {modal === "create" ? <Field name="email" label="Email" type="email" required /> : <div className="grid gap-1.5 text-[11px] font-semibold text-[#585961]"><span>Email</span><div className="flex h-10 items-center rounded-[7px] border border-[#e2e4e8] bg-[#f6f7f8] px-3 text-[12px] font-normal text-[#777b82]">{selected?.email}</div></div>}
      <Field name="password" label={modal === "edit" ? "New password (optional)" : "Temporary password"} type="password" required={modal === "create"} />
      <Field name="phone" label="Phone" defaultValue={selected?.phone} />
      <SelectField name="role" label="Role" defaultValue={selected?.role || ""} options={roles.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))} required />
      <div className="flex justify-end sm:col-span-2"><PrimaryButton type="submit" disabled={saving}>{saving ? "Saving…" : modal === "edit" ? "Save changes" : "Create user"}</PrimaryButton></div>
    </form>
  </Modal>;
}
