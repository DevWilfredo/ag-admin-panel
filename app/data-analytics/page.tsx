import { DataAnalyticsClient } from "@/features/data-analytics/data-analytics-client";
import type { AnalyticsTabKey } from "@/features/data-analytics/types";
import { ProtectedRoute } from "@/features/auth/protected-route";

type DataAnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DataAnalyticsPage({ searchParams }: DataAnalyticsPageProps) {
  const params = await searchParams;
  const previewState = typeof params?.state === "string" ? params.state : undefined;
  const requestedTab = parseAnalyticsTab(typeof params?.tab === "string" ? params.tab : undefined);
  return (
    <ProtectedRoute capability="view:analytics">
      <DataAnalyticsClient activeTab={requestedTab} previewState={previewState} />
    </ProtectedRoute>
  );
}

function parseAnalyticsTab(tab?: string): AnalyticsTabKey {
  if (tab === "flow" || tab === "market") {
    return tab;
  }

  return "operations";
}
