import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./ChartCard";

export function RevenueExpenseChart({
  data,
}: {
  data: { month: string; revenue: number; expense: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={3}>
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
            cursor={{ fill: "rgba(1,126,132,0.06)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill={CHART_COLORS.revenue}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="expense"
            name="Expense"
            fill={CHART_COLORS.expense}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
