import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Plus,
  CheckCircle2,
  ArrowUpRight,
  Globe2,
} from "lucide-react";
import { CURRENCIES, formatCurrency, toUSD } from "../utils/currency";

function GoalProgressRing({ pct, reached }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={reached ? "#00855d" : "#006948"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold font-mono tabular-nums text-[#0b1c30]">
          {clamped}%
        </span>
      </div>
    </div>
  );
}

const DashboardGoalsSection = ({
  goals = [],
  currentCurrency = "USD",
  onContributeGoal,
  onNotify,
}) => {
  const [filterMode, setFilterMode] = useState("all");

  const { totalSavedUSD, totalTargetUSD, overallPct, completedCount } =
    useMemo(() => {
      let saved = 0;
      let target = 0;
      let completed = 0;
      goals.forEach((g) => {
        const s = parseFloat(g.saved_amount) || 0;
        const t = parseFloat(g.target_amount) || 0;
        saved += s;
        target += t;
        if (t > 0 && s >= t) completed += 1;
      });
      const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
      return {
        totalSavedUSD: saved,
        totalTargetUSD: target,
        overallPct: pct,
        completedCount: completed,
      };
    }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter((item) => {
        const target = parseFloat(item.target_amount) || 0;
        const saved = parseFloat(item.saved_amount) || 0;
        const reached = target > 0 && saved >= target;
        if (filterMode === "active") return !reached;
        if (filterMode === "completed") return reached;
        return true;
      });
  }, [goals, filterMode]);

  const quickSteps = currentCurrency === "JPY" ? [5000, 25000] : [50, 250];

  const handleQuickFund = (goalItem, localAmount) => {
    if (!onContributeGoal) return;
    const deltaUSD = Number(toUSD(localAmount, currentCurrency).toFixed(2));
    onContributeGoal(goalItem.originalIndex, deltaUSD);
    if (onNotify) {
      onNotify(
        `Added ${formatCurrency(deltaUSD, currentCurrency, {
          showCents: false,
        })} toward ${goalItem.goal}!`
      );
    }
  };

  return (
    <section
      aria-label="Financial Goals Progress Tracker"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#0b1c30] text-[#85f8c4] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-semibold text-[#0b1c30]">
                Financial Goals &amp; Progress Tracker
              </h2>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#006948] bg-[#eff4ff] px-2.5 py-0.5 rounded">
                {overallPct}% Overall · {completedCount}/{goals.length} Funded
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              {formatCurrency(totalSavedUSD, currentCurrency, {
                showCents: false,
              })}{" "}
              saved across{" "}
              {formatCurrency(totalTargetUSD, currentCurrency, {
                showCents: false,
              })}{" "}
              combined targets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200">
            {[
              { id: "all", label: "All Goals" },
              { id: "active", label: "In Progress" },
              { id: "completed", label: "Reached" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  filterMode === tab.id
                    ? "bg-[#0b1c30] text-white"
                    : "text-slate-600 hover:text-[#0b1c30]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            to="/goals"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage &amp; Add Goals</span>
          </Link>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length > 0 ? (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredGoals.map((item, idx) => {
            const targetUSD = parseFloat(item.target_amount) || 0;
            const savedUSD = parseFloat(item.saved_amount) || 0;
            const remainingUSD = Math.max(0, targetUSD - savedUSD);
            const pct =
              targetUSD > 0
                ? Math.min(100, Math.round((savedUSD / targetUSD) * 100))
                : 0;
            const reached = targetUSD > 0 && savedUSD >= targetUSD;
            const monthlyAutoUSD = parseFloat(item.monthlyAuto) || 0;
            const monthsRemaining =
              !reached && monthlyAutoUSD > 0
                ? Math.ceil(remainingUSD / monthlyAutoUSD)
                : null;
            const fxObj =
              item.foreignCurrency && CURRENCIES[item.foreignCurrency];

            return (
              <div
                key={`${item.goal}-${idx}`}
                className={`border rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors ${
                  reached
                    ? "border-emerald-200 bg-emerald-50/35"
                    : "border-slate-200 bg-[#f8f9ff]/60"
                }`}
              >
                {/* Top Row: Ring + Title & Target Date */}
                <div className="flex items-start gap-3.5">
                  <GoalProgressRing pct={pct} reached={reached} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#0b1c30] truncate">
                        {item.goal}
                      </h3>
                      {reached && (
                        <CheckCircle2
                          className="w-4 h-4 text-[#006948] shrink-0"
                          aria-label="Goal reached"
                        />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {item.categoryTag || "Savings Goal"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-medium text-slate-500">
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded">
                        Target: {item.targetDate || "Flexible"}
                      </span>
                      {fxObj && (
                        <span className="inline-flex items-center gap-1 bg-[#eff4ff] text-[#006948] px-2 py-0.5 rounded font-mono">
                          <Globe2 className="w-3 h-3" />
                          {fxObj.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Milestone Ticks */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-mono tabular-nums font-bold text-[#0b1c30]">
                      {formatCurrency(savedUSD, currentCurrency, {
                        showCents: false,
                      })}
                      <span className="font-normal text-slate-500">
                        {" "}
                        /{" "}
                        {formatCurrency(targetUSD, currentCurrency, {
                          showCents: false,
                        })}
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] font-semibold text-[#006948]">
                      {reached
                        ? "Goal Reached"
                        : `${formatCurrency(remainingUSD, currentCurrency, {
                            showCents: false,
                          })} left`}
                    </span>
                  </div>

                  <div className="relative w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        reached ? "bg-[#00855d]" : "bg-[#006948]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute left-1/4 top-0 bottom-0 w-px bg-white/70" />
                    <span className="absolute left-1/2 top-0 bottom-0 w-px bg-white/70" />
                    <span className="absolute left-3/4 top-0 bottom-0 w-px bg-white/70" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>
                      {monthlyAutoUSD > 0
                        ? `+${formatCurrency(monthlyAutoUSD, currentCurrency, {
                            showCents: false,
                          })}/mo auto`
                        : "Manual contributions"}
                    </span>
                    <span>
                      {reached
                        ? "100% Complete"
                        : monthsRemaining !== null
                        ? `~${monthsRemaining} mo${
                            monthsRemaining === 1 ? "" : "s"
                          } ETA`
                        : "Flexible pace"}
                    </span>
                  </div>
                </div>

                {/* Quick Fund Footer */}
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  {onContributeGoal && !reached ? (
                    <div className="flex items-center gap-1.5">
                      {quickSteps.map((stepVal) => (
                        <button
                          key={stepVal}
                          type="button"
                          onClick={() => handleQuickFund(item, stepVal)}
                          className="px-2.5 py-1 text-xs font-semibold font-mono tabular-nums text-[#006948] bg-white border border-[#006948]/30 hover:bg-[#eff4ff] rounded-md transition-colors cursor-pointer"
                        >
                          +{CURRENCIES[currentCurrency]?.symbol || "$"}
                          {stepVal.toLocaleString("en-US")}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-[#006948]">
                      Fully funded
                    </span>
                  )}

                  <Link
                    to="/goals"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0b1c30] hover:text-[#006948]"
                  >
                    <span>Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-10 text-center text-sm text-slate-500">
          <p>
            {goals.length === 0
              ? "No financial goals created yet."
              : "No goals match the selected filter."}
          </p>
          <Link
            to="/goals"
            className="inline-block mt-2 text-xs font-semibold text-[#006948] hover:underline"
          >
            Create a Goal (e.g. Emergency Fund, Vacation)
          </Link>
        </div>
      )}
    </section>
  );
};

export default DashboardGoalsSection;
