import React, { useState } from "react";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import WW from "../assests/WW.jpg";

const WelcomePage = ({ openAuthModal }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white [text-wrap:balance]">
              Welcome to WealthWise!
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-slate-200 leading-relaxed">
              &ldquo;We&apos;re here to help you get there&rdquo; — track daily
              expenses, set category budgets, plan financial goals, and review
              clear spending breakdowns in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 whitespace-nowrap shrink-0"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
              >
                Log In to Workspace
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs font-semibold text-violet-700 mb-2">
              01. Spending Analytics
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              Visual Expense Dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Monitor total expenses across categories and monthly trends with
              interactive pie and bar charts.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs font-semibold text-violet-700 mb-2">
              02. Ledger &amp; Export
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              Expense Logging &amp; Excel Export
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Record categorized expenses with dates and descriptions, and
              download your ledger directly to Excel.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs font-semibold text-violet-700 mb-2">
              03. Planning Targets
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              Category Budgets &amp; Goals
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Define clear spending limits per category and track long-term
              financial target amounts.
            </p>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="mt-auto border-t border-slate-200 bg-white py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Stay up to date with WealthWise
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Subscribe to our newsletter for updates, tips, and financial
            insights.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="mt-6 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
            />
            <button
              type="submit"
              className="bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              Subscribe
            </button>
          </form>

          {status && (
            <div
              role="status"
              className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                status.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{status.text}</span>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WelcomePage;
