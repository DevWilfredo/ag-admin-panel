import { ApiError, getErrorMessage } from "@/services/api-errors";
import { getCachedCurrentUser } from "@/services/auth-service";
import {
  getInventoryByOrder,
  type InventoryDto,
} from "@/services/inventory-service";
import {
  getDocumentChecklist,
  getDocumentTypeLabel,
  type DocumentChecklistDto,
} from "@/services/documents-service";
import {
  getOrderAudit,
  getOrderStageIndex,
  isFinalOrderStatus,
  listOrders,
  orderStatuses,
  type OrderAuditLogDto,
  type OrderDto,
  type OrderListItemDto,
} from "@/services/orders-service";
import { getWarehouse, type WarehouseDto } from "@/services/warehouses-service";
import {
  getPaymentByOrder,
  type PaymentDto,
} from "@/services/payments-service";
import {
  getVesselByOrder,
  getVesselLogs,
  type VesselDetails,
  type VesselPosition,
} from "@/services/vessels-service";
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
  orderNumber?: string;
  commodityType?: string;
  dateFrom?: string;
  dateTo?: string;
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

export async function loadTransactionsBackendState(
  options: LoadTransactionsOptions,
): Promise<TransactionsDataState> {
  if (options.tab === "alerts") {
    return {
      status: "empty",
      title: "Alerts are not available",
      message:
        "The backend does not document an alert endpoint or alert model yet.",
    };
  }

  try {
    const listResponse = await listOrders({
      limit: 20,
      page: 1,
      status: options.tab === "closed" ? "FUNDS_DISTRIBUTED" : undefined,
      orderNumber: options.orderNumber,
      commodityType: options.commodityType,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
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
    const [
      auditResult,
      checklistResult,
      paymentResult,
      vesselResult,
      vesselLogsResult,
      inventoryResult,
    ] = await Promise.all([
      loadResource(() => getOrderAudit(selectedOrder.id)),
      loadResource(() => getDocumentChecklist(selectedOrder.id)),
      loadResource(() => getPaymentByOrder(selectedOrder.id)),
      loadResource(() => getVesselByOrder(selectedOrder.id)),
      loadResource(() => getVesselLogs(selectedOrder.id)),
      loadResource(() => getInventoryByOrder(selectedOrder.id)),
    ]);
    const warehouseResult =
      inventoryResult.status === "ready" && inventoryResult.data.warehouse?.id
        ? await loadResource(() => getWarehouse(inventoryResult.data.warehouse!.id!))
        : ({ status: "missing" } as const);

    return {
      status: "ready",
      data: {
        header: buildTransactionsHeader(),
        resultCount: `${listResponse.pagination.total} total / ${visibleOrders.length} shown`,
        selectedTransaction: mapOrderToTransactionDetail(selectedOrder, {
          auditResult,
          checklistResult,
          paymentResult,
          vesselResult,
          vesselLogsResult,
          inventoryResult,
          warehouseResult,
        }),
        tabs: buildTabs(options.tab),
        transactions: visibleOrders.map((order) =>
          mapOrderToTransactionListItem(order, options.tab),
        ),
      },
    };
  } catch (error) {
    return mapLoadError(error);
  }
}

export function mapOrderToTransactionListItem(
  order: OrderListItemDto | OrderDto,
  tab: TransactionTabKey = "all",
): TransactionListItem {
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
    seller: order.producer?.fullName || order.producer?.email || "Not assigned",
    buyer: order.buyer?.fullName || order.buyer?.email || "Not assigned",
    lender: order.lender?.fullName || order.lender?.email || "Not assigned",
    destination: order.destinationCountry || "Not provided",
  };
}

function buildTransactionsHeader() {
  const user = getCachedCurrentUser();

  return {
    title: "Transactions",
    dateLabel: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()),
    searchPlaceholder: "Search transaction number",
    unreadNotifications: 0,
    avatarLabel: user ? `${user.fullName} profile` : "User profile",
    avatarSrc: "/user-avatar.png",
    profileName: user?.fullName,
    profileSubtitle: user
      ? `${formatRole(user.role)} - AgroTrust Backoffice`
      : undefined,
  };
}

function buildTabs(activeTab: TransactionTabKey): TransactionTab[] {
  return tabDefinitions.map((tab) => ({
    active: tab.key === activeTab,
    label: tab.label,
  }));
}

function filterOrdersForTab(
  orders: OrderListItemDto[],
  tab: TransactionTabKey,
) {
  if (tab === "active") {
    return orders.filter((order) => !isFinalOrderStatus(order.status));
  }

  return orders;
}

function selectOrder(
  orders: OrderListItemDto[],
  options: LoadTransactionsOptions,
) {
  const requested = options.selectedOrderId || options.selectedTransaction;

  if (!requested) {
    return orders[0];
  }

  return (
    orders.find(
      (order) => order.id === requested || order.orderNumber === requested,
    ) ?? orders[0]
  );
}

async function loadResource<T>(
  loader: () => Promise<T>,
): Promise<ResourceResult<T>> {
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
      message: getErrorMessage(
        error,
        "The backend resource could not be loaded.",
      ),
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
    message: getErrorMessage(
      error,
      "The backend orders source could not be loaded.",
    ),
  };
}

function mapOrderToTransactionDetail(
  order: OrderDto | OrderListItemDto,
  resources: {
    auditResult: ResourceResult<OrderAuditLogDto[]>;
    checklistResult: ResourceResult<DocumentChecklistDto>;
    paymentResult: ResourceResult<PaymentDto>;
    vesselResult: ResourceResult<VesselDetails>;
    vesselLogsResult: ResourceResult<VesselPosition[]>;
    inventoryResult: ResourceResult<InventoryDto>;
    warehouseResult: ResourceResult<WarehouseDto>;
  },
): TransactionDetail {
  const status = mapOrderVisualStatus(order.status);
  const progressPercent = getStageProgressPercent(order.status);
  const checklist = mapChecklist(resources.checklistResult);
  const payment = mapPayment(resources.paymentResult);
  const auditTimeline = mapAuditTimeline(resources.auditResult);
  const vessel = mapVessel(resources.vesselResult, resources.vesselLogsResult);
  const warehouse = mapWarehouse(resources.inventoryResult, resources.warehouseResult);
  const paymentAmount =
    resources.paymentResult.status === "ready"
      ? formatMoney(
          resources.paymentResult.data.amount,
          resources.paymentResult.data.currency,
        )
      : "Not available";

  return {
    id: order.id,
    alerts: [],
    auditTimeline,
    backendStatusLabel: formatOrderStatus(order.status),
    backendUnsupported: ["Alerts and export are not documented backend capabilities."],
    commodity: order.commodityType || "Commodity not provided",
    documentChecklist: checklist,
    etaLabel: vessel?.eta ? formatDateTime(vessel.eta) : "ETA not provided",
    keyInfo: [
      {
        label: "ETA",
        value: vessel?.eta ? formatDateTime(vessel.eta) : "Not provided",
      },
      { label: "PROGRESS", value: `${progressPercent}%` },
      {
        label: "VESSEL",
        value: vessel?.vesselName || getVesselLabel(order.vessel),
      },
      { label: "DOCUMENTS", value: checklist.uploadedLabel },
      { label: "PAYMENT", value: paymentAmount },
      { label: "SELLER", value: getParticipantName(order.producer, "Not assigned") },
      { label: "BUYER", value: getParticipantName(order.buyer, "Not assigned") },
      { label: "LENDER", value: getParticipantName(order.lender, "Not assigned") },
      { label: "WAREHOUSE", value: warehouse?.name || "Not assigned" },
    ],
    number: order.orderNumber || order.id,
    paymentSummary: payment,
    progressPercent,
    route: {
      origin: getParticipantName(order.producer, "Origin not provided"),
      destination:
        order.destinationCountry ||
        getParticipantName(order.buyer, "Destination not provided"),
    },
    stageLabel: formatOrderStatus(order.status),
    status,
    tracker: buildBackendTracker(order.status, vessel, warehouse, checklist),
    trackerSummary: `Step ${Math.max(getOrderStageIndex(order.status), 1)} of ${orderStatuses.length}`,
    volume: formatQuantity(order.quantity, order.unit),
    vesselDetails: vessel,
    warehouseDetails: warehouse,
  };
}

function mapWarehouse(
  inventory: ResourceResult<InventoryDto>,
  warehouse: ResourceResult<WarehouseDto>,
) {
  if (inventory.status !== "ready") return undefined;
  const inventoryWarehouse = inventory.data.warehouse;
  const detail = warehouse.status === "ready" ? warehouse.data : undefined;
  return {
    name: detail?.name || inventoryWarehouse?.name || "Assigned warehouse",
    location: detail?.location || inventoryWarehouse?.location,
    latitude: detail?.latitude ?? inventoryWarehouse?.latitude ?? undefined,
    longitude: detail?.longitude ?? inventoryWarehouse?.longitude ?? undefined,
    custodyStatus: inventory.data.custodyStatus,
    receiptNumber: inventory.data.receipt?.receiptNumber,
  };
}

function mapVessel(
  result: ResourceResult<VesselDetails>,
  logs: ResourceResult<VesselPosition[]>,
) {
  if (result.status !== "ready") return undefined;
  const data = result.data;
  const position = data.currentPosition || data.position;
  const latitude = position?.latitude ?? data.latitude ?? undefined;
  const longitude = position?.longitude ?? data.longitude ?? undefined;
  const rawStatus = data.trackingStatus || data.status;
  const history =
    logs.status === "ready"
      ? logs.data
          .filter(
            (item) =>
              item.latitude !== undefined && item.longitude !== undefined,
          )
          .map((item) => ({
            latitude: item.latitude!,
            longitude: item.longitude!,
            label: item.portOfCall,
            timestamp: item.timestamp || item.createdAt,
          }))
      : [];
  return {
    vesselName: data.vesselName || data.name || "Assigned vessel",
    shippingLine: data.shippingLine,
    voyageNumber: data.voyageNumber,
    billOfLading: data.billOfLading,
    scac: data.scac,
    eta: position?.eta || data.eta,
    latitude,
    longitude,
    speed: position?.speed,
    portOfCall: position?.portOfCall || data.currentPortOfCall || undefined,
    status:
      latitude !== undefined && longitude !== undefined && rawStatus === "TRACKING_FAILED"
        ? "MANUAL_POSITION"
        : rawStatus,
    history,
  };
}

function mapChecklist(
  result: ResourceResult<DocumentChecklistDto>,
): TransactionDocumentChecklist {
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

function mapPayment(
  result: ResourceResult<PaymentDto>,
): TransactionPaymentSummary {
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

function mapAuditTimeline(
  result: ResourceResult<OrderAuditLogDto[]>,
): TransactionAuditItem[] {
  if (result.status !== "ready") {
    return [];
  }

  return result.data.slice(0, 4).map((item) => ({
    detail:
      item.notes ||
      `${formatOrderStatus(item.fromStatus || "CREATED")} -> ${formatOrderStatus(item.toStatus)}`,
    timeLabel: formatDateTime(item.createdAt),
    title: `${formatOrderStatus(item.toStatus)} by ${item.user?.fullName || "Unknown user"}`,
  }));
}

function buildBackendTracker(
  status: string,
  vessel?: TransactionDetail["vesselDetails"],
  warehouse?: TransactionDetail["warehouseDetails"],
  checklist?: TransactionDetail["documentChecklist"],
): TrackerStep[] {
  const currentStage = Math.max(getOrderStageIndex(status), 1);

  return orderStatuses.map((orderStatus, index) => {
    const step = index + 1;

    const warehouseCheckpoint = [0, 2, 3].includes(index);
    const vesselCheckpoint = [5, 6, 7].includes(index);
    const documentKeywords: Partial<Record<string, string[]>> = {
      CERTIFICATION: ["Quality Certificate"],
      COLLATERALIZATION: ["Pledge Bond", "Loan Contract"],
      BILL_OF_LADING: ["Master Bill Of Lading", "House Bill Of Lading"],
      SHIPPING_DOCUMENTS: ["Commercial Invoice", "Packing List", "Certificate Of Origin", "Phytosanitary Certificate", "Insurance Certificate"],
    };
    const documentHref = checklist?.items.find((item) =>
      documentKeywords[orderStatus]?.some((keyword) => item.label.toLowerCase().includes(keyword.toLowerCase())),
    )?.href;
    return {
      label: getShortStageLabel(orderStatus),
      state:
        step < currentStage
          ? "complete"
          : step === currentStage
            ? "current"
            : "upcoming",
      step,
      documentHref,
      locationPreview:
        warehouseCheckpoint && warehouse?.latitude !== undefined && warehouse.longitude !== undefined
          ? { kind: "warehouse" as const, title: warehouse.name, subtitle: warehouse.location, latitude: warehouse.latitude, longitude: warehouse.longitude }
          : vesselCheckpoint && vessel?.latitude !== undefined && vessel.longitude !== undefined
            ? { kind: "vessel" as const, title: vessel.vesselName, subtitle: vessel.portOfCall, latitude: vessel.latitude, longitude: vessel.longitude }
            : undefined,
    };
  });
}

function buildOrderHref(
  order: OrderListItemDto | OrderDto,
  tab: TransactionTabKey,
) {
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
  const value = Number.isFinite(parsed)
    ? new Intl.NumberFormat("en-US").format(parsed)
    : String(quantity);

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
  return getDocumentTypeLabel(type);
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

function getParticipantName(
  participant: OrderDto["producer"],
  fallback: string,
) {
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
