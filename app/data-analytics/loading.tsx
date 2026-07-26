import { DataAnalyticsScreen } from "@/features/data-analytics/data-analytics-screen";

export default function DataAnalyticsLoading() {
  return <DataAnalyticsScreen activeTab="operations" state={{ status: "loading" }} />;
}
