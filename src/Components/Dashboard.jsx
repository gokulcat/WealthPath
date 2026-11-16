import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Plus,
  Target,
  Wallet,
  CheckCircle2,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Flame,
  PiggyBank,
  Gauge,
  Repeat,
  Calendar,
} from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import DashboardGoalsSection from "./DashboardGoalsSection";
import { exportExpensesAndAnalyticsCSV } from "../utils/exportCsv";
import {
  CURRENCIES,
  convertAmount,
  formatCurrency,
  getCategoryStream,
} from "../utils/currency";
import { getMonthlyEquivalentUSD } from "../utils/recurringExpenses";

const CATEGORY_COLORS = {
  Food: "#006948",
  Utilities: "#0b1c30",
  Transport: "#0d9488",
  Healthcare: "#0284c7",
  Entertainment: "#10b981",
  Shopping: "#334155",
  Housing: "#1e3a8a",
};

const FALLBACK_COLORS = [
  "#006948",
  "#0b1c30",
  "#0d9488",
  "#0284c7",
  "#10b981",
  "#334155",
  "#1e3a8a",
  "#059669",
];

function getCategoryColor(category, index) {
  return (
    CATEGORY_COLORS[category] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(dateObj.getTime())) return monthKey;
  return dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatShortMonth(monthKey) {
  const [year, month] = monthKey.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(dateObj.getTime())) return monthKey;
  return dateObj.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function BarChartTooltip({ active, payload, label, currentCurrency }) {
  if (!active || !payload || payload.length === 0) return null;

  const totalUSD = payload.reduce(
    (sum, entry) => sum + (Number(entry.value) || 0),
    0
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs min-w-[195px]">
      <p className="font-semibold text-[#0b1c30] mb-2.5">
        {formatMonthLabel(label)}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}</span>
            </span>
            <span className="font-mono tabular-nums font-medium text-[#0b1c30]">
              {formatCurrency(entry.value, currentCurrency, {
                showCents: false,
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between font-semibold text-[#0b1c30]">
        <span>Monthly Total</span>
        <span className="font-mono tabular-nums">
          {formatCurrency(totalUSD, currentCurrency, { showCents: false })}
        </span>
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload, totalExpensesUSD, currentCurrency }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const valueUSD = Number(item.value) || 0;
  const share =
    totalExpensesUSD > 0
      ? ((valueUSD / totalExpensesUSD) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-3.5 py-2.5 text-xs">
      <div className="flex items-center gap-2 font-semibold text-[#0b1c30]">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.payload?.color }}
        />
        <span>{item.name}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-slate-600 font-mono tabular-nums">
        <span className="font-semibold text-[#0b1c30]">
          {formatCurrency(valueUSD, currentCurrency, { showCents: false })}
        </span>
        <span aria-hidden="true">·</span>
        <span>{share}%</span>
      </div>
    </div>
  );
}

function CashFlowTooltip({ active, payload, label, currentCurrency }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs min-w-[205px]">
      <p className="font-semibold text-[#0b1c30] mb-2">
        {formatMonthLabel(label)}
      </p>
      <div className="space-y-1.5 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Income Target</span>
          <span className="font-semibold text-[#0b1c30]">
            {formatCurrency(row.incomeUSD || 0, currentCurrency, {
              showCents: false,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Actual Spend</span>
          <span className="font-semibold text-[#0b1c30]">
            {formatCurrency(row.spendUSD || 0, currentCurrency, {
              showCents: false,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[#006948] pt-1.5 border-t border-slate-100">
          <span className="font-sans font-semibold">Net Surplus</span>
          <span className="font-bold">
            {row.surplusUSD >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(row.surplusUSD || 0), currentCurrency, {
              showCents: false,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-500 text-[11px]">
          <span className="font-sans">Savings Rate</span>
          <span>{row.savingsRatePct ?? 0}%</span>
        </div>
      </div>
    </div>
  );
}

function BudgetComparisonTooltip({ active, payload, label, currentCurrency }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload || {};
  const pct =
    row.limitUSD > 0 ? Math.round((row.spentUSD / row.limitUSD) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs min-w-[190px]">
      <p className="font-semibold text-[#0b1c30] mb-1.5">{label}</p>
      <div className="space-y-1 font-mono tabular-nums">
        <div className="flex justify-between gap-4">
          <span className="font-sans text-slate-500">Spent</span>
          <span className="font-semibold text-[#0b1c30]">
            {formatCurrency(row.spentUSD || 0, currentCurrency, {
              showCents: false,
            })}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-sans text-slate-500">Monthly Cap</span>
          <span className="font-semibold text-[#006948]">
            {formatCurrency(row.limitUSD || 0, currentCurrency, {
              showCents: false,
            })}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 text-[11px]">
          <span className="font-sans text-slate-500">Utilization</span>
          <span className={pct >= 100 ? "text-rose-600 font-bold" : "text-[#006948] font-bold"}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

const Dashboard = ({
  expenses = [],
  budgets = [],
  goals = [],
  recurringExpenses = [],
  incomeConfig,
  onAddExpense,
  onContributeGoal,
  currentCurrency = "USD",
  onCurrencyChange,
  onOpenFXModal,
  alertThreshold = 80,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartMode, setChartMode] = useState("stacked");
  const [isDonutHovered, setIsDonutHovered] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const monthlyIncomeUSD = incomeConfig?.monthlyIncomeUSD || 6500;
  const activeCurrencyObj = CURRENCIES[currentCurrency] || CURRENCIES.USD;

  const {
    totalExpensesUSD,
    categoryTotals,
    categoriesList,
    monthlyCategoryData,
    cashFlowSeries,
    availableMonths,
    latestMonthSpendUSD,
    prevMonthSpendUSD,
    momDeltaPct,
    avgMonthlySpendUSD,
  } = useMemo(() => {
    const catMap = new Map();
    const monthMap = new Map();
    let total = 0;

    expenses.forEach((item) => {
      const amount = parseFloat(item.amount) || 0;
      const category = (item.category || "Other").trim();
      const monthKey = (item.date || "").slice(0, 7) || "Unknown";

      total += amount;
      catMap.set(category, (catMap.get(category) || 0) + amount);

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { month: monthKey, __total: 0 });
      }
      const row = monthMap.get(monthKey);
      row[category] = (row[category] || 0) + amount;
      row.__total += amount;
    });

    const catEntries = Array.from(catMap.entries())
      .map(([category, sum], index) => ({
        name: category,
        category,
        value: sum,
        total: sum,
        color: getCategoryColor(category, index),
      }))
      .sort((a, b) => b.total - a.total);

    const categories = catEntries.map((c) => c.category);
    const sortedMonths = Array.from(monthMap.keys())
      .filter((m) => m !== "Unknown")
      .sort();

    const monthlyRows = sortedMonths.map((monthKey) => {
      const row = { ...monthMap.get(monthKey) };
      categories.forEach((cat) => {
        if (row[cat] === undefined) row[cat] = 0;
      });
      return row;
    });

    const flowRows = sortedMonths.map((monthKey) => {
      const spendUSD = monthMap.get(monthKey)?.__total || 0;
      const surplusUSD = monthlyIncomeUSD - spendUSD;
      const savingsRatePct =
        monthlyIncomeUSD > 0
          ? Math.round((surplusUSD / monthlyIncomeUSD) * 1000) / 10
          : 0;
      return {
        month: monthKey,
        incomeUSD: monthlyIncomeUSD,
        spendUSD: Math.round(spendUSD * 100) / 100,
        surplusUSD: Math.round(surplusUSD * 100) / 100,
        savingsRatePct,
      };
    });

    const latestKey = sortedMonths[sortedMonths.length - 1];
    const prevKey = sortedMonths[sortedMonths.length - 2];
    const latestSpend = latestKey ? monthMap.get(latestKey)?.__total || 0 : 0;
    const prevSpend = prevKey ? monthMap.get(prevKey)?.__total || 0 : 0;
    const momChange =
      prevSpend > 0
        ? Math.round(((latestSpend - prevSpend) / prevSpend) * 1000) / 10
        : null;
    const avgMonthly =
      sortedMonths.length > 0 ? total / sortedMonths.length : total;

    return {
      totalExpensesUSD: total,
      categoryTotals: catEntries,
      categoriesList: categories,
      monthlyCategoryData: monthlyRows,
      cashFlowSeries: flowRows,
      availableMonths: [...sortedMonths].reverse(),
      latestMonthSpendUSD: latestSpend,
      prevMonthSpendUSD: prevSpend,
      momDeltaPct: momChange,
      avgMonthlySpendUSD: avgMonthly,
    };
  }, [expenses, monthlyIncomeUSD]);

  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState(
    () => availableMonths[0] || new Date().toISOString().slice(0, 7)
  );

  const activeBudgetMonth = availableMonths.includes(selectedBudgetMonth)
    ? selectedBudgetMonth
    : availableMonths[0] || new Date().toISOString().slice(0, 7);

  const monthlySpendByCategory = useMemo(() => {
    const map = new Map();
    expenses.forEach((item) => {
      const monthKey = (item.date || "").slice(0, 7);
      if (monthKey === activeBudgetMonth) {
        const key = (item.category || "Other").trim().toLowerCase();
        map.set(key, (map.get(key) || 0) + (parseFloat(item.amount) || 0));
      }
    });
    return map;
  }, [expenses, activeBudgetMonth]);

  const budgetComparisonData = useMemo(() => {
    return budgets.map((b) => {
      const limitUSD = parseFloat(b.budgetAmount) || 0;
      const spentUSD =
        monthlySpendByCategory.get(b.category.trim().toLowerCase()) || 0;
      return {
        category: b.category,
        spentUSD: Math.round(spentUSD * 100) / 100,
        limitUSD: Math.round(limitUSD * 100) / 100,
      };
    });
  }, [budgets, monthlySpendByCategory]);

  const streamBreakdown = useMemo(() => {
    const budgetStreamMap = new Map();
    budgets.forEach((b) => {
      budgetStreamMap.set(
        b.category.trim().toLowerCase(),
        getCategoryStream(b.category, b.stream)
      );
    });

    const sums = {
      "Essential Needs": 0,
      "Lifestyle & Wants": 0,
      "Wealth Building": 0,
    };

    expenses.forEach((item) => {
      if ((item.date || "").slice(0, 7) === activeBudgetMonth) {
        const key = (item.category || "Other").trim().toLowerCase();
        const stream = getCategoryStream(item.category, budgetStreamMap.get(key));
        sums[stream] = (sums[stream] || 0) + (parseFloat(item.amount) || 0);
      }
    });

    const vaultAutoUSD = goals.reduce(
      (sum, g) => sum + (parseFloat(g.monthlyAuto) || 0),
      0
    );
    sums["Wealth Building"] += vaultAutoUSD;

    const split = incomeConfig?.split || { needs: 50, wants: 30, wealth: 20 };

    return [
      {
        label: "Essential Needs",
        actualUSD: sums["Essential Needs"],
        targetPct: split.needs ?? 50,
        actualPct:
          monthlyIncomeUSD > 0
            ? Math.round((sums["Essential Needs"] / monthlyIncomeUSD) * 100)
            : 0,
        color: "#0b1c30",
      },
      {
        label: "Lifestyle & Wants",
        actualUSD: sums["Lifestyle & Wants"],
        targetPct: split.wants ?? 30,
        actualPct:
          monthlyIncomeUSD > 0
            ? Math.round((sums["Lifestyle & Wants"] / monthlyIncomeUSD) * 100)
            : 0,
        color: "#0d9488",
      },
      {
        label: "Wealth & Vaults",
        actualUSD: sums["Wealth Building"],
        targetPct: split.wealth ?? 20,
        actualPct:
          monthlyIncomeUSD > 0
            ? Math.round((sums["Wealth Building"] / monthlyIncomeUSD) * 100)
            : 0,
        color: "#006948",
      },
    ];
  }, [expenses, budgets, goals, activeBudgetMonth, incomeConfig, monthlyIncomeUSD]);

  const latestSurplusUSD = monthlyIncomeUSD - latestMonthSpendUSD;
  const savingsRatePct =
    monthlyIncomeUSD > 0
      ? Math.round((latestSurplusUSD / monthlyIncomeUSD) * 1000) / 10
      : 0;
  const dailyBurnRateUSD = latestMonthSpendUSD / 30;
  const projectedAnnualSavingsUSD = latestSurplusUSD * 12;

  const totalBudgetCapUSD = budgets.reduce(
    (sum, b) => sum + (parseFloat(b.budgetAmount) || 0),
    0
  );
  const totalBudgetSpentUSD = budgets.reduce((sum, b) => {
    return (
      sum + (monthlySpendByCategory.get(b.category.trim().toLowerCase()) || 0)
    );
  }, 0);
  const overallBudgetPct =
    totalBudgetCapUSD > 0
      ? Math.round((totalBudgetSpentUSD / totalBudgetCapUSD) * 100)
      : 0;

  const totalGoalSavedUSD = goals.reduce(
    (sum, g) => sum + (parseFloat(g.saved_amount) || 0),
    0
  );
  const totalGoalTargetUSD = goals.reduce(
    (sum, g) => sum + (parseFloat(g.target_amount) || 0),
    0
  );
  const overallGoalPct =
    totalGoalTargetUSD > 0
      ? Math.round((totalGoalSavedUSD / totalGoalTargetUSD) * 100)
      : 0;

  const topCategory = categoryTotals[0] || { category: "None", total: 0 };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleQuickAddExpense = (newExpense) => {
    if (onAddExpense) {
      onAddExpense(newExpense);
    }
    showToast(
      `Added ${formatCurrency(newExpense.amount, currentCurrency)} under ${
        newExpense.category
      }`
    );
  };

  const handleExportCSV = () => {
    exportExpensesAndAnalyticsCSV(
      expenses,
      budgets,
      activeBudgetMonth,
      currentCurrency,
      { monthlyIncomeUSD, goals }
    );
    showToast(
      `Comprehensive financial report exported to CSV (${currentCurrency})!`
    );
  };

  return (
    <div className="flex-1 bg-[#f8f9ff] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        {/* Page Header + Global Currency Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
              Financial Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Unified income cash flow, spending trends, budget limits, and
              savings vaults in{" "}
              <span className="font-semibold text-[#0b1c30]">
                {currentCurrency} ({activeCurrencyObj.symbol})
              </span>
              {currentCurrency !== "USD" && (
                <span className="font-mono text-xs text-[#006948] ml-1.5">
                  · 1 USD = {activeCurrencyObj.rateAgainstUSD} {currentCurrency}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onCurrencyChange && (
              <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                <select
                  aria-label="Global base currency"
                  value={currentCurrency}
                  onChange={(e) => {
                    const nextCode = e.target.value;
                    onCurrencyChange(nextCode);
                    showToast(
                      `Switched workspace currency to ${nextCode} (${
                        CURRENCIES[nextCode]?.name || nextCode
                      })`
                    );
                  }}
                  className="pl-3 pr-2 py-2 text-xs font-bold text-[#0b1c30] bg-[#eff4ff]/70 focus:outline-none cursor-pointer"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                {onOpenFXModal && (
                  <button
                    type="button"
                    onClick={onOpenFXModal}
                    title="Sync live FX rates or edit rates"
                    aria-label="Open FX Rate Matrix"
                    className="px-2.5 py-2 text-xs font-semibold text-[#006948] hover:bg-[#eff4ff] border-l border-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">FX</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add Expense</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#006948]" />
              <span>Export Report ({currentCurrency})</span>
            </button>
            <Link
              to="/expenses?tab=calendar"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <Calendar className="w-4 h-4 text-[#006948]" />
              <span>Calendar</span>
            </Link>
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <Wallet className="w-4 h-4 text-[#006948]" />
              <span>Salary</span>
            </Link>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <TrendingUp className="w-4 h-4 text-[#006948]" />
              <span>Analytics</span>
            </Link>
          </div>
        </div>

        {toastMessage && (
          <div
            role="status"
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-emerald-50 text-[#006948] border border-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Unified 4-Card KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Monthly Income Target
            </p>
            <p className="mt-1.5 text-2xl font-bold text-[#0b1c30] font-mono tabular-nums">
              {formatCurrency(monthlyIncomeUSD, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              Split {incomeConfig?.split?.needs ?? 50}/
              {incomeConfig?.split?.wants ?? 30}/
              {incomeConfig?.split?.wealth ?? 20} rule
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Total Logged Expenses
            </p>
            <p className="mt-1.5 text-2xl font-bold text-[#0b1c30] font-mono tabular-nums">
              {formatCurrency(totalExpensesUSD, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              Avg{" "}
              {formatCurrency(avgMonthlySpendUSD, currentCurrency, {
                showCents: false,
              })}
              /mo · {expenses.length} entries
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Latest Month Net Surplus
            </p>
            <p
              className={`mt-1.5 text-2xl font-bold font-mono tabular-nums ${
                latestSurplusUSD >= 0 ? "text-[#006948]" : "text-rose-600"
              }`}
            >
              {latestSurplusUSD >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(latestSurplusUSD), currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              {savingsRatePct}% savings rate in {formatShortMonth(activeBudgetMonth)}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Highest Category &amp; Cap Usage
            </p>
            <p className="mt-1.5 text-2xl font-bold text-[#006948] font-mono tabular-nums">
              {formatCurrency(topCategory.total, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              {topCategory.category} · {overallBudgetPct}% of monthly caps
            </p>
          </div>
        </div>

        {/* Executive Quantitative Pulse Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#eff4ff]/70 border border-slate-200/80 rounded-xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0b1c30] shrink-0">
              {momDeltaPct !== null && momDeltaPct <= 0 ? (
                <TrendingDown className="w-4 h-4 text-[#006948]" />
              ) : (
                <TrendingUp className="w-4 h-4 text-[#0b1c30]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">
                Month-over-Month Spend
              </p>
              <p className="text-sm font-bold font-mono tabular-nums text-[#0b1c30]">
                {momDeltaPct === null
                  ? "Baseline month"
                  : `${momDeltaPct > 0 ? "+" : ""}${momDeltaPct}% vs prior mo`}
              </p>
            </div>
          </div>

          <div className="bg-[#eff4ff]/70 border border-slate-200/80 rounded-xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#006948] shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">
                Daily Spend Velocity
              </p>
              <p className="text-sm font-bold font-mono tabular-nums text-[#0b1c30]">
                {formatCurrency(dailyBurnRateUSD, currentCurrency, {
                  showCents: false,
                })}{" "}
                <span className="text-xs font-normal text-slate-500">/ day</span>
              </p>
            </div>
          </div>

          <div className="bg-[#eff4ff]/70 border border-slate-200/80 rounded-xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#006948] shrink-0">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">
                Annualized Surplus Pace
              </p>
              <p className="text-sm font-bold font-mono tabular-nums text-[#006948]">
                {projectedAnnualSavingsUSD >= 0 ? "+" : "-"}
                {formatCurrency(
                  Math.abs(projectedAnnualSavingsUSD),
                  currentCurrency,
                  { showCents: false }
                )}
                <span className="text-xs font-normal text-slate-500"> / yr</span>
              </p>
            </div>
          </div>

          <div className="bg-[#eff4ff]/70 border border-slate-200/80 rounded-xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0b1c30] shrink-0">
              <Gauge className="w-4 h-4 text-[#006948]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">
                Vault Targets Funded
              </p>
              <p className="text-sm font-bold font-mono tabular-nums text-[#0b1c30]">
                {overallGoalPct}%{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({formatCurrency(totalGoalSavedUSD, currentCurrency, {
                    showCents: false,
                    compact: true,
                  })}
                  )
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Primary Spending Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1c30]">
                  Monthly Spending Trends by Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly expenditure breakdown in {currentCurrency}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMode("stacked")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    chartMode === "stacked"
                      ? "bg-[#0b1c30] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0b1c30]"
                  }`}
                >
                  Stacked
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("grouped")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    chartMode === "grouped"
                      ? "bg-[#0b1c30] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0b1c30]"
                  }`}
                >
                  Grouped
                </button>
              </div>
            </div>

            <div className="h-[310px] w-full">
              {monthlyCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyCategoryData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                    barCategoryGap="26%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#eff4ff"
                    />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatShortMonth}
                      tick={{
                        fill: "#64748b",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                      dy={6}
                    />
                    <YAxis
                      tickFormatter={(val) =>
                        formatCurrency(val, currentCurrency, {
                          showCents: false,
                          compact: true,
                        })
                      }
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={58}
                    />
                    <Tooltip
                      wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                      content={
                        <BarChartTooltip currentCurrency={currentCurrency} />
                      }
                      cursor={{ fill: "rgba(239, 244, 255, 0.8)" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "14px" }}
                      iconType="circle"
                      iconSize={8}
                    />
                    {categoriesList.map((category, index) => (
                      <Bar
                        key={category}
                        dataKey={category}
                        name={category}
                        stackId={chartMode === "stacked" ? "spend" : undefined}
                        fill={getCategoryColor(category, index)}
                        stroke="#ffffff"
                        strokeWidth={chartMode === "stacked" ? 1.5 : 0}
                        radius={
                          chartMode === "grouped"
                            ? [5, 5, 0, 0]
                            : index === categoriesList.length - 1
                            ? [5, 5, 0, 0]
                            : [0, 0, 0, 0]
                        }
                        maxBarSize={chartMode === "stacked" ? 44 : 22}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  Add an expense to visualize monthly category trends.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#0b1c30]">
                Expenses by Category
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportional spend across active categories
              </p>
            </div>

            {categoryTotals.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div
                  className="relative h-[220px] w-full"
                  onMouseLeave={() => setIsDonutHovered(false)}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center transition-opacity duration-150 ${
                      isDonutHovered ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <span className="text-[11px] font-medium text-slate-500">
                      Total Spent
                    </span>
                    <span className="text-lg font-bold text-[#0b1c30] font-mono tabular-nums">
                      {formatCurrency(totalExpensesUSD, currentCurrency, {
                        showCents: false,
                        compact:
                          convertAmount(totalExpensesUSD, currentCurrency) >=
                          100000,
                      })}
                    </span>
                  </div>

                  <div className="relative z-10 w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryTotals}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={64}
                          outerRadius={92}
                          paddingAngle={3}
                          cornerRadius={6}
                          stroke="none"
                          onMouseEnter={() => setIsDonutHovered(true)}
                          onMouseLeave={() => setIsDonutHovered(false)}
                        >
                          {categoryTotals.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                          content={
                            <DonutTooltip
                              totalExpensesUSD={totalExpensesUSD}
                              currentCurrency={currentCurrency}
                            />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
                  {categoryTotals.map((item) => {
                    const share =
                      totalExpensesUSD > 0
                        ? Math.round((item.total / totalExpensesUSD) * 100)
                        : 0;
                    return (
                      <div
                        key={item.category}
                        className="py-2 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-[#0b1c30] truncate">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                          <span className="text-slate-400">{share}%</span>
                          <span className="font-semibold text-[#0b1c30] w-20 text-right">
                            {formatCurrency(item.total, currentCurrency, {
                              showCents: false,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
                No category expenses recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Extended Insights Grid: Income vs. Spend Cash Flow + Budget Cap vs Actual & 3-Stream Mix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cash Flow & Net Surplus Trend */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1c30]">
                  Cash Flow: Income Target vs. Spend &amp; Surplus
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly net savings capacity after expenses in{" "}
                  {currentCurrency}
                </p>
              </div>
              {prevMonthSpendUSD > 0 && (
                <span className="text-xs font-mono tabular-nums font-semibold text-[#006948] bg-[#eff4ff] px-2.5 py-1 rounded-md self-start sm:self-auto">
                  Savings Rate: {savingsRatePct}%
                </span>
              )}
            </div>

            <div className="h-[270px] w-full">
              {cashFlowSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={cashFlowSeries}
                    margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient
                        id="dashSurplusGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#006948"
                          stopOpacity={0.22}
                        />
                        <stop
                          offset="95%"
                          stopColor="#006948"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#eff4ff"
                    />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatShortMonth}
                      tick={{
                        fill: "#64748b",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(val) =>
                        formatCurrency(val, currentCurrency, {
                          showCents: false,
                          compact: true,
                        })
                      }
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={58}
                    />
                    <Tooltip
                      wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                      content={
                        <CashFlowTooltip currentCurrency={currentCurrency} />
                      }
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <ReferenceLine
                      y={monthlyIncomeUSD}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                    />
                    <Area
                      type="monotone"
                      dataKey="surplusUSD"
                      name="Net Surplus"
                      stroke="#006948"
                      strokeWidth={2.5}
                      fill="url(#dashSurplusGrad)"
                    />
                    <Bar
                      dataKey="spendUSD"
                      name="Monthly Spend"
                      fill="#0b1c30"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={32}
                    />
                    <Line
                      type="monotone"
                      dataKey="incomeUSD"
                      name="Income Target"
                      stroke="#0d9488"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  Add expenses across months to view cash-flow velocity.
                </div>
              )}
            </div>
          </div>

          {/* Budget Cap vs Actual Chart + 3-Stream Allocation */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#0b1c30]">
                    Budget Caps vs. Actuals
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatMonthLabel(activeBudgetMonth)} category variance
                  </p>
                </div>
                <Link
                  to="/budget"
                  className="text-xs font-semibold text-[#006948] hover:underline whitespace-nowrap"
                >
                  Tune Caps
                </Link>
              </div>

              <div className="h-[175px] w-full">
                {budgetComparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={budgetComparisonData}
                      layout="vertical"
                      margin={{ top: 4, right: 10, left: 4, bottom: 4 }}
                      barGap={2}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#eff4ff"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(val) =>
                          formatCurrency(val, currentCurrency, {
                            showCents: false,
                            compact: true,
                          })
                        }
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="category"
                        width={84}
                        tick={{
                          fill: "#0b1c30",
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                        content={
                          <BudgetComparisonTooltip
                            currentCurrency={currentCurrency}
                          />
                        }
                        cursor={{ fill: "rgba(239, 244, 255, 0.7)" }}
                      />
                      <Bar
                        dataKey="limitUSD"
                        name="Cap"
                        fill="#cbd5e1"
                        radius={[0, 4, 4, 0]}
                        barSize={8}
                      />
                      <Bar
                        dataKey="spentUSD"
                        name="Spent"
                        fill="#006948"
                        radius={[0, 4, 4, 0]}
                        barSize={8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Set monthly category budgets to compare limits vs. actuals.
                  </div>
                )}
              </div>
            </div>

            {/* 3-Stream Cash Allocation vs Target Split */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0b1c30]">
                  3-Stream Actual vs. Target Mix
                </span>
                <span className="text-[11px] text-slate-500">
                  {formatShortMonth(activeBudgetMonth)}
                </span>
              </div>
              {streamBreakdown.map((st) => (
                <div key={st.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#0b1c30]">
                      {st.label}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600">
                      <strong className="text-[#0b1c30]">
                        {formatCurrency(st.actualUSD, currentCurrency, {
                          showCents: false,
                        })}
                      </strong>{" "}
                      ({st.actualPct}% / {st.targetPct}% goal)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, st.actualPct)}%`,
                        backgroundColor: st.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dedicated Financial Goals & Visual Progress Section */}
        <DashboardGoalsSection
          goals={goals}
          currentCurrency={currentCurrency}
          onContributeGoal={onContributeGoal}
          onNotify={showToast}
        />

        {/* Bottom Grid: Monthly Budget Progress + Upcoming Recurring Bills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Budget Progress */}
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1c30]">
                  Monthly Budget Progress
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category spending vs. monthly limits in {currentCurrency}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {availableMonths.length > 0 && (
                  <select
                    aria-label="Select month for budget progress"
                    value={activeBudgetMonth}
                    onChange={(e) => setSelectedBudgetMonth(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium text-[#0b1c30] bg-[#eff4ff] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  >
                    {availableMonths.map((monthKey) => (
                      <option key={monthKey} value={monthKey}>
                        {formatMonthLabel(monthKey)}
                      </option>
                    ))}
                  </select>
                )}
                <Link
                  to="/budget"
                  className="text-xs font-semibold text-[#006948] hover:text-[#00855d] hover:underline whitespace-nowrap"
                >
                  Manage Budgets
                </Link>
              </div>
            </div>

            {budgets.length > 0 ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((budget) => {
                  const limitUSD = parseFloat(budget.budgetAmount) || 0;
                  const spentUSD =
                    monthlySpendByCategory.get(
                      budget.category.trim().toLowerCase()
                    ) || 0;
                  const pct =
                    limitUSD > 0 ? Math.round((spentUSD / limitUSD) * 100) : 0;
                  const barWidth = Math.min(pct, 100);
                  const remainingUSD = limitUSD - spentUSD;

                  const status =
                    pct >= 100
                      ? {
                          label: "Over budget",
                          textClass: "text-rose-700",
                          barClass: "bg-rose-600",
                        }
                      : pct >= 75
                      ? {
                          label: "Near limit",
                          textClass: "text-amber-700",
                          barClass: "bg-amber-500",
                        }
                      : {
                          label: "On track",
                          textClass: "text-[#006948]",
                          barClass: "bg-[#006948]",
                        };

                  return (
                    <div
                      key={budget.category}
                      className="border border-slate-200 rounded-xl p-4 bg-[#eff4ff]/35"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-[#0b1c30] truncate">
                          {budget.category}
                        </span>
                        <span
                          className={`text-xs font-medium ${status.textClass}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-base font-bold font-mono tabular-nums text-[#0b1c30]">
                          {formatCurrency(spentUSD, currentCurrency, {
                            showCents: false,
                          })}
                          <span className="text-xs font-normal text-slate-500">
                            {" "}
                            /{" "}
                            {formatCurrency(limitUSD, currentCurrency, {
                              showCents: false,
                            })}
                          </span>
                        </span>
                        <span className="text-xs font-mono tabular-nums text-slate-500">
                          {pct}%
                        </span>
                      </div>

                      <div
                        className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={Math.min(pct, 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${budget.category} budget usage`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${status.barClass}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
                        {remainingUSD >= 0
                          ? `${formatCurrency(
                              remainingUSD,
                              currentCurrency
                            )} remaining`
                          : `${formatCurrency(
                              Math.abs(remainingUSD),
                              currentCurrency
                            )} over limit`}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No monthly budgets set yet.{" "}
                <Link
                  to="/budget"
                  className="font-semibold text-[#006948] hover:underline"
                >
                  Set your first category limit
                </Link>
                .
              </div>
            )}
          </section>

          {/* Upcoming Recurring Bills Summary */}
          <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1c30]">
                  Recurring Bills
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                  {formatCurrency(
                    recurringExpenses
                      .filter((r) => r.active !== false)
                      .reduce((sum, r) => sum + getMonthlyEquivalentUSD(r), 0),
                    currentCurrency,
                    { showCents: false }
                  )}
                  /mo scheduled
                </p>
              </div>
              <Link
                to="/expenses?tab=recurring"
                className="text-xs font-semibold text-[#006948] hover:text-[#00855d] hover:underline whitespace-nowrap"
              >
                Manage All
              </Link>
            </div>

            {recurringExpenses.filter((r) => r.active !== false).length > 0 ? (
              <div className="p-5 space-y-3.5 flex-1">
                {[...recurringExpenses]
                  .filter((r) => r.active !== false)
                  .sort((a, b) =>
                    (a.nextRunDate || "").localeCompare(b.nextRunDate || "")
                  )
                  .slice(0, 4)
                  .map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-[#eff4ff]/40"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0b1c30] truncate">
                          {rule.description}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
                          {rule.frequency} · Next: {rule.nextRunDate}
                        </p>
                      </div>
                      <span className="text-xs font-bold font-mono tabular-nums text-[#006948] shrink-0">
                        {formatCurrency(rule.amountUSD, currentCurrency, {
                          showCents: false,
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500 flex-1 flex flex-col items-center justify-center">
                <Repeat className="w-8 h-8 text-slate-300 mb-2" />
                <p>No active recurring bills.</p>
                <Link
                  to="/expenses?tab=recurring"
                  className="mt-1 text-xs font-semibold text-[#006948] hover:underline"
                >
                  Schedule a bill
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddExpense={handleQuickAddExpense}
        currentCurrency={currentCurrency}
        expenses={expenses}
        budgets={budgets}
        alertThreshold={alertThreshold}
      />
    </div>
  );
};

export default Dashboard;
