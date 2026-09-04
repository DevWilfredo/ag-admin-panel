import { ApiError, getErrorMessage } from "@/services/api-errors";
import type { CurrentUser } from "@/services/session-service";
import { getOrderAudit, listOrders, type OrderAuditLogDto, type OrderListItemDto } from "@/services/orders-service";
import { dashboardMockData } from "./mock-dashboard";
import type { ActivityItem, DashboardData, DashboardDataState, RecentTransaction } from "./types";

export async function loadDashboardBackendState(
  user: CurrentUser,
): Promise<DashboardDataState> {
  try {
    const ordersResponse = await listOrders({
      limit: 100,
      page: 1,
    });
    const auditItems = await loadRecentAuditItems(ordersResponse.orders);

    return {
      status: "ready",
      data: {
        ...dashboardMockData,
        header: buildDashboardHeader(user),
        quickActions: buildQuickActions(user),
        metrics: buildMetrics(ordersResponse.orders, ordersResponse.pagination.total),
        recentActivity: auditItems,
        recentTransactions: ordersResponse.orders
          .slice(0, 5)
          .map(mapOrderToRecentTransaction),
        notifications: [],
        commodityPerformance: {
          ...dashboardMockData.commodityPerformance,
          subtitle: "No historical analytics are available for this role",
          series: dashboardMockData.commodityPerformance.series.map((series) => ({
            ...series,
            values: [],
          })),
        },
        loanToValue: {
          ...dashboardMockData.loanToValue,
          percent: 0,
          loanAmount: "Not available",
          totalValue: "Not available",
          availableToFinance: "Not available",
        },
        statusOverview: buildStatusOverview(ordersResponse.orders),
        messages: [],
      },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return {
        status: "unauthorized",
        title: "Sign in required",
        message: "A valid session is required before dashboard data can be loaded.",
      };
    }

    if (error instanceof ApiError && error.status === 403) {
      return {
        status: "forbidden",
        title: "Access restricted",
        message: "Your role is not allowed to view backend dashboard sources.",
      };
    }

    return {
      status: "error",
      title: "Dashboard data unavailable",
      message: getErrorMessage(error, "The backend dashboard sources could not be loaded."),
    };
  }
}

function buildQuickActions(user: CurrentUser) {
  const reviewDocuments = {
    ...dashboardMockData.quickActions.find(
      (action) => action.id === "review-documents",
    )!,
    href: "/documents",
    accessibilityLabel: "Review documents",
  };
  if (user.role !== "ADMIN") return [reviewDocuments];

  return [
    {
      ...dashboardMockData.quickActions.find(
        (action) => action.id === "create-transaction",
      )!,
      accessibilityLabel: "Create transaction",
    },
    {
      ...dashboardMockData.quickActions.find(
        (action) => action.id === "export-report",
      )!,
      accessibilityLabel: "Open user management",
      href: "/users",
    },
    {
      ...dashboardMockData.quickActions.find(
        (action) => action.id === "open-analytics",
      )!,
      accessibilityLabel: "Open data analytics",
      href: "/data-analytics",
    },
    reviewDocuments,
  ];
}

export function buildOrdersCsvDataUrl(orders: OrderListItemDto[]) {
  const rows = [
    ["Transaction number", "Commodity", "Quantity", "Unit", "Destination", "Status"],
    ...orders.map((order) => [
      order.orderNumber || order.id,
      order.commodityType || "",
      order.quantity ?? "",
      order.unit || "",
      order.destinationCountry || "",
      order.status || "",
    ]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function buildDashboardHeader(user: CurrentUser): DashboardData["header"] {
  return {
    ...dashboardMockData.header,
    avatarLabel: `${user.fullName} profile`,
    dateLabel: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date()),
    searchPlaceholder: "Search transaction number",
    profileName: user.fullName,
    profileSubtitle: `${formatRole(user.role)} - AgroTrust Backoffice`,
    unreadNotifications: 0,
  };
}

function buildMetrics(orders: OrderListItemDto[], total: number) {
  const active = orders.filter(
    (order) => order.status !== "FUNDS_DISTRIBUTED",
  ).length;
  const volume = orders.reduce((sum, order) => {
    const quantity = Number(order.quantity);
    return sum + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
  const units = [...new Set(orders.map((order) => order.unit?.trim()).filter(Boolean))];
  const volumeValue = units.length <= 1
    ? `${new Intl.NumberFormat("en-US").format(volume)}${units[0] ? ` ${units[0]}` : ""}`
    : "Mixed units";

  return [
    {
      label: "Visible Transactions",
      value: String(total),
      delta: "Live",
      deltaContext: "role-filtered backend data",
    },
    {
      label: "Active Contracts",
      value: String(active),
      delta: "Live",
      deltaContext: "among loaded transactions",
    },
    {
      label: "Visible Volume",
      value: volumeValue,
      delta: "Live",
      deltaContext: units.length <= 1 ? "across loaded transactions" : "cannot be safely aggregated",
    },
  ];
}

function buildStatusOverview(orders: OrderListItemDto[]) {
  const total = orders.length || 1;
  const definitions = [
    {
      label: "Active" as const,
      color: "blue" as const,
      matches: (order: OrderListItemDto) =>
        order.status !== "FUNDS_DISTRIBUTED" &&
        order.status !== "CARGO_IN_TRANSIT",
    },
    {
      label: "In Transit" as const,
      color: "green" as const,
      matches: (order: OrderListItemDto) =>
        order.status === "CARGO_IN_TRANSIT",
    },
    {
      label: "Alert" as const,
      color: "red" as const,
      matches: () => false,
    },
    {
      label: "Completed" as const,
      color: "amber" as const,
      matches: (order: OrderListItemDto) =>
        order.status === "FUNDS_DISTRIBUTED",
    },
  ];

  return definitions.map((definition) => {
    const count = orders.filter(definition.matches).length;
    const percent = Math.round((count / total) * 100);
    return {
      label: definition.label,
      color: definition.color,
      count,
      percentLabel: `${percent}% of visible`,
      progressPercent: percent,
    };
  });
}

function mapOrderToRecentTransaction(order: OrderListItemDto): RecentTransaction {
  return {
    amount: "Payment not loaded",
    commodity: order.commodityType || "Commodity not provided",
    href: `/transactions?orderId=${order.id}`,
    number: order.orderNumber || order.id,
    route: order.destinationCountry ? `Destination: ${order.destinationCountry}` : "Route not provided",
    status: order.status === "FUNDS_DISTRIBUTED" ? "Closed" : "Active",
    volume: formatQuantity(order.quantity, order.unit),
  };
}

async function loadRecentAuditItems(orders: OrderListItemDto[]) {
  const selectedOrders = orders.slice(0, 10);
  const auditResults = await Promise.allSettled(selectedOrders.map((order) => getOrderAudit(order.id)));

  return auditResults
    .flatMap((result, index) => {
      if (result.status !== "fulfilled") {
        return [];
      }

      return result.value.map((audit) => ({ audit, order: selectedOrders[index] }));
    })
    .sort((a, b) => new Date(b.audit.createdAt).getTime() - new Date(a.audit.createdAt).getTime())
    .map(({ audit, order }) => mapAuditItem(audit, order))
    .slice(0, 4);
}

function mapAuditItem(audit: OrderAuditLogDto, order: OrderListItemDto): ActivityItem {
  return {
    detail: `${order.orderNumber} - ${audit.notes || formatStatus(audit.toStatus)}`,
    href: `/transactions?orderId=${order.id}`,
    icon: "contract",
    timeAgo: formatDate(audit.createdAt),
    title: formatStatus(audit.toStatus),
  };
}

function formatQuantity(quantity?: number | string, unit?: string) {
  if (quantity === undefined || quantity === null || quantity === "") {
    return "Quantity not provided";
  }

  const parsed = typeof quantity === "number" ? quantity : Number(quantity);
  const value = Number.isFinite(parsed) ? new Intl.NumberFormat("en-US").format(parsed) : String(quantity);

  return `${value}${unit ? ` ${unit}` : ""}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
