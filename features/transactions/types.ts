import type { AppShellHeader } from "@/components/app-shell";

export type TransactionsDataState =
  | { status: "loading" }
  | { status: "empty"; title: string; message: string }
  | { status: "error"; title: string; message: string }
  | { status: "unauthorized"; title: string; message: string }
  | { status: "forbidden"; title: string; message: string }
  | { status: "ready"; data: TransactionsData };

export type TransactionsData = {
  header: AppShellHeader;
  tabs: TransactionTab[];
  resultCount: string;
  transactions: TransactionListItem[];
  selectedTransaction: TransactionDetail;
};

export type TransactionTab = {
  label: "All" | "Active" | "Closed" | "Alerts";
  active: boolean;
};

export type TransactionTabKey = "all" | "active" | "closed" | "alerts";

export type TransactionStatus = "Active" | "Alert" | "Closed";

export type TransactionListItem = {
  id: string;
  number: string;
  commodity: string;
  volume: string;
  status: TransactionStatus;
  progressPercent: number;
  href: string;
  backendStatusLabel?: string;
};

export type TransactionDetail = {
  id: string;
  number: string;
  status: TransactionStatus;
  commodity: string;
  volume: string;
  route: {
    origin: string;
    destination: string;
  };
  progressPercent: number;
  tracker: TrackerStep[];
  trackerSummary: string;
  stageLabel: string;
  alerts: string[];
  keyInfo: KeyInfoItem[];
  etaLabel: string;
  map: MapPreview;
  backendStatusLabel?: string;
  backendUnsupported?: string[];
  documentChecklist?: TransactionDocumentChecklist;
  paymentSummary?: TransactionPaymentSummary;
  auditTimeline?: TransactionAuditItem[];
};

export type TrackerStep = {
  step: number;
  label: string;
  state: "complete" | "current" | "upcoming";
};

export type KeyInfoItem = {
  label: string;
  value: string;
};

export type MapPreview = {
  labels: string[];
  primaryPinLabel: string;
  secondaryPinLabel: string;
};

export type TransactionDocumentChecklist = {
  label: string;
  uploadedLabel: string;
  pendingLabel: string;
  completionPercent: number;
  items: {
    label: string;
    status: string;
    uploaded: boolean;
    href?: string;
  }[];
  state: "ready" | "restricted" | "missing";
};

export type TransactionPaymentSummary = {
  label: string;
  amountLabel: string;
  bankLabel: string;
  timelineLabel: string;
  state: "ready" | "restricted" | "missing";
};

export type TransactionAuditItem = {
  title: string;
  detail: string;
  timeLabel: string;
};
