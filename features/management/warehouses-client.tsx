"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuthenticatedUser } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/services/api-errors";
import { hasCapability } from "@/services/authorization";
import {
  createWarehouse,
  deleteWarehouse,
  listWarehouses,
  updateWarehouse,
  type WarehouseDto,
} from "@/services/warehouses-service";
import {
  EmptyTable,
  Field,
  Modal,
  Notice,
  PageHeading,
  PrimaryButton,
  SecondaryButton,
  formatValue,
  managementHeader,
} from "./management-ui";

export function WarehousesClient() {
  const canManage = hasCapability(
    useAuthenticatedUser()?.role,
    "manage:warehouses",
  );
  const [rows, setRows] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<WarehouseDto>();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [expandedId, setExpandedId] = useState<string>();
  const [query, setQuery] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setRows(await listWarehouses());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const payload = {
        name: value(data, "name"),
        location: value(data, "location"),
        latitude: optionalNumber(data, "latitude"),
        longitude: optionalNumber(data, "longitude"),
      };
      if (modal === "edit" && selected)
        await updateWarehouse(selected.id, payload);
      else await createWarehouse(payload);
      setModal(null);
      setNotice(modal === "edit" ? "Warehouse updated." : "Warehouse created.");
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  async function remove(row: WarehouseDto) {
    if (!window.confirm(`Delete ${row.name}? This action cannot be undone.`))
      return;
    try {
      await deleteWarehouse(row.id);
      setNotice("Warehouse deleted.");
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  return (
    <AppShell activeNav="warehouses" header={managementHeader("Warehouses")}>
      <PageHeading
        title="Warehouses"
        description="Manage storage locations and their assigned inventory."
        action={canManage ? (
          <PrimaryButton
            onClick={() => {
              setSelected(undefined);
              setModal("create");
            }}
          >
            New warehouse
          </PrimaryButton>
        ) : undefined}
      />
      {notice ? <Notice message={notice} /> : null}
      <label className="grid max-w-[520px] gap-1.5 text-[11px] font-semibold text-[#585961]">Search warehouses
        <input className="h-10 rounded-[7px] border border-[#dedef2] px-3 text-[12px] outline-none focus:border-[#3971ad]" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or location" />
      </label>
      {error && rows.length ? <Notice error message={error} /> : null}
      {!rows.length ? (
        <EmptyTable
          loading={loading}
          error={error}
          label="warehouses"
          onRetry={load}
        />
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead className="bg-[#f8f9fb] text-[10px] uppercase tracking-wider text-[#85858d]">
                <tr>
                  <th className="px-5 py-3">Warehouse</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Coordinates</th>
                  <th className="px-5 py-3">Inventory</th>
                  {canManage ? (
                    <th className="px-5 py-3 text-right">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.filter((row) => !query || [row.name, row.location].some((value) => value?.toLowerCase().includes(query.toLowerCase()))).map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[#ececee] text-[12px] text-[#515159]"
                  >
                    <td className="px-5 py-4 font-semibold text-[#29292e]">
                      {row.name}
                    </td>
                    <td className="px-5 py-4">{formatValue(row.location)}</td>
                    <td className="px-5 py-4">
                      {row.latitude ?? "—"}, {row.longitude ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <button className="font-semibold text-[#15447c] hover:underline" type="button" onClick={() => setExpandedId((id) => id === row.id ? undefined : row.id)}>
                        {row._count?.inventories ?? row.inventories?.length ?? 0} · {expandedId === row.id ? "Hide" : "View"}
                      </button>
                      {expandedId === row.id ? <div className="mt-2 grid gap-1 rounded-md bg-[#f7f9fb] p-2 text-[11px]">
                        {row.inventories?.length ? row.inventories.map((inventory, index) => <span key={`${row.id}-${index}`}>{inventory.lotId || "Unidentified lot"} · {formatValue(inventory.quantity)} · {inventory.custodyStatus?.replaceAll("_", " ") || "No custody status"}</span>) : <span>Inventory details are not included in this API response.</span>}
                      </div> : null}
                    </td>
                    {canManage ? (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <SecondaryButton
                            onClick={() => {
                              setSelected(row);
                              setModal("edit");
                            }}
                          >
                            Edit
                          </SecondaryButton>
                          <SecondaryButton
                            danger
                            onClick={() => void remove(row)}
                          >
                            Delete
                          </SecondaryButton>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {canManage && modal ? (
        <Modal
          title={modal === "edit" ? "Edit warehouse" : "New warehouse"}
          description="Add the warehouse location and optional map coordinates."
          onClose={() => setModal(null)}
        >
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field
              name="name"
              label="Name"
              required
              defaultValue={selected?.name}
            />
            <Field
              name="location"
              label="Location"
              required
              defaultValue={selected?.location}
            />
            <Field
              name="latitude"
              label="Latitude"
              type="number"
              step="any"
              defaultValue={selected?.latitude ?? undefined}
            />
            <Field
              name="longitude"
              label="Longitude"
              type="number"
              step="any"
              defaultValue={selected?.longitude ?? undefined}
            />
            <div className="sm:col-span-2 flex justify-end gap-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save warehouse"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}
function value(data: FormData, key: string) {
  return String(data.get(key) || "").trim();
}
function optionalNumber(data: FormData, key: string) {
  const v = value(data, key);
  return v ? Number(v) : undefined;
}
