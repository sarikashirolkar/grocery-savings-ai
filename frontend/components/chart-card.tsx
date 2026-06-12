export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <div className="mb-5 flex items-center justify-between border-b border-lineSoft pb-4">
        <h2 className="eyebrow">{title}</h2>
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}
