"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/Header";
import Login from "../components/Login";
import SummaryCards from "../components/SummaryCards";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import { auth } from "./lib/firebase";
import {
  subscribeTransactions,
  addTransaction as addTransactionToFirestore,
  deleteTransaction as deleteTransactionFromFirestore,
} from "./lib/transactions";
import {
  uploadReceipt,
  replaceReceipt,
  deleteReceipt,
} from "./lib/receipts";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState("");

  // Receipt upload & replace state
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setTransactionsLoading(false);
      return;
    }

    setTransactionsLoading(true);
    setError("");

    // Subscribe to real-time transactions from Firestore under users/{uid}/transactions
    const unsubscribe = subscribeTransactions(
      user.uid,
      (updatedTransactions) => {
        setTransactions(updatedTransactions);
        setTransactionsLoading(false);
      },
      (err) => {
        console.error("Failed to load transactions from Firestore:", err);
        setError("Unable to sync transactions with Firestore. Please check your connection.");
        setTransactionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const expenses = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  async function handleAddTransaction(transactionData) {
    if (!user) {
      throw new Error("You must be logged in to add a transaction.");
    }

    setError("");
    const { receiptFile, ...data } = transactionData;
    const addedTransaction = await addTransactionToFirestore(user.uid, data);

    // If an optional receipt was attached during creation, upload it to Storage
    if (receiptFile && addedTransaction.id) {
      try {
        await uploadReceipt(user.uid, addedTransaction.id, receiptFile);
      } catch (receiptErr) {
        console.error("Failed to upload receipt:", receiptErr);
        setError("Transaction saved, but receipt upload failed. You can re-upload it below.");
      }
    }

    return addedTransaction;
  }

  async function handleDeleteTransaction(id, receiptStoragePath) {
    if (!user) return;

    try {
      setError("");
      await deleteTransactionFromFirestore(user.uid, id, receiptStoragePath);
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      setError("Failed to delete transaction. Please try again.");
    }
  }

  async function handleUploadReceipt(transaction, file) {
    if (!user || !transaction?.id) return;

    try {
      setError("");
      setUploadingId(transaction.id);
      setUploadProgress(0);

      await uploadReceipt(
        user.uid,
        transaction.id,
        file,
        (progress) => setUploadProgress(progress)
      );
    } catch (err) {
      console.error("Receipt upload error:", err);
      setError(err.message || "Failed to upload receipt. Please try again.");
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
    }
  }

  async function handleReplaceReceipt(transaction, newFile) {
    if (!user || !transaction?.id) return;

    try {
      setError("");
      setIsReplacing(true);
      setReplaceProgress(0);

      await replaceReceipt(
        user.uid,
        transaction.id,
        newFile,
        transaction.receipt?.storagePath,
        (progress) => setReplaceProgress(progress)
      );
    } catch (err) {
      console.error("Receipt replace error:", err);
      setError(err.message || "Failed to replace receipt. Please try again.");
    } finally {
      setIsReplacing(false);
      setReplaceProgress(0);
    }
  }

  async function handleDeleteReceipt(transaction) {
    if (!user || !transaction?.id) return;

    try {
      setError("");
      await deleteReceipt(
        user.uid,
        transaction.id,
        transaction.receipt?.storagePath
      );
    } catch (err) {
      console.error("Receipt delete error:", err);
      setError("Failed to delete receipt. Please try again.");
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-medium text-slate-600">
        Checking authentication...
      </main>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header user={user} />

      <main className="mx-auto w-full max-w-[1080px] px-5 pb-12 pt-7 sm:px-6 lg:px-0">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">
          Expense Tracker
        </h1>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {error}
          </div>
        )}

        <SummaryCards totals={totals} />

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            Add Transaction
          </h2>

          <TransactionForm onAdd={handleAddTransaction} />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            Transactions
          </h2>

          <TransactionList
            transactions={transactions}
            onDelete={handleDeleteTransaction}
            onUploadReceipt={handleUploadReceipt}
            onReplaceReceipt={handleReplaceReceipt}
            onDeleteReceipt={handleDeleteReceipt}
            uploadingId={uploadingId}
            uploadProgress={uploadProgress}
            isReplacing={isReplacing}
            replaceProgress={replaceProgress}
            isLoading={transactionsLoading}
          />
        </section>
      </main>
    </div>
  );
}


