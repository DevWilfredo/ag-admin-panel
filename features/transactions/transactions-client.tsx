"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticatedUser } from "@/features/auth/auth-context";
import { createOrder } from "@/services/orders-service";
import { getErrorMessage } from "@/services/api-errors";
import { listUsers, type UserDirectoryItem } from "@/services/users-service";
import { hasCapability } from "@/services/authorization";
import {
  Field,
  Modal,
  Notice,
  PrimaryButton,
  SelectField,
} from "@/features/management/management-ui";
import { getTransactionsMockState } from "./mock-transactions";
import { loadTransactionsBackendState } from "./backend-adapter";
import { TransactionsScreen } from "./transactions-screen";
import type { TransactionTabKey, TransactionsDataState } from "./types";

export type OrderFilters = {
  orderNumber?: string;
  commodityType?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function TransactionsClient({
  previewState,
  selectedOrderId,
  selectedTransaction,
  tab,
  filters,
  openCreate = false,
}: {
  previewState?: string;
  selectedOrderId?: string;
  selectedTransaction?: string;
  tab: TransactionTabKey;
  filters: OrderFilters;
  openCreate?: boolean;
}) {
  const router = useRouter();
  const authenticatedUser = useAuthenticatedUser();
  const canCreateOrder = hasCapability(
    authenticatedUser?.role,
    "manage:orders",
  );
  const [state, setState] = useState<TransactionsDataState>({
    status: "loading",
  });
  const [modal, setModal] = useState(false),
    [saving, setSaving] = useState(false),
    [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<Record<string, UserDirectoryItem[]>>({
    PRODUCER: [],
    BUYER: [],
    LENDER: [],
    WAREHOUSE_KEEPER: [],
  });
  const [formError, setFormError] = useState<string>();

  const load = useCallback(() => {
    return loadTransactionsBackendState({
      selectedOrderId,
      selectedTransaction,
      tab,
      ...filters,
    });
  }, [filters, selectedOrderId, selectedTransaction, tab]);

  useEffect(() => {
    if (previewState) return;
    let mounted = true;
    void load().then((next) => {
      if (mounted) setState(next);
    });
    return () => {
      mounted = false;
    };
  }, [load, previewState]);

  useEffect(() => {
    if (openCreate && canCreateOrder) void openCreateModal();
  }, [openCreate, canCreateOrder]);

  async function openCreateModal() {
    setModal(true);
    setFormError(undefined);
    setLoadingUsers(true);
    try {
      const [producers, buyers, lenders, keepers] = await Promise.all([
        listUsers({ role: "PRODUCER", limit: 100 }),
        listUsers({ role: "BUYER", limit: 100 }),
        listUsers({ role: "LENDER", limit: 100 }),
        listUsers({ role: "WAREHOUSE_KEEPER", limit: 100 }),
      ]);
      setUsers({
        PRODUCER: producers,
        BUYER: buyers,
        LENDER: lenders,
        WAREHOUSE_KEEPER: keepers,
      });
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "The participant directory could not be loaded.",
        ),
      );
    } finally {
      setLoadingUsers(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) || "").trim();
    if (!get("producerId") || !get("buyerId")) {
      setFormError("Select a seller and buyer before creating the transaction.");
      return;
    }
    setSaving(true);
    setFormError(undefined);
    try {
      const response = await createOrder({
        commodityType: get("commodityType"),
        quantity: Number(get("quantity")),
        unit: get("unit") || undefined,
        lotId: get("lotId"),
        destinationCountry: get("destinationCountry"),
        producerId: get("producerId"),
        buyerId: get("buyerId"),
        lenderId: get("lenderId") || undefined,
        keeperId: get("keeperId") || undefined,
      });
      setModal(false);
      router.push(`/transactions?orderId=${response.order.id}`);
      router.refresh();
      setState(await load());
    } catch (error) {
      setFormError(getErrorMessage(error, "The order could not be created."));
    } finally {
      setSaving(false);
    }
  }

  const screenState = previewState
    ? getTransactionsMockState(previewState, tab)
    : state;
  return (
    <>
      <TransactionsScreen
        state={screenState}
        filters={filters}
        tab={tab}
        onCreateOrder={canCreateOrder ? () => void openCreateModal() : undefined}
      />
      {canCreateOrder && modal ? (
        <Modal
          title="Create transaction"
          description="Assign the commercial parties and initial trade information."
          onClose={() => setModal(false)}
        >
          {formError ? (
            <div className="mb-4">
              <Notice error message={formError} />
            </div>
          ) : null}
          {loadingUsers ? (
            <p className="py-10 text-center text-sm text-[#777]">
              Loading participant directory…
            </p>
          ) : (
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <Field
                name="commodityType"
                label="Commodity type"
                placeholder="e.g. Arabica coffee"
                required
              />
              <Field
                name="quantity"
                label="Quantity"
                type="number"
                placeholder="Enter quantity"
                required
              />
              <Field name="unit" label="Unit" placeholder="e.g. MT" />
              <Field
                name="lotId"
                label="Lot / batch ID"
                placeholder="Enter lot identifier"
                required
              />
              <Field
                name="destinationCountry"
                label="Destination country"
                placeholder="Enter destination country"
                required
              />
              <SelectField
                name="producerId"
                label="Seller"
                required
                placeholder="Select seller"
                options={toOptions(users.PRODUCER)}
              />
              <SelectField
                name="buyerId"
                label="Buyer"
                required
                placeholder="Select buyer"
                options={toOptions(users.BUYER)}
              />
              <SelectField
                name="lenderId"
                label="Lender"
                placeholder="Select lender (optional)"
                options={toOptions(users.LENDER)}
              />
              <SelectField
                name="keeperId"
                label="Warehouse keeper"
                placeholder="Select keeper (optional)"
                options={toOptions(users.WAREHOUSE_KEEPER)}
              />
              <div className="flex justify-end sm:col-span-2">
                <PrimaryButton type="submit" disabled={saving}>
                  {saving ? "Creating…" : "Create transaction"}
                </PrimaryButton>
              </div>
            </form>
          )}
        </Modal>
      ) : null}
    </>
  );
}

function toOptions(users: UserDirectoryItem[]) {
  return users.map((user) => ({
    value: user.id,
    label: `${user.fullName || user.email} — ${user.email}`,
  }));
}
