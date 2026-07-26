import { AppShell } from "@/components/app-shell";
import { AgroBarChart, AgroHorizontalBarChart, AgroLineChart, AgroPieChart } from "@/components/agrotrust-charts";
import type {
  AnalyticsTabKey,
  AnalyticsTab,
  BarChartData,
  DataAnalyticsData,
  DataAnalyticsState,
  DualAxisLineChartData,
  FlowAnalyticsData,
  CommodityExposureChart,
  GeographicFlowChart,
  LineChartData,
  MarketAnalyticsData,
  PriceEvolutionChart,
  ShipmentStatusChart,
  VerticalBarChartData,
} from "./types";

const defaultHeader = {
  title: "Data Analytics",
  dateLabel: "12 Ene 2026",
  searchPlaceholder: "Search TXN ID / COMMODITY / LOT",
  unreadNotifications: 0,
  avatarLabel: "User profile",
  avatarSrc: "/user-avatar.png",
};

const cardClass = "rounded-[8px] border border-[#e8e8ea] bg-white";

export function DataAnalyticsScreen({
  activeTab,
  state,
}: {
  activeTab: AnalyticsTabKey;
  state: DataAnalyticsState;
}) {
  if (state.status === "ready") {
    return (
      <AppShell activeNav="analytics" header={state.data.header} mainClassName="gap-0 px-0 py-0">
        <DataAnalyticsReady activeTab={activeTab} data={state.data} />
      </AppShell>
    );
  }

  if (state.status === "loading") {
    return (
      <AppShell activeNav="analytics" header={defaultHeader} mainClassName="gap-0 px-0 py-0">
        <AnalyticsTabs tabs={buildTabs(activeTab)} />
        <div className="grid gap-[22px] px-4 py-5 sm:px-6 lg:px-5">
          <DataAnalyticsLoadingState />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="analytics" header={defaultHeader} mainClassName="gap-0 px-0 py-0">
      <AnalyticsTabs tabs={buildTabs(activeTab)} />
      <div className="px-4 py-5 sm:px-6 lg:px-5">
        <DataAnalyticsStatePanel message={state.message} title={state.title} />
      </div>
    </AppShell>
  );
}

function DataAnalyticsReady({
  activeTab,
  data,
}: {
  activeTab: AnalyticsTabKey;
  data: DataAnalyticsData;
}) {
  if (activeTab === "flow") {
    return (
      <>
        <AnalyticsTabs tabs={data.tabs} />
        <FlowAnalyticsView flow={data.flow} />
      </>
    );
  }

  if (activeTab === "market") {
    return (
      <>
        <AnalyticsTabs tabs={data.tabs} />
        <MarketAnalyticsView market={data.market} />
      </>
    );
  }

  return (
    <>
      <AnalyticsTabs tabs={data.tabs} />
      <div className="grid gap-[22px] px-4 py-5 sm:px-6 lg:px-5">
        <section className="grid gap-[22px] xl:grid-cols-2">
          <ShipmentStatusDistribution chart={data.shipmentStatus} />
          <CycleDurationTrend chart={data.cycleDuration} />
        </section>
        <ExecutionEfficiencyMetrics chart={data.executionEfficiency} />
      </div>
    </>
  );
}

function AnalyticsTabs({ tabs }: { tabs: AnalyticsTab[] }) {
  return (
    <div className="border-b border-[#eeeeef] bg-white px-4 sm:px-6 lg:px-5">
      <nav aria-label="Analytics sections" className="flex h-[40px] items-end gap-10">
        {tabs.map((tab) => (
          <a
            aria-current={tab.active ? "page" : undefined}
            className={`relative inline-flex h-full items-center px-1 text-[11px] font-medium leading-[16px] ${
              tab.active ? "text-[#15447C]" : "text-[#5f5f65]"
            }`}
            href={getAnalyticsTabHref(tab.label)}
            key={tab.label}
          >
            {tab.label}
            {tab.active ? <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#15447C]" /> : null}
          </a>
        ))}
      </nav>
    </div>
  );
}

function buildTabs(activeTab: AnalyticsTabKey): AnalyticsTab[] {
  return [
    { label: "Operations", active: activeTab === "operations" },
    { label: "Flow", active: activeTab === "flow" },
    { label: "Market", active: activeTab === "market" },
  ];
}

function getAnalyticsTabHref(label: AnalyticsTab["label"]) {
  if (label === "Flow") {
    return "/data-analytics?tab=flow";
  }

  if (label === "Market") {
    return "/data-analytics?tab=market";
  }

  return "/data-analytics";
}

function FlowAnalyticsView({ flow }: { flow: FlowAnalyticsData }) {
  return (
    <div className="grid gap-[18px] px-4 py-5 sm:px-6 lg:px-5">
      <section className="grid gap-[18px] xl:grid-cols-2">
        <VerticalBarChart chart={flow.capitalDeployment} legend />
        <VerticalBarChart chart={flow.paymentTiming} />
      </section>
      <TransactionVolumeChart chart={flow.transactionVolume} />
    </div>
  );
}

function MarketAnalyticsView({ market }: { market: MarketAnalyticsData }) {
  return (
    <div className="grid gap-[18px] px-4 py-5 sm:px-6 lg:px-5">
      <section className="grid gap-[18px] xl:grid-cols-2">
        <CommodityExposureChartView chart={market.commodityExposure} />
        <PriceEvolutionChartView chart={market.priceEvolution} />
      </section>
      <GeographicFlowOverview flow={market.geographicFlow} />
    </div>
  );
}

function CommodityExposureChartView({ chart }: { chart: CommodityExposureChart }) {
  return (
    <section aria-labelledby="commodity-exposure-title" className={`${cardClass} min-h-[292px] px-5 py-6`}>
      <ChartTitle id="commodity-exposure-title" subtitle={chart.subtitle} title={chart.title} />
      <AgroBarChart
        className="mt-4 h-[190px] w-full"
        datasets={chart.series.map((series) => ({
          color: series.color,
          label: series.label,
          values: series.values,
          yAxisID: series.axis === "right" ? "y1" : "y",
        }))}
        labels={chart.categories}
        yAxisLabel={chart.leftAxisLabel}
        yMax={chart.leftAxis[0]}
      />
      <ChartLegend items={chart.series.map((series) => ({ color: series.color, label: series.label }))} />
    </section>
  );
}

function PriceEvolutionChartView({ chart }: { chart: PriceEvolutionChart }) {
  return (
    <section aria-labelledby="price-evolution-title" className={`${cardClass} min-h-[292px] px-5 py-6`}>
      <ChartTitle id="price-evolution-title" subtitle={chart.subtitle} title={chart.title} />
      <AgroLineChart
        className="mt-4 h-[176px] w-full"
        datasets={chart.series.map((series) => ({
          color: series.color,
          label: series.label,
          values: series.values,
        }))}
        labels={chart.weeks}
        yAxisLabel={chart.yAxisLabel}
        yMax={chart.yAxis[0]}
        yTicks={chart.yAxis}
      />
      <ChartLegend items={chart.series.map((series) => ({ color: series.color, label: series.label }))} />
      <p className="mt-3 text-[9px] font-medium italic leading-[13px] text-[#a0a0a6]">{chart.note}</p>
    </section>
  );
}

function GeographicFlowOverview({ flow }: { flow: GeographicFlowChart }) {
  return (
    <section aria-labelledby="geographic-flow-title" className={`${cardClass} min-h-[206px] px-5 py-6`}>
      <ChartTitle id="geographic-flow-title" subtitle={flow.subtitle} title={flow.title} />
      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        <GeographicFlowColumn items={flow.origins} title={flow.originTitle} />
        <GeographicFlowColumn items={flow.destinations} title={flow.destinationTitle} />
      </div>
    </section>
  );
}

function GeographicFlowColumn({ items, title }: { items: GeographicFlowChart["origins"]; title: string }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold leading-[16px] text-[#242428]">{title}</h3>
      <div className="mt-3 grid gap-[9px]">
        {items.map((item) => (
          <div className="grid gap-1" key={item.country}>
            <div className="flex items-center justify-between gap-4 text-[10px] font-medium leading-[14px] text-[#6b6b72]">
              <span>{item.country}</span>
              <span className="text-[#303034]">{item.percentage}%</span>
            </div>
            <div className="h-[5px] rounded-full bg-[#eeeeef]">
              <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${item.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="mt-1 flex justify-center gap-5">
      {items.map((item) => (
        <div className="flex items-center gap-2 text-[10px] font-medium leading-[15px] text-[#7f7f85]" key={item.label}>
          <span className="h-[8px] w-[8px] rounded-[2px]" style={{ backgroundColor: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function VerticalBarChart({ chart, legend = false }: { chart: VerticalBarChartData; legend?: boolean }) {
  const titleId = `${chart.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;

  return (
    <section aria-labelledby={titleId} className={`${cardClass} min-h-[292px] px-5 py-6`}>
      <ChartTitle id={titleId} subtitle={chart.subtitle} title={chart.title} />
      <AgroBarChart
        className="mt-4 h-[190px] w-full"
        datasets={chart.bars.map((bar) => ({
          color: bar.color,
          label: bar.label,
          values: bar.values,
        }))}
        labels={chart.xLabels}
        yAxisLabel={chart.yAxisLabel}
        yMax={chart.yAxis[0]}
      />
      {legend ? (
        <div className="mt-1 flex justify-center gap-5">
          {chart.bars.map((bar) => (
            <div className="flex items-center gap-2 text-[10px] font-medium leading-[15px] text-[#7f7f85]" key={bar.label}>
              <span className="h-[8px] w-[8px] rounded-[2px]" style={{ backgroundColor: bar.color }} />
              {bar.label}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function TransactionVolumeChart({ chart }: { chart: DualAxisLineChartData }) {
  return (
    <section aria-labelledby="transaction-volume-title" className={`${cardClass} min-h-[245px] px-5 py-6`}>
      <ChartTitle id="transaction-volume-title" subtitle={chart.subtitle} title={chart.title} />
      <AgroLineChart
        className="mt-4 h-[185px] w-full"
        datasets={[
          {
            color: chart.color,
            label: chart.leftAxisLabel,
            values: chart.values,
          },
        ]}
        labels={chart.months}
        yAxisLabel={chart.leftAxisLabel}
        yMax={chart.leftAxis[0]}
        yTicks={chart.leftAxis}
      />
    </section>
  );
}

function ShipmentStatusDistribution({ chart }: { chart: ShipmentStatusChart }) {
  return (
    <section aria-labelledby="shipment-status-title" className={`${cardClass} min-h-[344px] px-5 py-6`}>
      <ChartTitle id="shipment-status-title" subtitle={chart.subtitle} title={chart.title} />
      <div className="mt-5 grid items-center gap-3 md:grid-cols-[1fr_260px_1fr]">
        <div className="hidden md:block" />
        <AgroPieChart
          className="mx-auto h-[185px] w-[250px]"
          colors={chart.segments.map((segment) => segment.color)}
          labels={chart.segments.map((segment) => segment.label)}
          values={chart.segments.map((segment) => segment.value)}
        />
        <div className="hidden md:block" />
      </div>
      <div className="mx-auto mt-5 grid max-w-[470px] grid-cols-1 gap-x-16 gap-y-2 sm:grid-flow-col sm:grid-rows-2">
        {chart.segments.map((segment) => (
          <div className="flex items-center gap-2 text-[10px] font-medium leading-[15px] text-[#7f7f85]" key={segment.label}>
            <span className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: segment.color }} />
            {segment.label}: {segment.value}%
          </div>
        ))}
      </div>
    </section>
  );
}

function CycleDurationTrend({ chart }: { chart: LineChartData }) {
  return (
    <section aria-labelledby="cycle-duration-title" className={`${cardClass} min-h-[344px] px-5 py-6`}>
      <ChartTitle id="cycle-duration-title" subtitle={chart.subtitle} title={chart.title} />
      <AgroLineChart
        className="mt-5 h-[245px] w-full"
        datasets={[
          {
            color: "#245895",
            label: chart.yAxisLabel,
            values: chart.values,
          },
        ]}
        labels={chart.months}
        yAxisLabel={chart.yAxisLabel}
        yMax={chart.yAxis[0]}
        yTicks={chart.yAxis}
      />
    </section>
  );
}

function ExecutionEfficiencyMetrics({ chart }: { chart: BarChartData }) {
  return (
    <section aria-labelledby="execution-efficiency-title" className={`${cardClass} min-h-[290px] px-5 py-6`}>
      <ChartTitle id="execution-efficiency-title" subtitle={chart.subtitle} title={chart.title} />
      <AgroHorizontalBarChart
        className="mt-5 h-[210px] w-full"
        labels={chart.items.map((item) => item.label)}
        values={chart.items.map((item) => item.value)}
        xAxisLabel={chart.xAxisLabel}
        xMax={chart.xAxis[chart.xAxis.length - 1]}
      />
    </section>
  );
}

function ChartTitle({ id, subtitle, title }: { id: string; subtitle: string; title: string }) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold leading-[18px] text-[#17171a]" id={id}>
        {title}
      </h2>
      <p className="mt-1 text-[10px] font-medium leading-[15px] text-[#8f8f95]">{subtitle}</p>
    </div>
  );
}

function DataAnalyticsLoadingState() {
  return (
    <>
      <section className="grid gap-[22px] xl:grid-cols-2">
        <SkeletonBlock className="h-[344px]" />
        <SkeletonBlock className="h-[344px]" />
      </section>
      <SkeletonBlock className="h-[290px]" />
    </>
  );
}

function DataAnalyticsStatePanel({ title, message }: { title: string; message: string }) {
  return (
    <section className="flex min-h-[540px] items-center justify-center rounded-[8px] border border-[#e8e8ea] bg-white p-8 text-center">
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

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`${className} animate-pulse rounded-[8px] bg-[#ededf0]`} />;
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 8v5m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}
