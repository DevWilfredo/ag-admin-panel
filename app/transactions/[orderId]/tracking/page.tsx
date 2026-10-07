import { ProtectedRoute } from "@/features/auth/protected-route";
import { VesselTrackingDetailClient } from "@/features/transactions/vessel-tracking-detail-client";

export default async function VesselTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return (
    <ProtectedRoute capability="view:transactions">
      <VesselTrackingDetailClient orderId={orderId} />
    </ProtectedRoute>
  );
}
