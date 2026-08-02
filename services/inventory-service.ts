import { apiRequest } from "./api-client";

export type CustodyStatus = "IN_CUSTODY" | "RELEASED" | "TRANSFERRED";

export type InventoryDto = {
  id: string;
  custodyStatus: CustodyStatus;
  quantity?: number | string;
  unit?: string;
  lotId?: string;
  releasedAt?: string | null;
  transferredAt?: string | null;
  photoUrls?: string[];
  receipt?: {
    receiptNumber?: string;
    quantityConfirmed?: number | string;
    issueDate?: string;
    operator?: {
      fullName?: string;
    };
  } | null;
  order?: {
    orderNumber?: string;
  };
  warehouse?: unknown;
};

export type ListInventoryParams = {
  custodyStatus?: CustodyStatus;
  warehouseId?: string;
};

export type CreateInventoryPayload = {
  orderId: string;
  warehouseId: string;
  commodityType: string;
  quantity: number;
  unit?: string;
  lotId: string;
  dateReceived?: string;
};

export type CreateInventoryResponse = {
  inventory: InventoryDto;
};

export type UploadInventoryPhotosResponse = {
  message: string;
  inventory: InventoryDto;
};

export type IssueWarehouseReceiptPayload = {
  quantityConfirmed: number;
};

export type IssueWarehouseReceiptResponse = {
  receipt: NonNullable<InventoryDto["receipt"]>;
};

export type UpdateCustodyPayload = {
  custodyStatus: CustodyStatus;
};

export function createInventory(payload: CreateInventoryPayload) {
  return apiRequest<CreateInventoryResponse>("/inventory", {
    auth: true,
    body: payload,
    method: "POST",
  });
}

export function uploadInventoryPhotos(inventoryId: string, photos: File[]) {
  const formData = new FormData();

  photos.forEach((photo) => {
    formData.append("photos", photo);
  });

  return apiRequest<UploadInventoryPhotosResponse>(`/inventory/${inventoryId}/photos`, {
    auth: true,
    body: formData,
    method: "POST",
  });
}

export function issueWarehouseReceipt(inventoryId: string, payload: IssueWarehouseReceiptPayload) {
  return apiRequest<IssueWarehouseReceiptResponse>(`/inventory/${inventoryId}/receipt`, {
    auth: true,
    body: payload,
    method: "POST",
  });
}

export function updateInventoryCustody(inventoryId: string, payload: UpdateCustodyPayload) {
  return apiRequest<InventoryDto>(`/inventory/${inventoryId}/custody`, {
    auth: true,
    body: payload,
    method: "PATCH",
  });
}

export function getInventoryByOrder(orderId: string) {
  return apiRequest<InventoryDto>(`/inventory/order/${orderId}`, {
    auth: true,
    method: "GET",
  });
}

export function listInventory(params: ListInventoryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.custodyStatus) {
    searchParams.set("custodyStatus", params.custodyStatus);
  }

  if (params.warehouseId) {
    searchParams.set("warehouseId", params.warehouseId);
  }

  const query = searchParams.toString();

  return apiRequest<InventoryDto[]>(`/inventory${query ? `?${query}` : ""}`, {
    auth: true,
    method: "GET",
  });
}
