import { ApiError, getErrorMessage } from "@/services/api-errors";
import { getCachedCurrentUser } from "@/services/auth-service";
import { getOrderAudit, listOrders, type OrderAuditLogDto, type OrderListItemDto } from "@/services/orders-service";
import { dashboardMockData } from "./mock-dashboard";
import type { ActivityItem, DashboardData, DashboardDataState, RecentTransaction } from "./types";

export async function loadDashboardBackendState(): Promise<DashboardDataState> {
  try {
    const ordersResponse = await listOrders({
      limit: 5,
      page: 1,
    });
    const auditItems = await loadRecentAuditItems(ordersResponse.orders);

    return {
      status: "ready",
      data: {
        ...dashboardMockData,
        header: buildDashboardHeader(),
        quickActions: buildQuickActions(),
        recentActivity: auditItems.length > 0 ? auditItems : dashboardMockData.recentActivity,
        recentTransactions: ordersResponse.orders.map(mapOrderToRecentTransaction),
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

function buildQuickActions() {
  const user = getCachedCurrentUser();

  return dashboardMockData.quickActions.map((action) => {
    if (action.id !== "create-transaction" || user?.role === "ADMIN") {
      return action;
    }

    return {
      ...action,
      accessibilityLabel: "Create transaction is restricted to administrators",
      disabled: true,
    };
  });
}

function buildDashboardHeader(): DashboardData["header"] {
  const user = getCachedCurrentUser();

  return {
    ...dashboardMockData.header,
    avatarLabel: user ? `${user.fullName} profile` : dashboardMockData.header.avatarLabel,
    profileName: user?.fullName,
    profileSubtitle: user ? `${formatRole(user.role)} - AgroTrust Backoffice` : undefined,
    unreadNotifications: dashboardMockData.notifications.filter((notification) => notification.unread).length,
  };
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
  const auditResults = await Promise.allSettled(orders.slice(0, 3).map((order) => getOrderAudit(order.id)));

  return auditResults
    .flatMap((result, index) => {
      if (result.status !== "fulfilled") {
        return [];
      }

      return result.value.slice(0, 2).map((audit) => mapAuditItem(audit, orders[index]));
    })
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
