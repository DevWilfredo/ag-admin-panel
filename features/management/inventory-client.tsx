"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { getErrorMessage } from "@/services/api-errors";
import {
  createInventory,
  issueWarehouseReceipt,
  listInventory,
  updateInventoryCustody,
  uploadInventoryPhotos,
  type InventoryDto,
} from "@/services/inventory-service";
import { listOrders, type OrderListItemDto } from "@/services/orders-service";
import {
  listWarehouses,
  type WarehouseDto,
} from "@/services/warehouses-service";
import {
  EmptyTable,
  DateField,
  Field,
  Modal,
  Notice,
  PageHeading,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  formatValue,
  managementHeader,
} from "./management-ui";

export function InventoryClient() {
  const [rows, setRows] = useState<InventoryDto[]>([]),
    [orders, setOrders] = useState<OrderListItemDto[]>([]),
    [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>(),
    [notice, setNotice] = useState<string>();
  const [modal, setModal] = useState<"create" | "manage" | null>(null),
    [selected, setSelected] = useState<InventoryDto>();
  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [inventory, orderData, warehouseData] = await Promise.all([
        listInventory(),
        listOrders({ limit: 100, page: 1 }),
        listWarehouses(),
      ]);
      setRows(inventory);
      setOrders(orderData.orders);
      setWarehouses(warehouseData);
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
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await createInventory({
        orderId: v(d, "orderId"),
        warehouseId: v(d, "warehouseId"),
        commodityType: v(d, "commodityType"),
        quantity: Number(v(d, "quantity")),
        unit: v(d, "unit") || undefined,
        lotId: v(d, "lotId"),
        dateReceived: v(d, "dateReceived") || undefined,
      });
      setModal(null);
      setNotice("Inventory intake recorded.");
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  async function manage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const d = new FormData(event.currentTarget),
      action = v(d, "action");
    setSaving(true);
    try {
      if (action === "receipt")
        await issueWarehouseReceipt(selected.id, {
          quantityConfirmed: Number(v(d, "quantityConfirmed")),
        });
      if (action === "custody")
        await updateInventoryCustody(selected.id, {
          custodyStatus: v(d, "custodyStatus") as
            "IN_CUSTODY" | "RELEASED" | "TRANSFERRED",
        });
      if (action === "photos") {
        const photos = d
          .getAll("photos")
          .filter((x): x is File => x instanceof File && !!x.name);
        await uploadInventoryPhotos(selected.id, photos);
      }
      setModal(null);
      setNotice("Inventory updated.");
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <AppShell activeNav="inventory" header={managementHeader("Inventory")}>
      <PageHeading
        title="Inventory"
        description="Track commodity intake, custody, warehouse receipts and evidence."
        action={
          <PrimaryButton onClick={() => setModal("create")}>
            Record intake
          </PrimaryButton>
        }
      />
      {notice ? <Notice message={notice} /> : null}
      {error && rows.length ? <Notice error message={error} /> : null}
      {!rows.length ? (
        <EmptyTable loading={loading} error={error} label="inventory records" onRetry={load} />
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#f8f9fb] text-[10px] uppercase tracking-wider text-[#85858d]">
                <tr>
                  <th className="px-5 py-3">Lot</th>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Custody</th>
                  <th className="px-5 py-3">Receipt</th>
                  <th className="px-5 py-3">Photos</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[#ececee] text-[12px] text-[#55555c]"
                  >
                    <td className="px-5 py-4 font-semibold text-[#29292e]">
                      {formatValue(row.lotId)}
                    </td>
                    <td className="px-5 py-4">
                      {formatValue(row.order?.orderNumber)}
                    </td>
                    <td className="px-5 py-4">
                      {formatValue(row.quantity)} {row.unit}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#eef4fa] px-2 py-1 text-[10px] font-semibold text-[#315f91]">
                        {row.custodyStatus.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {formatValue(row.receipt?.receiptNumber)}
                    </td>
                    <td className="px-5 py-4">{row.photoUrls?.length ?? 0}</td>
                    <td className="px-5 py-4 text-right">
                      <SecondaryButton
                        onClick={() => {
                          setSelected(row);
                          setModal("manage");
                        }}
                      >
                        Manage
                      </SecondaryButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {modal === "create" ? (
        <Modal title="Record inventory intake" onClose={() => setModal(null)}>
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <SelectField
              name="orderId"
              label="Order"
              required
              options={orders.map((x) => ({
                value: x.id,
                label: `${x.orderNumber} — ${x.commodityType || "Commodity"}`,
              }))}
            />
            <SelectField
              name="warehouseId"
              label="Warehouse"
              required
              options={warehouses.map((x) => ({ value: x.id, label: x.name }))}
            />
            <Field name="commodityType" label="Commodity type" required />
            <Field name="quantity" label="Quantity" type="number" required />
            <Field name="unit" label="Unit" />
            <Field name="lotId" label="Lot / batch ID" required />
            <DateField name="dateReceived" label="Date received" placeholder="Select received date" />
            <div className="sm:col-span-2 flex justify-end">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save intake"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      ) : null}
      {modal === "manage" && selected ? (
        <Modal
          title={`Manage lot ${selected.lotId || ""}`}
          onClose={() => setModal(null)}
        >
          <div className="grid gap-5">
            <form onSubmit={manage} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="action" value="custody" />
              <SelectField
                name="custodyStatus"
                label="Custody status"
                required
                defaultValue={selected.custodyStatus}
                options={["IN_CUSTODY", "RELEASED", "TRANSFERRED"].map((x) => ({
                  value: x,
                  label: x.replaceAll("_", " "),
                }))}
              />
              <div className="flex items-end">
                <PrimaryButton type="submit" disabled={saving}>
                  Update custody
                </PrimaryButton>
              </div>
            </form>
            <form onSubmit={manage} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="action" value="receipt" />
              <Field
                name="quantityConfirmed"
                label="Confirmed quantity"
                type="number"
                required
              />
              <div className="flex items-end">
                <PrimaryButton type="submit" disabled={saving}>
                  Issue receipt
                </PrimaryButton>
              </div>
            </form>
            <form onSubmit={manage} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="action" value="photos" />
              <Field
                name="photos"
                label="Goods photos"
                type="file"
                accept="image/*"
                multiple
                required
              />
              <div className="flex items-end">
                <PrimaryButton type="submit" disabled={saving}>
                  Upload photos
                </PrimaryButton>
              </div>
            </form>
          </div>
        </Modal>
      ) : null}
    </AppShell>
  );
}
function v(d: FormData, k: string) {
  return String(d.get(k) || "").trim();
}
