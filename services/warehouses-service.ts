import { apiRequest } from "./api-client";

export type WarehouseDto = {
  id: string;
  name: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  keeper?: {
    fullName?: string;
  } | null;
  inventories?: Array<{
    lotId?: string;
    quantity?: number | string;
    custodyStatus?: string;
  }>;
  _count?: {
    inventories?: number;
  };
};

export type CreateWarehousePayload = {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  keeperId?: string;
};

export type UpdateWarehousePayload = {
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  keeperId?: string;
};

export type WarehouseMutationResponse = {
  message: string;
  warehouse: WarehouseDto;
};

export function createWarehouse(payload: CreateWarehousePayload) {
  return apiRequest<WarehouseMutationResponse>("/warehouses", {
    auth: true,
    body: payload,
    method: "POST",
  });
}

export function listWarehouses() {
  return apiRequest<WarehouseDto[]>("/warehouses", {
    auth: true,
    method: "GET",
  });
}

export function getWarehouse(warehouseId: string) {
  return apiRequest<WarehouseDto>(`/warehouses/${warehouseId}`, {
    auth: true,
    method: "GET",
  });
}

export function updateWarehouse(warehouseId: string, payload: UpdateWarehousePayload) {
  return apiRequest<WarehouseMutationResponse>(`/warehouses/${warehouseId}`, {
    auth: true,
    body: payload,
    method: "PUT",
  });
}

export function deleteWarehouse(warehouseId: string) {
  return apiRequest<{ message?: string }>(`/warehouses/${warehouseId}`, {
    auth: true,
    method: "DELETE",
  });
}
