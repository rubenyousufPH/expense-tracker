import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { updateDoc, doc } from "firebase/firestore";
import { storage, db } from "./firebase";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

/**
 * Validates the receipt image file.
 * @param {File} file
 */
export function validateReceiptFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  // Check file type
  const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isAllowedType) {
    throw new Error(
      "Invalid file type. Only JPG, JPEG, PNG, and WEBP image formats are supported."
    );
  }

  // Check file size (5MB max)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File size (${sizeInMB} MB) exceeds the maximum limit of 5 MB.`
    );
  }

  return true;
}

/**
 * Generates a clean safe filename for storage.
 */
function sanitizeFileName(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_");
}

/**
 * Upload a receipt image to Firebase Storage and update the Firestore transaction document.
 * Storage Path: users/{uid}/receipts/{transactionId}/{filename}
 *
 * @param {string} uid - Authenticated user's UID
 * @param {string} transactionId - Transaction document ID
 * @param {File} file - Image file to upload
 * @param {Function} [onProgress] - Optional progress callback receiving percentage (0-100)
 * @returns {Promise<Object>} Receipt metadata saved to Firestore
 */
export function uploadReceipt(uid, transactionId, file, onProgress) {
  return new Promise((resolve, reject) => {
    try {
      if (!uid) {
        throw new Error("Authentication required to upload receipt.");
      }
      if (!transactionId) {
        throw new Error("Transaction ID is required to attach receipt.");
      }

      validateReceiptFile(file);

      const safeName = `${Date.now()}_${sanitizeFileName(file.name)}`;
      const storagePath = `users/${uid}/receipts/${transactionId}/${safeName}`;
      const storageRef = ref(storage, storagePath);

      const customMetadata = {
        contentType: file.type || "image/jpeg",
        customMetadata: {
          uploadedBy: uid,
          transactionId: transactionId,
          originalName: file.name,
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, file, customMetadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (onProgress && snapshot.totalBytes > 0) {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Firebase Storage upload error:", error);
          reject(new Error(error.message || "Failed to upload image to Storage."));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

            const receiptMetadata = {
              fileName: file.name,
              contentType: file.type || "image/jpeg",
              size: file.size,
              storagePath: storagePath,
              downloadUrl: downloadUrl,
              uploadedAt: new Date().toISOString(),
            };

            // Update Firestore transaction document
            const transactionDocRef = doc(
              db,
              "users",
              uid,
              "transactions",
              transactionId
            );
            await updateDoc(transactionDocRef, {
              receipt: receiptMetadata,
            });

            resolve(receiptMetadata);
          } catch (docUpdateError) {
            console.error(
              "Failed to update transaction document with receipt metadata:",
              docUpdateError
            );
            reject(
              new Error(
                "Image uploaded to Storage, but failed to link with transaction."
              )
            );
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Deletes the receipt file from Firebase Storage and removes receipt metadata from Firestore.
 *
 * @param {string} uid - Authenticated user's UID
 * @param {string} transactionId - Transaction document ID
 * @param {string} [storagePath] - Optional direct path to delete in Storage
 * @returns {Promise<void>}
 */
export async function deleteReceipt(uid, transactionId, storagePath) {
  if (!uid || !transactionId) {
    throw new Error("User ID and Transaction ID are required to delete receipt.");
  }

  // 1. Delete from Firebase Storage if path is known
  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (storageErr) {
      // If object already does not exist (404), log and proceed with Firestore update
      if (storageErr.code !== "storage/object-not-found") {
        console.warn("Storage delete warning:", storageErr);
      }
    }
  }

  // 2. Clear receipt field from Firestore
  const transactionDocRef = doc(
    db,
    "users",
    uid,
    "transactions",
    transactionId
  );
  await updateDoc(transactionDocRef, {
    receipt: null,
  });
}

/**
 * Replaces an existing receipt with a new image file.
 *
 * @param {string} uid - Authenticated user's UID
 * @param {string} transactionId - Transaction document ID
 * @param {File} newFile - New image file
 * @param {string} [oldStoragePath] - Storage path of the old receipt
 * @param {Function} [onProgress] - Optional upload progress callback
 * @returns {Promise<Object>} New receipt metadata
 */
export async function replaceReceipt(
  uid,
  transactionId,
  newFile,
  oldStoragePath,
  onProgress
) {
  // 1. Upload new receipt first
  const newReceipt = await uploadReceipt(
    uid,
    transactionId,
    newFile,
    onProgress
  );

  // 2. If upload succeeded and there was an old file, clean up the old file
  if (oldStoragePath && oldStoragePath !== newReceipt.storagePath) {
    try {
      const oldRef = ref(storage, oldStoragePath);
      await deleteObject(oldRef);
    } catch (err) {
      console.warn("Could not delete old receipt file during replace:", err);
    }
  }

  return newReceipt;
}
