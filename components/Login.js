"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../app/lib/firebase";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function toggleMode(targetSignUp) {
    setIsSignUp(targetSignUp);
    setError("");
    setForm({
      email: "",
      password: "",
      confirmPassword: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (isSignUp) {
        // Create user in Firebase Auth (automatically signs them in on success)
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      // Firebase's onAuthStateChanged listener in page.js will detect
      // the authenticated user and transition into the app.
    } catch (firebaseError) {
      const code = firebaseError.code;

      if (isSignUp) {
        switch (code) {
          case "auth/email-already-in-use":
            setError("An account with this email already exists. Try signing in.");
            break;

          case "auth/weak-password":
            setError("Password is too weak. Please use at least 6 characters.");
            break;

          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;

          case "auth/operation-not-allowed":
            setError("Email/password sign-up is currently disabled in Firebase.");
            break;

          case "auth/too-many-requests":
            setError("Too many attempts. Please try again later.");
            break;

          default:
            setError(firebaseError.message || "Unable to create account. Please try again.");
        }
      } else {
        switch (code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
            setError("The email or password is incorrect.");
            break;

          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;

          case "auth/too-many-requests":
            setError("Too many attempts. Please try again later.");
            break;

          case "auth/user-disabled":
            setError("This account has been disabled.");
            break;

          default:
            setError(firebaseError.message || "Unable to sign in. Please try again.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <div className="w-full max-w-[430px]">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-xl font-bold text-white shadow-sm">
            $
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Expense Tracker
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {isSignUp
              ? "Create an account to start tracking your expenses"
              : "Sign in to manage your expenses"}
          </p>
        </div>

        {/* Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          {/* Mode Switch Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                !isSignUp
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                isSignUp
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {isSignUp
              ? "Enter your credentials to create your new account."
              : "Enter your credentials to continue."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            {/* Email */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Email
              </span>

              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[16px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            {/* Password */}
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Password
              </span>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    isSignUp
                      ? "Create password (min. 6 characters)"
                      : "Enter your password"
                  }
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 pr-20 text-[16px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-slate-600">
                  Confirm Password
                </span>

                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[16px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 h-12 w-full rounded-lg bg-black px-5 text-[16px] font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </button>

            {/* Footer toggle prompt */}
            <div className="mt-5 text-center text-sm text-slate-500">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode(false)}
                    className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode(true)}
                    className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
