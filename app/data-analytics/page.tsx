import { DataAnalyticsClient } from "@/features/data-analytics/data-analytics-client";
import type { AnalyticsTabKey } from "@/features/data-analytics/types";
import { ProtectedRoute } from "@/features/auth/protected-route";
import type { AnalyticsFilters } from "@/services/analytics-service";

type DataAnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DataAnalyticsPage({ searchParams }: DataAnalyticsPageProps) {
  const params = await searchParams;
  const previewState = typeof params?.state === "string" ? params.state : undefined;
  const requestedTab = parseAnalyticsTab(typeof params?.tab === "string" ? params.tab : undefined);
  const filters = parseAnalyticsFilters(params);
  return (
    <ProtectedRoute capability="view:analytics">
      <DataAnalyticsClient activeTab={requestedTab} initialFilters={filters} previewState={previewState} />
    </ProtectedRoute>
  );
}

function parseAnalyticsFilters(params?: Record<string, string | string[] | undefined>): AnalyticsFilters {
  const value = (key: keyof AnalyticsFilters) => {
    const raw = params?.[key];
    return typeof raw === "string" ? raw : undefined;
  };
  return {
    startDate: value("startDate"), endDate: value("endDate"), producerId: value("producerId"),
    buyerId: value("buyerId"), lenderId: value("lenderId"), keeperId: value("keeperId"),
  };
}

function parseAnalyticsTab(tab?: string): AnalyticsTabKey {
  if (tab === "flow" || tab === "market") {
    return tab;
  }

  return "operations";
}
