"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { createManualReceipt, uploadReceipt } from "@/lib/api";


type FormValues = {
  store_name: string;
  purchase_date: string;
  receipt_number: string;
  raw_text: string;
  file: FileList;
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
    const file = values.file?.[0];
    if (file) {
      await uploadReceipt(token, {
        store_name: values.store_name,
        purchase_date: values.purchase_date,
        receipt_number: values.receipt_number,
        raw_text: values.raw_text,
        total_amount: 246,
        file
      });
    } else {
      await createManualReceipt(token, {
        store_name: values.store_name,
        purchase_date: values.purchase_date,
        receipt_number: values.receipt_number,
        raw_text: values.raw_text,
        upload_type: "manual",
        total_amount: 246,
        items: []
      });
    }
    reset();
    setMessage(file ? "Receipt uploaded and stored. Re-run pattern analysis to include it in predictions." : "Receipt created. Re-run pattern analysis to include it in predictions.");
    onCreated();
  });

  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h2 className="eyebrow">Manual receipt entry</h2>
        <p className="mt-3 text-sm text-steel">Paste OCR-like lines in `Item Qty x Price` format for quick trial testing.</p>
      </div>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" {...register("store_name", { required: true })} placeholder="Store" />
          <input className="input" type="date" {...register("purchase_date", { required: true })} />
          <input className="input" {...register("receipt_number")} placeholder="Receipt number" />
        </div>
        <input className="input" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt" {...register("file")} />
        <textarea className="input min-h-40" {...register("raw_text", { required: true })} />
        {message ? <p className="text-sm text-taupe">{message}</p> : null}
        <button className="btn-quiet" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Add Receipt"}
        </button>
      </form>
    </div>
  );
}
