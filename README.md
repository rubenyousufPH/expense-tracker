# Expense Tracker — Next.js

A simple responsive expense tracker matching the supplied reference design.

## Features

- Next.js App Router & React 19
- Firebase Authentication (Email/Password Sign-In & Sign-Up)
- Firebase Firestore (per-user transactions subcollection `users/{uid}/transactions/{id}`)
- Firebase Storage for Receipt Images (`users/{uid}/receipts/{transactionId}/{filename}`)
- Receipt Upload, View (Modal/Lightbox), Replace, and Delete
- Image validation (JPG, JPEG, PNG, WEBP; max 5 MB)
- Income / Expense transactions with category selection
- Automatic totals and balance
- Responsive design with Tailwind CSS

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Structure

```text
app/
  globals.css
  layout.js
  page.js
  lib/
    firebase.js
    transactions.js
    receipts.js

components/
  Header.js
  Login.js
  ReceiptModal.js
  SummaryCards.js
  TransactionForm.js
  TransactionList.js

firestore.rules
storage.rules
```

