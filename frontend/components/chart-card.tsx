export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}
