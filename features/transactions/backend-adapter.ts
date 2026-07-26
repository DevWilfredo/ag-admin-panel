import { ApiError, getErrorMessage } from "@/services/api-errors";
import { getCachedCurrentUser } from "@/services/auth-service";
import { getDocumentChecklist, type DocumentChecklistDto } from "@/services/documents-service";
import {
  getOrder,
  getOrderAudit,
  getOrderStageIndex,
  isFinalOrderStatus,
  listOrders,
  orderStatuses,
  type OrderAuditLogDto,
  type OrderDto,
  type OrderListItemDto,
} from "@/services/orders-service";
import { getPaymentByOrder, type PaymentDto } from "@/services/payments-service";
import type {
  TransactionAuditItem,
  TransactionDetail,
  TransactionDocumentChecklist,
  TransactionListItem,
  TransactionPaymentSummary,
  TransactionsDataState,
  TransactionStatus,
  TransactionTab,
  TransactionTabKey,
  TrackerStep,
} from "./types";

type LoadTransactionsOptions = {
  selectedOrderId?: string;
  selectedTransaction?: string;
  tab: TransactionTabKey;
};

type ResourceResult<T> =
  | { status: "ready"; data: T }
  | { status: "restricted" }
  | { status: "missing" }
  | { status: "error"; message: string };

const tabDefinitions: {
  key: TransactionTabKey;
  label: TransactionTab["label"];
}[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "closed", label: "Closed" },
  { key: "alerts", label: "Alerts" },
];

const mapPreview = {
  labels: [
    "Barranquilla",
    "Cartagena de Indias",
    "Maracaibo",
    "Valledupar",
    "Caracas",
    "Puerto La Cruz",
    "Trinidad y Tobago",
  ],
  primaryPinLabel: "Current vessel position unavailable",
  secondaryPinLabel: "Destination marker unavailable",
};

export async function loadTransactionsBackendState(options: LoadTransactionsOptions): Promise<TransactionsDataState> {
  if (options.tab === "alerts") {
    return {
      status: "empty",
      title: "Alerts are not available",
      message: "The backend does not document an alert endpoint or alert model yet.",
    };
  }

  try {
    const listResponse = await listOrders({
      limit: 20,
      page: 1,
      status: options.tab === "closed" ? "FUNDS_DISTRIBUTED" : undefined,
    });
    const visibleOrders = filterOrdersForTab(listResponse.orders, options.tab);

    if (visibleOrders.length === 0) {
      return {
        status: "empty",
        title: "No transactions found",
        message: "No backend orders matched the selected transaction view.",
      };
    }

    const selectedOrder = selectOrder(visibleOrders, options);
    const orderDetail = await loadOrderDetail(selectedOrder);
    const [auditResult, checklistResult, paymentResult] = await Promise.all([
      loadResource(() => getOrderAudit(selectedOrder.id)),
      loadResource(() => getDocumentChecklist(selectedOrder.id)),
      loadResource(() => getPaymentByOrder(selectedOrder.id)),
    ]);

    return {
      status: "ready",
      data: {
        header: buildTransactionsHeader(),
        resultCount: `${listResponse.pagination.total} total / ${visibleOrders.length} shown`,
        selectedTransaction: mapOrderToTransactionDetail(orderDetail, {
          auditResult,
          checklistResult,
          paymentResult,
        }),
        tabs: buildTabs(options.tab),
        transactions: visibleOrders.map((order) => mapOrderToTransactionListItem(order, options.tab)),
      },
    };
  } catch (error) {
    return mapLoadError(error);
  }
}

export function mapOrderToTransactionListItem(order: OrderListItemDto | OrderDto, tab: TransactionTabKey = "all"): TransactionListItem {
  const status = mapOrderVisualStatus(order.status);

  return {
    id: order.id,
    backendStatusLabel: formatOrderStatus(order.status),
    commodity: order.commodityType || "Commodity not provided",
    href: buildOrderHref(order, tab),
    number: order.orderNumber || order.id,
    progressPercent: getStageProgressPercent(order.status),
    status,
    volume: formatQuantity(order.quantity, order.unit),
  };
}

function buildTransactionsHeader() {
  const user = getCachedCurrentUser();

  return {
    title: "Transactions",
    dateLabel: "12 Ene 2026",
    searchPlaceholder: "Search TXN ID / COMMODITY / LOT",
    unreadNotifications: 0,
    avatarLabel: user ? `${user.fullName} profile` : "User profile",
    avatarSrc: "/user-avatar.png",
    profileName: user?.fullName,
    profileSubtitle: user ? `${formatRole(user.role)} - AgroTrust Backoffice` : undefined,
  };
}

function buildTabs(activeTab: TransactionTabKey): TransactionTab[] {
  return tabDefinitions.map((tab) => ({
    active: tab.key === activeTab,
    label: tab.label,
  }));
}

function filterOrdersForTab(orders: OrderListItemDto[], tab: TransactionTabKey) {
  if (tab === "active") {
    return orders.filter((order) => !isFinalOrderStatus(order.status));
  }

  return orders;
}

function selectOrder(orders: OrderListItemDto[], options: LoadTransactionsOptions) {
  const requested = options.selectedOrderId || options.selectedTransaction;

  if (!requested) {
    return orders[0];
  }

  return orders.find((order) => order.id === requested || order.orderNumber === requested) ?? orders[0];
}

async function loadOrderDetail(order: OrderListItemDto) {
  try {
    return await getOrder(order.id);
  } catch {
    return order;
  }
}

async function loadResource<T>(loader: () => Promise<T>): Promise<ResourceResult<T>> {
  try {
    return {
      status: "ready",
      data: await loader(),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return { status: "restricted" };
    }

    if (error instanceof ApiError && error.status === 404) {
      return { status: "missing" };
    }

    return {
      status: "error",
      message: getErrorMessage(error, "The backend resource could not be loaded."),
    };
  }
}

function mapLoadError(error: unknown): TransactionsDataState {
  if (error instanceof ApiError && error.status === 401) {
    return {
      status: "unauthorized",
      title: "Sign in required",
      message: "A valid session is required before transactions can be loaded.",
    };
  }

  if (error instanceof ApiError && error.status === 403) {
    return {
      status: "forbidden",
      title: "Access restricted",
      message: "Your role is not allowed to view backend orders.",
    };
  }

  return {
    status: "error",
    title: "Transactions unavailable",
    message: getErrorMessage(error, "The backend orders source could not be loaded."),
  };
}

function mapOrderToTransactionDetail(
  order: OrderDto | OrderListItemDto,
  resources: {
    auditResult: ResourceResult<OrderAuditLogDto[]>;
    checklistResult: ResourceResult<DocumentChecklistDto>;
    paymentResult: ResourceResult<PaymentDto>;
  },
): TransactionDetail {
  const status = mapOrderVisualStatus(order.status);
  const progressPercent = getStageProgressPercent(order.status);
  const checklist = mapChecklist(resources.checklistResult);
  const payment = mapPayment(resources.paymentResult);
  const auditTimeline = mapAuditTimeline(resources.auditResult);
  const paymentAmount = resources.paymentResult.status === "ready" ? formatMoney(resources.paymentResult.data.amount, resources.paymentResult.data.currency) : "Not available";

  return {
    id: order.id,
    alerts: [],
    auditTimeline,
    backendStatusLabel: formatOrderStatus(order.status),
    backendUnsupported: [
      "Alerts, ETA, current coordinates, shipment tracking, and export are not documented backend capabilities.",
    ],
    commodity: order.commodityType || "Commodity not provided",
    documentChecklist: checklist,
    etaLabel: "ETA not provided",
    keyInfo: [
      { label: "ETA", value: "Not provided" },
      { label: "PROGRESS", value: `${progressPercent}%` },
      { label: "VESSEL", value: getVesselLabel(order.vessel) },
      { label: "DOCUMENTS", value: checklist.uploadedLabel },
      { label: "PAYMENT", value: paymentAmount },
    ],
    map: mapPreview,
    number: order.orderNumber || order.id,
    paymentSummary: payment,
    progressPercent,
    route: {
      origin: getParticipantName(order.producer, "Origin not provided"),
      destination: order.destinationCountry || getParticipantName(order.buyer, "Destination not provided"),
    },
    stageLabel: formatOrderStatus(order.status),
    status,
    tracker: buildBackendTracker(order.status),
    trackerSummary: `Step ${Math.max(getOrderStageIndex(order.status), 1)} of ${orderStatuses.length}`,
    volume: formatQuantity(order.quantity, order.unit),
  };
}

function mapChecklist(result: ResourceResult<DocumentChecklistDto>): TransactionDocumentChecklist {
  if (result.status === "ready") {
    return {
      completionPercent: result.data.completionPercentage,
      items: result.data.checklist.map((item) => ({
        href: item.fileUrl || undefined,
        label: formatDocumentType(item.type),
        status: formatOrderStatus(item.status),
        uploaded: item.uploaded,
      })),
      label: `${result.data.completionPercentage}% complete`,
      pendingLabel: `${result.data.totalPending} pending`,
      state: "ready",
      uploadedLabel: `${result.data.totalUploaded}/${result.data.totalRequired} uploaded`,
    };
  }

  if (result.status === "restricted") {
    return {
      completionPercent: 0,
      items: [],
      label: "Restricted",
      pendingLabel: "Permission required",
      state: "restricted",
      uploadedLabel: "Restricted",
    };
  }

  return {
    completionPercent: 0,
    items: [],
    label: "Not available",
    pendingLabel: "No checklist",
    state: "missing",
    uploadedLabel: "Not available",
  };
}

function mapPayment(result: ResourceResult<PaymentDto>): TransactionPaymentSummary {
  if (result.status === "ready") {
    const amount = formatMoney(result.data.amount, result.data.currency);

    return {
      amountLabel: amount,
      bankLabel: result.data.escrowBank || "Escrow bank not provided",
      label: formatOrderStatus(result.data.status),
      state: "ready",
      timelineLabel: formatPaymentTimeline(result.data),
    };
  }

  if (result.status === "restricted") {
    return {
      amountLabel: "Restricted",
      bankLabel: "Permission required",
      label: "Restricted",
      state: "restricted",
      timelineLabel: "Payment data is not available for this role",
    };
  }

  return {
    amountLabel: "Not created",
    bankLabel: "No payment record",
    label: "Not available",
    state: "missing",
    timelineLabel: "No payment record is available for this order",
  };
}

function mapAuditTimeline(result: ResourceResult<OrderAuditLogDto[]>): TransactionAuditItem[] {
  if (result.status !== "ready") {
    return [];
  }

  return result.data.slice(0, 4).map((item) => ({
    detail: item.notes || `${formatOrderStatus(item.fromStatus || "CREATED")} -> ${formatOrderStatus(item.toStatus)}`,
    timeLabel: formatDateTime(item.createdAt),
    title: `${formatOrderStatus(item.toStatus)} by ${item.user?.fullName || "Unknown user"}`,
  }));
}

function buildBackendTracker(status: string): TrackerStep[] {
  const currentStage = Math.max(getOrderStageIndex(status), 1);

  return orderStatuses.map((orderStatus, index) => {
    const step = index + 1;

    return {
      label: getShortStageLabel(orderStatus),
      state: step < currentStage ? "complete" : step === currentStage ? "current" : "upcoming",
      step,
    };
  });
}

function buildOrderHref(order: OrderListItemDto | OrderDto, tab: TransactionTabKey) {
  const params = new URLSearchParams();

  if (tab !== "all") {
    params.set("tab", tab);
  }

  params.set("orderId", order.id);

  return `/transactions?${params.toString()}`;
}

function mapOrderVisualStatus(status: string): TransactionStatus {
  return isFinalOrderStatus(status) ? "Closed" : "Active";
}

function getStageProgressPercent(status: string) {
  const stageIndex = getOrderStageIndex(status);

  if (stageIndex <= 0) {
    return 0;
  }

  return Math.round((stageIndex / orderStatuses.length) * 100);
}

function formatQuantity(quantity?: number | string, unit?: string) {
  if (quantity === undefined || quantity === null || quantity === "") {
    return "Quantity not provided";
  }

  const parsed = typeof quantity === "number" ? quantity : Number(quantity);
  const value = Number.isFinite(parsed) ? new Intl.NumberFormat("en-US").format(parsed) : String(quantity);

  return `${value}${unit ? ` ${unit}` : ""}`;
}

function formatMoney(amount?: number | string | null, currency = "USD") {
  if (amount === undefined || amount === null || amount === "") {
    return "Not available";
  }

  const parsed = typeof amount === "number" ? amount : Number(amount);

  if (!Number.isFinite(parsed)) {
    return `${currency} ${amount}`;
  }

  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(parsed);
}

function formatPaymentTimeline(payment: PaymentDto) {
  if (payment.distributedAt) {
    return `Distributed ${formatDateTime(payment.distributedAt)}`;
  }

  if (payment.receivedAt) {
    return `Received ${formatDateTime(payment.receivedAt)}`;
  }

  if (payment.sentToEscrowAt) {
    return `Sent ${formatDateTime(payment.sentToEscrowAt)}`;
  }

  return "Payment opened";
}

function formatDateTime(value: string) {
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

function formatOrderStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDocumentType(type: string) {
  return formatOrderStatus(type);
}

function getShortStageLabel(status: string) {
  const labels: Record<string, string> = {
    BILL_OF_LADING: "B/L",
    CARGO_BOOKING: "Booking",
    CARGO_IN_TRANSIT: "Transit",
    CERTIFICATION: "Cert.",
    COLLATERALIZATION: "Collateral",
    DOCUMENT_CONTROL: "Control",
    FUNDS_DISTRIBUTED: "Distributed",
    INVENTORY_DELIVERED: "Inventory",
    PAYMENT_RECEIVED: "Received",
    PAYMENT_TO_ESCROW: "Escrow",
    SHIPPING_DOCUMENTS: "Docs",
    WAREHOUSE_RECEIPT: "Receipt",
  };

  return labels[status] || formatOrderStatus(status);
}

function getParticipantName(participant: OrderDto["producer"], fallback: string) {
  return participant?.fullName || fallback;
}

function getVesselLabel(vessel: OrderDto["vessel"]) {
  if (!vessel) {
    return "Not provided";
  }

  if (typeof vessel === "string") {
    return vessel;
  }

  return vessel.name || vessel.vesselName || "Not provided";
}
