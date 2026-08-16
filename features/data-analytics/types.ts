import type { AppShellHeader } from "@/components/app-shell";

export type DataAnalyticsState =
  | { status: "loading" }
  | { status: "empty"; title: string; message: string }
  | { status: "error"; title: string; message: string }
  | { status: "unauthorized"; title: string; message: string }
  | { status: "forbidden"; title: string; message: string }
  | { status: "ready"; data: DataAnalyticsData };

export type DataAnalyticsData = {
  header: AppShellHeader;
  tabs: AnalyticsTab[];
  summary?: { label: string; value: number }[];
  operationTimelines?: {
    orderNumber: string;
    currentStatus: string;
    stages: { stage: string; startedAt: string; durationHours: number | null }[];
  }[];
  shipmentStatus: ShipmentStatusChart;
  cycleDuration: LineChartData;
  executionEfficiency: BarChartData;
  flow: FlowAnalyticsData;
  market: MarketAnalyticsData;
};

export type AnalyticsTab = {
  label: "Operations" | "Flow" | "Market";
  active: boolean;
};

export type AnalyticsTabKey = "operations" | "flow" | "market";

export type ShipmentStatusChart = {
  title: string;
  subtitle: string;
  segments: PieSegment[];
};

export type PieSegment = {
  label: string;
  value: number;
  color: string;
};

export type LineChartData = {
  title: string;
  subtitle: string;
  yAxisLabel: string;
  months: string[];
  yAxis: number[];
  values: number[];
};

export type BarChartData = {
  title: string;
  subtitle: string;
  xAxisLabel: string;
  xAxis: number[];
  items: {
    label: string;
    value: number;
  }[];
};

export type FlowAnalyticsData = {
  capitalDeployment: VerticalBarChartData;
  paymentTiming: VerticalBarChartData;
  transactionVolume: DualAxisLineChartData;
};

export type VerticalBarChartData = {
  title: string;
  subtitle: string;
  yAxisLabel: string;
  xLabels: string[];
  yAxis: number[];
  bars: {
    label: string;
    color: string;
    values: number[];
  }[];
};

export type DualAxisLineChartData = {
  title: string;
  subtitle: string;
  leftAxisLabel: string;
  rightAxisLabel: string;
  months: string[];
  leftAxis: number[];
  rightAxis: number[];
  values: number[];
  color: string;
};

export type MarketAnalyticsData = {
  commodityExposure: CommodityExposureChart;
  priceEvolution?: PriceEvolutionChart;
  geographicFlow: GeographicFlowChart;
};

export type CommodityExposureChart = {
  title: string;
  subtitle: string;
  leftAxisLabel: string;
  rightAxisLabel: string;
  categories: string[];
  leftAxis: number[];
  rightAxis: number[];
  series: {
    label: string;
    color: string;
    axis: "left" | "right";
    values: number[];
  }[];
};

export type PriceEvolutionChart = {
  title: string;
  subtitle: string;
  yAxisLabel: string;
  weeks: string[];
  yAxis: number[];
  series: {
    label: string;
    color: string;
    values: number[];
  }[];
  note: string;
};

export type GeographicFlowChart = {
  title: string;
  subtitle: string;
  originTitle: string;
  destinationTitle: string;
  origins: GeographicFlowItem[];
  destinations: GeographicFlowItem[];
};

export type GeographicFlowItem = {
  country: string;
  percentage: number;
  color: string;
};
