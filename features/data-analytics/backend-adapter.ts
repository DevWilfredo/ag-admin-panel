import { ApiError, getErrorMessage } from "@/services/api-errors";
import {
  getCapitalFlow,
  getCommodityExposure,
  getCycleDuration,
  getExecutionEfficiency,
  getGeographicFlow,
  getOperationsSummary,
  getOperationsTimeline,
  getPaymentTiming,
  getShipmentStatus,
  getVolumeOverTime,
} from "@/services/analytics-service";
import { listOrders } from "@/services/orders-service";
import type { AnalyticsTabKey, DataAnalyticsState } from "./types";

const colors = ["#245895", "#087d2f", "#f2aa1d", "#946015", "#7b61a8"];

export async function loadAnalyticsBackendState(activeTab: AnalyticsTabKey): Promise<DataAnalyticsState> {
  try {
    const [summary, shipment, cycle, efficiency, capital, geographic, timing, volume, exposure, orders] = await Promise.all([
      getOperationsSummary(), getShipmentStatus(), getCycleDuration(), getExecutionEfficiency(), getCapitalFlow(),
      getGeographicFlow(), getPaymentTiming(), getVolumeOverTime(), getCommodityExposure(), listOrders({ page: 1, limit: 20 }),
    ]);
    const timelines = await Promise.all(orders.orders.map((order) => getOperationsTimeline(order.id)));
    const cycleRows = cycle.byCommodity || [];
    const months = volume.volumeByMonth.map((item) => item.month);
    const routeTotal = geographic.routes.reduce((sum, route) => sum + route.totalQuantity, 0) || 1;
    const groupRoutes = (key: "origin" | "destination") => Array.from(
      geographic.routes.reduce((map, route) => map.set(route[key], (map.get(route[key]) || 0) + route.totalQuantity), new Map<string, number>()),
    ).map(([country, quantity], index) => ({ country, percentage: Math.round((quantity / routeTotal) * 100), color: colors[index % colors.length] }));

    return { status: "ready", data: {
      header: { title: "Data Analytics", dateLabel: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()), searchPlaceholder: "Search transaction number", unreadNotifications: 0, avatarLabel: "Admin profile", avatarSrc: "" },
      tabs: ["Operations", "Flow", "Market"].map((label) => ({ label: label as "Operations" | "Flow" | "Market", active: label.toLowerCase() === activeTab })),
      summary: [
        { label: "Total orders", value: summary.totalOrders }, { label: "Active orders", value: summary.activeOrders },
        { label: "Completed orders", value: summary.completedOrders }, { label: "Warehouses", value: summary.totalWarehouses },
      ],
      operationTimelines: timelines.map((timeline) => ({ orderNumber: timeline.orderNumber, currentStatus: timeline.currentStatus, stages: timeline.timeline.map((stage) => ({ stage: stage.stage, startedAt: stage.startedAt, durationHours: stage.durationHours })) })),
      shipmentStatus: { title: "Shipment Status Distribution", subtitle: `${shipment.total} orders in the current distribution`, segments: shipment.distribution.map((item, index) => ({ label: item.label, value: item.percentage, color: colors[index % colors.length] })) },
      cycleDuration: { title: "Cycle Duration by Commodity", subtitle: "Observed average lifecycle duration", yAxisLabel: "Days", months: cycleRows.map((row) => String(row.commodityType || row.commodity || "Unknown")), yAxis: axis(cycleRows.map((row) => numeric(row.avgDays ?? row.averageDays ?? row.avgDurationDays))), values: cycleRows.map((row) => numeric(row.avgDays ?? row.averageDays ?? row.avgDurationDays)) },
      executionEfficiency: { title: "Execution Efficiency Metrics", subtitle: "Average time spent per lifecycle stage", xAxisLabel: "Hours", xAxis: axis(efficiency.efficiency.map((item) => item.avgHours || 0)).reverse(), items: efficiency.efficiency.map((item) => ({ label: formatStage(item.stage), value: item.avgHours || 0 })) },
      flow: {
        capitalDeployment: { title: "Capital Flow", subtitle: "Current deployed, recovered and outstanding capital", yAxisLabel: "Amount", xLabels: ["Current"], yAxis: axis([capital.summary.totalDeployed, capital.summary.totalRecovered, capital.summary.outstandingCapital]), bars: [
          { label: "Deployed", color: colors[0], values: [capital.summary.totalDeployed] }, { label: "Recovered", color: colors[1], values: [capital.summary.totalRecovered] }, { label: "Outstanding", color: colors[2], values: [capital.summary.outstandingCapital] },
        ] },
        paymentTiming: { title: "Payment Timing Analysis", subtitle: `${timing.totalTransactions} completed payment timelines`, yAxisLabel: "Transactions", xLabels: timing.distribution.map((item) => item.range), yAxis: axis(timing.distribution.map((item) => item.count)), bars: [{ label: "Payments", color: colors[1], values: timing.distribution.map((item) => item.count) }] },
        transactionVolume: { title: "Transaction Volume Over Time", subtitle: "Monthly order count from live data", leftAxisLabel: "Transactions", rightAxisLabel: "Volume (kg)", months, leftAxis: axis(volume.volumeByMonth.map((item) => item.orderCount)), rightAxis: axis(volume.volumeByMonth.map((item) => item.totalQuantityKg)), values: volume.volumeByMonth.map((item) => item.orderCount), color: colors[2] },
      },
      market: {
        commodityExposure: { title: "Commodity Exposure", subtitle: "Volume and value by commodity type", leftAxisLabel: "Volume", rightAxisLabel: "Value", categories: exposure.exposure.map((item) => item.commodityType), leftAxis: axis(exposure.exposure.map((item) => item.totalQuantity)), rightAxis: axis(exposure.exposure.map((item) => item.totalValue)), series: [
          { label: "Volume", color: colors[0], axis: "left", values: exposure.exposure.map((item) => item.totalQuantity) }, { label: "Value", color: colors[1], axis: "right", values: exposure.exposure.map((item) => item.totalValue) },
        ] },
        geographicFlow: { title: "Geographic Flow Overview", subtitle: "Shipment routes weighted by quantity", originTitle: "Origin Countries", destinationTitle: "Destination Countries", origins: groupRoutes("origin"), destinations: groupRoutes("destination") },
      },
    } };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { status: "unauthorized", title: "Sign in required", message: getErrorMessage(error) };
    if (error instanceof ApiError && error.status === 403) return { status: "forbidden", title: "Access restricted", message: getErrorMessage(error) };
    return { status: "error", title: "Analytics unavailable", message: getErrorMessage(error) };
  }
}

function numeric(value: unknown) { const number = Number(value); return Number.isFinite(number) ? number : 0; }
function axis(values: number[]) { const maximum = Math.max(1, ...values); return [maximum, maximum * 0.75, maximum * 0.5, maximum * 0.25, 0]; }
function formatStage(stage: string) { return stage.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
