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

export type AnalyticsFilters = {
  startDate?: string;
  endDate?: string;
  producerId?: string;
  buyerId?: string;
  lenderId?: string;
  keeperId?: string;
};

function withFilters(path: string, filters: AnalyticsFilters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return `${path}${query.size ? `?${query.toString()}` : ""}`;
}

const get = <T>(path: string, filters?: AnalyticsFilters) =>
  apiRequest<T>(withFilters(path, filters), { auth: true });

export const getOperationsSummary = (filters?: AnalyticsFilters) => get<OperationsSummaryDto>("/analytics/operations/summary", filters);
export const getOperationsTimeline = (orderId: string) => get<OperationsTimelineDto>(`/analytics/operations/timeline/${orderId}`);
export const getCycleDuration = (filters?: AnalyticsFilters) => get<CycleDurationDto>("/analytics/operations/cycle-duration", filters);
export const getShipmentStatus = (filters?: AnalyticsFilters) => get<ShipmentStatusDto>("/analytics/operations/shipment-status", filters);
export const getExecutionEfficiency = (filters?: AnalyticsFilters) => get<ExecutionEfficiencyDto>("/analytics/operations/execution-efficiency", filters);
export const getCapitalFlow = (filters?: AnalyticsFilters) => get<CapitalFlowDto>("/analytics/flow/capital", filters);
export const getGeographicFlow = (filters?: AnalyticsFilters) => get<GeographicFlowDto>("/analytics/flow/geographic", filters);
export const getPaymentTiming = (filters?: AnalyticsFilters) => get<PaymentTimingDto>("/analytics/flow/payment-timing", filters);
export const getVolumeOverTime = (filters?: AnalyticsFilters) => get<VolumeOverTimeDto>("/analytics/flow/volume-over-time", filters);
export const getCommodityExposure = (filters?: AnalyticsFilters) => get<CommodityExposureDto>("/analytics/market/commodity-exposure", filters);
