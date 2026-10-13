import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Helper to get the user-specific transactions collection reference.
 * Path: users/{uid}/transactions
 */
export function getTransactionsCollectionRef(uid) {
  if (!uid) {
    throw new Error("User ID is required to access transactions.");
  }
  return collection(db, "users", uid, "transactions");
}

/**
 * Helper to get a specific transaction document reference.
 * Path: users/{uid}/transactions/{transactionId}
 */
export function getTransactionDocRef(uid, transactionId) {
  if (!uid || !transactionId) {
    throw new Error("User ID and Transaction ID are required.");
  }
  return doc(db, "users", uid, "transactions", transactionId);
}

/**
 * Retrieve all transactions for a user, ordered by createdAt descending.
 * @param {string} uid - Authenticated user's UID
 * @returns {Promise<Array>} List of transaction objects with their document IDs
 */
export async function getTransactions(uid) {
  if (!uid) return [];

  const transactionsQuery = query(
    getTransactionsCollectionRef(uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(transactionsQuery);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Subscribe to real-time updates for a user's transactions.
 * @param {string} uid - Authenticated user's UID
 * @param {Function} onNext - Callback receiving the updated transactions array
 * @param {Function} onError - Optional error callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeTransactions(uid, onNext, onError) {
  if (!uid) {
    onNext([]);
    return () => {};
  }

  const transactionsQuery = query(
    getTransactionsCollectionRef(uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onNext(items);
    },
    (err) => {
      console.error("Firestore subscribe error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Add a new transaction to Firestore.
 * @param {string} uid - Authenticated user's UID
 * @param {Object} transactionData - { description, amount, type, category, createdAt? }
 * @returns {Promise<Object>} The added transaction with its Firestore id
 */
export async function addTransaction(uid, transactionData) {
  if (!uid) {
    throw new Error("Unauthenticated: Cannot add transaction without a user ID.");
  }

  const newTransaction = {
    description: transactionData.description.trim(),
    amount: Number(transactionData.amount),
    type: transactionData.type || "expense",
    category: transactionData.category || "Food",
    createdAt: transactionData.createdAt || new Date().toISOString(),
  };

  const docRef = await addDoc(
    getTransactionsCollectionRef(uid),
    newTransaction
  );

  return {
    id: docRef.id,
    ...newTransaction,
  };
}

/**
 * Update an existing transaction in Firestore.
 * @param {string} uid - Authenticated user's UID
 * @param {string} transactionId - Transaction document ID
 * @param {Object} updatedData - Partial transaction data to update
 * @returns {Promise<void>}
 */
export async function updateTransaction(uid, transactionId, updatedData) {
  if (!uid || !transactionId) {
    throw new Error("User ID and Transaction ID are required for update.");
  }

  const payload = { ...updatedData };
  if (payload.amount !== undefined) {
    payload.amount = Number(payload.amount);
  }
  if (payload.description !== undefined) {
    payload.description = payload.description.trim();
  }

  const docRef = getTransactionDocRef(uid, transactionId);
  await updateDoc(docRef, payload);
}

/**
 * Delete a transaction from Firestore and its associated receipt in Storage if present.
 * @param {string} uid - Authenticated user's UID
 * @param {string} transactionId - Transaction document ID
 * @param {string} [receiptStoragePath] - Optional receipt storage path to clean up
 * @returns {Promise<void>}
 */
export async function deleteTransaction(uid, transactionId, receiptStoragePath) {
  if (!uid || !transactionId) {
    throw new Error("User ID and Transaction ID are required for deletion.");
  }

  if (receiptStoragePath) {
    try {
      const { ref, deleteObject } = await import("firebase/storage");
      const { storage } = await import("./firebase");
      const storageRef = ref(storage, receiptStoragePath);
      await deleteObject(storageRef);
    } catch (storageErr) {
      if (storageErr.code !== "storage/object-not-found") {
        console.warn("Storage cleanup warning during transaction deletion:", storageErr);
      }
    }
  }

  const docRef = getTransactionDocRef(uid, transactionId);
  await deleteDoc(docRef);
}

