"use client";

import { AppShell } from "@/components/app-shell";
import { motion } from "motion/react";
import { AgroGaugeChart, AgroLineChart } from "@/components/agrotrust-charts";
import type {
  ActivityItem,
  CommodityPerformance,
  DashboardData,
  DashboardDataState,
  DashboardMessage,
  DashboardNotification,
  LoanToValue,
  MetricCard,
  QuickAction,
  RecentTransaction,
  StatusOverviewItem,
} from "./types";

const defaultHeader = {
  title: "Dashboard",
  dateLabel: "12 Jan 2026",
  searchPlaceholder: "Search TXN ID / COMMODITY / LOT",
  unreadNotifications: 0,
  avatarLabel: "User profile",
  avatarSrc: "/user-avatar.png",
};

const statusStyles = {
  blue: {
    text: "text-[#2d5f9f]",
    dot: "bg-[#2d5f9f]",
    soft: "bg-[#eaf2fd]",
    bar: "bg-[#2d5f9f]",
  },
  green: {
    text: "text-[#087d2f]",
    dot: "bg-[#0a8a37]",
    soft: "bg-[#e9f7ed]",
    bar: "bg-[#087d2f]",
  },
  red: {
    text: "text-[#ef4f55]",
    dot: "bg-[#ef4f55]",
    soft: "bg-[#ffe9eb]",
    bar: "bg-[#ef4f55]",
  },
  amber: {
    text: "text-[#986115]",
    dot: "bg-[#9a620f]",
    soft: "bg-[#f7efe4]",
    bar: "bg-[#9a620f]",
  },
} satisfies Record<StatusOverviewItem["color"], Record<"text" | "dot" | "soft" | "bar", string>>;

const panelClass = "rounded-[8px] border border-[#ebebeb] bg-white";
const hoverTransition = { type: "tween", duration: 0.1, ease: "easeOut" } as const;
const quickHoverTransition = { type: "tween", duration: 0.12, ease: "easeOut" } as const;
const cardHoverMotion = {
  rest: { y: 0, scale: 1, boxShadow: "0 0 0 rgba(0, 28, 66, 0)", transition: hoverTransition },
  hover: { y: -2, scale: 1.004, boxShadow: "0 10px 24px rgba(0, 28, 66, 0.08)", transition: quickHoverTransition },
};
const quickActionIconMotion = {
  rest: { rotate: 0, scale: 1, transition: hoverTransition },
  hover: { rotate: -3, scale: 1.04, transition: quickHoverTransition },
};
const sectionMotion = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.045,
      duration: 0.36,
    },
  }),
};

export function DashboardScreen({ state }: { state: DashboardDataState }) {
  if (state.status === "ready") {
    return (
      <AppShell activeNav="dashboard" header={state.data.header} notifications={state.data.notifications}>
        <DashboardReady data={state.data} />
      </AppShell>
    );
  }

  if (state.status === "loading") {
    return (
      <AppShell activeNav="dashboard" header={defaultHeader}>
        <DashboardLoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="dashboard" header={defaultHeader}>
      <DashboardStatePanel title={state.title} message={state.message} />
    </AppShell>
  );
}

function DashboardReady({ data }: { data: DashboardData }) {
  return (
    <>
      <motion.div animate="visible" custom={0} initial="hidden" variants={sectionMotion}>
        <QuickActions actions={data.quickActions} />
      </motion.div>
      <motion.div animate="visible" custom={1} initial="hidden" variants={sectionMotion}>
        <MetricGrid metrics={data.metrics} />
      </motion.div>
      <motion.section animate="visible" className="grid gap-[26px] xl:grid-cols-[minmax(0,2.08fr)_minmax(340px,1fr)]" custom={2} initial="hidden" variants={sectionMotion}>
        <RecentTransactions transactions={data.recentTransactions} />
        <NotificationsPanel notifications={data.notifications} />
      </motion.section>
      <motion.section animate="visible" className="grid gap-[26px] xl:grid-cols-[minmax(0,2.08fr)_minmax(340px,1fr)]" custom={3} initial="hidden" variants={sectionMotion}>
        <CommodityPerformanceChart chart={data.commodityPerformance} />
        <LoanToValueGauge data={data.loanToValue} />
      </motion.section>
      <motion.div animate="visible" custom={4} initial="hidden" variants={sectionMotion}>
        <StatusOverview items={data.statusOverview} />
      </motion.div>
      <motion.section animate="visible" className="grid gap-[26px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" custom={5} initial="hidden" variants={sectionMotion}>
        <MessagesPanel messages={data.messages} />
        <RecentActivityPanel items={data.recentActivity} />
      </motion.section>
    </>
  );
}

function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section aria-labelledby="quick-actions-title" className={`${panelClass} px-4 py-5 sm:px-6 sm:py-7`}>
      <div>
        <h2 id="quick-actions-title" className="text-[16px] font-semibold leading-[22px] text-[#343438]">
          Quick Actions
        </h2>
        <p className="mt-1 text-[13px] font-medium leading-[20px] text-[#a3a3a8]">Common tasks and shortcuts</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {actions.map((action) => (
          <motion.a
            aria-label={action.accessibilityLabel}
            aria-disabled={action.disabled ? "true" : undefined}
            className={`group flex min-w-0 flex-col items-center justify-center gap-3 rounded-[7px] border border-[#e5e5e7] bg-white px-3 py-4 text-center outline-none transition-colors duration-100 ease-out focus:ring-2 focus:ring-[#2d5f9f]/30 sm:h-[112px] sm:gap-4 sm:px-4 ${
              action.disabled ? "cursor-not-allowed opacity-55" : "hover:border-[#cbdcf1] hover:bg-[#fbfdff]"
            }`}
            href={action.disabled ? undefined : action.href}
            key={action.id}
            initial="rest"
            onClick={action.disabled ? (event) => event.preventDefault() : undefined}
            transition={quickHoverTransition}
            whileFocus={action.disabled ? undefined : "hover"}
            whileHover={action.disabled ? undefined : "hover"}
            whileTap={action.disabled ? undefined : { scale: 0.985 }}
            variants={cardHoverMotion}
          >
            <motion.span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf2fd] transition-colors duration-100 ease-out group-hover:bg-[#dceafa] sm:h-[46px] sm:w-[46px]" variants={quickActionIconMotion}>
              <QuickActionIcon icon={action.icon} />
            </motion.span>
            <span className="max-w-full text-[12px] font-semibold leading-[17px] text-[#45454a] sm:text-[13px] sm:leading-[19px]">{action.label}</span>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: MetricCard[] }) {
  return (
    <section aria-label="Dashboard metrics" className="grid grid-cols-2 gap-3 sm:gap-[18px] xl:grid-cols-4">
      {metrics.map((metric) => (
        <motion.article className={`${panelClass} min-h-[112px] px-4 py-5 sm:min-h-[120px]`} initial="rest" key={metric.label} whileHover="hover" variants={cardHoverMotion}>
          <p className="text-[12px] font-bold uppercase leading-[18px] text-[#9b9ba0]">{metric.label}</p>
          <p className="mt-3 text-[26px] font-bold leading-[31px] text-[#28282d] sm:text-[30px] sm:leading-[36px]">{metric.value}</p>
          <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold leading-[17px]">
            <span className="text-[#1b9443]">+ {metric.delta.replace("+", "")}</span>
            <span className="text-[#a4a4aa]">{metric.deltaContext}</span>
          </p>
        </motion.article>
      ))}
    </section>
  );
}

function RecentTransactions({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <section aria-labelledby="recent-transactions-title" className={`${panelClass} min-h-[410px] p-4 sm:p-6`}>
      <SectionHeader
        subtitle="Latest activity across all shipments"
        title="Recent Transactions"
        titleId="recent-transactions-title"
        viewAllHref="/transactions"
        viewAllLabel="View all transactions"
      />
      <div className="mt-6 divide-y divide-[#ededee]">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <motion.a
              className="group grid gap-3 rounded-[6px] px-2 py-[15px] outline-none transition-colors duration-100 ease-out hover:bg-[#f7faff] focus:bg-[#f7faff] focus:ring-2 focus:ring-[#15447C]/15 sm:grid-cols-[minmax(140px,1fr)_minmax(220px,1.1fr)_72px] sm:items-center"
              href={transaction.href}
              key={transaction.number}
              transition={hoverTransition}
              whileHover={{ x: 2 }}
            >
              <div>
                <h3 className="text-[13px] font-bold leading-[18px] text-[#414145] transition-colors duration-100 ease-out group-hover:text-[#15447C]">{transaction.number}</h3>
                <p className="mt-1 text-[12px] font-medium leading-[17px] text-[#99999e]">
                  {transaction.commodity} - {transaction.volume}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[12px] font-medium leading-[17px] text-[#99999e]">{transaction.route}</p>
                <p className="mt-1 text-[13px] font-bold leading-[18px] text-[#424247]">{transaction.amount}</p>
              </div>
              <div className="sm:text-right">
                <StatusBadge status={transaction.status} />
              </div>
            </motion.a>
          ))
        ) : (
          <RecentTransactionsEmptyState />
        )}
      </div>
    </section>
  );
}

function RecentTransactionsEmptyState() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[270px] items-center justify-center px-4 py-8 text-center"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="max-w-[320px]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf2fd] text-[#2d5f9f]">
          <EmptyTransactionsIcon className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-[15px] font-semibold leading-[21px] text-[#343438]">No transactions available</h3>
        <p className="mt-2 text-[12px] font-medium leading-[18px] text-[#8d8d93]">
          Orders returned by the backend will appear here as soon as they are available.
        </p>
        <motion.a
          className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-[6px] bg-[#0d3b70] px-4 text-[12px] font-semibold leading-[18px] text-white transition hover:bg-[#15447C] focus:outline-none focus:ring-2 focus:ring-[#15447C]/30"
          href="/transactions"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          View transactions
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </motion.a>
      </div>
    </motion.div>
  );
}

function NotificationsPanel({ notifications }: { notifications: DashboardNotification[] }) {
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return (
    <section aria-labelledby="notifications-title" className={`${panelClass} group min-h-[410px] px-5 py-6 sm:px-7`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="notifications-title" className="text-[16px] font-semibold leading-[22px] text-[#343438]">
            Notifications
          </h2>
          <p className="mt-1 text-[13px] font-medium leading-[20px] text-[#a3a3a8]">
            {unreadCount} alerts require attention
          </p>
        </div>
        <motion.a
          aria-label="View all notifications"
          className="mt-1 inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[13px] font-semibold leading-[18px] text-[#2d5f9f] opacity-100 transition hover:text-[#164780] focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          href="/transactions?tab=alerts"
          transition={hoverTransition}
          whileHover={{ x: 1 }}
        >
          View all
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </motion.a>
      </div>
      <div className="mt-7 grid gap-2">
        {notifications.map((notification) => (
          <motion.a
            className="group rounded-[6px] px-3 py-3 outline-none transition-colors duration-100 ease-out hover:bg-[#f7faff] focus:bg-[#f7faff] focus:ring-2 focus:ring-[#15447C]/15"
            href={notification.href}
            key={notification.id}
            transition={hoverTransition}
            whileHover={{ x: 2 }}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${notification.unread ? "bg-[#ef4f55]" : "bg-[#d4d4d8]"}`} />
              <div>
                <h3 className="text-[13px] font-semibold leading-[18px] text-[#4c4c51] transition-colors duration-100 ease-out group-hover:text-[#15447C]">{notification.title}</h3>
                <p className="mt-1 text-[12px] font-medium leading-[17px] text-[#8d8d93]">{notification.description}</p>
              </div>
            </div>
            <p className="mt-1 text-[12px] font-medium leading-[17px] text-[#aaaab0]">{notification.timeAgo}</p>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

function CommodityPerformanceChart({ chart }: { chart: CommodityPerformance }) {
  const drawableSeries = chart.series.filter((series) => series.values.length > 0);

  return (
    <section aria-labelledby="commodity-performance-title" className={`${panelClass} min-h-[360px] p-4 sm:min-h-[380px] sm:p-6`}>
      <h2 id="commodity-performance-title" className="text-[16px] font-semibold leading-[22px] text-[#343438]">
        {chart.title}
      </h2>
      <p className="mt-1 text-[13px] font-medium leading-[20px] text-[#a3a3a8]">{chart.subtitle}</p>
      <div className="mt-4 overflow-hidden">
        <AgroLineChart
          className="h-[220px] w-full sm:h-[250px]"
          datasets={drawableSeries.map((series) => ({
            color: series.color,
            label: series.name,
            values: series.values,
          }))}
          labels={chart.months}
          yMax={chart.yAxis[0]}
          yTicks={chart.yAxis}
        />
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-7">
          {chart.series.map((series) => (
            <span className="flex items-center gap-2 text-[12px] font-medium leading-[17px] text-[#8f8f95]" key={series.name}>
              <span className="h-[13px] w-[13px] rounded-full" style={{ backgroundColor: series.color }} />
              {series.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoanToValueGauge({ data }: { data: LoanToValue }) {
  return (
    <section aria-labelledby="ltv-title" className={`${panelClass} min-h-[360px] px-5 py-7 sm:min-h-[380px] sm:px-7 sm:py-8`}>
      <h2 id="ltv-title" className="text-[22px] font-semibold leading-[28px] text-[#77777d]">
        {data.title}
      </h2>
      <div className="relative mx-auto mt-6 max-w-[360px] sm:mt-7">
        <div className="relative h-[190px] w-full sm:h-[210px]">
          <AgroGaugeChart availableLabel="Total Value" className="h-full w-full" label="Loan Amount" percent={data.percent} />
          <div className="pointer-events-none absolute inset-x-0 top-[96px] text-center text-[32px] font-extrabold leading-[38px] text-[#16161a] sm:top-[108px] sm:text-[34px] sm:leading-[40px]">
            {data.percent}%
          </div>
        </div>
        <div className="mt-[-4px] border-t border-[#ececee] pt-2">
          <div className="flex items-center justify-between text-[12px] font-medium leading-[18px]">
            <span className="flex items-center gap-2 text-[#85858b]">
              <span className="h-[13px] w-[13px] rounded-full bg-[#3f73b6]" />
              Loan Amount
            </span>
            <strong className="font-bold text-[#424247]">{data.loanAmount}</strong>
          </div>
          <div className="mt-2 flex items-center justify-between text-[12px] font-medium leading-[18px]">
            <span className="flex items-center gap-2 text-[#85858b]">
              <span className="h-[13px] w-[13px] rounded-full bg-[#d7d7d8]" />
              Total Value
            </span>
            <strong className="font-bold text-[#424247]">{data.totalValue}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#ececee] pt-3 text-[12px] font-medium leading-[18px]">
            <span className="text-[#85858b]">Available to Finance</span>
            <strong className="font-bold text-[#1b9443]">{data.availableToFinance}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusOverview({ items }: { items: StatusOverviewItem[] }) {
  return (
    <section aria-labelledby="status-overview-title" className={`${panelClass} px-4 py-6 sm:px-6 sm:py-7`}>
      <h2 id="status-overview-title" className="text-[16px] font-semibold leading-[22px] text-[#343438]">
        Transaction Status Overview
      </h2>
      <p className="mt-1 text-[13px] font-medium leading-[20px] text-[#a3a3a8]">
        Current distribution across all 100 transactions
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        {items.map((item) => (
          <StatusTile item={item} key={item.label} />
        ))}
      </div>
    </section>
  );
}

function StatusTile({ item }: { item: StatusOverviewItem }) {
  const styles = statusStyles[item.color];

  return (
    <motion.article className="rounded-[7px] border border-[#e7e7e9] bg-white p-4 sm:p-5" initial="rest" whileHover="hover" variants={cardHoverMotion}>
      <div className="flex items-center gap-2 sm:gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${styles.soft}`}>
          <span className={`h-[13px] w-[13px] rounded-full sm:h-[15px] sm:w-[15px] ${styles.dot}`} />
        </span>
        <div>
          <h3 className="text-[14px] font-semibold leading-[19px] text-[#39393d]">{item.label}</h3>
          <p className="text-[12px] font-medium leading-[17px] text-[#a1a1a7]">{item.percentLabel}</p>
        </div>
      </div>
      <p className={`mt-5 text-[30px] font-bold leading-[36px] sm:mt-6 sm:text-[34px] sm:leading-[40px] ${styles.text}`}>{item.count}</p>
      <p className="mt-2 text-[12px] font-medium leading-[17px] text-[#8f8f95]">transactions</p>
      <div className="mt-4 h-[6px] rounded-full bg-[#f0f0f2]">
        <div
          aria-label={`${item.label} transactions ${item.percentLabel}`}
          className={`h-full rounded-full ${styles.bar}`}
          role="img"
          style={{ width: `${item.progressPercent}%` }}
        />
      </div>
    </motion.article>
  );
}

function MessagesPanel({ messages }: { messages: DashboardMessage[] }) {
  const unreadCount = messages.filter((message) => message.unread).length;

  return (
    <section aria-labelledby="messages-title" className={`${panelClass} min-h-[390px] p-4 sm:p-6`}>
      <SectionHeader
        subtitle={`${unreadCount} unread messages`}
        title="Messages"
        titleId="messages-title"
        viewAllHref="/messages"
        viewAllLabel="View all messages"
      />
      <div className="mt-5 divide-y divide-[#ededee]">
        {messages.map((message) => (
          <motion.a
            className={`group grid gap-2 rounded-[4px] px-2 py-3 outline-none transition-colors duration-100 ease-out hover:bg-[#f7faff] focus:bg-[#f7faff] focus:ring-2 focus:ring-[#15447C]/15 sm:grid-cols-[1fr_86px] ${message.unread ? "bg-[#f5f8fc]" : ""}`}
            href={message.href}
            key={`${message.sender}-${message.timeAgo}`}
            transition={hoverTransition}
            whileHover={{ x: 2 }}
          >
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-bold leading-[18px] text-[#4b4b50] transition-colors duration-100 ease-out group-hover:text-[#15447C]">
                {message.sender}
                {message.unread ? <span className="ml-2 inline-block h-[6px] w-[6px] rounded-full bg-[#2d5f9f] align-middle" /> : null}
              </h3>
              <p className="mt-1 truncate text-[12px] font-medium leading-[17px] text-[#8d8d93]">{message.subject}</p>
            </div>
            <p className="text-left text-[12px] font-medium leading-[17px] text-[#aaaab0] sm:text-right">{message.timeAgo}</p>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

function RecentActivityPanel({ items }: { items: ActivityItem[] }) {
  return (
    <section aria-labelledby="activity-title" className={`${panelClass} min-h-[390px] px-5 py-6 sm:px-7 sm:py-7`}>
      <h2 id="activity-title" className="text-[16px] font-semibold leading-[22px] text-[#343438]">
        Recent Activity
      </h2>
      <p className="mt-1 text-[13px] font-medium leading-[20px] text-[#a3a3a8]">Latest updates and events</p>
      <div className="relative mt-6 grid gap-6 pl-8">
        <span className="absolute bottom-0 left-[13px] top-3 w-px bg-[#e6e6e8]" />
        {items.map((item) => (
          <motion.a className="group relative block rounded-[6px] px-2 py-1 outline-none transition-colors duration-100 ease-out hover:bg-[#f7faff] focus:bg-[#f7faff] focus:ring-2 focus:ring-[#15447C]/15" href={item.href} key={`${item.title}-${item.timeAgo}`} transition={hoverTransition} whileHover={{ x: 2 }}>
            <span className="absolute -left-8 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-[#eeeeef] bg-[#fafafa] text-[13px]">
              <ActivityIcon icon={item.icon} />
            </span>
            <h3 className="text-[13px] font-bold leading-[18px] text-[#4b4b50] transition-colors duration-100 ease-out group-hover:text-[#15447C]">{item.title}</h3>
            <p className="mt-1 text-[12px] font-medium leading-[17px] text-[#8d8d93]">{item.detail}</p>
            <p className="mt-1 text-[12px] font-medium leading-[17px] text-[#aaaab0]">{item.timeAgo}</p>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  titleId,
  subtitle,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  titleId: string;
  subtitle: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 id={titleId} className="text-[16px] font-semibold leading-[22px] text-[#343438]">
          {title}
        </h2>
        <p className="mt-1 text-[13px] font-medium leading-[20px] text-[#a3a3a8]">{subtitle}</p>
      </div>
      <motion.a
        aria-label={viewAllLabel}
        className="mt-1 inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold leading-[18px] text-[#2d5f9f] transition-colors duration-100 ease-out hover:text-[#164780]"
        href={viewAllHref}
        transition={hoverTransition}
        whileHover={{ x: 1 }}
      >
        View all
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </motion.a>
    </div>
  );
}

function StatusBadge({ status }: { status: RecentTransaction["status"] }) {
  const classes =
    status === "Alert"
      ? "bg-[#ffecef] text-[#d64b55]"
      : status === "Closed"
        ? "border border-[#d9d9dc] bg-white text-[#8d8d93]"
        : "bg-[#eaf2fd] text-[#2d5f9f]";

  return (
    <span className={`inline-flex h-7 items-center rounded-[6px] px-3 text-[12px] font-semibold leading-[17px] ${classes}`}>
      {status}
    </span>
  );
}

function DashboardStatePanel({ title, message }: { title: string; message: string }) {
  return (
    <section className={`${panelClass} flex min-h-[420px] items-center justify-center p-8 text-center`}>
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf2fd] text-[#2d5f9f]">
          <AlertCircleIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-[20px] font-semibold leading-[28px] text-[#303034]">{title}</h2>
        <p className="mt-2 text-[14px] font-medium leading-[22px] text-[#8d8d93]">{message}</p>
      </div>
    </section>
  );
}

function DashboardLoadingState() {
  return (
    <>
      <section className={`${panelClass} px-6 py-7`}>
        <SkeletonLine className="h-5 w-32" />
        <SkeletonLine className="mt-3 h-3 w-44" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock className="h-[112px]" key={index} />
          ))}
        </div>
      </section>
      <section className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock className="h-[120px]" key={index} />
        ))}
      </section>
      <section className="grid gap-[26px] xl:grid-cols-[minmax(0,2.08fr)_minmax(340px,1fr)]">
        <SkeletonBlock className="h-[410px]" />
        <SkeletonBlock className="h-[410px]" />
      </section>
    </>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`${className} animate-pulse rounded-[8px] bg-[#ededf0]`} />;
}

function SkeletonLine({ className }: { className: string }) {
  return <div className={`${className} animate-pulse rounded-full bg-[#ededf0]`} />;
}

function QuickActionIcon({ icon }: { icon: QuickAction["icon"] }) {
  switch (icon) {
    case "plus-square":
      return <PlusSquareIcon className="h-5 w-5 text-[#2d5f9f]" />;
    case "download":
      return <DownloadIcon className="h-5 w-5 text-[#2d5f9f]" />;
    case "trend":
      return <TrendIcon className="h-5 w-5 text-[#2d5f9f]" />;
    case "document":
      return <DocumentIcon className="h-5 w-5 text-[#2d5f9f]" />;
  }
}

function ActivityIcon({ icon }: { icon: ActivityItem["icon"] }) {
  switch (icon) {
    case "contract":
      return <ContractActivityIcon className="h-4 w-4 text-[#b0b0b5]" />;
    case "payment":
      return <PaymentActivityIcon className="h-4 w-4 text-[#c49a30]" />;
    case "document":
      return <PaperclipActivityIcon className="h-4 w-4 text-[#aab3c3]" />;
    case "vessel":
      return <VesselActivityIcon className="h-4 w-4 text-[#b85b3f]" />;
  }
}

function PlusSquareIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M8 12h8m-4-4v8M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 4v9m0 0 4-4m-4 4L8 9m-3 7v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m5 15 4-4 3 3 6-7m0 0h-4m4 0v4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M8 4h7l4 4v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M14 4v5h5M9 14h4m-4 4h7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <rect fill="#f2aa1d" height="5" rx="1" width="5" x="14" y="13" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
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

function EmptyTransactionsIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M7 4h8l4 4v12H7V4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M15 4v5h4M10 13h6M10 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M4.5 7.5v13h11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" opacity=".45" />
    </svg>
  );
}

function ContractActivityIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M8 4h6l4 4v12H8V4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M14 4v5h4M10 13h6M10 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function PaymentActivityIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 4v16M15.5 8.5c-.5-1-1.7-1.6-3.1-1.6-1.9 0-3.2.9-3.2 2.3 0 3.5 6.6 1.6 6.6 5.3 0 1.5-1.4 2.6-3.6 2.6-1.7 0-3-.7-3.6-1.9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function PaperclipActivityIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m9.5 12.5 4.9-4.9a3 3 0 0 1 4.2 4.2l-6.4 6.4a5 5 0 0 1-7.1-7.1l6.4-6.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function VesselActivityIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 15h16l-2 4H7l-3-4ZM7 15V9h4v6m2 0V6h4v9M5 20c1.2 0 1.2.8 2.4.8s1.2-.8 2.4-.8 1.2.8 2.4.8 1.2-.8 2.4-.8 1.2.8 2.4.8 1.2-.8 2.4-.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}
