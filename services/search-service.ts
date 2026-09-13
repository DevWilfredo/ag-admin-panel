import { apiRequest } from "./api-client";

export const searchTypes = [
  "orders",
  "documents",
  "warehouses",
  "inventory",
  "payments",
  "users",
] as const;

export type SearchType = (typeof searchTypes)[number];
export type SearchItem = Record<string, unknown> & { id: string };
export type QuickSearchResponse = {
  query: string;
  totalResults: number;
  results: Record<SearchType, SearchItem[]>;
};
export type ScopedSearchResponse = {
  query: string;
  type: SearchType;
  results: SearchItem[];
  pagination: { page: number; limit: number; total: number; totalPages?: number };
};

export function quickSearch(query: string, signal?: AbortSignal) {
  return apiRequest<QuickSearchResponse>(`/search?q=${encodeURIComponent(query)}`, {
    auth: true,
    signal,
  });
}

export function scopedSearch(
  query: string,
  type: SearchType,
  page = 1,
  limit = 10,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    q: query,
    type,
    page: String(page),
    limit: String(limit),
  });
  return apiRequest<ScopedSearchResponse>(`/search?${params}`, {
    auth: true,
    signal,
  });
}

export function searchItemTitle(type: SearchType, item: SearchItem) {
  return text(item.orderNumber) || text(item.fileName) || text(item.name) ||
    text(item.fullName) || text(item.lotId) || text(item.escrowBank) || "Result";
}

export function searchItemDescription(type: SearchType, item: SearchItem) {
  if (type === "orders") return join(item.commodityType, item.destinationCountry);
  if (type === "documents") return join(item.type, nested(item, "order", "orderNumber"));
  if (type === "warehouses") return text(item.location);
  if (type === "inventory") return join(item.commodityType, nested(item, "warehouse", "name"));
  if (type === "payments") return join(item.status, item.currency, item.amount);
  return join(item.email, item.role);
}

export function searchItemHref(type: SearchType, item: SearchItem) {
  const orderId = text(item.orderId) || nested(item, "order", "id");
  const orderNumber = text(item.orderNumber) || nested(item, "order", "orderNumber");
  if (type === "orders") return `/transactions?orderId=${encodeURIComponent(item.id)}`;
  if (type === "documents") return orderId ? `/transactions?orderId=${encodeURIComponent(orderId)}` : "/documents";
  if (type === "warehouses") return `/warehouses?search=${encodeURIComponent(searchItemTitle(type, item))}`;
  if (type === "inventory") return orderId ? `/transactions?orderId=${encodeURIComponent(orderId)}` : "/inventory";
  if (type === "payments") return orderId ? `/transactions?orderId=${encodeURIComponent(orderId)}` : "/payments";
  if (type === "users") return `/users?search=${encodeURIComponent(searchItemTitle(type, item))}`;
  return orderNumber ? `/transactions?orderNumber=${encodeURIComponent(orderNumber)}` : "/dashboard";
}

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
function nested(item: SearchItem, parent: string, key: string) {
  const value = item[parent];
  return value && typeof value === "object" ? text((value as Record<string, unknown>)[key]) : "";
}
function join(...values: unknown[]) {
  return values.map(text).filter(Boolean).join(" · ");
}
