"use client";

import { TransactionsScreen } from "@/features/transactions/transactions-screen";

export default function TransactionsLoading() {
  return (
    <TransactionsScreen
      state={{ status: "loading" }}
      filters={{}}
      tab="all"
      onCreateOrder={() => undefined}
    />
  );
}
