import type { DashboardData, DashboardDataState } from "./types";

type PreviewState = Exclude<DashboardDataState["status"], "ready">;

const previewStates = new Set<PreviewState>([
  "loading",
  "empty",
  "error",
  "unauthorized",
  "forbidden",
]);

export function getDashboardMockState(requestedState?: string): DashboardDataState {
  if (requestedState && previewStates.has(requestedState as PreviewState)) {
    return createPreviewState(requestedState as PreviewState);
  }

  return {
    status: "ready",
    data: dashboardMockData,
  };
}

function createPreviewState(status: PreviewState): DashboardDataState {
  switch (status) {
    case "loading":
      return { status: "loading" };
    case "empty":
      return {
        status,
        title: "No dashboard data yet",
        message: "Dashboard widgets will appear once live backend sources or approved mocks provide data.",
      };
    case "error":
      return {
        status,
        title: "Dashboard data unavailable",
        message: "The dashboard could not be loaded. Try again once the backend source is available.",
      };
    case "unauthorized":
      return {
        status,
        title: "Sign in required",
        message: "A valid session is required before dashboard data can be loaded.",
      };
    case "forbidden":
      return {
        status,
        title: "Access restricted",
        message: "Your role is not allowed to view this dashboard state.",
      };
  }
}

export const dashboardMockData: DashboardData = {
  header: {
    title: "Dashboard",
    dateLabel: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()),
    searchPlaceholder: "Search transaction number",
    unreadNotifications: 1,
    avatarLabel: "System Admin",
    avatarSrc: "/user-avatar.png",
  },
  quickActions: [
    {
      id: "create-transaction",
      label: "Create Transaction",
      accessibilityLabel: "Create transaction placeholder",
      icon: "plus-square",
      href: "/transactions?action=create",
    },
    {
      id: "export-report",
      label: "Open Users",
      accessibilityLabel: "Export report placeholder",
      icon: "users",
      href: "/users",
    },
    {
      id: "open-analytics",
      label: "Open Analytics",
      accessibilityLabel: "Open analytics placeholder",
      icon: "trend",
      href: "/data-analytics",
    },
    {
      id: "review-documents",
      label: "Open Documents",
      accessibilityLabel: "Open documents",
      icon: "document",
      href: "/documents",
    },
  ],
  metrics: [
    {
      label: "Total Transactions",
      value: "156",
      delta: "+12%",
      deltaContext: "vs last month",
    },
    {
      label: "Active Contracts",
      value: "42",
      delta: "+5",
      deltaContext: "vs last month",
    },
    {
      label: "Commodity Volume",
      value: "48.2K MT",
      delta: "+8%",
      deltaContext: "vs last month",
    },
    {
      label: "Revenue Overview",
      value: "$12.4M",
      delta: "+15%",
      deltaContext: "vs last month",
    },
  ],
  recentTransactions: [
    {
      number: "TXN-0044",
      commodity: "Soybean",
      volume: "2,400 MT",
      route: "Rosario, AR -> Rotterdam, NL",
      amount: "$1.2M",
      status: "Active",
      href: "/transactions?transaction=TXN-0044",
    },
    {
      number: "TXN-0041",
      commodity: "Coffee",
      volume: "800 MT",
      route: "Santos, BR -> Hamburg, DE",
      amount: "$980K",
      status: "Alert",
      href: "/transactions?transaction=TXN-0041",
    },
    {
      number: "TXN-0038",
      commodity: "Corn",
      volume: "3,100 MT",
      route: "Buenos Aires, AR -> Shanghai, CN",
      amount: "$890K",
      status: "Active",
      href: "/transactions?transaction=TXN-0038",
    },
    {
      number: "TXN-0031",
      commodity: "Soybean",
      volume: "1,800 MT",
      route: "Paranagua, BR -> Qingdao, CN",
      amount: "$950K",
      status: "Active",
      href: "/transactions?transaction=TXN-0031",
    },
    {
      number: "TXN-0022",
      commodity: "Coffee",
      volume: "600 MT",
      route: "Manizales, CO -> Miami, US",
      amount: "$720K",
      status: "Active",
      href: "/transactions?transaction=TXN-0022",
    },
  ],
  notifications: [
    {
      id: "missing-bl-0041",
      title: "TXN-0041: Missing document - Original B/L",
      description: "Document review is waiting for the original Bill of Lading.",
      timeAgo: "30 min ago",
      unread: true,
      href: "/transactions?tab=alerts&transaction=TXN-0041",
      tone: "danger",
    },
    {
      id: "price-deviation-0044",
      title: "TXN-0044: Price deviation +8.2% above contracted",
      description: "Commodity price moved above the agreed threshold.",
      timeAgo: "1 hour ago",
      unread: false,
      href: "/transactions?transaction=TXN-0044",
      tone: "warning",
    },
    {
      id: "payment-0028",
      title: "Payment received for TXN-0028 ($1.2M)",
      description: "Funds were marked as received for the wheat transaction.",
      timeAgo: "2 hours ago",
      unread: false,
      href: "/transactions?tab=closed&transaction=TXN-0028",
      tone: "success",
    },
    {
      id: "contract-wheat-1",
      title: "New contract uploaded: Wheat - 1,500 MT",
      description: "A new wheat contract is ready for review.",
      timeAgo: "3 hours ago",
      unread: false,
      href: "/transactions?panel=documents",
      tone: "info",
    },
    {
      id: "contract-wheat-2",
      title: "New contract uploaded: Wheat - 1,500 MT",
      description: "A duplicate contract upload requires verification.",
      timeAgo: "3 hours ago",
      unread: false,
      href: "/transactions?panel=documents",
      tone: "info",
    },
  ],
  commodityPerformance: {
    title: "Commodity Performance",
    subtitle: "Volume trends by commodity type (MT)",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    yAxis: [18000, 13500, 9000, 4500, 0],
    series: [
      {
        name: "Soybean",
        color: "#2d5f9f",
        values: [],
      },
      {
        name: "Coffee",
        color: "#946015",
        values: [],
      },
      {
        name: "Corn",
        color: "#f2aa1d",
        values: [12200, 11600, 13900, 13200, 14700, 14200],
      },
    ],
  },
  loanToValue: {
    title: "Loan-to-Value",
    percent: 58.7,
    loanAmount: "$171,923",
    totalValue: "$292,800",
    availableToFinance: "$120,877",
  },
  statusOverview: [
    {
      label: "Active",
      percentLabel: "42% of total",
      count: 42,
      progressPercent: 42,
      color: "blue",
    },
    {
      label: "In Transit",
      percentLabel: "28% of total",
      count: 28,
      progressPercent: 28,
      color: "green",
    },
    {
      label: "Alert",
      percentLabel: "8% of total",
      count: 8,
      progressPercent: 8,
      color: "red",
    },
    {
      label: "Completed",
      percentLabel: "22% of total",
      count: 22,
      progressPercent: 22,
      color: "amber",
    },
  ],
  messages: [
    {
      sender: "Carlos Mendez",
      subject: "Payment confirmation for shipment TXN-0038",
      timeAgo: "15 min ago",
      unread: true,
      href: "/messages?thread=carlos-mendez",
    },
    {
      sender: "Rotterdam Port Authority",
      subject: "Vessel MV Atlantic Pioneer arrival update",
      timeAgo: "1 hour ago",
      unread: true,
      href: "/messages?thread=rotterdam-port-authority",
    },
    {
      sender: "Ana Silva",
      subject: "Contract amendment request - Coffee 800MT",
      timeAgo: "3 hours ago",
      unread: false,
      href: "/messages?thread=ana-silva",
    },
    {
      sender: "Hamburg Customs",
      subject: "Documentation approved for TXN-0041",
      timeAgo: "5 hours ago",
      unread: false,
      href: "/messages?thread=hamburg-customs",
    },
    {
      sender: "Louis Cortez",
      subject: "Contract amendment request - Coffee 800MT",
      timeAgo: "6 hours ago",
      unread: false,
      href: "/messages?thread=louis-cortez",
    },
  ],
  recentActivity: [
    {
      title: "Contract signed",
      detail: "TXN-0044 - Soybean 2,400 MT",
      timeAgo: "2 hours ago",
      icon: "contract",
      href: "/transactions?transaction=TXN-0044",
    },
    {
      title: "Payment processed",
      detail: "TXN-0028 - $1.2M received",
      timeAgo: "3 hours ago",
      icon: "payment",
      href: "/transactions?tab=closed&transaction=TXN-0028",
    },
    {
      title: "Document uploaded",
      detail: "Bill of Lading - TXN-0038",
      timeAgo: "4 hours ago",
      icon: "document",
      href: "/transactions?transaction=TXN-0038",
    },
    {
      title: "Vessel departed",
      detail: "MV Atlantic Pioneer from Rosario",
      timeAgo: "6 hours ago",
      icon: "vessel",
      href: "/transactions?transaction=TXN-0044",
    },
  ],
};
