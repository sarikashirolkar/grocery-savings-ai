"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/chart-card";
import type { NamedValue, SavingsTrend } from "@/lib/types";

const pieColors = ["#604D53", "#DB7F8E", "#9DA3A4", "#D5C5C8", "#FFDBDA"];

function EmptyChartState({ message }: { message: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-steel">{message}</div>;
}

export function DashboardCharts({
  monthlySavings,
  categorySpend,
  storeComparison
}: {
  monthlySavings: SavingsTrend[];
  categorySpend: NamedValue[];
  storeComparison: NamedValue[];
}) {
  return (
    <>
      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Actual vs Optimized Spend">
          {monthlySavings.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySavings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="actual_spend" fill="#9DA3A4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="optimized_spend" fill="#DB7F8E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState message="Upload more receipts to populate the monthly comparison chart." />
          )}
        </ChartCard>
        <ChartCard title="Category Spend">
          {categorySpend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categorySpend} dataKey="value" nameKey="name" outerRadius={100}>
                  {categorySpend.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState message="Category mix appears after the first analyzed receipt cycle." />
          )}
        </ChartCard>
      </section>

      <section className="mt-8">
        <ChartCard title="Store-wise Spend">
          {storeComparison.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#DB7F8E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState message="Store comparison will appear once enough purchase history exists." />
          )}
        </ChartCard>
      </section>
    </>
  );
}
