"use client";

import { useState } from "react";

import { importPricesCsv } from "@/lib/api";

export function PriceImportForm({ onImported }: { onImported: () => void }) {
  const [source, setSource] = useState("retailer_csv");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a CSV file first.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await importPricesCsv({ source, file });
      setMessage(`Imported ${result.imported_count} prices from ${result.source} across ${result.stores_touched.join(", ") || "no stores"}.`);
      setFile(null);
      onImported();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Price import failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel p-5">
      <h2 className="eyebrow">Retailer Price Import</h2>
      <p className="mt-3 text-sm text-steel">
        Bring in fresher pricing from a retailer CSV export. Required columns: `store_name`, `item_name`, `regular_price`, `offer_price`, `valid_from`, `valid_to`.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <input className="input" onChange={(event) => setSource(event.target.value)} value={source} />
        <input
          className="input"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          accept=".csv"
          type="file"
        />
        <button className="btn-secondary" disabled={submitting} type="submit">
          {submitting ? "Importing..." : "Import Price CSV"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-taupe">{message}</p> : null}
    </div>
  );
}
