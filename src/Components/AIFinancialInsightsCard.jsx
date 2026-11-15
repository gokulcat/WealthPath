import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Sparkles,
  RefreshCw,
  TrendingDown,
  Lightbulb,
  PiggyBank,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "../utils/currency";

const SESSION_CACHE_KEY = "wealthwise_ai_insights_cache_v1";

function buildFingerprint({ expenses, budgets, goals, incomeConfig }) {
  const expenseSig = expenses
    .map((e) => `${e.id || ""}:${e.date || ""}:${e.category || ""}:${e.amount || 0}`)
    .join("|");
  const budgetSig = budgets
    .map((b) => `${b.category || ""}:${b.budgetAmount || 0}`)
    .join("|");
  const goalSig = goals
    .map((g) => `${g.goal || ""}:${g.saved_amount || 0}:${g.target_amount || 0}`)
    .join("|");
  const incomeSig = `${incomeConfig?.monthlyIncomeUSD || 0}:${incomeConfig?.needsPct || 50}:${incomeConfig?.wantsPct || 30}:${incomeConfig?.wealthPct || 20}`;
  return `${expenseSig}__${budgetSig}__${goalSig}__${incomeSig}`;
}

function getStatusAccent(statusLabel) {
  const normalized = (statusLabel || "").toLowerCase();
  if (normalized.includes("strong")) {
    return "text-[#85f8c4]";
  }
  if (normalized.includes("watch")) {
    return "text-amber-300";
  }
  return "text-emerald-200";
}

const AIFinancialInsightsCard = ({
  expenses = [],
  budgets = [],
  goals = [],
  incomeConfig,
  currentCurrency = "USD",
}) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastFetchedSignatureRef = useRef("");

  const dataSignature = useMemo(
    () => buildFingerprint({ expenses, budgets, goals, incomeConfig }),
    [expenses, budgets, goals, incomeConfig]
  );

  const fetchInsights = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (expenses.length === 0) {
        setInsights(null);
        setError("");
        return;
      }

      if (!forceRefresh) {
        try {
          const cachedRaw = sessionStorage.getItem(SESSION_CACHE_KEY);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached?.signature === dataSignature && cached?.data) {
              setInsights(cached.data);
              setError("");
              lastFetchedSignatureRef.current = dataSignature;
              return;
            }
          }
        } catch {
          // Ignore sessionStorage parse issues
        }
      }

      setLoading(true);
      setError("");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch("/api/financial-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            expenses,
            budgets,
            goals,
            incomeConfig,
            currency: currentCurrency,
          }),
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            payload?.error || "Unable to generate AI financial insights."
          );
        }

        setInsights(payload);
        lastFetchedSignatureRef.current = dataSignature;

        try {
          sessionStorage.setItem(
            SESSION_CACHE_KEY,
            JSON.stringify({ signature: dataSignature, data: payload })
          );
        } catch {
          // Ignore storage quota issues
        }
      } catch (err) {
        if (err?.name === "AbortError") {
          setError(
            "AI analysis took too long to respond. Please try refreshing again."
          );
        } else {
          setError(
            err?.message || "Failed to load AI insights. Please try again."
          );
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [expenses, budgets, goals, incomeConfig, currentCurrency, dataSignature]
  );

  useEffect(() => {
    if (expenses.length === 0) {
      setInsights(null);
      setError("");
      lastFetchedSignatureRef.current = "";
      return;
    }

    if (lastFetchedSignatureRef.current !== dataSignature) {
      fetchInsights({ forceRefresh: false });
    }
  }, [expenses.length, dataSignature, fetchInsights]);

  const totalSavingsUSD = useMemo(() => {
    if (!insights) return 0;
    const explicit = Number(insights.estimatedMonthlySavingsUSD);
    if (!Number.isNaN(explicit) && explicit > 0) return explicit;
    if (Array.isArray(insights.savingsOpportunities)) {
      return insights.savingsOpportunities.reduce(
        (sum, opp) => sum + (Number(opp.monthlySavingsUSD) || 0),
        0
      );
    }
    return 0;
  }, [insights]);

  return (
    <section
      aria-label="AI Financial Insights"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
    >
      {/* Top Executive Deep Navy Header */}
      <div className="bg-[#0b1c30] text-white px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#006948] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-[#85f8c4]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                AI Financial Insights
              </h2>
              {insights?.healthStatus && !loading && (
                <span
                  className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 ${getStatusAccent(
                    insights.healthStatus
                  )}`}
                >
                  {insights.healthStatus}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Personalized spending pattern analysis &amp; savings opportunities
              in {currentCurrency}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 self-start md:self-auto">
          {insights && !loading && totalSavingsUSD > 0 && (
            <div className="bg-white/10 border border-white/10 rounded-lg px-3.5 py-2">
              <p className="text-[11px] font-medium text-slate-300">
                Potential Monthly Savings
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-[#85f8c4]">
                +{formatCurrency(totalSavingsUSD, currentCurrency, { showCents: false })}
                <span className="text-xs font-normal text-slate-300"> / mo</span>
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchInsights({ forceRefresh: true })}
            disabled={loading || expenses.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#0b1c30] bg-[#85f8c4] hover:bg-[#6ee7b7] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>{loading ? "Analyzing..." : "Refresh Insights"}</span>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6">
        {expenses.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Log at least one expense to unlock AI-powered spending summaries and
            savings recommendations.
          </div>
        ) : loading && !insights ? (
          <div className="space-y-5 animate-pulse" aria-busy="true">
            <div className="h-14 bg-[#eff4ff] rounded-lg w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-40" />
                <div className="h-20 bg-slate-100 rounded-lg" />
                <div className="h-20 bg-slate-100 rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-44" />
                <div className="h-20 bg-slate-100 rounded-lg" />
                <div className="h-20 bg-slate-100 rounded-lg" />
              </div>
            </div>
          </div>
        ) : error && !insights ? (
          <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchInsights({ forceRefresh: true })}
              className="px-3 py-1.5 text-xs font-semibold bg-[#0b1c30] text-white rounded-md hover:bg-slate-800 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Try Again
            </button>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Summary Callout */}
            <div className="bg-[#eff4ff] border border-slate-200/80 rounded-xl px-4 py-3.5 flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-[#006948] shrink-0 mt-0.5" />
              <p className="text-sm text-[#0b1c30] leading-relaxed">
                {insights.summary}
              </p>
            </div>

            {/* Two-Column Breakdown: Spending Habits & Savings Opportunities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spending Habits */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-[#0b1c30]" />
                  <h3 className="text-sm font-semibold text-[#0b1c30]">
                    Observed Spending Habits
                  </h3>
                </div>
                <div className="space-y-3">
                  {(insights.spendingHabits || []).map((habit, idx) => (
                    <div
                      key={`${habit.title}-${idx}`}
                      className="border border-slate-200 rounded-xl p-3.5 bg-white"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#0b1c30]">
                          {habit.title}
                        </span>
                        <span className="text-[11px] font-medium text-[#0b1c30] bg-[#eff4ff] px-2 py-0.5 rounded shrink-0">
                          {habit.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {habit.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Savings Opportunities */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <PiggyBank className="w-4 h-4 text-[#006948]" />
                  <h3 className="text-sm font-semibold text-[#0b1c30]">
                    Actionable Savings Opportunities
                  </h3>
                </div>
                <div className="space-y-3">
                  {(insights.savingsOpportunities || []).map((opp, idx) => (
                    <div
                      key={`${opp.title}-${idx}`}
                      className="border border-emerald-200/80 rounded-xl p-3.5 bg-emerald-50/40"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          <span className="text-sm font-semibold text-[#0b1c30] block">
                            {opp.title}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            Focus: {opp.targetCategory}
                          </span>
                        </div>
                        <span className="text-xs font-bold font-mono tabular-nums text-[#006948] bg-white border border-emerald-200 px-2.5 py-1 rounded-md shrink-0">
                          +
                          {formatCurrency(
                            opp.monthlySavingsUSD || 0,
                            currentCurrency,
                            { showCents: false }
                          )}
                          /mo
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        {opp.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default AIFinancialInsightsCard;
