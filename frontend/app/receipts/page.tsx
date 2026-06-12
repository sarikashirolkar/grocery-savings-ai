"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { getReceipts } from "@/lib/api";


function ReceiptsScreen() {
  const [token, setToken] = useState("");
  useEffect(() => {
    setToken(window.localStorage.getItem("grocery-token") || "cookie");
  }, []);
  const receipts = useQuery({ queryKey: ["receipts-page", token], queryFn: () => getReceipts(token), enabled: !!token });

  return (
    <AppShell>
      <section className="page-head">
        <div>
          <p className="eyebrow text-rose">History</p>
          <h2 className="page-title mt-2">Receipts</h2>
          <p className="page-copy">Review uploaded and seeded receipts, then use them to refine purchase predictions.</p>
        </div>
      </section>
      <section className="panel mt-8 overflow-x-auto p-5">
        <table className="data-table">
          <thead>
            <tr>
              <th className="pb-3">Store</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Total</th>
              <th className="pb-3">Source</th>
              <th className="pb-3">Items</th>
            </tr>
          </thead>
          <tbody>
            {(receipts.data || []).map((receipt) => (
              <tr key={receipt.id}>
                <td className="font-medium text-taupe">{receipt.store_name}</td>
                <td>{receipt.purchase_date}</td>
                <td className="font-serif text-xl text-taupe">₹{receipt.total_amount.toFixed(0)}</td>
                <td>
                  <div>{receipt.upload_type}</div>
                  {receipt.file_name ? <div className="text-xs text-steel">{receipt.file_name}</div> : null}
                </td>
                <td>
                  <div className="space-y-1">
                    {receipt.items.map((item) => (
                      <div key={`${receipt.id}-${item.item_name}`}>{item.item_name}</div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}


export default function ReceiptsPage() {
  return (
    <AuthGate>
      <ReceiptsScreen />
    </AuthGate>
  );
}
