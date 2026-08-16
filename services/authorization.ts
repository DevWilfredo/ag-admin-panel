import type { UserRole } from "./session-service";

export type Capability =
  | "view:dashboard"
  | "view:transactions"
  | "view:warehouses"
  | "view:inventory"
  | "view:documents"
  | "view:payments"
  | "view:analytics"
  | "manage:users"
  | "manage:orders"
  | "advance:orders"
  | "manage:warehouses"
  | "manage:vessels"
  | "manage:inventory"
  | "upload:documents"
  | "manage:document-status"
  | "delete:documents"
  | "manage:payments";

const readCapabilities: Capability[] = [
  "view:dashboard",
  "view:transactions",
  "view:warehouses",
  "view:inventory",
  "view:documents",
  "view:payments",
];

const capabilitiesByRole: Record<UserRole, ReadonlySet<Capability>> = {
  ADMIN: new Set<Capability>([
    ...readCapabilities,
    "view:analytics",
    "manage:users",
    "manage:orders",
    "advance:orders",
    "manage:warehouses",
    "manage:vessels",
    "manage:inventory",
    "upload:documents",
    "manage:document-status",
    "delete:documents",
    "manage:payments",
  ]),
  BUYER: new Set<Capability>([
    ...readCapabilities,
    "advance:orders",
    "upload:documents",
  ]),
  LENDER: new Set<Capability>([
    ...readCapabilities,
    "advance:orders",
    "upload:documents",
    "manage:document-status",
  ]),
  PRODUCER: new Set<Capability>([
    ...readCapabilities,
    "advance:orders",
    "upload:documents",
  ]),
  WAREHOUSE_KEEPER: new Set<Capability>([
    ...readCapabilities,
    "advance:orders",
    "manage:inventory",
    "upload:documents",
  ]),
};

export function hasCapability(
  role: UserRole | null | undefined,
  capability: Capability,
) {
  return role ? capabilitiesByRole[role].has(capability) : false;
}
