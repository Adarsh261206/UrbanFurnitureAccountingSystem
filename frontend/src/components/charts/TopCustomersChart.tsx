import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "./ChartCard";

export function TopCustomersChart({ data }: { data: { name: string; outstanding: number }[] }) {
  const chartData = [...data].reverse();

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" barCategoryGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6C757D" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 100000 ? `${v / 100000}L` : `${v / 1000}K`)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontSize: 11, fill: "#495057" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [
              new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(Number(value ?? 0)),
              "Outstanding",
            ]}
            cursor={{ fill: "rgba(1,126,132,0.06)" }}
          />
          <Bar
            dataKey="outstanding"
            fill={CHART_COLORS.revenue}
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
