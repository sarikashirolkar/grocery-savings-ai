"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { createManualReceipt } from "@/lib/api";


type FormValues = {
  store_name: string;
  purchase_date: string;
  receipt_number: string;
  raw_text: string;
};


export function ManualReceiptForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      store_name: "Blinkit",
      purchase_date: new Date().toISOString().slice(0, 10),
      receipt_number: "",
      raw_text: "Amul Gold Milk 1L 2 x 68\nTomato 1 x 38\nBanana Robusta 1 x 72"
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    await createManualReceipt(token, {
      ...values,
      upload_type: "manual",
      total_amount: 246,
      items: []
    });
    reset();
    setMessage("Receipt created. Re-run pattern analysis to include it in predictions.");
    onCreated();
  });

  return (
    <div className="panel">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Manual Receipt Entry</h2>
        <p className="text-sm text-slate-500">Paste OCR-like lines in `Item Qty x Price` format for quick trial testing.</p>
      </div>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" {...register("store_name", { required: true })} placeholder="Store" />
          <input className="input" type="date" {...register("purchase_date", { required: true })} />
          <input className="input" {...register("receipt_number")} placeholder="Receipt number" />
        </div>
        <textarea className="input min-h-40" {...register("raw_text", { required: true })} />
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <button className="btn-secondary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Add Receipt"}
        </button>
      </form>
    </div>
  );
}
