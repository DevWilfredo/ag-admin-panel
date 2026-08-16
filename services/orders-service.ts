import { apiRequest } from "./api-client";

export const orderStatuses = [
  "INVENTORY_DELIVERED",
  "CERTIFICATION",
  "WAREHOUSE_RECEIPT",
  "COLLATERALIZATION",
  "CARGO_BOOKING",
  "BILL_OF_LADING",
  "CARGO_IN_TRANSIT",
  "SHIPPING_DOCUMENTS",
  "DOCUMENT_CONTROL",
  "PAYMENT_TO_ESCROW",
  "PAYMENT_RECEIVED",
  "FUNDS_DISTRIBUTED",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type OrderParticipantDto = {
  id?: string;
  email?: string;
  fullName?: string;
  role?: string;
};

export type VesselDto = {
  id?: string;
  name?: string;
  vesselName?: string;
  currentLocation?: string;
};

export type OrderDto = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  commodityType?: string;
  quantity?: number | string;
  unit?: string;
  lotId?: string;
  destinationCountry?: string;
  producer?: OrderParticipantDto | null;
  buyer?: OrderParticipantDto | null;
  lender?: OrderParticipantDto | null;
  keeper?: OrderParticipantDto | null;
  documents?: unknown[];
  payment?: unknown;
  vessel?: VesselDto | string | null;
  auditLogs?: OrderAuditLogDto[];
  createdAt?: string;
  updatedAt?: string;
};

export type OrderListItemDto = Partial<OrderDto> & {
  id: string;
  orderNumber: string;
  status: OrderStatus;
};

export type OrderAuditLogDto = {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  notes?: string | null;
  user?: {
    fullName?: string;
    role?: string;
  } | null;
  createdAt: string;
};

export type OrderPaginationDto = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListOrdersParams = {
  status?: OrderStatus;
  commodityType?: string;
  page?: number;
  limit?: number;
  orderNumber?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ListOrdersResponse = {
  orders: OrderListItemDto[];
  pagination: OrderPaginationDto;
};

export type CreateOrderPayload = {
  commodityType: string;
  quantity: number;
  unit?: string;
  lotId: string;
  destinationCountry: string;
  producerId: string;
  buyerId: string;
  lenderId?: string;
  keeperId?: string;
};

export type CreateOrderResponse = {
  message: string;
  order: OrderDto;
};

export type AdvanceOrderPayload = {
  notes?: string;
};

export type AdvanceOrderResponse = {
  message: string;
  transition: {
    from: OrderStatus;
    to: OrderStatus;
  };
  order: OrderDto;
};

export async function listOrders(params: ListOrdersParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.commodityType) {
    searchParams.set("commodityType", params.commodityType);
  }

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.orderNumber) searchParams.set("orderNumber", params.orderNumber);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);

  const query = searchParams.toString();

  return apiRequest<ListOrdersResponse>(`/orders${query ? `?${query}` : ""}`, {
    auth: true,
    method: "GET",
  });
}

export function createOrder(payload: CreateOrderPayload) {
  return apiRequest<CreateOrderResponse>("/orders", {
    auth: true,
    body: payload,
    method: "POST",
  });
}

export function advanceOrderStage(
  orderId: string,
  payload: AdvanceOrderPayload = {},
) {
  return apiRequest<AdvanceOrderResponse>(`/orders/${orderId}/advance`, {
    auth: true,
    body: payload,
    method: "PATCH",
  });
}

export function getOrderAudit(orderId: string) {
  return apiRequest<OrderAuditLogDto[]>(`/orders/${orderId}/audit`, {
    auth: true,
    method: "GET",
  });
}

export function isOrderStatus(
  status: string | undefined | null,
): status is OrderStatus {
  return orderStatuses.includes(status as OrderStatus);
}

export function getOrderStageIndex(status: string | undefined | null) {
  const index = orderStatuses.findIndex(
    (orderStatus) => orderStatus === status,
  );

  return index >= 0 ? index + 1 : 0;
}

export function isFinalOrderStatus(status: string | undefined | null) {
  return status === "FUNDS_DISTRIBUTED";
}
