"use client";

import { useRef, useState } from "react";
import ReceiptModal from "./ReceiptModal";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  try {
    const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export default function TransactionList({
  transactions,
  onDelete,
  onUploadReceipt,
  onReplaceReceipt,
  onDeleteReceipt,
  uploadingId,
  uploadProgress,
  isReplacing,
  replaceProgress,
  isLoading,
}) {
  const [selectedReceiptTransaction, setSelectedReceiptTransaction] = useState(null);
  const fileInputRefs = useRef({});

  if (isLoading) {
    return (
      <p className="py-4 text-[16px] text-slate-500">
        Loading transactions from Firestore...
      </p>
    );
  }

  if (transactions.length === 0) {
    return (
      <p className="py-4 text-[16px] text-slate-500">
        No transactions yet.
      </p>
    );
  }

  // Keep selected modal transaction up to date if parent state updates
  const activeModalTransaction = selectedReceiptTransaction
    ? transactions.find((t) => t.id === selectedReceiptTransaction.id) || null
    : null;

  function handleFileSelect(transaction, event) {
    const file = event.target.files?.[0];
    if (file && onUploadReceipt) {
      onUploadReceipt(transaction, file);
    }
    event.target.value = "";
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.1fr_auto] gap-4 border-b border-slate-200 px-1 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Description</span>
            <span>Category</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Receipt</span>
            <span />
          </div>

          <div className="divide-y divide-slate-100">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const isCurrentlyUploading = uploadingId === transaction.id;
              const hasReceipt = Boolean(transaction.receipt?.downloadUrl);

              return (
                <div
                  key={transaction.id}
                  className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.1fr_auto] items-center gap-4 px-1 py-4"
                >
                  {/* Description & Type */}
                  <div>
                    <p className="font-semibold text-slate-800">
                      {transaction.description}
                    </p>
                    <p
                      className={`mt-0.5 text-xs font-medium ${
                        isIncome ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isIncome ? "Income" : "Expense"}
                    </p>
                  </div>

                  {/* Category */}
                  <span className="text-sm text-slate-600">
                    {transaction.category}
                  </span>

                  {/* Date */}
                  <span className="text-sm text-slate-500">
                    {formatDate(transaction.createdAt)}
                  </span>

                  {/* Amount */}
                  <span
                    className={`font-semibold ${
                      isIncome ? "text-emerald-600" : "text-slate-800"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>

                  {/* Receipt Action Column */}
                  <div>
                    {isCurrentlyUploading ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                        {uploadProgress}%
                      </span>
                    ) : hasReceipt ? (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptTransaction(transaction)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-100 active:scale-95"
                      >
                        <span>📎</span>
                        <span>View</span>
                      </button>
                    ) : (
                      <>
                        <input
                          type="file"
                          ref={(el) => (fileInputRefs.current[transaction.id] = el)}
                          onChange={(e) => handleFileSelect(transaction, e)}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            fileInputRefs.current[transaction.id]?.click()
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700 active:scale-95"
                        >
                          <span>+ Receipt</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Delete Transaction */}
                  <button
                    type="button"
                    onClick={() =>
                      onDelete(transaction.id, transaction.receipt?.storagePath)
                    }
                    aria-label={`Delete ${transaction.description}`}
                    className="rounded-md px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* View / Replace / Delete Receipt Modal */}
      {activeModalTransaction && (
        <ReceiptModal
          isOpen={Boolean(activeModalTransaction)}
          transaction={activeModalTransaction}
          onClose={() => setSelectedReceiptTransaction(null)}
          onReplace={async (trans, file) => {
            if (onReplaceReceipt) {
              await onReplaceReceipt(trans, file);
            }
          }}
          onDeleteReceipt={async (trans) => {
            if (onDeleteReceipt) {
              await onDeleteReceipt(trans);
              setSelectedReceiptTransaction(null);
            }
          }}
          isReplacing={isReplacing}
          replaceProgress={replaceProgress}
        />
      )}
    </>
  );
}
