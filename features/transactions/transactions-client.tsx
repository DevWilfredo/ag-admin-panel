"use client";

import { useEffect, useState } from "react";
import { getTransactionsMockState } from "./mock-transactions";
import { loadTransactionsBackendState } from "./backend-adapter";
import { TransactionsScreen } from "./transactions-screen";
import type { TransactionTabKey, TransactionsDataState } from "./types";

export function TransactionsClient({
  previewState,
  selectedOrderId,
  selectedTransaction,
  tab,
}: {
  previewState?: string;
  selectedOrderId?: string;
  selectedTransaction?: string;
  tab: TransactionTabKey;
}) {
  const [state, setState] = useState<TransactionsDataState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;

    if (previewState) {
      return;
    }

    async function loadTransactions() {
      const nextState = await loadTransactionsBackendState({
        selectedOrderId,
        selectedTransaction,
        tab,
      });

      if (mounted) {
        setState(nextState);
      }
    }

    void loadTransactions();

    return () => {
      mounted = false;
    };
  }, [previewState, selectedOrderId, selectedTransaction, tab]);

  if (previewState) {
    return <TransactionsScreen state={getTransactionsMockState(previewState, tab)} />;
  }

  return <TransactionsScreen state={state} />;
}
