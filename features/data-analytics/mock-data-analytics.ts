import type { AnalyticsTabKey, DataAnalyticsData, DataAnalyticsState } from "./types";

type PreviewState = Exclude<DataAnalyticsState["status"], "ready">;

const previewStates = new Set<PreviewState>([
  "loading",
  "empty",
  "error",
  "unauthorized",
  "forbidden",
]);

export function getDataAnalyticsMockState(requestedState?: string, requestedTab: AnalyticsTabKey = "operations"): DataAnalyticsState {
  if (requestedState && previewStates.has(requestedState as PreviewState)) {
    return createPreviewState(requestedState as PreviewState);
  }

  return {
    status: "ready",
    data: {
      ...dataAnalyticsMockData,
      tabs: dataAnalyticsMockData.tabs.map((tab) => ({
        ...tab,
        active: tab.label.toLowerCase().replace(" ", "-") === requestedTab,
      })),
    },
  };
}

function createPreviewState(status: PreviewState): DataAnalyticsState {
  switch (status) {
    case "loading":
      return { status: "loading" };
    case "empty":
      return {
        status,
        title: "No analytics data yet",
        message: "Analytics will appear here once backend aggregation endpoints or approved mocks provide data.",
      };
    case "error":
      return {
        status,
        title: "Analytics unavailable",
        message: "The analytics view could not be loaded. Try again when the backend source is available.",
      };
    case "unauthorized":
      return {
        status,
        title: "Sign in required",
        message: "A valid session is required before analytics can be loaded.",
      };
    case "forbidden":
      return {
        status,
        title: "Access restricted",
        message: "Your role is not allowed to view this analytics state.",
      };
  }
}

export const dataAnalyticsMockData: DataAnalyticsData = {
  header: {
    title: "Data Analytics",
    dateLabel: "12 Ene 2026",
    searchPlaceholder: "Search TXN ID / COMMODITY / LOT",
    unreadNotifications: 0,
    avatarLabel: "System Admin",
    avatarSrc: "/user-avatar.png",
  },
  tabs: [
    { label: "Operations", active: true },
    { label: "Flow", active: false },
    { label: "Market", active: false },
  ],
  shipmentStatus: {
    title: "Shipment Status Distribution",
    subtitle: "Current distribution of all active shipments",
    segments: [
      { label: "In Warehouse", value: 12, color: "#946015" },
      { label: "Pending Payment", value: 28, color: "#f2aa1d" },
      { label: "In Transit", value: 35, color: "#245895" },
      { label: "Completed", value: 25, color: "#087d2f" },
    ],
  },
  cycleDuration: {
    title: "Cycle Duration Trend",
    subtitle: "Average days from contract to completion",
    yAxisLabel: "Days",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    yAxis: [32, 24, 16, 8, 0],
    values: [29, 27.2, 25.4, 27.6, 25.2, 26.6],
  },
  executionEfficiency: {
    title: "Execution Efficiency Metrics",
    subtitle: "Average time per process step",
    xAxisLabel: "Days",
    xAxis: [0, 4, 8, 12, 16],
    items: [
      { label: "Warehouse -> Cert", value: 3.2 },
      { label: "Cert -> Shipment", value: 5.8 },
      { label: "Shipment -> Payment", value: 12.4 },
    ],
  },
  flow: {
    capitalDeployment: {
      title: "Capital Deployment",
      subtitle: "Capital deployed vs available (Million USD)",
      yAxisLabel: "M USD",
      xLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      yAxis: [16, 12, 8, 4, 0],
      bars: [
        {
          label: "Deployed",
          color: "#245895",
          values: [0.2, 0.15, 0.18, 0.16, 0.2, 0.14],
        },
        {
          label: "Available",
          color: "#f2aa1d",
          values: [12.4, 11.7, 14.2, 13.5, 15.1, 14.5],
        },
      ],
    },
    paymentTiming: {
      title: "Payment Timing Analysis",
      subtitle: "Distribution of days from shipment to payment",
      yAxisLabel: "Count",
      xLabels: ["0-5d", "6-10d", "11-15d", "16-20d", "21-25d", "26-30d"],
      yAxis: [28, 21, 14, 7, 0],
      bars: [
        {
          label: "Payments",
          color: "#087d2f",
          values: [8, 15, 28, 22, 12, 7],
        },
      ],
    },
    transactionVolume: {
      title: "Transaction Volume Over Time",
      subtitle: "Monthly transaction count and total volume",
      leftAxisLabel: "Transactions",
      rightAxisLabel: "Volume (MT)",
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      leftAxis: [60, 45, 30, 15],
      rightAxis: [26000, 19500, 13000, 6500],
      values: [42, 38, 49, 45, 53, 48],
      color: "#f2aa1d",
    },
  },
  market: {
    commodityExposure: {
      title: "Commodity Exposure",
      subtitle: "Volume and value by commodity type",
      leftAxisLabel: "Volume (MT)",
      rightAxisLabel: "Revenue (USD)",
      categories: ["Soybean", "Coffee", "Corn", "Wheat", "Sugar"],
      leftAxis: [16000, 12000, 8000, 4000, 0],
      rightAxis: [14000000, 10500000, 7000000, 3500000, 0],
      series: [
        {
          label: "Volume (MT)",
          color: "#245895",
          axis: "left",
          values: [120, 90, 150, 75, 105],
        },
        {
          label: "Value (USD)",
          color: "#087d2f",
          axis: "right",
          values: [10800000, 7200000, 13600000, 5900000, 8000000],
        },
      ],
    },
    priceEvolution: {
      title: "Price Evolution",
      subtitle: "Market reference price (external data) - USD/MT",
      yAxisLabel: "USD/MT",
      weeks: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"],
      yAxis: [1600, 1200, 800, 400, 0],
      series: [
        {
          label: "Soybean",
          color: "#245895",
          values: [610, 620, 632, 626, 638, 645],
        },
        {
          label: "Coffee",
          color: "#946015",
          values: [600, 606, 615, 613, 622, 629],
        },
        {
          label: "Corn",
          color: "#f2aa1d",
          values: [590, 600, 612, 608, 618, 626],
        },
      ],
      note: "Price data is provided for reference purposes only and does not represent valuation, recommendation, or performance assessment.",
    },
    geographicFlow: {
      title: "Geographic Flow Overview",
      subtitle: "Top origin and destination countries",
      originTitle: "Origin Countries",
      destinationTitle: "Destination Countries",
      origins: [
        { country: "Argentina", percentage: 35, color: "#245895" },
        { country: "Brazil", percentage: 28, color: "#3d6fa8" },
        { country: "Colombia", percentage: 18, color: "#5b86bc" },
        { country: "Paraguay", percentage: 12, color: "#78a0ce" },
      ],
      destinations: [
        { country: "China", percentage: 42, color: "#087d2f" },
        { country: "Netherlands", percentage: 22, color: "#0e8f38" },
        { country: "Germany", percentage: 16, color: "#17a246" },
        { country: "United States", percentage: 13, color: "#25b454" },
      ],
    },
  },
};
