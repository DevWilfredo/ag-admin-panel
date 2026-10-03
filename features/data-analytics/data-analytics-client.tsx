"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticatedUser } from "@/features/auth/auth-context";
import { listUsers, type UserDirectoryItem } from "@/services/users-service";
import type { AnalyticsFilters } from "@/services/analytics-service";
import { PrimaryButton, SecondaryButton } from "@/features/management/management-ui";
import { getDataAnalyticsMockState } from "./mock-data-analytics";
import { loadAnalyticsBackendState } from "./backend-adapter";
import { DataAnalyticsScreen } from "./data-analytics-screen";
import type { AnalyticsTabKey, DataAnalyticsState } from "./types";

export function DataAnalyticsClient({ activeTab, initialFilters = {}, previewState }: { activeTab: AnalyticsTabKey; initialFilters?: AnalyticsFilters; previewState?: string }) {
  const router = useRouter();
  const user = useAuthenticatedUser();
  const [state, setState] = useState<DataAnalyticsState>({ status: "loading" });
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (!previewState) {
      setState({ status: "loading" });
      void loadAnalyticsBackendState(activeTab, filters).then((next) => { if (mounted) setState(next); });
    }
    return () => { mounted = false; };
  }, [activeTab, filters, previewState]);

  useEffect(() => {
    if (user.role !== "ADMIN" || previewState) return;
    let mounted = true;
    setLoadingUsers(true);
    void listUsers({ limit: 100 })
      .then((items) => { if (mounted) setUsers(items); })
      .catch(() => { if (mounted) setUsers([]); })
      .finally(() => { if (mounted) setLoadingUsers(false); });
    return () => { mounted = false; };
  }, [previewState, user.role]);

  function applyFilters(next: AnalyticsFilters) {
    setFilters(next);
    const query = buildFilterQuery(next);
    router.replace(`/data-analytics?tab=${activeTab}${query ? `&${query}` : ""}`, { scroll: false });
  }

  const filterQuery = buildFilterQuery(filters);
  return <DataAnalyticsScreen
    activeTab={activeTab}
    filterQuery={filterQuery}
    filters={user.role === "ADMIN" ? <AnalyticsFilterBar filters={filters} loadingUsers={loadingUsers} onApply={applyFilters} users={users} /> : undefined}
    state={previewState ? getDataAnalyticsMockState(previewState, activeTab) : state}
  />;
}

function AnalyticsFilterBar({ filters, loadingUsers, onApply, users }: { filters: AnalyticsFilters; loadingUsers: boolean; onApply: (filters: AnalyticsFilters) => void; users: UserDirectoryItem[] }) {
  const [formKey, setFormKey] = useState(0);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: keyof AnalyticsFilters) => String(data.get(key) || "").trim() || undefined;
    onApply({ startDate: value("startDate"), endDate: value("endDate"), producerId: value("producerId"), buyerId: value("buyerId"), lenderId: value("lenderId"), keeperId: value("keeperId") });
  }
  function clear() { setFormKey((key) => key + 1); onApply({}); }
  return <form key={formKey} onSubmit={submit} className="mx-4 mt-4 rounded-[8px] border border-[#e3e6ea] bg-white p-4 sm:mx-6 lg:mx-5">
    <div className="mb-3"><h2 className="text-[13px] font-semibold text-[#303034]">Admin analytics filters</h2><p className="mt-1 text-[10px] text-[#85858b]">Apply a date range or commercial party across the current analytics view.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <NativeField defaultValue={filters.startDate} label="Start date" name="startDate" type="date" />
      <NativeField defaultValue={filters.endDate} label="End date" name="endDate" type="date" />
      <PartySelect defaultValue={filters.producerId} label="Seller" name="producerId" role="PRODUCER" users={users} />
      <PartySelect defaultValue={filters.buyerId} label="Buyer" name="buyerId" role="BUYER" users={users} />
      <PartySelect defaultValue={filters.lenderId} label="Lender" name="lenderId" role="LENDER" users={users} />
      <PartySelect defaultValue={filters.keeperId} label="Warehouse keeper" name="keeperId" role="WAREHOUSE_KEEPER" users={users} />
    </div>
    <div className="mt-3 flex flex-wrap justify-end gap-2"><SecondaryButton onClick={clear}>Clear filters</SecondaryButton><PrimaryButton disabled={loadingUsers} type="submit">Apply filters</PrimaryButton></div>
  </form>;
}

function NativeField({ defaultValue, label, name, type }: { defaultValue?: string; label: string; name: string; type: string }) {
  return <label className="grid gap-1.5 text-[10px] font-semibold text-[#585961]">{label}<input className="h-10 min-w-0 rounded-[7px] border border-[#dedef2] bg-white px-3 text-[11px] font-normal outline-none focus:border-[#3971ad]" defaultValue={defaultValue} name={name} type={type} /></label>;
}

function PartySelect({ defaultValue, label, name, role, users }: { defaultValue?: string; label: string; name: string; role: string; users: UserDirectoryItem[] }) {
  return <label className="grid gap-1.5 text-[10px] font-semibold text-[#585961]">{label}<select className="h-10 min-w-0 rounded-[7px] border border-[#dedef2] bg-white px-2 text-[11px] font-normal outline-none focus:border-[#3971ad]" defaultValue={defaultValue || ""} name={name}><option value="">All</option>{users.filter((user) => user.role === role).map((user) => <option key={user.id} value={user.id}>{user.fullName || user.email}</option>)}</select></label>;
}

function buildFilterQuery(filters: AnalyticsFilters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  return query.toString();
}
