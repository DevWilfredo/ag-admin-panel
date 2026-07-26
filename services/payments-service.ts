import { apiRequest } from "./api-client";

export type PaymentStatus = "OPEN" | "PARTIALLY_SETTLED" | "SETTLED";

export type PaymentDto = {
  id: string;
  amount: number | string;
  currency: string;
  escrowBank?: string | null;
  status: PaymentStatus;
  loanAmount?: number | string | null;
  interestAmount?: number | string | null;
  sentToEscrowAt?: string | null;
  receivedAt?: string | null;
  distributedAt?: string | null;
  order?: unknown;
};

export type CreatePaymentPayload = {
  orderId: string;
  amount: number;
  currency: string;
  escrowBank: string;
  loanAmount: number;
  interestAmount: number;
};

export type CreatePaymentResponse = {
  payment: PaymentDto;
};

export type MarkPaymentSentPayload = {
  escrowBank: string;
  notes?: string;
};

export type MarkPaymentReceivedPayload = {
  notes?: string;
};

export type DistributePaymentPayload = {
  amountPaid: number;
  notes?: string;
};

export type DistributePaymentResponse = {
  payment: PaymentDto;
  settlement: {
    amountPaid: number | string;
    totalOwed: number | string;
    remainingBalance: number | string;
    status: PaymentStatus;
  };
};

export type LenderPaymentHistoryDto = {
  summary: {
    totalLoaned: number | string;
    totalInterest: number | string;
    totalSettled: number;
    totalPending: number;
  };
  payments: Array<{
    id: string;
    status: PaymentStatus;
    order?: {
      orderNumber?: string;
    };
  }>;
};

export function createPayment(payload: CreatePaymentPayload) {
  return apiRequest<CreatePaymentResponse>("/payments", {
    auth: true,
    body: payload,
    method: "POST",
  });
}

export function markPaymentSent(orderId: string, payload: MarkPaymentSentPayload) {
  return apiRequest<PaymentDto>(`/payments/order/${orderId}/sent`, {
    auth: true,
    body: payload,
    method: "PATCH",
  });
}

export function markPaymentReceived(orderId: string, payload: MarkPaymentReceivedPayload = {}) {
  return apiRequest<PaymentDto>(`/payments/order/${orderId}/received`, {
    auth: true,
    body: payload,
    method: "PATCH",
  });
}

export function distributePayment(orderId: string, payload: DistributePaymentPayload) {
  return apiRequest<DistributePaymentResponse>(`/payments/order/${orderId}/distribute`, {
    auth: true,
    body: payload,
    method: "PATCH",
  });
}

export function getPaymentByOrder(orderId: string) {
  return apiRequest<PaymentDto>(`/payments/order/${orderId}`, {
    auth: true,
    method: "GET",
  });
}

export function getLenderPaymentHistory() {
  return apiRequest<LenderPaymentHistoryDto>("/payments/lender/history", {
    auth: true,
    method: "GET",
  });
}
