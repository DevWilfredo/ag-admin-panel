import type { TransactionTabKey } from "@/features/transactions/types";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { TransactionsClient } from "@/features/transactions/transactions-client";

type TransactionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;
  const previewState =
    typeof params?.state === "string" ? params.state : undefined;
  const requestedTab = parseTransactionsTab(
    typeof params?.tab === "string" ? params.tab : undefined,
  );
  const selectedOrderId =
    typeof params?.orderId === "string" ? params.orderId : undefined;
  const selectedTransaction =
    typeof params?.transaction === "string" ? params.transaction : undefined;

  return (
    <ProtectedRoute capability="view:transactions">
      <TransactionsClient
        previewState={previewState}
        selectedOrderId={selectedOrderId}
        selectedTransaction={selectedTransaction}
        tab={requestedTab}
        filters={{
          orderNumber: value(params?.orderNumber),
          commodityType: value(params?.commodityType),
          dateFrom: value(params?.dateFrom),
          dateTo: value(params?.dateTo),
        }}
      />
    </ProtectedRoute>
  );
}

function value(input: string | string[] | undefined) {
  return typeof input === "string" && input ? input : undefined;
}

function parseTransactionsTab(tab?: string): TransactionTabKey {
  if (tab === "active" || tab === "closed" || tab === "alerts") {
    return tab;
  }

  return "all";
}
