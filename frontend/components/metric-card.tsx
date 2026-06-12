export function MetricCard({ label, value, tone }: { label: string; value: string; tone?: "default" | "highlight" }) {
  return (
    <div className={`panel p-4 ${tone === "highlight" ? "border-rose/60 bg-blush/60" : ""}`}>
      <p className="eyebrow">{label}</p>
      <p className={`mt-3 font-serif text-4xl font-medium tracking-[-0.02em] ${tone === "highlight" ? "text-rose" : "text-taupe"}`}>{value}</p>
    </div>
  );
}
