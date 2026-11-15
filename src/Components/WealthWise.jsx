import React, { useState } from "react";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ReceiptText,
  Target,
  Calculator,
} from "lucide-react";
import WW from "../assests/WW.jpg";

const WelcomePage = ({ openAuthModal }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [monthlyIncome, setMonthlyIncome] = useState("4000");

  const handleGetStarted = () => {
    if (openAuthModal) {
      openAuthModal("signup");
    } else {
      navigate("/signup");
    }
  };

  const handleSignIn = () => {
    if (openAuthModal) {
      openAuthModal("login");
    } else {
      navigate("/login");
    }
  };

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (email.trim()) {
      setStatus({
        type: "success",
        text: `Thank you for subscribing, ${email}!`,
      });
      setEmail("");
    } else {
      setStatus({
        type: "error",
        text: "Please enter a valid email address!",
      });
    }
  };

  const parsedIncome = Math.max(0, parseFloat(monthlyIncome) || 0);
  const needsAmount = parsedIncome * 0.5;
  const wantsAmount = parsedIncome * 0.3;
  const savingsAmount = parsedIncome * 0.2;

  const formatCurrency = (value) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url(${WW})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/75 to-slate-950/90"
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            Welcome to WealthWise!
          </h1>
          <p className="mt-2.5 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto">
            &ldquo;We&apos;re here to help you get there&rdquo; — track daily
            expenses, set category budgets, plan financial goals, and review
            clear spending breakdowns in one place.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 whitespace-nowrap shrink-0"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSignIn}
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              Log In to Workspace
            </button>
          </div>
        </div>
      </section>

      {/* Core Capabilities & Budget Planner */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col justify-center gap-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800">
                01. Spending Analytics
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-slate-900">
                Visual Expense Dashboard
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-snug">
                Monitor total expenses across categories and monthly trends with
                interactive charts.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800">
                02. Ledger &amp; Export
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-slate-900">
                Expense Logging &amp; Reports
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-snug">
                Record categorized expenses with dates and notes, and export
                your history to CSV or Excel.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800">
                03. Planning Targets
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-slate-900">
                Category Budgets &amp; Goals
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-snug">
                Define monthly spending limits per category and track progress
                against financial goals.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive 50/30/20 Monthly Budget Estimator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center gap-2 text-blue-800">
                <Calculator className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  50 / 30 / 20 Budget Planner
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                Estimate your monthly spending split
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
                <label
                  htmlFor="homepage-monthly-income"
                  className="text-xs font-medium text-slate-600 whitespace-nowrap"
                >
                  Monthly Income ($)
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    id="homepage-monthly-income"
                    type="number"
                    min="0"
                    step="100"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="4000"
                    className="w-full sm:w-36 px-3 py-1.5 text-sm font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="text-xs font-semibold text-blue-800 hover:text-blue-900 hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Track in workspace &rarr;
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Needs</span>
                    <span className="font-mono tabular-nums font-semibold text-blue-800">
                      50%
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
                    {formatCurrency(needsAmount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Housing, food &amp; utilities
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Wants</span>
                    <span className="font-mono tabular-nums font-semibold text-sky-700">
                      30%
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
                    {formatCurrency(wantsAmount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Dining, travel &amp; leisure
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      Savings &amp; Goals
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-700">
                      20%
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
                    {formatCurrency(savingsAmount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Emergency fund &amp; targets
                  </p>
                </div>
              </div>

              <div
                className="w-full h-2 rounded-full overflow-hidden bg-slate-100 flex"
                aria-hidden="true"
              >
                <div className="h-full bg-blue-800 w-1/2" />
                <div className="h-full bg-sky-500 w-[30%]" />
                <div className="h-full bg-emerald-600 w-1/5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="border-t border-slate-200 bg-white py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-left">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Stay up to date with WealthWise
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Subscribe to our newsletter for updates, tips, and financial
              insights.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sm:w-64 px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
              >
                Subscribe
              </button>
            </form>

            {status && (
              <div
                role="status"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{status.text}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WelcomePage;
