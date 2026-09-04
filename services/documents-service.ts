import { apiRequest } from "./api-client";

export const documentTypes = [
  "QUALITY_CERTIFICATE",
  "WAREHOUSE_RECEIPT",
  "PLEDGE_BOND",
  "LOAN_CONTRACT",
  "MASTER_BILL_OF_LADING",
  "HOUSE_BILL_OF_LADING",
  "COMMERCIAL_INVOICE",
  "PACKING_LIST",
  "BOOKING_CONFIRMATION",
  "PAYMENT_CONFIRMATION",
] as const;

export type DocumentType = (typeof documentTypes)[number];

export const documentTypeLabels: Record<DocumentType, string> = {
  QUALITY_CERTIFICATE: "Quality Certificate",
  WAREHOUSE_RECEIPT: "Warehouse Receipt",
  PLEDGE_BOND: "Pledge Bond",
  LOAN_CONTRACT: "Loan Contract",
  MASTER_BILL_OF_LADING: "Master Bill of Lading",
  HOUSE_BILL_OF_LADING: "House Bill of Lading",
  COMMERCIAL_INVOICE: "Commercial Invoice",
  PACKING_LIST: "Packing List",
  BOOKING_CONFIRMATION: "Booking Confirmation",
  PAYMENT_CONFIRMATION: "Payment Confirmation",
};

export function getDocumentTypeLabel(type: string) {
  return documentTypeLabels[type as DocumentType] || type.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export type DocumentStatus = "PENDING" | "UPLOADED" | "ENDORSED" | "RELEASED";

export type DocumentChecklistItemDto = {
  type: DocumentType;
  status: DocumentStatus;
  uploaded: boolean;
  fileUrl: string | null;
};

export type DocumentChecklistDto = {
  orderNumber: string;
  totalRequired: number;
  totalUploaded: number;
  totalPending: number;
  completionPercentage: number;
  checklist: DocumentChecklistItemDto[];
};

export type DocumentDto = {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string | null;
  holderNote?: string | null;
  uploadedBy?: {
    fullName?: string;
  } | null;
};

export type UploadDocumentPayload = {
  orderId: string;
  type: DocumentType;
  file: File;
  holderNote?: string;
};

export type UploadDocumentResponse = {
  message: string;
  document: DocumentDto;
};

export type UpdateDocumentStatusPayload = {
  status: "UPLOADED" | "ENDORSED" | "RELEASED";
  holderNote?: string;
};

export type UpdateDocumentStatusResponse = {
  message: string;
  document: DocumentDto;
};

export function uploadDocument(payload: UploadDocumentPayload) {
  const formData = new FormData();
  formData.set("orderId", payload.orderId);
  formData.set("type", payload.type);
  formData.set("file", payload.file);

  if (payload.holderNote) {
    formData.set("holderNote", payload.holderNote);
  }

  return apiRequest<UploadDocumentResponse>("/documents", {
    auth: true,
    body: formData,
    method: "POST",
  });
}

export function getDocumentChecklist(orderId: string) {
  return apiRequest<DocumentChecklistDto>(`/documents/checklist/${orderId}`, {
    auth: true,
    method: "GET",
  });
}

export function getOrderDocuments(orderId: string) {
  return apiRequest<DocumentDto[]>(`/documents/order/${orderId}`, {
    auth: true,
    method: "GET",
  });
}

export function updateDocumentStatus(documentId: string, payload: UpdateDocumentStatusPayload) {
  return apiRequest<UpdateDocumentStatusResponse>(`/documents/${documentId}/status`, {
    auth: true,
    body: payload,
    method: "PATCH",
  });
}

export function getDocument(documentId: string) {
  return apiRequest<DocumentDto>(`/documents/${documentId}`, {
    auth: true,
    method: "GET",
  });
}

export function deleteDocument(documentId: string) {
  return apiRequest<{ message?: string }>(`/documents/${documentId}`, {
    auth: true,
    method: "DELETE",
  });
}
