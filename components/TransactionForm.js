"use client";

import { useState } from "react";

const categories = [
  "Food",
  "Transportation",
  "Housing",
  "Entertainment",
  "Shopping",
  "Bills",
  "Healthcare",
  "Education",
  "Salary",
  "Other"
];

const initialForm = {
  description: "",
  amount: "",
  type: "expense",
  category: "Food"
};

export default function TransactionForm({ onAdd }) {
  const [form, setForm] = useState(initialForm);
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));

    if (error) setError("");
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setReceiptFile(null);
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Receipt image must be under 5 MB.");
      event.target.value = "";
      setReceiptFile(null);
      return;
    }

    // Validate type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validMimes.includes(file.type.toLowerCase()) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setError("Please choose a valid image (JPG, PNG, or WEBP).");
      event.target.value = "";
      setReceiptFile(null);
      return;
    }

    setError("");
    setReceiptFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const description = form.description.trim();
    const amount = Number(form.amount);

    if (!description) {
      setError("Please enter a description.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter an amount greater than 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onAdd({
        description,
        amount,
        type: form.type,
        category: form.category,
        receiptFile: receiptFile || null,
      });

      setForm(initialForm);
      setReceiptFile(null);
    } catch (err) {
      console.error("Error saving transaction:", err);
      setError(err.message || "Failed to save transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1fr_1.05fr_1.05fr]">
        <label className="block">
          <span className="mb-2 block text-[14px] font-medium text-slate-500">
            Description
          </span>
          <input
            name="description"
            value={form.description}
            onChange={updateField}
            placeholder="Description"
            className="h-[54px] w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[16px] text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[14px] font-medium text-slate-500">
            Amount
          </span>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={updateField}
            placeholder="Amount"
            className="h-[54px] w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[16px] text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[14px] font-medium text-slate-500">
            Type
          </span>
          <select
            name="type"
            value={form.type}
            onChange={updateField}
            className="h-[54px] w-full appearance-auto rounded-lg border border-slate-300 bg-white px-3.5 text-[16px] text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[14px] font-medium text-slate-500">
            Category
          </span>
          <select
            name="category"
            value={form.category}
            onChange={updateField}
            className="h-[54px] w-full appearance-auto rounded-lg border border-slate-300 bg-white px-3.5 text-[16px] text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Optional Receipt Attachment */}
      <div className="mt-4">
        <label className="block">
          <span className="mb-2 block text-[14px] font-medium text-slate-500">
            Attach Receipt (Optional — JPG, PNG, WEBP, max 5 MB)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-200 file:cursor-pointer cursor-pointer"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-[52px] rounded-lg bg-black px-5 text-[16px] font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Add Transaction"}
        </button>

        {error ? (
          <p className="text-sm font-medium text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
