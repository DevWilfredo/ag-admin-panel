import { ProtectedRoute } from "@/features/auth/protected-route";
import { WarehousesClient } from "@/features/management/warehouses-client";
export default function WarehousesPage(){ return <ProtectedRoute><WarehousesClient /></ProtectedRoute>; }
