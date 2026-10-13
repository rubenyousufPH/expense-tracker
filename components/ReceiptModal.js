"use client";

import { useEffect, useRef } from "react";

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  try {
    const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return "";
  }
}

export default function ReceiptModal({
  isOpen,
  onClose,
  transaction,
  onReplace,
  onDeleteReceipt,
  isReplacing,
  replaceProgress,
}) {
  const replaceInputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !transaction?.receipt) {
    return null;
  }

  const { receipt } = transaction;

  function handleFileSelected(event) {
    const file = event.target.files?.[0];
    if (file) {
      onReplace(transaction, file);
    }
    // reset input so same file can be re-selected if desired
    event.target.value = "";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3
              id="receipt-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Receipt for {transaction.description}
            </h3>
            <p className="text-xs text-slate-500">
              Attached to transaction ({transaction.category})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Image Preview Container */}
          <div className="relative flex min-h-[220px] max-h-[50vh] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
            <img
              src={receipt.downloadUrl}
              alt={`Receipt for ${transaction.description}`}
              className="max-h-[46vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
              loading="lazy"
            />

            {/* Replace / Uploading Overlay */}
            {isReplacing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 text-white backdrop-blur-xs">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/20 border-t-white" />
                <p className="mt-3 text-sm font-semibold">
                  Uploading new receipt... {replaceProgress}%
                </p>
              </div>
            )}
          </div>

          {/* Receipt Metadata Info Bar */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-slate-400 font-medium">File Name</span>
              <span
                title={receipt.fileName}
                className="mt-0.5 block truncate font-semibold text-slate-700"
              >
                {receipt.fileName || "receipt.jpg"}
              </span>
            </div>

            <div>
              <span className="block text-slate-400 font-medium">File Size</span>
              <span className="mt-0.5 block font-semibold text-slate-700">
                {formatFileSize(receipt.size)}
              </span>
            </div>

            <div>
              <span className="block text-slate-400 font-medium">Uploaded</span>
              <span className="mt-0.5 block font-semibold text-slate-700">
                {formatDate(receipt.uploadedAt) || "Recently"}
              </span>
            </div>

            <div>
              <span className="block text-slate-400 font-medium">Format</span>
              <span className="mt-0.5 block uppercase font-semibold text-slate-700">
                {receipt.contentType?.split("/")[1] || "IMAGE"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          {/* Left Actions (Replace / Delete) */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={replaceInputRef}
              onChange={handleFileSelected}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => replaceInputRef.current?.click()}
              disabled={isReplacing}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-50"
            >
              {isReplacing ? "Replacing..." : "Replace Receipt"}
            </button>

            <button
              type="button"
              onClick={() => onDeleteReceipt(transaction)}
              disabled={isReplacing}
              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-xs transition hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-50"
            >
              Delete Receipt
            </button>
          </div>

          {/* Right Actions (Download / Close) */}
          <div className="flex items-center gap-2">
            <a
              href={receipt.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={receipt.fileName || "receipt"}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              Open Original ↗
            </a>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-black px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
