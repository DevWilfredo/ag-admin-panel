"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";
import { useAuthenticatedUser } from "@/features/auth/auth-context";
import { LayoutGroup, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { advanceOrderStage } from "@/services/orders-service";
import { getErrorMessage } from "@/services/api-errors";
import { hasCapability } from "@/services/authorization";
import {
  DateField,
  Field,
  Modal,
  Notice,
  PrimaryButton,
} from "@/features/management/management-ui";
import {
  assignVessel,
  retryVesselTracking,
  updateVesselPosition,
} from "@/services/vessels-service";
import type { OrderFilters } from "./transactions-client";
import type {
  TransactionDetail,
  TransactionListItem,
  TransactionsData,
  TransactionsDataState,
  TransactionStatus,
  TransactionTab,
  TransactionTabKey,
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

const TransactionMap = dynamic(
  () => import("./transaction-map").then((module) => module.TransactionMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-[#dce8ef]" />,
  },
);

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
const hoverTransition = {
  type: "tween",
  duration: 0.1,
  ease: "easeOut",
} as const;
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

export function TransactionsScreen({
  state,
  filters,
  tab,
  onCreateOrder,
}: {
  state: TransactionsDataState;
  filters: OrderFilters;
  tab: TransactionTabKey;
  onCreateOrder?: () => void;
}) {
  if (state.status === "ready") {
    return (
      <AppShell
        activeNav="transactions"
        header={state.data.header}
        mainClassName="gap-0 px-4 py-5 sm:px-6 lg:px-5"
      >
        <TransactionsToolbar
          filters={filters}
          tab={tab}
          onCreateOrder={onCreateOrder}
        />
        <TransactionsReady data={state.data} />
      </AppShell>
    );
  }

  if (state.status === "loading") {
    return (
      <AppShell
        activeNav="transactions"
        header={defaultHeader}
        mainClassName="gap-0 px-4 py-5 sm:px-6 lg:px-5"
      >
        <TransactionsToolbar
          filters={filters}
          tab={tab}
          onCreateOrder={onCreateOrder}
        />
        <TransactionsLoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      activeNav="transactions"
      header={defaultHeader}
      mainClassName="gap-0 px-4 py-5 sm:px-6 lg:px-5"
    >
      <TransactionsToolbar
        filters={filters}
        tab={tab}
        onCreateOrder={onCreateOrder}
      />
      <TransactionsStatePanel
        message={state.message}
        title={state.title}
        onCreateOrder={onCreateOrder}
      />
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
    <motion.aside
      className="border-b border-[#e7e7e9] bg-[#fbfbfc] lg:border-b-0 lg:border-r"
      variants={listPanelMotion}
    >
      <motion.div className="px-3 pb-2 pt-3" variants={fadeUpMotion}>
        <h2
          className="text-[12px] font-semibold leading-[18px] text-[#17171a]"
          id="transactions-view-title"
        >
          Transactions
        </h2>
        <LayoutGroup id="transaction-tabs">
          <div className="mt-3 grid grid-cols-4 overflow-hidden rounded-[4px] border border-[#e9e9eb] bg-white p-[2px]">
            {tabs.map((tab) => (
              <motion.a
                aria-current={tab.active ? "page" : undefined}
                className={`relative flex h-[26px] items-center justify-center rounded-[3px] text-[10px] font-medium leading-[15px] outline-none transition-colors duration-100 ease-out focus:ring-2 focus:ring-[#15447C]/20 ${
                  tab.active
                    ? "text-white"
                    : "text-[#77777d] hover:bg-[#f4f4f5]"
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
        <motion.p
          className="mt-2 text-[10px] font-medium leading-[15px] text-[#aaaab0]"
          variants={fadeUpMotion}
        >
          {resultCount}
        </motion.p>
      </motion.div>
      <motion.div
        className="divide-y divide-[#e7e7e9]"
        variants={listPanelMotion}
      >
        {transactions.map((transaction) => (
          <TransactionListRow
            isSelected={transaction.number === selectedNumber}
            key={transaction.id}
            transaction={transaction}
          />
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
        isSelected
          ? `border-l-[3px] ${selectedBorderStyles[transaction.status]} bg-white pl-[9px]`
          : "bg-[#fbfbfc]"
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
          <h3 className="truncate text-[11px] font-semibold leading-[16px] text-[#1f1f23]">
            {transaction.number}
          </h3>
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
    <motion.article
      className="min-w-0 bg-white"
      layout
      variants={detailPanelMotion}
    >
      <motion.div
        className="relative border-b border-[#e8e8ea] px-4 pb-4 pt-4 sm:px-5"
        variants={fadeUpMotion}
      >
        <motion.div className="pr-20" variants={fadeUpMotion}>
          <motion.div
            className="flex items-center gap-3"
            variants={fadeUpMotion}
          >
            <p className="text-[10px] font-medium uppercase leading-[15px] tracking-[1.4px] text-[#aaaab0]">
              {detail.number}
            </p>
            <StatusBadge status={detail.status} />
          </motion.div>
          <motion.h1
            className="mt-2 text-[24px] font-bold leading-[28px] text-[#111114]"
            variants={fadeUpMotion}
          >
            {detail.commodity}
          </motion.h1>
          <motion.p
            className="mt-1 text-[13px] font-medium leading-[18px] text-[#77777d]"
            variants={fadeUpMotion}
          >
            {detail.volume}
          </motion.p>
          <motion.p
            className="mt-3 flex items-center gap-2 text-[12px] font-semibold leading-[17px] text-[#1e1e22]"
            variants={fadeUpMotion}
          >
            <span>{detail.route.origin}</span>
            <ArrowRightIcon className="h-3.5 w-3.5 text-[#8d8d93]" />
            <span>{detail.route.destination}</span>
          </motion.p>
        </motion.div>
        <ProgressDonut percent={detail.progressPercent} />
      </motion.div>

      <motion.div
        className="border-b border-[#e8e8ea] px-4 py-4 sm:px-5"
        variants={fadeUpMotion}
      >
        <p className="text-[10px] font-medium uppercase leading-[15px] tracking-[2.2px] text-[#aaaab0]">
          Process Tracker
        </p>
        <ProcessTracker steps={detail.tracker} />
        <div className="mt-2 flex items-center justify-between text-[12px] font-medium leading-[18px] text-[#1f1f23]">
          <span>{detail.trackerSummary}</span>
          <span className="text-[#77777d]">{detail.stageLabel}</span>
        </div>
      </motion.div>

      <motion.div
        className="grid gap-4 px-4 py-4 sm:px-5"
        variants={detailPanelMotion}
      >
        <motion.section aria-label="Alerts" variants={fadeUpMotion}>
          <p className="text-[10px] font-medium uppercase leading-[15px] tracking-[2.2px] text-[#aaaab0]">
            Alerts
          </p>
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
                  <span
                    className={`mr-2 h-[5px] w-[5px] shrink-0 rounded-full ${detailAlertDotStyles[detail.status]}`}
                  />
                  {alert}
                </motion.div>
              ))
            ) : (
              <motion.p
                className="text-[11px] font-medium leading-[16px] text-[#aaaab0]"
                variants={fadeUpMotion}
              >
                No active alerts
              </motion.p>
            )}
          </div>
        </motion.section>

        <motion.section aria-label="Key information" variants={fadeUpMotion}>
          <p className="text-[10px] font-medium uppercase leading-[15px] tracking-[2.2px] text-[#aaaab0]">
            Key Info
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-3 xl:grid-cols-5">
            {detail.keyInfo.map((item) => (
              <motion.div
                className="rounded-[5px] bg-[#f7f7f8] px-3 py-2"
                key={item.label}
                transition={hoverTransition}
                whileHover={{ y: -1, backgroundColor: "#f2f6fb" }}
              >
                <p className="text-[9px] font-medium uppercase leading-[14px] tracking-[1px] text-[#a4a4aa]">
                  {item.label}
                </p>
                <p className="mt-1 text-[12px] font-semibold leading-[17px] text-[#15447C]">
                  {item.value}
                </p>
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
            <span className="font-medium text-[#8a8a90]">
              {detail.etaLabel}
            </span>
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
          <motion.span
            className="flex"
            transition={hoverTransition}
            whileHover={{ x: 1, y: -1 }}
          >
            <ExternalArrowIcon className="h-3.5 w-3.5" />
          </motion.span>
        </motion.button>
      </motion.div>
    </motion.article>
  );
}

function ProcessTracker({ steps }: { steps: TrackerStep[] }) {
  const [previewState, setPreviewState] = useState<{
    location: NonNullable<TrackerStep["locationPreview"]>;
    index: number;
  }>();
  const preview = previewState?.location;
  return (
    <div
      className="relative mt-3"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPreviewState(undefined);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setPreviewState(undefined);
      }}
      onMouseLeave={() => setPreviewState(undefined)}
    >
      <div className="overflow-x-auto pb-1">
      <div
        className="grid min-w-[820px]"
        style={{
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
        }}
      >
        {steps.map((step, index) => {
          const isCurrent = step.state === "current";

          return (
            <motion.div
              className="relative flex flex-col items-center"
              key={step.step}
              variants={fadeUpMotion}
            >
              {index > 0 ? (
                <motion.span
                  animate={{ scaleX: 1 }}
                  className={`absolute left-0 right-1/2 top-[11px] h-px origin-right ${
                    step.state === "upcoming" ? "bg-[#e6e6e8]" : "bg-[#159454]"
                  }`}
                  initial={{ scaleX: 0 }}
                  transition={{
                    delay: index * 0.025,
                    duration: 0.22,
                    ease: quickEase,
                  }}
                />
              ) : null}
              {index < steps.length - 1 ? (
                <motion.span
                  animate={{ scaleX: 1 }}
                  className={`absolute left-1/2 right-0 top-[11px] h-px origin-left ${
                    step.state === "complete" ? "bg-[#159454]" : "bg-[#e6e6e8]"
                  }`}
                  initial={{ scaleX: 0 }}
                  transition={{
                    delay: index * 0.025,
                    duration: 0.22,
                    ease: quickEase,
                  }}
                />
              ) : null}
              <motion.button
                aria-label={step.locationPreview ? `Preview location for ${step.label}` : undefined}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold leading-none ${
                  step.state === "upcoming"
                    ? "bg-[#f4f4f5] text-[#c2c2c7]"
                    : step.state === "current"
                      ? "bg-[#15447C] text-white shadow-[0_0_0_4px_rgba(21,68,124,0.14)]"
                      : "bg-[#078b3c] text-white"
                }`}
                initial={{ opacity: 0, scale: 0.72 }}
                aria-expanded={Boolean(step.locationPreview && previewState?.index === index)}
                onClick={() => {
                  if (!step.locationPreview) return;
                  setPreviewState((current) => current?.index === index ? undefined : { location: step.locationPreview!, index });
                }}
                onFocus={() => step.locationPreview && setPreviewState({ location: step.locationPreview, index })}
                onMouseEnter={() => step.locationPreview && setPreviewState({ location: step.locationPreview, index })}
                type="button"
                transition={{
                  delay: 0.04 + index * 0.03,
                  duration: 0.2,
                  ease: quickEase,
                }}
                whileHover={{ scale: isCurrent ? 1.08 : 1.04 }}
                disabled={!step.locationPreview}
              >
                {step.step}
              </motion.button>
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-[8px] font-medium leading-[12px] text-[#a5a5ab]"
                initial={{ opacity: 0, y: 3 }}
                transition={{
                  delay: 0.06 + index * 0.03,
                  duration: 0.18,
                  ease: quickEase,
                }}
              >
                {step.label}
              </motion.span>
            </motion.div>
          );
        })}
      </div>
      </div>
      {preview ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          aria-label={`Location preview for ${preview.title}`}
          className="absolute top-[58px] z-50 w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[12px] border border-white/80 bg-white/75 p-2 shadow-[0_18px_45px_rgba(0,28,66,.22)] backdrop-blur-xl"
          initial={{ opacity: 0, y: -6 }}
          key={`${preview.kind}-${previewState?.index}`}
          style={{
            left: `clamp(180px, ${(((previewState?.index || 0) + 0.5) / steps.length) * 100}%, calc(100% - 180px))`,
            transform: "translateX(-50%)",
          }}
        >
          <button aria-label="Close location preview" className="absolute left-3 top-3 z-[600] grid size-7 place-items-center rounded-full border border-white/45 bg-[#082b45]/55 text-base leading-none text-white shadow-lg backdrop-blur-xl hover:bg-[#082b45]/75" onClick={() => setPreviewState(undefined)} type="button">×</button>
          <div className="relative h-[180px] overflow-hidden rounded-[9px] bg-[#dce8ef]">
            <TransactionMap current={{ latitude: preview.latitude, longitude: preview.longitude, label: preview.subtitle || preview.title }} vesselName={preview.title} />
            <MapGlassButton href={openStreetMapUrl(preview.latitude, preview.longitude)} label={preview.kind === "vessel" ? "View tracker" : "Warehouse location"} />
            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] max-w-[75%] rounded-full border border-white/45 bg-[#082b45]/55 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur-xl">
              {preview.title}{preview.subtitle ? ` · ${preview.subtitle}` : ""}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

function BackendDataPanels({ detail }: { detail: TransactionDetail }) {
  return (
    <motion.section
      aria-label="Backend order data"
      className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]"
      variants={fadeUpMotion}
    >
      {detail.documentChecklist ? (
        <DocumentChecklistPanel checklist={detail.documentChecklist} />
      ) : null}
      {detail.paymentSummary ? (
        <PaymentSummaryPanel payment={detail.paymentSummary} />
      ) : null}
      {detail.auditTimeline?.length ? (
        <AuditTimelinePanel items={detail.auditTimeline} />
      ) : null}
      <VesselOperationsPanel detail={detail} />
      <StageActionPanel detail={detail} />
    </motion.section>
  );
}

function VesselOperationsPanel({ detail }: { detail: TransactionDetail }) {
  const canManage = hasCapability(
    useAuthenticatedUser()?.role,
    "manage:vessels",
  );
  const [modal, setModal] = useState<"assign" | "position" | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      get = (key: string) => String(data.get(key) || "").trim();
    setPending(true);
    setError(undefined);
    try {
      if (modal === "assign")
        await assignVessel({
          orderId: detail.id,
          vesselName: get("vesselName"),
          shippingLine: get("shippingLine") || undefined,
          voyageNumber: get("voyageNumber") || undefined,
          billOfLading: get("billOfLading") || undefined,
          scac: get("scac") || undefined,
        });
      else
        await updateVesselPosition(detail.id, {
          latitude: number(get("latitude")),
          longitude: number(get("longitude")),
          speed: number(get("speed")),
          portOfCall: get("portOfCall") || undefined,
        });
      window.location.reload();
    } catch (next) {
      setError(getErrorMessage(next));
      setPending(false);
    }
  }
  async function retry() {
    setPending(true);
    setError(undefined);
    try {
      await retryVesselTracking(detail.id);
      window.location.reload();
    } catch (next) {
      setError(getErrorMessage(next));
      setPending(false);
    }
  }
  const vessel = detail.vesselDetails;
  return (
    <>
      <motion.article
        className="rounded-[6px] border border-[#dce5ef] bg-white p-3 xl:col-span-2"
        variants={fadeUpMotion}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[12px] font-semibold text-[#303034]">
              Vessel tracking
            </h2>
            {vessel ? (
              <p className="mt-1 text-[11px] text-[#777]">
                {vessel.vesselName}
                {vessel.shippingLine ? ` · ${vessel.shippingLine}` : ""}
                {vessel.portOfCall ? ` · ${vessel.portOfCall}` : ""}
                {vessel.eta ? ` · ETA ${formatVesselDate(vessel.eta)}` : ""}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-[#85858d]">
                No vessel has been assigned to this order.
              </p>
            )}
          </div>
          {canManage ? <div className="flex flex-wrap gap-2">
            {vessel ? (
              <>
                <button
                  onClick={() => setModal("position")}
                  type="button"
                  className="h-9 rounded-[5px] border border-[#d6e0ea] px-3 text-[11px] font-semibold text-[#15447c]"
                >
                  Update position
                </button>
                <button
                  onClick={() => void retry()}
                  disabled={pending}
                  type="button"
                  className="h-9 rounded-[5px] bg-[#15447c] px-3 text-[11px] font-semibold text-white disabled:opacity-50"
                >
                  Retry tracking
                </button>
              </>
            ) : (
              <PrimaryButton onClick={() => setModal("assign")}>
                Assign vessel
              </PrimaryButton>
            )}
          </div> : null}
        </div>
        {vessel?.latitude !== undefined ? (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#edf0f3] pt-3 sm:grid-cols-4">
            <SmallMetric label="Latitude" value={String(vessel.latitude)} />
            <SmallMetric
              label="Longitude"
              value={String(vessel.longitude ?? "—")}
            />
            <SmallMetric
              label="Speed"
              value={vessel.speed !== undefined ? `${vessel.speed} kn` : "—"}
            />
            <SmallMetric label="Status" value={vessel.status || "Tracking"} />
          </div>
        ) : null}
        {error ? (
          <div className="mt-3">
            <Notice error message={error} />
          </div>
        ) : null}
      </motion.article>
      {canManage && modal ? (
        <Modal
          title={
            modal === "assign" ? "Assign vessel" : "Update vessel position"
          }
          description={
            modal === "assign"
              ? "Connect this order with Terminal49 tracking."
              : "Manual fallback when live tracking is unavailable."
          }
          onClose={() => setModal(null)}
        >
          {error ? (
            <div className="mb-4">
              <Notice error message={error} />
            </div>
          ) : null}
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {modal === "assign" ? (
              <>
                <Field name="vesselName" label="Vessel name" required />
                <Field name="shippingLine" label="Shipping line" />
                <Field name="voyageNumber" label="Voyage number" />
                <Field name="billOfLading" label="Master Bill of Lading" />
                <Field name="scac" label="SCAC code" placeholder="e.g. MAEU" />
              </>
            ) : (
              <>
                <Field
                  name="latitude"
                  label="Latitude"
                  type="number"
                  step="any"
                  required
                />
                <Field
                  name="longitude"
                  label="Longitude"
                  type="number"
                  step="any"
                  required
                />
                <Field
                  name="speed"
                  label="Speed (knots)"
                  type="number"
                  step="any"
                />
                <Field name="portOfCall" label="Port of call" />
              </>
            )}
            <div className="flex justify-end sm:col-span-2">
              <PrimaryButton type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[5px] bg-[#f7f9fb] px-3 py-2">
      <p className="text-[9px] uppercase tracking-wide text-[#999]">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#334]">{value}</p>
    </div>
  );
}
function number(value: string) {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : undefined;
}
function formatVesselDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function TransactionsToolbar({
  filters,
  tab,
  onCreateOrder,
}: {
  filters: OrderFilters;
  tab: TransactionTabKey;
  onCreateOrder?: () => void;
}) {
  return (
    <section className="mb-4 rounded-[8px] border border-[#e3e6ea] bg-white p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <form
          action="/transactions"
          method="get"
          className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input type="hidden" name="tab" value={tab} />
          <label className="grid gap-1.5 text-[11px] font-semibold text-[#585961]">
            <span>Order number</span>
            <input
              name="orderNumber"
              defaultValue={filters.orderNumber}
              placeholder="Search order number"
              className="h-10 rounded-[7px] border border-[#dedef2] px-3 text-[12px] outline-none focus:border-[#3971ad]"
            />
          </label>
          <label className="grid gap-1.5 text-[11px] font-semibold text-[#585961]">
            <span>Commodity</span>
            <input
              name="commodityType"
              defaultValue={filters.commodityType}
              placeholder="Search commodity"
              className="h-10 rounded-[7px] border border-[#dedef2] px-3 text-[12px] outline-none focus:border-[#3971ad]"
            />
          </label>
          <DateField
            name="dateFrom"
            label="From"
            defaultValue={filters.dateFrom}
          />
          <DateField name="dateTo" label="To" defaultValue={filters.dateTo} />
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="h-9 rounded-[6px] bg-[#eef4fa] px-4 text-[11px] font-semibold text-[#15447c] hover:bg-[#e2edf7]"
            >
              Apply filters
            </button>
            <a
              href="/transactions"
              className="inline-flex h-9 items-center rounded-[6px] border border-[#dfe3e8] px-4 text-[11px] font-semibold text-[#65717e] hover:bg-[#f7f8fa]"
            >
              Clear
            </a>
          </div>
        </form>
        {onCreateOrder ? (
          <PrimaryButton onClick={onCreateOrder}>New order</PrimaryButton>
        ) : null}
      </div>
    </section>
  );
}

function StageActionPanel({ detail }: { detail: TransactionDetail }) {
  const canAdvance = hasCapability(
    useAuthenticatedUser()?.role,
    "advance:orders",
  );
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const notes = String(
      new FormData(event.currentTarget).get("notes") || "",
    ).trim();
    setPending(true);
    setError(undefined);
    try {
      await advanceOrderStage(detail.id, { notes: notes || undefined });
      window.location.reload();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      setPending(false);
    }
  }

  if (detail.status === "Closed" || !canAdvance) return null;

  return (
    <motion.article
      className="rounded-[6px] border border-[#dce5ef] bg-[#f8fbff] p-3 xl:col-span-2"
      variants={fadeUpMotion}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[12px] font-semibold text-[#303034]">
            Lifecycle control
          </h2>
          <p className="mt-1 text-[11px] text-[#85858d]">
            Current stage: {detail.stageLabel}. The backend validates whether
            your role can advance it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="h-9 rounded-[5px] bg-[#15447c] px-4 text-[11px] font-semibold text-white hover:bg-[#0e3869]"
        >
          Advance stage
        </button>
      </div>
      {open ? (
        <form
          onSubmit={advance}
          className="mt-3 flex flex-col gap-2 border-t border-[#dce5ef] pt-3 sm:flex-row"
        >
          <input
            name="notes"
            placeholder="Transition notes (optional)"
            className="h-9 flex-1 rounded-[5px] border border-[#d8dee6] bg-white px-3 text-[11px] outline-none focus:border-[#3971ad]"
          />
          <button
            disabled={pending}
            className="h-9 rounded-[5px] bg-[#986115] px-4 text-[11px] font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Advancing…" : "Confirm transition"}
          </button>
        </form>
      ) : null}
      {error ? (
        <p className="mt-2 text-[11px] font-medium text-[#a73640]">{error}</p>
      ) : null}
    </motion.article>
  );
}

function DocumentChecklistPanel({
  checklist,
}: {
  checklist: NonNullable<TransactionDetail["documentChecklist"]>;
}) {
  return (
    <motion.article
      className="rounded-[6px] border border-[#ececee] bg-white p-3"
      variants={fadeUpMotion}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[12px] font-semibold leading-[17px] text-[#303034]">
            Documents
          </h2>
          <p className="mt-1 text-[11px] font-medium leading-[16px] text-[#8d8d93]">
            {checklist.uploadedLabel}
          </p>
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
                <span
                  className={`mt-1 h-[6px] w-[6px] shrink-0 rounded-full ${item.uploaded ? "bg-[#159454]" : "bg-[#d4d4d8]"}`}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold leading-[16px] text-[#45454a]">
                    {item.label}
                  </span>
                  <span className="block text-[10px] font-medium leading-[14px] text-[#99999e]">
                    {item.status}
                  </span>
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
              <div
                className="flex min-w-0 gap-2 rounded-[5px] bg-[#f8f8f9] px-2 py-2"
                key={item.label}
              >
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[11px] font-medium leading-[16px] text-[#99999e]">
          {checklist.pendingLabel}
        </p>
      )}
    </motion.article>
  );
}

function PaymentSummaryPanel({
  payment,
}: {
  payment: NonNullable<TransactionDetail["paymentSummary"]>;
}) {
  return (
    <motion.article
      className="rounded-[6px] border border-[#ececee] bg-white p-3"
      variants={fadeUpMotion}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[12px] font-semibold leading-[17px] text-[#303034]">
            Payment
          </h2>
          <p className="mt-1 text-[11px] font-medium leading-[16px] text-[#8d8d93]">
            {payment.bankLabel}
          </p>
        </div>
        <span className="rounded-[5px] bg-[#e9f7ed] px-2 py-1 text-[10px] font-semibold leading-[14px] text-[#087d2f]">
          {payment.label}
        </span>
      </div>
      <p className="mt-4 text-[18px] font-bold leading-[24px] text-[#202025]">
        {payment.amountLabel}
      </p>
      <p className="mt-1 text-[11px] font-medium leading-[16px] text-[#99999e]">
        {payment.timelineLabel}
      </p>
    </motion.article>
  );
}

function AuditTimelinePanel({
  items,
}: {
  items: NonNullable<TransactionDetail["auditTimeline"]>;
}) {
  return (
    <motion.article
      className="rounded-[6px] border border-[#ececee] bg-white p-3 xl:col-span-2"
      variants={fadeUpMotion}
    >
      <h2 className="text-[12px] font-semibold leading-[17px] text-[#303034]">
        Audit Timeline
      </h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            className="rounded-[5px] bg-[#f8f8f9] px-2 py-2"
            key={`${item.title}-${item.timeLabel}`}
          >
            <p className="truncate text-[11px] font-semibold leading-[16px] text-[#45454a]">
              {item.title}
            </p>
            <p className="mt-1 truncate text-[10px] font-medium leading-[14px] text-[#8d8d93]">
              {item.detail}
            </p>
            <p className="mt-1 text-[10px] font-medium leading-[14px] text-[#aaaab0]">
              {item.timeLabel}
            </p>
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
      <svg
        aria-label={`${percent}% transaction progress`}
        className="h-full w-full -rotate-90"
        role="img"
        viewBox="0 0 54 54"
      >
        <circle
          cx="27"
          cy="27"
          fill="none"
          r="20"
          stroke="#e9e9ec"
          strokeWidth="5"
        />
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
  const vessel = detail.vesselDetails;
  const warehouse = detail.warehouseDetails;
  if (vessel?.latitude !== undefined && vessel.longitude !== undefined) {
    const external = openStreetMapUrl(vessel.latitude, vessel.longitude);
    return (
      <div className={`grid gap-3 ${warehouse?.latitude !== undefined && warehouse.longitude !== undefined ? "lg:grid-cols-2" : ""}`}>
      <motion.section
        aria-label="Live vessel map"
        className="relative h-[220px] overflow-hidden rounded-[7px] border border-[#dce3e9] bg-[#dce8ef]"
        variants={fadeUpMotion}
      >
        <TransactionMap
          current={{
            latitude: vessel.latitude,
            longitude: vessel.longitude,
            label: vessel.portOfCall || "Current vessel position",
          }}
          history={vessel.history}
          vesselName={vessel.vesselName}
        />
        <MapGlassButton href={external} label="Vessel tracker" />
        <div className="absolute bottom-3 left-3 z-[500] rounded-[6px] bg-white/92 px-3 py-2 text-[10px] font-semibold text-[#334] shadow-md backdrop-blur">
          {vessel.latitude.toFixed(5)}, {vessel.longitude.toFixed(5)}
          {vessel.speed !== undefined ? ` · ${vessel.speed} kn` : ""}
        </div>
      </motion.section>
      {warehouse?.latitude !== undefined && warehouse.longitude !== undefined ? (
        <motion.section aria-label="Warehouse location map" className="relative h-[220px] overflow-hidden rounded-[10px] border border-white/70 bg-[#dce8ef] shadow-[0_12px_30px_rgba(0,28,66,.12)]" variants={fadeUpMotion}>
          <TransactionMap current={{ latitude: warehouse.latitude, longitude: warehouse.longitude, label: warehouse.location || warehouse.name }} vesselName={warehouse.name} />
          <MapGlassButton href={openStreetMapUrl(warehouse.latitude, warehouse.longitude)} label="Warehouse tracker" />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] max-w-[calc(100%-24px)] truncate rounded-full border border-white/45 bg-[#082b45]/55 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur-xl">
            {warehouse.location || warehouse.name}{warehouse.custodyStatus ? ` · ${warehouse.custodyStatus.replaceAll("_", " ")}` : ""}
          </div>
        </motion.section>
      ) : null}
      </div>
    );
  }
  if (warehouse?.latitude !== undefined && warehouse.longitude !== undefined) {
    return (
      <motion.section aria-label="Warehouse location map" className="relative h-[220px] overflow-hidden rounded-[10px] border border-white/70 bg-[#dce8ef] shadow-[0_12px_30px_rgba(0,28,66,.12)]" variants={fadeUpMotion}>
        <TransactionMap current={{ latitude: warehouse.latitude, longitude: warehouse.longitude, label: warehouse.location || warehouse.name }} vesselName={warehouse.name} />
        <MapGlassButton href={openStreetMapUrl(warehouse.latitude, warehouse.longitude)} label="Warehouse tracker" />
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-full border border-white/45 bg-[#082b45]/55 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur-xl">{warehouse.location || warehouse.name}</div>
      </motion.section>
    );
  }
  return (
    <motion.section
      aria-label="Vessel position unavailable"
      className="flex min-h-[116px] flex-col justify-between gap-4 rounded-[7px] border border-dashed border-[#cfd9e4] bg-[#f7f9fb] px-4 py-4 sm:flex-row sm:items-center"
      variants={fadeUpMotion}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0f8] text-[#245895]">
          <MapPinIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[12px] font-semibold text-[#303034]">
            Live position pending
          </h2>
          <p className="mt-1 text-[11px] leading-[17px] text-[#7f7f86]">
            {vessel
              ? `${vessel.vesselName} is assigned, but Terminal49 has not returned coordinates yet.`
              : "No vessel or tracking coordinates are available for this order."}
          </p>
        </div>
      </div>
      {vessel ? (
        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-[10px] sm:text-right">
          <div>
            <dt className="uppercase tracking-wide text-[#9a9aa0]">Status</dt>
            <dd className="mt-0.5 font-semibold text-[#45454a]">
              {vessel.status || "Awaiting update"}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide text-[#9a9aa0]">ETA</dt>
            <dd className="mt-0.5 font-semibold text-[#45454a]">
              {vessel.eta ? formatVesselDate(vessel.eta) : "Not provided"}
            </dd>
          </div>
        </dl>
      ) : null}
    </motion.section>
  );
}

function MapGlassButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="group absolute right-3 top-3 z-[500] inline-flex h-10 items-center gap-2 rounded-full border border-white/55 bg-[#0b334d]/35 py-1 pl-4 pr-1 text-[11px] font-bold text-white shadow-[0_8px_28px_rgba(0,20,45,.28),inset_0_1px_0_rgba(255,255,255,.38)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-[#8fc6dc]/70 hover:bg-[#062d49]/75 hover:shadow-[0_12px_34px_rgba(0,20,45,.42),inset_0_1px_0_rgba(190,231,246,.3)] focus:outline-none focus:ring-2 focus:ring-white/80"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
      <span className="grid size-8 place-items-center rounded-full border border-white/35 bg-white/20 shadow-inner transition group-hover:rotate-12 group-hover:border-[#9ed4e7]/70 group-hover:bg-[#0d4a6b]/80">
        <ExternalArrowIcon className="h-4 w-4" />
      </span>
    </a>
  );
}

function openStreetMapUrl(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=8/${latitude}/${longitude}`;
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

function TransactionsStatePanel({
  title,
  message,
  onCreateOrder,
}: {
  title: string;
  message: string;
  onCreateOrder?: () => void;
}) {
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
        <h2 className="mt-5 text-[20px] font-semibold leading-[28px] text-[#303034]">
          {title}
        </h2>
        <p className="mt-2 text-[14px] font-medium leading-[22px] text-[#8d8d93]">
          {message}
        </p>
        {onCreateOrder ? <div className="mt-5">
          <PrimaryButton onClick={onCreateOrder}>
            Create first order
          </PrimaryButton>
        </div> : null}
      </motion.div>
    </motion.section>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`${className} animate-pulse rounded-[6px] bg-[#ededf0]`} />
  );
}

function SkeletonLine({ className }: { className: string }) {
  return (
    <div className={`${className} animate-pulse rounded-full bg-[#ededf0]`} />
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ExternalArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 17 17 7m0 0h-7m7 0v7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
        fill="currentColor"
        opacity=".18"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" fill="currentColor" r="2.2" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 8v5m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
