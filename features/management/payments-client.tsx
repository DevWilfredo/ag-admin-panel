"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuthenticatedUser } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/services/api-errors";
import { ApiError } from "@/services/api-errors";
import { hasCapability } from "@/services/authorization";
import { listOrders, type OrderListItemDto } from "@/services/orders-service";
import {
  createPayment,
  distributePayment,
  getLenderPaymentHistory,
  getPaymentByOrder,
  markPaymentReceived,
  markPaymentSent,
  type PaymentDto,
  type LenderPaymentHistoryDto,
} from "@/services/payments-service";
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
type Action = "create" | "sent" | "received" | "distribute";
export function PaymentsClient() {
  const role = useAuthenticatedUser()?.role;
  const canManage = hasCapability(role, "manage:payments");
  const canViewLenderHistory = role === "LENDER" || role === "ADMIN";
  const [orders, setOrders] = useState<OrderListItemDto[]>([]),
    [orderId, setOrderId] = useState(""),
    [payment, setPayment] = useState<PaymentDto>(),
    [history, setHistory] = useState<LenderPaymentHistoryDto>();
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState<string>(),
    [notice, setNotice] = useState<string>(),
    [modal, setModal] = useState<Action | null>(null);
  const boot = useCallback(async () => {
    try {
      const [o, h] = await Promise.all([
        listOrders({ page: 1, limit: 100 }),
        canViewLenderHistory
          ? getLenderPaymentHistory().catch(() => undefined)
          : Promise.resolve(undefined),
      ]);
      setOrders(o.orders);
      setHistory(h);
      if (o.orders[0]) setOrderId((x) => x || o.orders[0].id);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, [canViewLenderHistory]);
  useEffect(() => {
    const timer = window.setTimeout(() => void boot(), 0);
    return () => window.clearTimeout(timer);
  }, [boot]);
  const load = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPayment(await getPaymentByOrder(orderId));
      setError(undefined);
    } catch (e) {
      setPayment(undefined);
      setError(e instanceof ApiError && e.status === 404 ? undefined : getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [orderId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function act(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    const d = new FormData(e.currentTarget);
    setSaving(true);
    try {
      if (modal === "create")
        await createPayment({
          orderId,
          amount: n(d, "amount"),
          currency: v(d, "currency") || "USD",
          escrowBank: v(d, "escrowBank") || undefined,
          loanAmount: on(d, "loanAmount"),
          interestAmount: on(d, "interestAmount"),
        });
      if (modal === "sent")
        await markPaymentSent(orderId, {
          escrowBank: v(d, "escrowBank") || undefined,
          notes: v(d, "notes") || undefined,
        });
      if (modal === "received")
        await markPaymentReceived(orderId, {
          notes: v(d, "notes") || undefined,
        });
      if (modal === "distribute")
        await distributePayment(orderId, {
          amountPaid: n(d, "amountPaid"),
          notes: v(d, "notes") || undefined,
        });
      setModal(null);
      setNotice("Payment record updated.");
      await load();
    } catch (x) {
      setError(getErrorMessage(x));
    } finally {
      setSaving(false);
    }
  }
  const selectedOrder = orders.find((x) => x.id === orderId);
  return (
    <AppShell activeNav="payments" header={managementHeader("Payments")}>
      <PageHeading
        title="Payments & Escrow"
        description="Control settlement stages and lender repayment by transaction."
      />
      <div className="rounded-[8px] border border-[#e5e5e8] bg-white p-4">
        <div className="max-w-[520px]">
          <SelectField label="Transaction" value={orderId} onChange={setOrderId} placeholder="Select a transaction" options={orders.map((order) => ({ value: order.id, label: `${order.orderNumber} — ${order.commodityType}` }))} />
        </div>
      </div>
      {notice ? <Notice message={notice} /> : null}
      {!payment ? (
        <EmptyTable
          loading={loading}
          error={error}
          label="payment record for this order"
        />
      ) : (
        <section className="rounded-[8px] border border-[#e4e4e7] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#ececee] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#8c8c93]">
                {selectedOrder?.orderNumber}
              </p>
              <h2 className="mt-1 text-[20px] font-bold text-[#29292e]">
                {payment.currency} {Number(payment.amount).toLocaleString()}
              </h2>
            </div>
            <span className="w-fit rounded-full bg-[#edf4fa] px-3 py-1.5 text-[11px] font-semibold text-[#315f91]">
              {payment.status.replaceAll("_", " ")}
            </span>
          </div>
          <div className="grid sm:grid-cols-3">
            <Metric
              label="Escrow bank"
              value={formatValue(payment.escrowBank)}
            />
            <Metric
              label="Loan principal"
              value={formatValue(payment.loanAmount)}
            />
            <Metric
              label="Interest"
              value={formatValue(payment.interestAmount)}
            />
            <Metric
              label="Sent to escrow"
              value={formatValue(payment.sentToEscrowAt)}
            />
            <Metric label="Received" value={formatValue(payment.receivedAt)} />
            <Metric
              label="Distributed"
              value={formatValue(payment.distributedAt)}
            />
          </div>
          {canManage ? <div className="flex flex-wrap items-center gap-2 border-t border-[#ececee] p-4">
            {!payment.sentToEscrowAt ? <SecondaryButton onClick={() => setModal("sent")}>Mark sent</SecondaryButton> : null}
            {payment.sentToEscrowAt && !payment.receivedAt ? <SecondaryButton onClick={() => setModal("received")}>Mark received</SecondaryButton> : null}
            {payment.receivedAt && payment.status !== "SETTLED" && !payment.distributedAt ? <PrimaryButton onClick={() => setModal("distribute")}>Distribute funds</PrimaryButton> : null}
            {payment.status === "SETTLED" || payment.distributedAt ? <span className="rounded-full bg-[#e9f7ed] px-3 py-2 text-[12px] font-semibold text-[#087d2f]">Funds distributed</span> : null}
          </div> : null}
        </section>
      )}{" "}
      {canManage && !payment && !loading && orderId ? (
        <div className="flex flex-col items-start gap-2 rounded-[8px] border border-[#e4e4e7] bg-white p-5">
          <p className="text-[12px] text-[#77777d]">No payment record exists for this transaction yet.</p>
          <PrimaryButton onClick={() => setModal("create")}>
            Create payment record
          </PrimaryButton>
        </div>
      ) : null}
      {history ? (
        <section className="rounded-[8px] border border-[#e4e4e7] bg-white p-5">
          <h2 className="text-[15px] font-bold text-[#303035]">
            Lender portfolio
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric
              label="Total loaned"
              value={formatValue(history.summary.totalLoaned)}
            />
            <Metric
              label="Total interest"
              value={formatValue(history.summary.totalInterest)}
            />
            <Metric label="Settled" value={history.summary.totalSettled} />
            <Metric label="Pending" value={history.summary.totalPending} />
          </div>
        </section>
      ) : null}
      {canManage && modal ? (
        <Modal title={titles[modal]} onClose={() => setModal(null)}>
          <form onSubmit={act} className="grid gap-4 sm:grid-cols-2">
            {modal === "create" ? (
              <>
                <Field
                  name="amount"
                  label="Transaction amount"
                  type="number"
                  required
                />
                <Field name="currency" label="Currency" defaultValue="USD" />
                <Field name="escrowBank" label="Escrow bank" />
                <Field name="loanAmount" label="Loan principal" type="number" />
                <Field name="interestAmount" label="Interest" type="number" />
              </>
            ) : null}
            {modal === "sent" ? (
              <>
                <Field name="escrowBank" label="Escrow bank" />
                <Field name="notes" label="Notes" />
              </>
            ) : null}
            {modal === "received" ? <Field name="notes" label="Notes" /> : null}
            {modal === "distribute" ? (
              <>
                <Field
                  name="amountPaid"
                  label="Amount paid"
                  type="number"
                  required
                />
                <Field name="notes" label="Notes" />
              </>
            ) : null}
            <div className="sm:col-span-2 flex justify-end">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Confirm"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}
const titles: Record<Action, string> = {
  create: "Create payment record",
  sent: "Mark funds sent to escrow",
  received: "Confirm funds received",
  distribute: "Distribute funds",
};
function Metric({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="border-b border-r border-[#ececee] p-4">
      <p className="text-[10px] uppercase tracking-wider text-[#929299]">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-[#3b3b41]">
        {String(value)}
      </p>
    </div>
  );
}
function v(d: FormData, k: string) {
  return String(d.get(k) || "").trim();
}
function n(d: FormData, k: string) {
  return Number(v(d, k));
}
function on(d: FormData, k: string) {
  const x = v(d, k);
  return x ? Number(x) : undefined;
}
