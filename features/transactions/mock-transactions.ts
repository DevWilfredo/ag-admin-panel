import type { TransactionDetail, TransactionListItem, TransactionTab, TransactionTabKey, TransactionsData, TransactionsDataState } from "./types";

type PreviewState = Exclude<TransactionsDataState["status"], "ready">;

const previewStates = new Set<PreviewState>([
  "loading",
  "empty",
  "error",
  "unauthorized",
  "forbidden",
]);

export function getTransactionsMockState(requestedState?: string, requestedTab: TransactionTabKey = "all"): TransactionsDataState {
  if (requestedState && previewStates.has(requestedState as PreviewState)) {
    return createPreviewState(requestedState as PreviewState);
  }

  return {
    status: "ready",
    data: createTransactionsData(requestedTab),
  };
}

function createPreviewState(status: PreviewState): TransactionsDataState {
  switch (status) {
    case "loading":
      return { status: "loading" };
    case "empty":
      return {
        status,
        title: "No transactions found",
        message: "Transactions will appear here once a live order source or approved mock data is available.",
      };
    case "error":
      return {
        status,
        title: "Transactions unavailable",
        message: "The transaction view could not be loaded. Try again when the backend source is available.",
      };
    case "unauthorized":
      return {
        status,
        title: "Sign in required",
        message: "A valid session is required before transactions can be loaded.",
      };
    case "forbidden":
      return {
        status,
        title: "Access restricted",
        message: "Your role is not allowed to view this transaction state.",
      };
  }
}

const transactionsHeader = {
  title: "Transactions",
  dateLabel: "12 Ene 2026",
  searchPlaceholder: "Search TXN ID / COMMODITY / LOT",
  unreadNotifications: 0,
  avatarLabel: "System Admin",
  avatarSrc: "/user-avatar.png",
};

const tabDefinitions: {
  key: TransactionTabKey;
  label: TransactionTab["label"];
}[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "closed", label: "Closed" },
  { key: "alerts", label: "Alerts" },
];

const allTransactions: TransactionListItem[] = [
  {
    id: "mock-txn-0044",
    number: "TXN-0044",
    commodity: "Soybean",
    volume: "2,400 MT",
    status: "Active",
    progressPercent: 63,
    href: "/transactions?transaction=TXN-0044",
  },
  {
    id: "mock-txn-0041",
    number: "TXN-0041",
    commodity: "Coffee",
    volume: "800 MT",
    status: "Alert",
    progressPercent: 45,
    href: "/transactions?tab=alerts&transaction=TXN-0041",
  },
  {
    id: "mock-txn-0038",
    number: "TXN-0038",
    commodity: "Corn",
    volume: "3,100 MT",
    status: "Active",
    progressPercent: 32,
    href: "/transactions?transaction=TXN-0038",
  },
  {
    id: "mock-txn-0031",
    number: "TXN-0031",
    commodity: "Soybean",
    volume: "1,800 MT",
    status: "Active",
    progressPercent: 88,
    href: "/transactions?transaction=TXN-0031",
  },
  {
    id: "mock-txn-0022",
    number: "TXN-0022",
    commodity: "Coffee",
    volume: "600 MT",
    status: "Active",
    progressPercent: 18,
    href: "/transactions?transaction=TXN-0022",
  },
  {
    id: "mock-txn-0028",
    number: "TXN-0028",
    commodity: "Wheat",
    volume: "1,200 MT",
    status: "Closed",
    progressPercent: 100,
    href: "/transactions?tab=closed&transaction=TXN-0028",
  },
];

const defaultSelectedTransaction: TransactionDetail = {
  id: "mock-txn-0044",
  number: "TXN-0044",
  status: "Active",
  commodity: "Soybean",
  volume: "2,400 MT",
  route: {
    origin: "Rosario, AR",
    destination: "Rotterdam, NL",
  },
  progressPercent: 63,
  tracker: [
    { step: 1, label: "Contract", state: "complete" },
    { step: 2, label: "KYC", state: "complete" },
    { step: 3, label: "Pre-fin.", state: "complete" },
    { step: 4, label: "Loading", state: "complete" },
    { step: 5, label: "B/L", state: "complete" },
    { step: 6, label: "Vessel", state: "complete" },
    { step: 7, label: "Transit", state: "current" },
    { step: 8, label: "Customs", state: "upcoming" },
    { step: 9, label: "Deliver", state: "upcoming" },
    { step: 10, label: "Payment", state: "upcoming" },
    { step: 11, label: "Closed", state: "upcoming" },
  ],
  trackerSummary: "Step 7 of 11",
  stageLabel: "Transit",
  alerts: ["Price deviation +8.2% above contracted price"],
  keyInfo: [
    { label: "ETA", value: "May 3" },
    { label: "PROGRESS", value: "63%" },
    { label: "VESSEL", value: "MV Atlantic Pioneer" },
  ],
  etaLabel: "ETA May 3",
  map: {
    labels: [
      "Barranquilla",
      "Cartagena de Indias",
      "Maracaibo",
      "Valledupar",
      "Caracas",
      "Puerto La Cruz",
      "Trinidad y Tobago",
    ],
    primaryPinLabel: "Current vessel position",
    secondaryPinLabel: "Destination marker",
  },
};

const alertSelectedTransaction: TransactionDetail = {
  id: "mock-txn-0041",
  number: "TXN-0041",
  status: "Alert",
  commodity: "Coffee",
  volume: "800 MT",
  route: {
    origin: "Santos, BR",
    destination: "Hamburg, DE",
  },
  progressPercent: 45,
  tracker: [
    { step: 1, label: "Contract", state: "complete" },
    { step: 2, label: "KYC", state: "complete" },
    { step: 3, label: "Pre-fin.", state: "complete" },
    { step: 4, label: "Loading", state: "complete" },
    { step: 5, label: "B/L", state: "current" },
    { step: 6, label: "Vessel", state: "upcoming" },
    { step: 7, label: "Transit", state: "upcoming" },
    { step: 8, label: "Customs", state: "upcoming" },
    { step: 9, label: "Deliver", state: "upcoming" },
    { step: 10, label: "Payment", state: "upcoming" },
    { step: 11, label: "Closed", state: "upcoming" },
  ],
  trackerSummary: "Step 5 of 11",
  stageLabel: "B/L",
  alerts: ["Customs clearance delayed - 4 days overdue", "Missing document: original Bill of Lading"],
  keyInfo: [
    { label: "ETA", value: "Apr 28" },
    { label: "PROGRESS", value: "45%" },
    { label: "VESSEL", value: "MV Santos Star" },
  ],
  etaLabel: "ETA Apr 28",
  map: defaultSelectedTransaction.map,
};

const closedSelectedTransaction: TransactionDetail = {
  ...defaultSelectedTransaction,
  id: "mock-txn-0028",
  number: "TXN-0028",
  status: "Closed",
  commodity: "Wheat",
  volume: "1,200 MT",
  route: {
    origin: "Mar del Plata, AR",
    destination: "Casablanca, MA",
  },
  progressPercent: 100,
  tracker: defaultSelectedTransaction.tracker.map((step) => ({
    ...step,
    state: step.step === 11 ? ("current" as const) : ("complete" as const),
  })),
  trackerSummary: "Step 11 of 11",
  stageLabel: "Closed",
  alerts: [],
  keyInfo: [
    { label: "ETA", value: "Done" },
    { label: "PROGRESS", value: "100%" },
    { label: "VESSEL", value: "MV Southern Cross" },
  ],
  etaLabel: "ETA Done",
};

export const transactionsMockData: TransactionsData = createTransactionsData("all");

function createTransactionsData(tabKey: TransactionTabKey): TransactionsData {
  const transactions = filterTransactions(tabKey);

  return {
    header: transactionsHeader,
    tabs: buildTabs(tabKey),
    resultCount: `${transactions.length} results`,
    transactions,
    selectedTransaction: selectTransactionDetail(tabKey),
  };
}

function buildTabs(activeTab: TransactionTabKey): TransactionTab[] {
  return tabDefinitions.map((tab) => ({
    label: tab.label,
    active: tab.key === activeTab,
  }));
}

function filterTransactions(tabKey: TransactionTabKey): TransactionListItem[] {
  switch (tabKey) {
    case "active":
      return allTransactions.filter((transaction) => transaction.status === "Active");
    case "closed":
      return allTransactions.filter((transaction) => transaction.status === "Closed");
    case "alerts":
      return allTransactions.filter((transaction) => transaction.status === "Alert");
    case "all":
      return allTransactions;
  }
}

function selectTransactionDetail(tabKey: TransactionTabKey): TransactionDetail {
  if (tabKey === "alerts") {
    return alertSelectedTransaction;
  }

  if (tabKey === "closed") {
    return closedSelectedTransaction;
  }

  return defaultSelectedTransaction;
}
