export type DashboardDataState =
  | { status: "loading" }
  | { status: "empty"; title: string; message: string }
  | { status: "error"; title: string; message: string }
  | { status: "unauthorized"; title: string; message: string }
  | { status: "forbidden"; title: string; message: string }
  | { status: "ready"; data: DashboardData };

export type DashboardData = {
  header: {
    title: string;
    dateLabel: string;
    searchPlaceholder: string;
    unreadNotifications: number;
    avatarLabel: string;
    avatarSrc: string;
    profileName?: string;
    profileSubtitle?: string;
  };
  quickActions: QuickAction[];
  metrics: MetricCard[];
  recentTransactions: RecentTransaction[];
  notifications: DashboardNotification[];
  commodityPerformance: CommodityPerformance;
  loanToValue: LoanToValue;
  statusOverview: StatusOverviewItem[];
  messages: DashboardMessage[];
  recentActivity: ActivityItem[];
};

export type QuickAction = {
  id: "create-transaction" | "export-report" | "open-analytics" | "review-documents";
  label: string;
  accessibilityLabel: string;
  icon: "plus-square" | "download" | "trend" | "document" | "users";
  href: string;
  downloadName?: string;
  disabled?: boolean;
};

export type MetricCard = {
  label: string;
  value: string;
  delta: string;
  deltaContext: string;
};

export type RecentTransaction = {
  number: string;
  commodity: string;
  volume: string;
  route: string;
  amount: string;
  status: "Active" | "Alert" | "Closed";
  href: string;
};

export type DashboardNotification = {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  unread: boolean;
  href: string;
  tone: "warning" | "success" | "info" | "danger";
};

export type CommodityPerformance = {
  title: string;
  subtitle: string;
  months: string[];
  yAxis: number[];
  series: {
    name: "Soybean" | "Coffee" | "Corn";
    color: string;
    values: number[];
  }[];
};

export type LoanToValue = {
  title: string;
  percent: number;
  loanAmount: string;
  totalValue: string;
  availableToFinance: string;
};

export type StatusOverviewItem = {
  label: "Active" | "In Transit" | "Alert" | "Completed";
  percentLabel: string;
  count: number;
  progressPercent: number;
  color: "blue" | "green" | "red" | "amber";
};

export type DashboardMessage = {
  sender: string;
  subject: string;
  timeAgo: string;
  unread: boolean;
  href: string;
};

export type ActivityItem = {
  title: string;
  detail: string;
  timeAgo: string;
  icon: "contract" | "payment" | "document" | "vessel";
  href: string;
};
