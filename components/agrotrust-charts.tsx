"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import { motion } from "motion/react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

type ChartShellProps = {
  children: React.ReactNode;
  className?: string;
};

const chartTextColor = "#85858b";
const gridColor = "#ececef";
const axisColor = "#cfcfd3";
const quickEase = [0.22, 1, 0.36, 1] as const;

export function ChartShell({ children, className = "h-[250px]" }: ChartShellProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.32, ease: quickEase }}
    >
      {children}
    </motion.div>
  );
}

export function AgroLineChart({
  labels,
  datasets,
  yAxisLabel,
  yMax,
  yTicks,
  className,
}: {
  labels: string[];
  datasets: {
    label: string;
    color: string;
    values: number[];
  }[];
  yAxisLabel?: string;
  yMax?: number;
  yTicks?: number[];
  className?: string;
}) {
  const data: ChartData<"line"> = {
    labels,
    datasets: datasets.map((dataset) => ({
      backgroundColor: dataset.color,
      borderColor: dataset.color,
      borderWidth: 2.2,
      data: dataset.values,
      label: dataset.label,
      pointBackgroundColor: dataset.color,
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      pointRadius: 4,
      tension: 0.34,
    })),
  };

  return (
    <ChartShell className={className}>
      <Line data={data} options={lineOptions({ yAxisLabel, yMax, yTicks })} />
    </ChartShell>
  );
}

export function AgroBarChart({
  labels,
  datasets,
  yAxisLabel,
  yMax,
  className,
}: {
  labels: string[];
  datasets: {
    label: string;
    color: string;
    values: number[];
    yAxisID?: "y" | "y1";
  }[];
  yAxisLabel?: string;
  yMax?: number;
  className?: string;
}) {
  const hasRightAxis = datasets.some((dataset) => dataset.yAxisID === "y1");
  const data: ChartData<"bar"> = {
    labels,
    datasets: datasets.map((dataset) => ({
      backgroundColor: dataset.color,
      borderRadius: 5,
      data: dataset.values,
      label: dataset.label,
      maxBarThickness: 44,
      yAxisID: dataset.yAxisID || "y",
    })),
  };

  return (
    <ChartShell className={className}>
      <Bar data={data} options={barOptions({ hasRightAxis, yAxisLabel, yMax })} />
    </ChartShell>
  );
}

export function AgroHorizontalBarChart({
  labels,
  values,
  color = "#245895",
  xAxisLabel,
  xMax,
  className,
}: {
  labels: string[];
  values: number[];
  color?: string;
  xAxisLabel?: string;
  xMax?: number;
  className?: string;
}) {
  const data: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        backgroundColor: color,
        borderRadius: 4,
        data: values,
        label: xAxisLabel || "Value",
        maxBarThickness: 42,
      },
    ],
  };

  return (
    <ChartShell className={className}>
      <Bar data={data} options={horizontalBarOptions({ xAxisLabel, xMax })} />
    </ChartShell>
  );
}

export function AgroPieChart({
  labels,
  values,
  colors,
  className,
}: {
  labels: string[];
  values: number[];
  colors: string[];
  className?: string;
}) {
  const data: ChartData<"pie"> = {
    labels,
    datasets: [
      {
        backgroundColor: colors,
        borderColor: "#ffffff",
        borderWidth: 2,
        data: values,
      },
    ],
  };

  return (
    <ChartShell className={className}>
      <Pie data={data} options={pieOptions} />
    </ChartShell>
  );
}

export function AgroGaugeChart({
  availableLabel,
  className,
  color = "#3f73b6",
  label,
  percent,
}: {
  availableLabel?: string;
  className?: string;
  color?: string;
  label: string;
  percent: number;
}) {
  const normalizedPercent = Math.max(0, Math.min(100, percent));
  const data: ChartData<"doughnut"> = {
    labels: [label, availableLabel || "Remaining"],
    datasets: [
      {
        backgroundColor: [color, "#dadada"],
        borderWidth: 0,
        circumference: 180,
        data: [normalizedPercent, 100 - normalizedPercent],
        rotation: 270,
      },
    ],
  };

  return (
    <ChartShell className={className}>
      <Doughnut data={data} options={gaugeOptions} />
    </ChartShell>
  );
}

function basePlugins(legendDisplay = false): ChartOptions["plugins"] {
  return {
    legend: {
      display: legendDisplay,
      labels: {
        boxHeight: 9,
        boxWidth: 9,
        color: chartTextColor,
        font: {
          family: "Inter, sans-serif",
          size: 11,
          weight: 500,
        },
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: "#0d1f35",
      bodyColor: "#ffffff",
      borderColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      displayColors: true,
      padding: 10,
      titleColor: "#ffffff",
      titleFont: {
        family: "Inter, sans-serif",
        size: 12,
        weight: 700,
      },
    },
  };
}

function lineOptions({
  yAxisLabel,
  yMax,
  yTicks,
}: {
  yAxisLabel?: string;
  yMax?: number;
  yTicks?: number[];
}): ChartOptions<"line"> {
  return {
    animation: {
      duration: 900,
      easing: "easeOutQuart",
    },
    maintainAspectRatio: false,
    plugins: basePlugins(true),
    responsive: true,
    scales: {
      x: axisScale(),
      y: {
        ...axisScale(yAxisLabel),
        max: yMax,
        ticks: {
          ...axisScale(yAxisLabel).ticks,
          callback: yTicks ? (value) => (yTicks.includes(Number(value)) ? String(value) : "") : undefined,
        },
      },
    },
  };
}

function barOptions({
  hasRightAxis,
  yAxisLabel,
  yMax,
}: {
  hasRightAxis: boolean;
  yAxisLabel?: string;
  yMax?: number;
}): ChartOptions<"bar"> {
  return {
    animation: {
      duration: 850,
      easing: "easeOutQuart",
    },
    maintainAspectRatio: false,
    plugins: basePlugins(true),
    responsive: true,
    scales: {
      x: axisScale(),
      y: {
        ...axisScale(yAxisLabel),
        max: yMax,
      },
      ...(hasRightAxis
        ? {
            y1: {
              ...axisScale(),
              grid: {
                drawOnChartArea: false,
              },
              position: "right" as const,
            },
          }
        : {}),
    },
  };
}

function horizontalBarOptions({
  xAxisLabel,
  xMax,
}: {
  xAxisLabel?: string;
  xMax?: number;
}): ChartOptions<"bar"> {
  return {
    animation: {
      duration: 850,
      easing: "easeOutQuart",
    },
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: basePlugins(false),
    responsive: true,
    scales: {
      x: {
        ...axisScale(xAxisLabel),
        max: xMax,
      },
      y: axisScale(),
    },
  };
}

const pieOptions: ChartOptions<"pie"> = {
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 900,
    easing: "easeOutQuart",
  },
  maintainAspectRatio: false,
  plugins: basePlugins(false),
  responsive: true,
};

const gaugeOptions: ChartOptions<"doughnut"> = {
  animation: {
    animateRotate: true,
    duration: 950,
    easing: "easeOutQuart",
  },
  cutout: "68%",
  maintainAspectRatio: false,
  plugins: basePlugins(false),
  responsive: true,
};

function axisScale(title?: string) {
  return {
    border: {
      color: axisColor,
    },
    grid: {
      color: gridColor,
      drawTicks: false,
    },
    ticks: {
      color: "#a4a4aa",
      font: {
        family: "Inter, sans-serif",
        size: 10,
        weight: 500,
      },
      padding: 8,
    },
    title: {
      color: chartTextColor,
      display: Boolean(title),
      font: {
        family: "Inter, sans-serif",
        size: 10,
        weight: 500,
      },
      text: title,
    },
  };
}
