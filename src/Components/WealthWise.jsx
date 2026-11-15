import React, { useState } from "react";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calculator,
  Target,
  Wallet,
} from "lucide-react";
import WW from "../assests/WW.jpg";
import { CURRENCIES, formatCurrency, toUSD } from "../utils/currency";

const WelcomePage = ({ openAuthModal }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [monthlyIncome, setMonthlyIncome] = useState("4000");
  const [currency, setCurrency] = useState("USD");

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

  const parsedIncomeInput = Math.max(0, parseFloat(monthlyIncome) || 0);
  const incomeUSD = toUSD(parsedIncomeInput, currency);
  const needsUSD = incomeUSD * 0.5;
  const wantsUSD = incomeUSD * 0.3;
  const savingsUSD = incomeUSD * 0.2;

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9ff]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0b1c30]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${WW})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#0b1c30]/85 via-[#0b1c30]/80 to-[#0b1c30]/95"
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            Welcome to WealthWise!
          </h1>
          <p className="mt-2.5 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto">
            &ldquo;We&apos;re here to help you get there&rdquo; — split income
            with 50/30/20 rules, track expenses in 8 currencies, manage category
            budgets, and grow target savings vaults in one workspace.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 bg-[#00855d] hover:bg-[#006948] text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85f8c4] whitespace-nowrap shrink-0"
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

      {/* Core Capabilities & Interactive 50/30/20 Planner */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col justify-center gap-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#006948]">
                01. Salary &amp; Multi-Currency
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-[#0b1c30]">
                Smart Salary Splitter
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-snug">
                Allocate biweekly, monthly, or annual income across Needs,
                Wants, and Wealth in 8 live currencies.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#006948]">
                02. Ledger &amp; Analytics
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-[#0b1c30]">
                Expense Tracking &amp; Exports
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-snug">
                Log daily expenses, monitor monthly trends and 5-year wealth
                projections, and export to CSV or Excel.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#006948]">
                03. Budgets &amp; Vaults
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-[#0b1c30]">
                Category Caps &amp; Sinking Funds
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-snug">
                Set monthly category limits, simulate spending adjustments, and
                fund multi-currency savings vaults.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive 50/30/20 Monthly Budget Estimator */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center gap-2 text-[#006948]">
                <Calculator className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold tracking-wide">
                  50 / 30 / 20 Salary Split Preview
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#0b1c30]">
                Estimate your monthly allocation
              </h2>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  aria-label="Preview currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-[#0b1c30] bg-[#eff4ff] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                >
                  {Object.keys(CURRENCIES).map((code) => (
                    <option key={code} value={code}>
                      {code} ({CURRENCIES[code].symbol})
                    </option>
                  ))}
                </select>
                <input
                  id="homepage-monthly-income"
                  aria-label="Monthly Income"
                  type="number"
                  min="0"
                  step="100"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="4000"
                  className="w-32 px-3 py-1.5 text-sm font-mono tabular-nums text-[#0b1c30] bg-[#eff4ff]/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="text-xs font-semibold text-[#006948] hover:text-[#00855d] hover:underline whitespace-nowrap cursor-pointer"
                >
                  Open full planner &rarr;
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-[#eff4ff]/60 px-4 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0b1c30]">Needs</span>
                    <span className="font-mono tabular-nums font-semibold text-[#0b1c30]">
                      50%
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold font-mono tabular-nums text-[#0b1c30]">
                    {formatCurrency(needsUSD, currency, { showCents: false })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Housing, food &amp; utilities
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-[#eff4ff]/60 px-4 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0b1c30]">Wants</span>
                    <span className="font-mono tabular-nums font-semibold text-teal-700">
                      30%
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold font-mono tabular-nums text-[#0b1c30]">
                    {formatCurrency(wantsUSD, currency, { showCents: false })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Dining, travel &amp; leisure
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-[#eff4ff]/60 px-4 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0b1c30]">
                      Wealth &amp; Vaults
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#006948]">
                      20%
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold font-mono tabular-nums text-[#006948]">
                    {formatCurrency(savingsUSD, currency, { showCents: false })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Sinking funds &amp; savings
                  </p>
                </div>
              </div>

              <div
                className="w-full h-2 rounded-full overflow-hidden bg-slate-100 flex"
                aria-hidden="true"
              >
                <div className="h-full bg-[#0b1c30] w-1/2" />
                <div className="h-full bg-teal-500 w-[30%]" />
                <div className="h-full bg-[#006948] w-1/5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="border-t border-slate-200 bg-white py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-left">
            <h2 className="text-lg font-bold tracking-tight text-[#0b1c30]">
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
                className="sm:w-64 px-3.5 py-2 text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
              />
              <button
                type="submit"
                className="bg-[#006948] hover:bg-[#00855d] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
              >
                Subscribe
              </button>
            </form>

            {status && (
              <div
                role="status"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  status.type === "success"
                    ? "bg-emerald-50 text-[#006948] border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
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
