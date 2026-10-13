"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../app/lib/firebase";

export default function Header({ user }) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <header className="h-16 bg-slate-950 text-white shadow-sm">
      <div className="mx-auto flex h-full w-full max-w-[1080px] items-center justify-between px-5 sm:px-6 lg:px-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
            $
          </div>
          <span className="text-[18px] font-bold tracking-tight sm:text-[20px]">
            Expense Tracker
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {user?.email && (
            <span
              title={user.email}
              className="hidden max-w-[200px] truncate text-xs text-slate-400 sm:inline-block md:max-w-[300px]"
            >
              {user.email}
            </span>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </header>
  );
}
