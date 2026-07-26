import { ProtectedRoute } from "@/features/auth/protected-route";
import { DashboardClient } from "@/features/dashboard/dashboard-client";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const previewState = typeof params?.state === "string" ? params.state : undefined;

  return (
    <ProtectedRoute>
      <DashboardClient previewState={previewState} />
    </ProtectedRoute>
  );
}
