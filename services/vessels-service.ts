import { apiRequest } from "./api-client";

export type VesselPosition = {
  latitude?: number;
  longitude?: number;
  speed?: number;
  portOfCall?: string;
  eta?: string;
  createdAt?: string;
  timestamp?: string;
};
export type VesselDetails = {
  id?: string;
  orderId?: string;
  vesselName?: string;
  name?: string;
  shippingLine?: string;
  voyageNumber?: string;
  billOfLading?: string;
  scac?: string;
  eta?: string;
  latitude?: number | null;
  longitude?: number | null;
  currentPortOfCall?: string | null;
  trackingStatus?: string;
  lastUpdated?: string;
  currentPosition?: VesselPosition;
  position?: VesselPosition;
  trackingLogs?: VesselPosition[];
  status?: string;
};
export type AssignVesselPayload = {
  orderId: string;
  vesselName: string;
  shippingLine?: string;
  voyageNumber?: string;
  billOfLading?: string;
  scac?: string;
};
export type UpdateVesselPayload = Omit<AssignVesselPayload, "orderId"> & {
  eta?: string;
};
export type UpdatePositionPayload = {
  latitude?: number;
  longitude?: number;
  speed?: number;
  portOfCall?: string;
  eta?: string;
};
type VesselResponse =
  VesselDetails | { vessel?: VesselDetails; data?: VesselDetails };
type LogsResponse =
  | VesselPosition[]
  | { logs?: VesselPosition[]; trackingLogs?: VesselPosition[] };

export async function assignVessel(payload: AssignVesselPayload) {
  return unwrap(
    await apiRequest<VesselResponse>("/vessels", {
      auth: true,
      method: "POST",
      body: payload,
    }),
  );
}
export async function getVesselByOrder(orderId: string) {
  return unwrap(
    await apiRequest<VesselResponse>(`/vessels/order/${orderId}`, {
      auth: true,
    }),
  );
}
export function updateVessel(orderId: string, payload: UpdateVesselPayload) {
  return apiRequest<VesselDetails>(`/vessels/order/${orderId}`, {
    auth: true,
    method: "PUT",
    body: payload,
  });
}
export function getVesselLogs(orderId: string) {
  return apiRequest<LogsResponse>(`/vessels/order/${orderId}/logs`, {
    auth: true,
  }).then((response) =>
    Array.isArray(response)
      ? response
      : response.logs || response.trackingLogs || [],
  );
}

function unwrap(response: VesselResponse): VesselDetails {
  if ("vessel" in response || "data" in response)
    return response.vessel || response.data || {};
  return response as VesselDetails;
}
export function retryVesselTracking(orderId: string) {
  return apiRequest<VesselDetails>(`/vessels/order/${orderId}/retry`, {
    auth: true,
    method: "POST",
  });
}
export function updateVesselPosition(
  orderId: string,
  payload: UpdatePositionPayload,
) {
  return apiRequest<VesselDetails>(`/vessels/order/${orderId}/position`, {
    auth: true,
    method: "PATCH",
    body: payload,
  });
}
