"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuthenticatedUser } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/services/api-errors";
import { hasCapability } from "@/services/authorization";
import {
  deleteDocument,
  documentTypes,
  getOrderDocuments,
  updateDocumentStatus,
  uploadDocument,
  type DocumentDto,
} from "@/services/documents-service";
import { listOrders, type OrderListItemDto } from "@/services/orders-service";
import {
  EmptyTable,
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
export function DocumentsClient() {
  const role = useAuthenticatedUser()?.role;
  const canUpload = hasCapability(role, "upload:documents");
  const canUpdateStatus = hasCapability(role, "manage:document-status");
  const canDelete = hasCapability(role, "delete:documents");
  const [orders, setOrders] = useState<OrderListItemDto[]>([]),
    [orderId, setOrderId] = useState(""),
    [rows, setRows] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState<string>(),
    [notice, setNotice] = useState<string>(),
    [modal, setModal] = useState<"upload" | "status" | null>(null),
    [selected, setSelected] = useState<DocumentDto>();
  const loadOrders = useCallback(async () => {
    try {
      const r = await listOrders({ page: 1, limit: 100 });
      setOrders(r.orders);
      if (r.orders[0]) setOrderId((x) => x || r.orders[0].id);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadOrders(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);
  const loadDocs = useCallback(async () => {
    if (!orderId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await getOrderDocuments(orderId));
      setError(undefined);
    } catch (e) {
      setError(getErrorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadDocs(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDocs]);
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget),
      f = d.get("file");
    if (!(f instanceof File)) return;
    setSaving(true);
    try {
      await uploadDocument({
        orderId,
        type: v(d, "type") as (typeof documentTypes)[number],
        file: f,
        holderNote: v(d, "holderNote") || undefined,
      });
      setModal(null);
      setNotice("Document uploaded.");
      await loadDocs();
    } catch (x) {
      setError(getErrorMessage(x));
    } finally {
      setSaving(false);
    }
  }
  async function status(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const d = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await updateDocumentStatus(selected.id, {
        status: v(d, "status") as "UPLOADED" | "ENDORSED" | "RELEASED",
        holderNote: v(d, "holderNote") || undefined,
      });
      setModal(null);
      setNotice("Document status updated.");
      await loadDocs();
    } catch (x) {
      setError(getErrorMessage(x));
    } finally {
      setSaving(false);
    }
  }
  async function remove(row: DocumentDto) {
    if (!window.confirm(`Delete ${row.type.replaceAll("_", " ")}?`)) return;
    try {
      await deleteDocument(row.id);
      setNotice("Document deleted.");
      await loadDocs();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  return (
    <AppShell activeNav="documents" header={managementHeader("Documents")}>
      <PageHeading
        title="Documents"
        description="Review and control trade documentation by order."
        action={canUpload ? (
          <PrimaryButton onClick={() => setModal("upload")} disabled={!orderId}>
            Upload document
          </PrimaryButton>
        ) : undefined}
      />
      <div className="rounded-[8px] border border-[#e5e5e8] bg-white p-4">
        <div className="max-w-[520px]">
          <SelectField label="Trade order" value={orderId} onChange={setOrderId} placeholder="Select an order" options={orders.map((order) => ({ value: order.id, label: `${order.orderNumber} — ${order.commodityType}` }))} />
        </div>
      </div>
      {notice ? <Notice message={notice} /> : null}
      {error && rows.length ? <Notice error message={error} /> : null}
      {!rows.length ? (
        <EmptyTable
          loading={loading}
          error={error}
          label="documents for this order"
        />
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-[#f8f9fb] text-[10px] uppercase tracking-wider text-[#85858d]">
              <tr>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Uploaded by</th>
                <th className="px-5 py-3">Holder note</th>
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
                    {row.type.replaceAll("_", " ")}
                  </td>
                  <td className="px-5 py-4">{row.status}</td>
                  <td className="px-5 py-4">
                    {formatValue(row.uploadedBy?.fullName)}
                  </td>
                  <td className="px-5 py-4">{formatValue(row.holderNote)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {row.fileUrl ? (
                        <a
                          href={row.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center rounded-[5px] border border-[#dfe3e8] px-3 text-[11px] font-semibold text-[#315f91]"
                        >
                          View
                        </a>
                      ) : null}
                      {canUpdateStatus ? <SecondaryButton
                        onClick={() => {
                          setSelected(row);
                          setModal("status");
                        }}
                      >
                        Update
                      </SecondaryButton> : null}
                      {canDelete ? <SecondaryButton danger onClick={() => void remove(row)}>
                        Delete
                      </SecondaryButton> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {canUpload && modal === "upload" ? (
        <Modal title="Upload trade document" onClose={() => setModal(null)}>
          <form onSubmit={upload} className="grid gap-4 sm:grid-cols-2">
            <SelectField
              name="type"
              label="Document type"
              required
              options={documentTypes.map((x) => ({
                value: x,
                label: x.replaceAll("_", " "),
              }))}
            />
            <Field name="holderNote" label="Holder note" />
            <div className="sm:col-span-2">
              <Field
                name="file"
                label="File"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                required
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Uploading…" : "Upload document"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      ) : null}
      {canUpdateStatus && modal === "status" && selected ? (
        <Modal title="Update document status" onClose={() => setModal(null)}>
          <form onSubmit={status} className="grid gap-4">
            <SelectField
              name="status"
              label="Status"
              required
              defaultValue={selected.status}
              options={["UPLOADED", "ENDORSED", "RELEASED"].map((x) => ({
                value: x,
                label: x,
              }))}
            />
            <Field
              name="holderNote"
              label="Holder note"
              defaultValue={selected.holderNote || ""}
            />
            <div className="flex justify-end">
              <PrimaryButton type="submit" disabled={saving}>
                Save status
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}
function v(d: FormData, k: string) {
  return String(d.get(k) || "").trim();
}
