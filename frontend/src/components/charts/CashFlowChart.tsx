import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./ChartCard";

export function CashFlowChart({
  data,
}: {
  data: { month: string; inflow: number; outflow: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="inflowFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.inflow} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CHART_COLORS.inflow} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="outflowFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.outflow} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CHART_COLORS.outflow} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#6C757D" }}
            axisLine={{ stroke: "#DEE2E6" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6C757D" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 100000 ? `${v / 100000}L` : `${v / 1000}K`)}
            width={50}
          />
          <Tooltip
            formatter={(value) => [
              new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(Number(value ?? 0)),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="inflow"
            name="Money In"
            stroke={CHART_COLORS.inflow}
            strokeWidth={2}
            fill="url(#inflowFill)"
          />
          <Area
            type="monotone"
            dataKey="outflow"
            name="Money Out"
            stroke={CHART_COLORS.outflow}
            strokeWidth={2}
            fill="url(#outflowFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
