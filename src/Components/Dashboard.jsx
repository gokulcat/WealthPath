import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
} from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import AIFinancialInsightsCard from "./AIFinancialInsightsCard";
import { exportExpensesAndAnalyticsCSV } from "../utils/exportCsv";
import { convertAmount, formatCurrency } from "../utils/currency";

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
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 text-xs min-w-[195px]">
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
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

const Dashboard = ({
  expenses = [],
  budgets = [],
  goals = [],
  incomeConfig,
  onAddExpense,
  currentCurrency = "USD",
  alertThreshold = 80,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartMode, setChartMode] = useState("stacked");
  const [isDonutHovered, setIsDonutHovered] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const monthlyIncomeUSD = incomeConfig?.monthlyIncomeUSD || 6500;

  const {
    totalExpensesUSD,
    categoryTotals,
    categoriesList,
    monthlyCategoryData,
    availableMonths,
    latestMonthSpendUSD,
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
    const sortedMonths = Array.from(monthMap.keys()).sort();
    const monthlyRows = sortedMonths.map((monthKey) => {
      const row = { ...monthMap.get(monthKey) };
      categories.forEach((cat) => {
        if (row[cat] === undefined) row[cat] = 0;
      });
      return row;
    });

    const latestKey = sortedMonths[sortedMonths.length - 1];
    const latestSpend = latestKey ? monthMap.get(latestKey)?.__total || 0 : 0;

    return {
      totalExpensesUSD: total,
      categoryTotals: catEntries,
      categoriesList: categories,
      monthlyCategoryData: monthlyRows,
      availableMonths: [...sortedMonths].reverse(),
      latestMonthSpendUSD: latestSpend,
    };
  }, [expenses]);

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

  const latestSurplusUSD = monthlyIncomeUSD - latestMonthSpendUSD;

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
      currentCurrency
    );
    showToast(
      `Expense history and analytics exported to CSV (${currentCurrency})!`
    );
  };

  return (
    <div className="flex-1 bg-[#f8f9ff] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
              Financial Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Unified income cash flow, spending trends, budget limits, and
              savings vaults in {currentCurrency}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
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
              <span>Export CSV Report</span>
            </button>
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <Wallet className="w-4 h-4 text-[#006948]" />
              <span>Salary</span>
            </Link>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <TrendingUp className="w-4 h-4 text-[#006948]" />
              <span>Analytics</span>
            </Link>
            <Link
              to="/goals"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <Target className="w-4 h-4 text-[#006948]" />
              <span>Goals</span>
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
            <p className="mt-1 text-xs text-slate-500">
              Configured in Salary &amp; Plan
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
            <p className="mt-1 text-xs text-slate-500">
              Across {availableMonths.length}{" "}
              {availableMonths.length === 1 ? "month" : "months"} ·{" "}
              {categoriesList.length} categories
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
              {formatMonthLabel(activeBudgetMonth)} spend:{" "}
              {formatCurrency(latestMonthSpendUSD, currentCurrency, {
                showCents: false,
              })}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Highest Category
            </p>
            <p className="mt-1.5 text-2xl font-bold text-[#006948] font-mono tabular-nums">
              {formatCurrency(topCategory.total, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {topCategory.category} spending
            </p>
          </div>
        </div>

        {/* AI Financial Insights */}
        <AIFinancialInsightsCard
          expenses={expenses}
          budgets={budgets}
          goals={goals}
          incomeConfig={incomeConfig}
          currentCurrency={currentCurrency}
        />

        {/* Modern Recharts Spending Grid */}
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

        {/* Bottom Grid: Monthly Budget Progress + Active Savings Vaults */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Budget Progress */}
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1c30]">
                  Monthly Budget Progress
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category spending vs. monthly limits
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

          {/* Top Savings Vaults Summary */}
          <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1c30]">
                  Savings Vaults
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {goals.length} active targets
                </p>
              </div>
              <Link
                to="/goals"
                className="text-xs font-semibold text-[#006948] hover:text-[#00855d] hover:underline whitespace-nowrap"
              >
                Manage All
              </Link>
            </div>

            {goals.length > 0 ? (
              <div className="p-5 space-y-4 flex-1">
                {goals.slice(0, 4).map((vault, idx) => {
                  const targetUSD = parseFloat(vault.target_amount) || 0;
                  const savedUSD = parseFloat(vault.saved_amount) || 0;
                  const pct =
                    targetUSD > 0
                      ? Math.round((savedUSD / targetUSD) * 100)
                      : 0;
                  return (
                    <div key={`${vault.goal}-${idx}`} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-semibold text-[#0b1c30] truncate">
                          {vault.goal}
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-[#006948] shrink-0">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#006948] rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                        <span>{vault.targetDate || "Flexible"}</span>
                        <span>
                          {formatCurrency(savedUSD, currentCurrency, {
                            showCents: false,
                          })}{" "}
                          /{" "}
                          {formatCurrency(targetUSD, currentCurrency, {
                            showCents: false,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500 flex-1 flex flex-col items-center justify-center">
                <Target className="w-8 h-8 text-slate-300 mb-2" />
                <p>No savings vaults yet.</p>
                <Link
                  to="/goals"
                  className="mt-1 text-xs font-semibold text-[#006948] hover:underline"
                >
                  Create your first vault
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
