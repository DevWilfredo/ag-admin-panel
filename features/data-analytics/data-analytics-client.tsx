"use client";

import { useEffect, useState } from "react";
import { getDataAnalyticsMockState } from "./mock-data-analytics";
import { loadAnalyticsBackendState } from "./backend-adapter";
import { DataAnalyticsScreen } from "./data-analytics-screen";
import type { AnalyticsTabKey, DataAnalyticsState } from "./types";

export function DataAnalyticsClient({ activeTab, previewState }: { activeTab: AnalyticsTabKey; previewState?: string }) {
  const [state, setState] = useState<DataAnalyticsState>({ status: "loading" });
  useEffect(() => {
    let mounted = true;
    if (!previewState) void loadAnalyticsBackendState(activeTab).then((next) => { if (mounted) setState(next); });
    return () => { mounted = false; };
  }, [activeTab, previewState]);
  return <DataAnalyticsScreen activeTab={activeTab} state={previewState ? getDataAnalyticsMockState(previewState, activeTab) : state} />;
}
