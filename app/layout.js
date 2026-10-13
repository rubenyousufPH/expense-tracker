import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata = {
  title: "Expense Tracker",
  description: "A simple personal income and expense tracker"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

