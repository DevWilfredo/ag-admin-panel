import { DataAnalyticsScreen } from "@/features/data-analytics/data-analytics-screen";
import { getDataAnalyticsMockState } from "@/features/data-analytics/mock-data-analytics";
import type { AnalyticsTabKey } from "@/features/data-analytics/types";
import { ProtectedRoute } from "@/features/auth/protected-route";

type DataAnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DataAnalyticsPage({ searchParams }: DataAnalyticsPageProps) {
  const params = await searchParams;
  const previewState = typeof params?.state === "string" ? params.state : undefined;
  const requestedTab = parseAnalyticsTab(typeof params?.tab === "string" ? params.tab : undefined);
  const dataAnalyticsState = getDataAnalyticsMockState(previewState, requestedTab);

  return (
    <ProtectedRoute>
      <DataAnalyticsScreen activeTab={requestedTab} state={dataAnalyticsState} />
    </ProtectedRoute>
  );
}

function parseAnalyticsTab(tab?: string): AnalyticsTabKey {
  if (tab === "flow" || tab === "market") {
    return tab;
  }

  return "operations";
}
