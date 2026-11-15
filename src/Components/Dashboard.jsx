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
import { Plus, Target, Wallet, CheckCircle2, FileSpreadsheet } from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import { exportExpensesAndAnalyticsCSV } from "../utils/exportCsv";

const CATEGORY_COLORS = {
  Food: "#1e3a8a",
  Utilities: "#0d9488",
  Transport: "#2563eb",
  Healthcare: "#6366f1",
  Entertainment: "#0284c7",
  Shopping: "#4f46e5",
  Housing: "#334155",
};

const FALLBACK_COLORS = [
  "#1e3a8a",
  "#0d9488",
  "#2563eb",
  "#6366f1",
  "#0284c7",
  "#475569",
  "#059669",
  "#4338ca",
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

function BarChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce(
    (sum, entry) => sum + (Number(entry.value) || 0),
    0
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 text-xs min-w-[190px]">
      <p className="font-semibold text-slate-900 mb-2.5">
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
            <span className="font-mono tabular-nums font-medium text-slate-900">
              ${Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between font-semibold text-slate-900">
        <span>Monthly Total</span>
        <span className="font-mono tabular-nums">
          ${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload, totalExpenses }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const value = Number(item.value) || 0;
  const share =
    totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.payload?.color }}
        />
        <span>{item.name}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-slate-600 font-mono tabular-nums">
        <span className="font-semibold text-slate-900">
          ${value.toLocaleString()}
        </span>
        <span aria-hidden="true">·</span>
        <span>{share}%</span>
      </div>
    </div>
  );
}

const Dashboard = ({ expenses = [], budgets = [], onAddExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartMode, setChartMode] = useState("stacked");
  const [toastMessage, setToastMessage] = useState("");

  const {
    totalExpenses,
    categoryTotals,
    categoriesList,
    monthlyCategoryData,
    availableMonths,
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
        monthMap.set(monthKey, { month: monthKey });
      }
      const row = monthMap.get(monthKey);
      row[category] = (row[category] || 0) + amount;
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

    return {
      totalExpenses: total,
      categoryTotals: catEntries,
      categoriesList: categories,
      monthlyCategoryData: monthlyRows,
      availableMonths: [...sortedMonths].reverse(),
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
      `Added $${newExpense.amount.toFixed(2)} under ${newExpense.category}`
    );
  };

  const handleExportCSV = () => {
    exportExpensesAndAnalyticsCSV(expenses, budgets, activeBudgetMonth);
    showToast("Expense history and analytics exported to CSV!");
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Overview of your spending trends, category shares, and monthly
              budget progress
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add Expense</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Export CSV Report</span>
            </button>
            <Link
              to="/budget"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <Wallet className="w-4 h-4 text-slate-500" />
              <span>Budgets</span>
            </Link>
            <Link
              to="/goals"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <Target className="w-4 h-4 text-slate-500" />
              <span>Goals</span>
            </Link>
          </div>
        </div>

        {toastMessage && (
          <div
            role="status"
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs font-medium text-slate-500">Total Expenses</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
              ${totalExpenses.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Recorded across {availableMonths.length}{" "}
              {availableMonths.length === 1 ? "month" : "months"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs font-medium text-slate-500">
              Categories Tracked
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {categoriesList.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 truncate">
              {categoriesList.length > 0
                ? categoriesList.join(" · ")
                : "No categories yet"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs font-medium text-slate-500">
              Highest Category
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-900 font-mono tabular-nums">
              ${topCategory.total.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {topCategory.category} spending
            </p>
          </div>
        </div>

        {/* Modern Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recharts Bar Chart: Monthly Spending Trends by Category */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Monthly Spending Trends by Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly expenditure breakdown across active categories
                </p>
              </div>
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMode("stacked")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    chartMode === "stacked"
                      ? "bg-blue-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Stacked
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("grouped")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    chartMode === "grouped"
                      ? "bg-blue-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
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
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatShortMonth}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                      dy={6}
                    />
                    <YAxis
                      tickFormatter={(val) => `$${val}`}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      content={<BarChartTooltip />}
                      cursor={{ fill: "rgba(241, 245, 249, 0.8)" }}
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

          {/* Modern Recharts Donut Chart + Structured Category Breakdown */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Expenses by Category
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportional spend across active categories
              </p>
            </div>

            {categoryTotals.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div className="relative h-[220px] w-full">
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
                      >
                        {categoryTotals.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<DonutTooltip totalExpenses={totalExpenses} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Donut Metric */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-medium text-slate-500">
                      Total Spent
                    </span>
                    <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                      ${totalExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Clean Tabular Breakdown List */}
                <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
                  {categoryTotals.map((item) => {
                    const share =
                      totalExpenses > 0
                        ? Math.round((item.total / totalExpenses) * 100)
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
                          <span className="font-medium text-slate-700 truncate">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                          <span className="text-slate-400">{share}%</span>
                          <span className="font-semibold text-slate-900 w-16 text-right">
                            ${item.total.toLocaleString()}
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

        {/* Monthly Budget Progress Section */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Monthly Budget Progress
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track category spending against your monthly limits
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {availableMonths.length > 0 && (
                <select
                  aria-label="Select month for budget progress"
                  value={activeBudgetMonth}
                  onChange={(e) => setSelectedBudgetMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="text-xs font-semibold text-blue-800 hover:text-blue-900 hover:underline whitespace-nowrap"
              >
                Manage Budgets
              </Link>
            </div>
          </div>

          {budgets.length > 0 ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {budgets.map((budget) => {
                const limit = parseFloat(budget.budgetAmount) || 0;
                const spent =
                  monthlySpendByCategory.get(
                    budget.category.trim().toLowerCase()
                  ) || 0;
                const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                const barWidth = Math.min(pct, 100);
                const remaining = limit - spent;

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
                        textClass: "text-emerald-700",
                        barClass: "bg-emerald-600",
                      };

                return (
                  <div
                    key={budget.category}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/40"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {budget.category}
                      </span>
                      <span className={`text-xs font-medium ${status.textClass}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                        ${spent.toFixed(0)}
                        <span className="text-xs font-normal text-slate-500">
                          {" "}
                          / ${limit.toFixed(0)}
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
                      {remaining >= 0
                        ? `$${remaining.toFixed(2)} remaining`
                        : `$${Math.abs(remaining).toFixed(2)} over limit`}
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
                className="font-semibold text-blue-800 hover:underline"
              >
                Set your first category limit
              </Link>
              .
            </div>
          )}
        </section>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddExpense={handleQuickAddExpense}
      />
    </div>
  );
};

export default Dashboard;
