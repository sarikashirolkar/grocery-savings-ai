export function MetricCard({ label, value, tone }: { label: string; value: string; tone?: "default" | "highlight" }) {
  return (
    <div className={`panel ${tone === "highlight" ? "border-saffron/60 bg-saffron/10" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
