import { DashboardScreen } from "@/features/dashboard/dashboard-screen";

export default function DashboardLoading() {
  return <DashboardScreen state={{ status: "loading" }} />;
}
