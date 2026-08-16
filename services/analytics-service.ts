import { apiRequest } from "./api-client";

export type OperationsSummaryDto = {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalWarehouses: number;
};
export type CycleDurationDto = { overall: number | null; byCommodity: Record<string, unknown>[] };
export type ShipmentStatusDto = { total: number; distribution: { label: string; count: number; percentage: number }[] };
export type ExecutionEfficiencyDto = { efficiency: { stage: string; avgHours: number | null; sampleSize: number }[] };
export type CapitalFlowDto = {
  summary: { totalDeployed: number; totalRecovered: number; outstandingCapital: number };
  transactions: Record<string, unknown>[];
};
export type GeographicFlowDto = { routes: { origin: string; destination: string; shipmentCount: number; totalQuantity: number }[] };
export type PaymentTimingDto = { totalTransactions: number; distribution: { range: string; count: number }[]; details: Record<string, unknown>[] };
export type VolumeOverTimeDto = { volumeByMonth: { month: string; orderCount: number; totalQuantityKg: number }[] };
export type CommodityExposureDto = { exposure: { commodityType: string; totalQuantity: number; orderCount: number; totalValue: number }[] };
export type OperationsTimelineDto = {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  timeline: { stage: string; startedAt: string; endedAt: string | null; durationHours: number | null; actor?: { fullName: string; role: string }; notes?: string }[];
};

const get = <T>(path: string) => apiRequest<T>(path, { auth: true });

export const getOperationsSummary = () => get<OperationsSummaryDto>("/analytics/operations/summary");
export const getOperationsTimeline = (orderId: string) => get<OperationsTimelineDto>(`/analytics/operations/timeline/${orderId}`);
export const getCycleDuration = () => get<CycleDurationDto>("/analytics/operations/cycle-duration");
export const getShipmentStatus = () => get<ShipmentStatusDto>("/analytics/operations/shipment-status");
export const getExecutionEfficiency = () => get<ExecutionEfficiencyDto>("/analytics/operations/execution-efficiency");
export const getCapitalFlow = () => get<CapitalFlowDto>("/analytics/flow/capital");
export const getGeographicFlow = () => get<GeographicFlowDto>("/analytics/flow/geographic");
export const getPaymentTiming = () => get<PaymentTimingDto>("/analytics/flow/payment-timing");
export const getVolumeOverTime = () => get<VolumeOverTimeDto>("/analytics/flow/volume-over-time");
export const getCommodityExposure = () => get<CommodityExposureDto>("/analytics/market/commodity-exposure");
