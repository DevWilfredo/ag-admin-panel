"use client";

import { AppShell } from "@/components/app-shell";
import { LayoutGroup, motion } from "motion/react";
import type {
  TransactionDetail,
  TransactionListItem,
  TransactionsData,
  TransactionsDataState,
  TransactionStatus,
  TransactionTab,
  TrackerStep,
} from "./types";

const defaultHeader = {
  title: "Transactions",
  dateLabel: "12 Ene 2026",
  searchPlaceholder: "Search TXN ID / COMMODITY / LOT",
  unreadNotifications: 0,
  avatarLabel: "User profile",
  avatarSrc: "/user-avatar.png",
};

const statusBadgeStyles = {
  Active: "bg-[#eaf2fd] text-[#2d5f9f]",
  Alert: "bg-[#ffecef] text-[#d64b55]",
  Closed: "border border-[#d9d9dc] bg-white text-[#8d8d93]",
} satisfies Record<TransactionStatus, string>;

const progressBarStyles = {
  Active: "bg-[#15447C]",
  Alert: "bg-[#ef4f55]",
  Closed: "bg-[#808085]",
} satisfies Record<TransactionStatus, string>;

const selectedBorderStyles = {
  Active: "border-[#15447C]",
  Alert: "border-[#ef4f55]",
  Closed: "border-[#808085]",
} satisfies Record<TransactionStatus, string>;

const detailAlertStyles = {
  Active: "border-[#f0aa39] bg-[#fff5e3] text-[#8b5510]",
  Alert: "border-[#efb7bc] bg-[#fff0f1] text-[#9c2f37]",
  Closed: "border-[#e2e2e5] bg-[#f8f8f9] text-[#77777d]",
} satisfies Record<TransactionStatus, string>;

const detailAlertDotStyles = {
  Active: "bg-[#b97010]",
  Alert: "bg-[#d64b55]",
  Closed: "bg-[#8d8d93]",
} satisfies Record<TransactionStatus, string>;

const quickEase = [0.22, 1, 0.36, 1] as const;
const hoverTransition = { type: "tween", duration: 0.1, ease: "easeOut" } as const;
const panelMotion = {
  hidden: { opacity: 0, y: 14, scale: 0.995 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: quickEase,
      staggerChildren: 0.035,
    },
  },
};
const listPanelMotion = {
  hidden: { opacity: 0, x: -14 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.24,
      ease: quickEase,
      staggerChildren: 0.035,
      delayChildren: 0.04,
    },
  },
};
const detailPanelMotion = {
  hidden: { opacity: 0, x: 12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.28,
      ease: quickEase,
      staggerChildren: 0.045,
      delayChildren: 0.06,
    },
  },
};
const fadeUpMotion = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: quickEase },
  },
};
const rowMotion = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: quickEase },
  },
};

export function TransactionsScreen({ state }: { state: TransactionsDataState }) {
  if (state.status === "ready") {
    return (
      <AppShell activeNav="transactions" header={state.data.header} mainClassName="gap-0 px-4 py-5 sm:px-6 lg:px-5">
        <TransactionsReady data={state.data} />
      </AppShell>
    );
  }

  if (state.status === "loading") {
    return (
      <AppShell activeNav="transactions" header={defaultHeader} mainClassName="gap-0 px-4 py-5 sm:px-6 lg:px-5">
        <TransactionsLoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="transactions" header={defaultHeader} mainClassName="gap-0 px-4 py-5 sm:px-6 lg:px-5">
      <TransactionsStatePanel message={state.message} title={state.title} />
    </AppShell>
  );
}

function TransactionsReady({ data }: { data: TransactionsData }) {
  return (
    <motion.section
      aria-labelledby="transactions-view-title"
      className="grid min-h-[540px] overflow-hidden rounded-[8px] border border-[#e8e8ea] bg-white lg:grid-cols-[190px_minmax(0,1fr)]"
      initial="hidden"
      animate="visible"
      id="transactions"
      variants={panelMotion}
    >
      <TransactionsListPanel
        resultCount={data.resultCount}
        selectedNumber={data.selectedTransaction.number}
        tabs={data.tabs}
        transactions={data.transactions}
      />
      <TransactionDetailPanel detail={data.selectedTransaction} />
    </motion.section>
  );
}

function TransactionsListPanel({
  resultCount,
  selectedNumber,
  tabs,
  transactions,
}: {
  resultCount: string;
  selectedNumber: string;
  tabs: TransactionTab[];
  transactions: TransactionListItem[];
}) {
  return (
    <motion.aside className="border-b border-[#e7e7e9] bg-[#fbfbfc] lg:border-b-0 lg:border-r" variants={listPanelMotion}>
      <motion.div className="px-3 pb-2 pt-3" variants={fadeUpMotion}>
        <h2 className="text-[12px] font-semibold leading-[18px] text-[#17171a]" id="transactions-view-title">
          Transactions
        </h2>
        <LayoutGroup id="transaction-tabs">
          <div className="mt-3 grid grid-cols-4 overflow-hidden rounded-[4px] border border-[#e9e9eb] bg-white p-[2px]">
            {tabs.map((tab) => (
              <motion.a
                aria-current={tab.active ? "page" : undefined}
                className={`relative flex h-[26px] items-center justify-center rounded-[3px] text-[10px] font-medium leading-[15px] outline-none transition-colors duration-100 ease-out focus:ring-2 focus:ring-[#15447C]/20 ${
                  tab.active ? "text-white" : "text-[#77777d] hover:bg-[#f4f4f5]"
                }`}
                href={getTransactionTabHref(tab.label)}
                key={tab.label}
                transition={hoverTransition}
                whileHover={tab.active ? undefined : { y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.active ? (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[3px] bg-[#001C42]"
                    layoutId="active-transaction-tab"
                    transition={{ duration: 0.16, ease: quickEase }}
                  />
                ) : null}
                <span className="relative z-10">{tab.label}</span>
              </motion.a>
            ))}
          </div>
        </LayoutGroup>
        <motion.p className="mt-2 text-[10px] font-medium leading-[15px] text-[#aaaab0]" variants={fadeUpMotion}>
          {resultCount}
        </motion.p>
      </motion.div>
      <motion.div className="divide-y divide-[#e7e7e9]" variants={listPanelMotion}>
        {transactions.map((transaction) => (
          <TransactionListRow isSelected={transaction.number === selectedNumber} key={transaction.id} transaction={transaction} />
        ))}
      </motion.div>
    </motion.aside>
  );
}

function getTransactionTabHref(label: TransactionTab["label"]) {
  if (label === "Active") {
    return "/transactions?tab=active";
  }

  if (label === "Closed") {
    return "/transactions?tab=closed";
  }

  if (label === "Alerts") {
    return "/transactions?tab=alerts";
  }

  return "/transactions";
}

function TransactionListRow({
  isSelected,
  transaction,
}: {
  isSelected: boolean;
  transaction: TransactionListItem;
}) {
  return (
    <motion.a
      aria-current={isSelected ? "true" : undefined}
      className={`relative block min-h-[56px] w-full px-3 py-3 text-left outline-none transition-colors duration-100 ease-out hover:bg-white focus:ring-2 focus:ring-[#15447C]/20 ${
        isSelected ? `border-l-[3px] ${selectedBorderStyles[transaction.status]} bg-white pl-[9px]` : "bg-[#fbfbfc]"
      }`}
      href={transaction.href}
      layout
      transition={hoverTransition}
      variants={rowMotion}
      whileHover={{ x: isSelected ? 0 : 2 }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[11px] font-semibold leading-[16px] text-[#1f1f23]">{transaction.number}</h3>
          <p className="mt-1 truncate text-[11px] font-medium leading-[16px] text-[#8a8a90]">
            {transaction.commodity} - {transaction.volume}
          </p>
        </div>
        <StatusBadge status={transaction.status} />
      </div>
      <div className="mt-3 h-[2px] w-full bg-transparent">
        <motion.div
          animate={{ scaleX: 1 }}
          className={`h-full origin-left ${progressBarStyles[transaction.status]}`}
          initial={{ scaleX: 0 }}
          style={{ width: `${transaction.progressPercent}%` }}
          transition={{ duration: 0.32, ease: quickEase }}
        />
      </div>
    </motion.a>
  );
}

function TransactionDetailPanel({ detail }: { detail: TransactionDetail }) {
  return (
    <motion.article className="min-w-0 bg-white" layout variants={detailPanelMotion}>
      <motion.div className="relative border-b border-[#e8e8ea] px-4 pb-4 pt-4 sm:px-5" variants={fadeUpMotion}>
        <motion.div className="pr-20" variants={fadeUpMotion}>
          <motion.div className="flex items-center gap-3" variants={fadeUpMotion}>
            <p className="text-[10px] font-medium uppercase leading-[15px] tracking-[1.4px] text-[#aaaab0]">{detail.number}</p>
            <StatusBadge status={detail.status} />
          </motion.div>
          <motion.h1 className="mt-2 text-[24px] font-bold leading-[28px] text-[#111114]" variants={fadeUpMotion}>
            {detail.commodity}
          </motion.h1>
          <motion.p className="mt-1 text-[13px] font-medium leading-[18px] text-[#77777d]" variants={fadeUpMotion}>
            {detail.volume}
          </motion.p>
          <motion.p className="mt-3 flex items-center gap-2 text-[12px] font-semibold leading-[17px] text-[#1e1e22]" variants={fadeUpMotion}>
            <span>{detail.route.origin}</span>
            <ArrowRightIcon className="h-3.5 w-3.5 text-[#8d8d93]" />
            <span>{detail.route.destination}</span>
          </motion.p>
        </motion.div>
        <ProgressDonut percent={detail.progressPercent} />
      </motion.div>

      <motion.div className="border-b border-[#e8e8ea] px-4 py-4 sm:px-5" variants={fadeUpMotion}>
        <p className="text-[10px] font-medium uppercase leading-[15px] tracking-[2.2px] text-[#aaaab0]">Process Tracker</p>
        <ProcessTracker steps={detail.tracker} />
        <div className="mt-2 flex items-center justify-between text-[12px] font-medium leading-[18px] text-[#1f1f23]">
          <span>{detail.trackerSummary}</span>
          <span className="text-[#77777d]">{detail.stageLabel}</span>
        </div>
      </motion.div>

      <motion.div className="grid gap-4 px-4 py-4 sm:px-5" variants={detailPanelMotion}>
        <motion.section aria-label="Alerts" variants={fadeUpMotion}>
          <p className="text-[10px] font-medium uppercase leading-[15px] tracking-[2.2px] text-[#aaaab0]">Alerts</p>
          <div className="mt-2 grid gap-2">
            {detail.alerts.length > 0 ? (
              detail.alerts.map((alert) => (
                <motion.div
                  className={`flex min-h-[28px] items-center rounded-[5px] border px-3 text-[11px] font-medium leading-[16px] ${detailAlertStyles[detail.status]}`}
                  key={alert}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: quickEase }}
                  whileHover={{ x: 2 }}
                >
                  <span className={`mr-2 h-[5px] w-[5px] shrink-0 rounded-full ${detailAlertDotStyles[detail.status]}`} />
                  {alert}
                </motion.div>
              ))
            ) : (
              <motion.p className="text-[11px] font-medium leading-[16px] text-[#aaaab0]" variants={fadeUpMotion}>
                No active alerts
              </motion.p>
            )}
          </div>
        </motion.section>

        <motion.section aria-label="Key information" variants={fadeUpMotion}>
          <p className="text-[10px] font-medium uppercase leading-[15px] tracking-[2.2px] text-[#aaaab0]">Key Info</p>
          <div className="mt-2 grid gap-2 md:grid-cols-3 xl:grid-cols-5">
            {detail.keyInfo.map((item) => (
              <motion.div
                className="rounded-[5px] bg-[#f7f7f8] px-3 py-2"
                key={item.label}
                transition={hoverTransition}
                whileHover={{ y: -1, backgroundColor: "#f2f6fb" }}
              >
                <p className="text-[9px] font-medium uppercase leading-[14px] tracking-[1px] text-[#a4a4aa]">{item.label}</p>
                <p className="mt-1 text-[12px] font-semibold leading-[17px] text-[#15447C]">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <BackendDataPanels detail={detail} />

        <motion.section aria-label="Progress" variants={fadeUpMotion}>
          <div className="h-[4px] rounded-full bg-[#eeeeef]">
            <motion.div
              animate={{ scaleX: 1 }}
              className="h-full origin-left rounded-full bg-[#15447C]"
              initial={{ scaleX: 0 }}
              style={{ width: `${detail.progressPercent}%` }}
              transition={{ duration: 0.42, ease: quickEase }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-semibold leading-[15px] text-[#303034]">
            <span>{detail.progressPercent}% complete</span>
            <span className="font-medium text-[#8a8a90]">{detail.etaLabel}</span>
          </div>
        </motion.section>

        <MapPreview detail={detail} />

        <motion.button
          aria-label={`Export full details for ${detail.number}`}
          className="group flex h-[33px] w-full items-center justify-center gap-2 rounded-[5px] bg-[#0d3b70] text-[12px] font-semibold leading-[18px] text-white transition-colors duration-100 ease-out hover:bg-[#15447C] focus:outline-none focus:ring-2 focus:ring-[#15447C]/30"
          transition={hoverTransition}
          type="button"
          variants={fadeUpMotion}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
        >
          Export full details
          <motion.span className="flex" transition={hoverTransition} whileHover={{ x: 1, y: -1 }}>
            <ExternalArrowIcon className="h-3.5 w-3.5" />
          </motion.span>
        </motion.button>
      </motion.div>
    </motion.article>
  );
}

function ProcessTracker({ steps }: { steps: TrackerStep[] }) {
  return (
    <div className="mt-3 overflow-x-auto pb-1">
      <div className="grid min-w-[820px]" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const isCurrent = step.state === "current";

          return (
            <motion.div className="relative flex flex-col items-center" key={step.step} variants={fadeUpMotion}>
              {index > 0 ? (
                <motion.span
                  animate={{ scaleX: 1 }}
                  className={`absolute left-0 right-1/2 top-[11px] h-px origin-right ${
                    step.state === "upcoming" ? "bg-[#e6e6e8]" : "bg-[#159454]"
                  }`}
                  initial={{ scaleX: 0 }}
                  transition={{ delay: index * 0.025, duration: 0.22, ease: quickEase }}
                />
              ) : null}
              {index < steps.length - 1 ? (
                <motion.span
                  animate={{ scaleX: 1 }}
                  className={`absolute left-1/2 right-0 top-[11px] h-px origin-left ${
                    step.state === "complete" ? "bg-[#159454]" : "bg-[#e6e6e8]"
                  }`}
                  initial={{ scaleX: 0 }}
                  transition={{ delay: index * 0.025, duration: 0.22, ease: quickEase }}
                />
              ) : null}
              <motion.span
                animate={{ opacity: 1, scale: 1 }}
                className={`relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold leading-none ${
                  step.state === "upcoming"
                    ? "bg-[#f4f4f5] text-[#c2c2c7]"
                    : step.state === "current"
                      ? "bg-[#15447C] text-white shadow-[0_0_0_4px_rgba(21,68,124,0.14)]"
                      : "bg-[#078b3c] text-white"
                }`}
                initial={{ opacity: 0, scale: 0.72 }}
                transition={{ delay: 0.04 + index * 0.03, duration: 0.2, ease: quickEase }}
                whileHover={{ scale: isCurrent ? 1.08 : 1.04 }}
              >
                {step.step}
              </motion.span>
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-[8px] font-medium leading-[12px] text-[#a5a5ab]"
                initial={{ opacity: 0, y: 3 }}
                transition={{ delay: 0.06 + index * 0.03, duration: 0.18, ease: quickEase }}
              >
                {step.label}
              </motion.span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function BackendDataPanels({ detail }: { detail: TransactionDetail }) {
  const hasChecklist = Boolean(detail.documentChecklist);
  const hasPayment = Boolean(detail.paymentSummary);
  const hasAudit = Boolean(detail.auditTimeline?.length);

  if (!hasChecklist && !hasPayment && !hasAudit) {
    return null;
  }

  return (
    <motion.section aria-label="Backend order data" className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]" variants={fadeUpMotion}>
      {detail.documentChecklist ? <DocumentChecklistPanel checklist={detail.documentChecklist} /> : null}
      {detail.paymentSummary ? <PaymentSummaryPanel payment={detail.paymentSummary} /> : null}
      {detail.auditTimeline?.length ? <AuditTimelinePanel items={detail.auditTimeline} /> : null}
    </motion.section>
  );
}

function DocumentChecklistPanel({ checklist }: { checklist: NonNullable<TransactionDetail["documentChecklist"]> }) {
  return (
    <motion.article className="rounded-[6px] border border-[#ececee] bg-white p-3" variants={fadeUpMotion}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[12px] font-semibold leading-[17px] text-[#303034]">Documents</h2>
          <p className="mt-1 text-[11px] font-medium leading-[16px] text-[#8d8d93]">{checklist.uploadedLabel}</p>
        </div>
        <span className="rounded-[5px] bg-[#eaf2fd] px-2 py-1 text-[10px] font-semibold leading-[14px] text-[#2d5f9f]">
          {checklist.label}
        </span>
      </div>
      <div className="mt-3 h-[4px] rounded-full bg-[#eeeeef]">
        <motion.div
          animate={{ scaleX: 1 }}
          className="h-full origin-left rounded-full bg-[#15447C]"
          initial={{ scaleX: 0 }}
          style={{ width: `${checklist.completionPercent}%` }}
          transition={{ duration: 0.32, ease: quickEase }}
        />
      </div>
      {checklist.items.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {checklist.items.slice(0, 4).map((item) => {
            const content = (
              <>
                <span className={`mt-1 h-[6px] w-[6px] shrink-0 rounded-full ${item.uploaded ? "bg-[#159454]" : "bg-[#d4d4d8]"}`} />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold leading-[16px] text-[#45454a]">{item.label}</span>
                  <span className="block text-[10px] font-medium leading-[14px] text-[#99999e]">{item.status}</span>
                </span>
              </>
            );

            return item.href ? (
              <a
                className="flex min-w-0 gap-2 rounded-[5px] bg-[#f8f8f9] px-2 py-2 outline-none transition hover:bg-[#f2f6fb] focus:ring-2 focus:ring-[#15447C]/20"
                href={item.href}
                key={item.label}
                rel="noreferrer"
                target="_blank"
              >
                {content}
              </a>
            ) : (
              <div className="flex min-w-0 gap-2 rounded-[5px] bg-[#f8f8f9] px-2 py-2" key={item.label}>
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[11px] font-medium leading-[16px] text-[#99999e]">{checklist.pendingLabel}</p>
      )}
    </motion.article>
  );
}

function PaymentSummaryPanel({ payment }: { payment: NonNullable<TransactionDetail["paymentSummary"]> }) {
  return (
    <motion.article className="rounded-[6px] border border-[#ececee] bg-white p-3" variants={fadeUpMotion}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[12px] font-semibold leading-[17px] text-[#303034]">Payment</h2>
          <p className="mt-1 text-[11px] font-medium leading-[16px] text-[#8d8d93]">{payment.bankLabel}</p>
        </div>
        <span className="rounded-[5px] bg-[#e9f7ed] px-2 py-1 text-[10px] font-semibold leading-[14px] text-[#087d2f]">
          {payment.label}
        </span>
      </div>
      <p className="mt-4 text-[18px] font-bold leading-[24px] text-[#202025]">{payment.amountLabel}</p>
      <p className="mt-1 text-[11px] font-medium leading-[16px] text-[#99999e]">{payment.timelineLabel}</p>
    </motion.article>
  );
}

function AuditTimelinePanel({ items }: { items: NonNullable<TransactionDetail["auditTimeline"]> }) {
  return (
    <motion.article className="rounded-[6px] border border-[#ececee] bg-white p-3 xl:col-span-2" variants={fadeUpMotion}>
      <h2 className="text-[12px] font-semibold leading-[17px] text-[#303034]">Audit Timeline</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div className="rounded-[5px] bg-[#f8f8f9] px-2 py-2" key={`${item.title}-${item.timeLabel}`}>
            <p className="truncate text-[11px] font-semibold leading-[16px] text-[#45454a]">{item.title}</p>
            <p className="mt-1 truncate text-[10px] font-medium leading-[14px] text-[#8d8d93]">{item.detail}</p>
            <p className="mt-1 text-[10px] font-medium leading-[14px] text-[#aaaab0]">{item.timeLabel}</p>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

function ProgressDonut({ percent }: { percent: number }) {
  const remainder = Math.max(0, 100 - percent);

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="absolute right-5 top-4 flex h-[54px] w-[54px] items-center justify-center"
      initial={{ opacity: 0, scale: 0.82 }}
      transition={{ duration: 0.22, ease: quickEase }}
    >
      <svg aria-label={`${percent}% transaction progress`} className="h-full w-full -rotate-90" role="img" viewBox="0 0 54 54">
        <circle cx="27" cy="27" fill="none" r="20" stroke="#e9e9ec" strokeWidth="5" />
        <motion.circle
          animate={{ strokeDashoffset: remainder }}
          cx="27"
          cy="27"
          fill="none"
          initial={{ strokeDashoffset: 100 }}
          pathLength={100}
          r="20"
          stroke="#15447C"
          strokeDasharray="100 100"
          strokeLinecap="round"
          strokeWidth="5"
          transition={{ duration: 0.45, ease: quickEase }}
        />
      </svg>
      <motion.span
        animate={{ opacity: 1 }}
        className="absolute text-[13px] font-bold leading-[18px] text-[#1c1c20]"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.16, duration: 0.16, ease: quickEase }}
      >
        {percent}%
      </motion.span>
    </motion.div>
  );
}

function MapPreview({ detail }: { detail: TransactionDetail }) {
  return (
    <motion.section
      aria-label="Shipment map preview"
      className="relative h-[104px] overflow-hidden rounded-[5px] bg-[#6ecfe0]"
      transition={hoverTransition}
      variants={fadeUpMotion}
      whileHover={{ y: -1 }}
    >
      <motion.svg
        aria-hidden="true"
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 h-full w-full"
        initial={{ opacity: 0.78, scale: 1.025 }}
        preserveAspectRatio="none"
        transition={{ duration: 0.32, ease: quickEase }}
        viewBox="0 0 800 104"
      >
        <rect fill="#72d0df" height="104" width="800" />
        <path d="M0 75 C42 48 86 50 126 24 C174 -7 241 11 280 37 C319 62 384 56 423 75 C476 100 530 96 583 81 C641 65 700 67 800 49 L800 104 L0 104 Z" fill="#8cddb7" />
        <path d="M0 92 C61 73 127 78 178 54 C210 38 252 39 286 50 C329 63 368 60 410 76 C446 89 493 92 560 82 L650 104 L0 104 Z" fill="#63c99d" opacity=".65" />
        <path d="M87 0 C119 24 122 44 113 68 C103 94 134 101 168 104 L224 104 C190 82 198 61 211 43 C231 14 203 2 184 0 Z" fill="#eef1de" />
        <path d="M0 66 C78 74 133 55 191 71 C245 86 296 80 340 88" fill="none" stroke="#7dbd83" strokeWidth="2" />
        <path d="M468 40 C502 47 535 45 568 57 C611 72 663 65 712 75" fill="none" stroke="#88c88a" strokeWidth="2" />
        <g fill="#1e2b34" fontFamily="Arial, Helvetica, sans-serif" fontSize="9" fontWeight="700">
          <text x="50" y="51">Barranquilla</text>
          <text x="38" y="67">Cartagena de Indias</text>
          <text x="170" y="58">Maracaibo</text>
          <text x="126" y="64">Valledupar</text>
          <text x="290" y="63">Caracas</text>
          <text x="400" y="70">Puerto La Cruz</text>
          <text x="470" y="62">Trinidad y Tobago</text>
        </g>
        <g fill="#35515b" fontFamily="Arial, Helvetica, sans-serif" fontSize="7">
          <text x="105" y="35">Maicao</text>
          <text x="232" y="28">Coro</text>
          <text x="612" y="26">Granada</text>
        </g>
      </motion.svg>
      <motion.span
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-label={detail.map.primaryPinLabel}
        className="absolute left-[36%] top-[12px] flex h-9 w-9 items-center justify-center rounded-full bg-[#d7eef8] shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
        initial={{ opacity: 0, scale: 0.72, y: -8 }}
        transition={{ delay: 0.12, duration: 0.24, ease: quickEase }}
        whileHover={{ scale: 1.07, y: -1 }}
      >
        <MapPinIcon className="h-6 w-6 text-[#2d5f9f]" />
      </motion.span>
      <motion.span
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-label={detail.map.secondaryPinLabel}
        className="absolute right-[21%] top-[44px]"
        initial={{ opacity: 0, scale: 0.72, y: -6 }}
        transition={{ delay: 0.18, duration: 0.22, ease: quickEase }}
        whileHover={{ scale: 1.08, y: -1 }}
      >
        <MapPinIcon className="h-6 w-6 text-[#273e9b]" />
      </motion.span>
      <motion.button
        aria-label={`View tracker for ${detail.number}`}
        className="absolute right-2 top-2 flex h-[28px] items-center gap-2 rounded-[4px] bg-white px-3 text-[11px] font-semibold leading-[16px] text-[#2b2b2f] shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
        transition={hoverTransition}
        type="button"
        whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.16)" }}
        whileTap={{ scale: 0.98 }}
      >
        View Tracker
        <ExternalArrowIcon className="h-3 w-3" />
      </motion.button>
    </motion.section>
  );
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <motion.span
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex h-[20px] shrink-0 items-center rounded-[6px] px-2 text-[9px] font-semibold leading-[14px] ${statusBadgeStyles[status]}`}
      initial={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.14, ease: quickEase }}
    >
      {status}
    </motion.span>
  );
}

function TransactionsLoadingState() {
  return (
    <motion.section
      animate="visible"
      className="grid min-h-[540px] overflow-hidden rounded-[8px] border border-[#e8e8ea] bg-white lg:grid-cols-[190px_minmax(0,1fr)]"
      initial="hidden"
      variants={panelMotion}
    >
      <aside className="border-b border-[#e7e7e9] bg-[#fbfbfc] p-3 lg:border-b-0 lg:border-r">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="mt-4 h-7 w-full" />
        <div className="mt-5 grid gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonLine className="h-10 w-full" key={index} />
          ))}
        </div>
      </aside>
      <div className="p-5">
        <SkeletonLine className="h-4 w-28" />
        <SkeletonLine className="mt-3 h-8 w-36" />
        <SkeletonLine className="mt-4 h-4 w-56" />
        <SkeletonLine className="mt-9 h-9 w-full" />
        <SkeletonLine className="mt-8 h-8 w-full" />
        <div className="mt-5 grid gap-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock className="h-[40px]" key={index} />
          ))}
        </div>
        <SkeletonBlock className="mt-5 h-[104px]" />
        <SkeletonBlock className="mt-5 h-[33px]" />
      </div>
    </motion.section>
  );
}

function TransactionsStatePanel({ title, message }: { title: string; message: string }) {
  return (
    <motion.section
      animate="visible"
      className="flex min-h-[540px] items-center justify-center rounded-[8px] border border-[#e8e8ea] bg-white p-8 text-center"
      initial="hidden"
      variants={panelMotion}
    >
      <motion.div className="max-w-md" variants={fadeUpMotion}>
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf2fd] text-[#2d5f9f]"
          initial={{ opacity: 0, scale: 0.86 }}
          transition={{ duration: 0.2, ease: quickEase }}
        >
          <AlertCircleIcon className="h-6 w-6" />
        </motion.div>
        <h2 className="mt-5 text-[20px] font-semibold leading-[28px] text-[#303034]">{title}</h2>
        <p className="mt-2 text-[14px] font-medium leading-[22px] text-[#8d8d93]">{message}</p>
      </motion.div>
    </motion.section>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`${className} animate-pulse rounded-[6px] bg-[#ededf0]`} />;
}

function SkeletonLine({ className }: { className: string }) {
  return <div className={`${className} animate-pulse rounded-full bg-[#ededf0]`} />;
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ExternalArrowIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M7 17 17 7m0 0h-7m7 0v7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" fill="currentColor" opacity=".18" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" fill="currentColor" r="2.2" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 8v5m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}
