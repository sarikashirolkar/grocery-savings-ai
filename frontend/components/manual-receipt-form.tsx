"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { createManualReceipt, previewReceipt, uploadReceipt, uploadReceiptBatchPdf } from "@/lib/api";
import type { ReceiptItem } from "@/lib/types";

type FormValues = {
  store_name: string;
  purchase_date: string;
  receipt_number: string;
  raw_text: string;
  file: FileList;
  batch_pdf: FileList;
  purchase_date_fallback: string;
};

const defaultRawText = "Amul Gold Milk 1L 2 x 68\nTomato 1 x 38\nBanana Robusta 1 x 72";

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(amul|fortune|india gate|aashirvaad|surf excel|tata sampann|nandini)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ManualReceiptForm({ onCreated }: { onCreated: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<ReceiptItem[]>([]);
  const [previewRawText, setPreviewRawText] = useState<string>("");
  const [previewReady, setPreviewReady] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<FormValues>({
    defaultValues: {
      store_name: "Blinkit",
      purchase_date: new Date().toISOString().slice(0, 10),
      purchase_date_fallback: new Date().toISOString().slice(0, 10),
      receipt_number: "",
      raw_text: defaultRawText
    }
  });

  const previewTotal = useMemo(
    () => draftItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0),
    [draftItems]
  );

  function resetDraft() {
    setDraftItems([]);
    setPreviewRawText("");
    setPreviewReady(false);
  }

  function updateDraftItem(index: number, field: keyof ReceiptItem, value: string) {
    setDraftItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const nextItem = {
          ...item,
          [field]: ["quantity", "unit_price", "total_price", "discount"].includes(field) ? Number(value || 0) : value
        };

        if (field === "item_name") {
          nextItem.normalized_item_name = normalizeName(String(value));
        }

        if (field === "quantity" || field === "unit_price") {
          nextItem.total_price = Number((nextItem.quantity * nextItem.unit_price).toFixed(2));
        }

        return nextItem;
      })
    );
  }

  const handlePreview = handleSubmit(async (values) => {
    setMessage(null);
    const file = values.file?.[0];
    const batchPdf = values.batch_pdf?.[0];
    if (batchPdf) {
      const result = await uploadReceiptBatchPdf({
        file: batchPdf,
        purchase_date_fallback: values.purchase_date_fallback
      });
      reset({
        store_name: values.store_name,
        purchase_date: values.purchase_date,
        purchase_date_fallback: values.purchase_date_fallback,
        receipt_number: "",
        raw_text: defaultRawText
      });
      resetDraft();
      setMessage(`Imported ${result.imported_count} receipts from the PDF and refreshed the prediction pipeline.`);
      onCreated();
      return;
    }

    const preview = await previewReceipt({
      store_name: values.store_name,
      purchase_date: values.purchase_date,
      raw_text: values.raw_text,
      file
    });
    setDraftItems(preview.items);
    setPreviewRawText(preview.raw_text || values.raw_text);
    setPreviewReady(true);
    setMessage(`Previewed ${preview.items.length} line items. Review them below before saving.`);
  });

  const handleSave = handleSubmit(async (values) => {
    setMessage(null);
    const file = values.file?.[0];
    const items = draftItems.map((item) => ({
      item_name: item.item_name,
      normalized_item_name: item.normalized_item_name,
      brand: item.brand || null,
      category: item.category || null,
      quantity: Number(item.quantity || 0),
      unit: item.unit || null,
      pack_size: item.pack_size || null,
      unit_price: Number(item.unit_price || 0),
      total_price: Number(item.total_price || 0),
      discount: Number(item.discount || 0),
      offer_applied: item.offer_applied || null,
      store_name: values.store_name,
      purchase_date: values.purchase_date
    }));

    if (file) {
      await uploadReceipt({
        store_name: values.store_name,
        purchase_date: values.purchase_date,
        receipt_number: values.receipt_number,
        raw_text: previewRawText || values.raw_text,
        total_amount: previewTotal,
        file,
        items
      });
      setMessage("Receipt uploaded and stored. OCR output was previewed before save.");
    } else {
      await createManualReceipt({
        store_name: values.store_name,
        purchase_date: values.purchase_date,
        receipt_number: values.receipt_number,
        raw_text: previewRawText || values.raw_text,
        upload_type: "manual",
        total_amount: previewTotal,
        items
      });
      setMessage("Receipt created from the reviewed preview.");
    }

    reset({
      store_name: values.store_name,
      purchase_date: values.purchase_date,
      purchase_date_fallback: values.purchase_date_fallback,
      receipt_number: "",
      raw_text: defaultRawText
    });
    resetDraft();
    onCreated();
  });

  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h2 className="eyebrow">Receipt intake</h2>
        <p className="mt-3 text-sm text-steel">
          Preview OCR and parsed line items before the receipt is committed. Batch PDFs still import directly because they run the extraction pipeline across multiple receipts at once.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handlePreview}>
        <div className="soft-card p-4">
          <h3 className="eyebrow">Batch PDF import</h3>
          <p className="mt-2 text-sm text-steel">
            Upload one PDF containing many grocery receipts. The app will extract each receipt, save them separately, and refresh purchase patterns automatically.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.9fr]">
            <input className="input" type="file" accept=".pdf" {...register("batch_pdf")} />
            <input className="input" type="date" {...register("purchase_date_fallback")} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" {...register("store_name", { required: true })} placeholder="Store" />
          <input className="input" type="date" {...register("purchase_date", { required: true })} />
          <input className="input" {...register("receipt_number")} placeholder="Receipt number" />
        </div>
        <input className="input" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt" {...register("file")} />
        <textarea className="input min-h-40" {...register("raw_text", { required: true })} />
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Working..." : "Preview Receipt"}
          </button>
          <button
            className="btn-quiet"
            disabled={isSubmitting || !previewReady}
            onClick={() => void handleSave()}
            type="button"
          >
            Save Reviewed Receipt
          </button>
        </div>
      </form>

      {previewReady ? (
        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-lineSoft pb-4">
            <div>
              <h3 className="eyebrow">Preview</h3>
              <p className="mt-2 text-sm text-steel">
                {draftItems.length} items parsed | Estimated total ₹{previewTotal.toFixed(0)}
              </p>
            </div>
            <button className="btn-quiet" onClick={resetDraft} type="button">
              Clear Preview
            </button>
          </div>

          {previewRawText ? (
            <div className="soft-card p-4">
              <p className="eyebrow">Extracted text</p>
              <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-taupe">{previewRawText}</pre>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="data-table min-w-[920px]">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {draftItems.map((item, index) => (
                  <tr key={`${item.normalized_item_name}-${index}`}>
                    <td>
                      <input
                        className="input"
                        onChange={(event) => updateDraftItem(index, "item_name", event.target.value)}
                        value={item.item_name}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        onChange={(event) => updateDraftItem(index, "category", event.target.value)}
                        value={item.category || ""}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        min="0"
                        onChange={(event) => updateDraftItem(index, "quantity", event.target.value)}
                        step="0.1"
                        type="number"
                        value={item.quantity}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        min="0"
                        onChange={(event) => updateDraftItem(index, "unit_price", event.target.value)}
                        step="0.01"
                        type="number"
                        value={item.unit_price}
                      />
                    </td>
                    <td className="font-serif text-xl text-taupe">₹{Number(item.total_price || 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {message ? <p className="mt-4 text-sm text-taupe">{message}</p> : null}
    </div>
  );
}
