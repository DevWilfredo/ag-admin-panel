"use client";

import { useEffect, useState } from "react";
import { useAuthenticatedUser } from "@/features/auth/auth-context";
import { loadDashboardBackendState } from "./backend-adapter";
import { DashboardScreen } from "./dashboard-screen";
import { getDashboardMockState } from "./mock-dashboard";
import type { DashboardDataState } from "./types";

export function DashboardClient({ previewState }: { previewState?: string }) {
  const authenticatedUser = useAuthenticatedUser();
  const [state, setState] = useState<DashboardDataState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;

    if (previewState) {
      return;
    }

    async function loadDashboard() {
      if (!authenticatedUser) {
        return;
      }
      const nextState = await loadDashboardBackendState(authenticatedUser);

      if (mounted) {
        setState(nextState);
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [authenticatedUser, previewState]);

  if (previewState) {
    return <DashboardScreen state={getDashboardMockState(previewState)} />;
  }

  return <DashboardScreen state={state} />;
}
