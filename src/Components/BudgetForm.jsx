import React, { useState, useMemo } from "react";
import { Plus, CheckCircle2, Wallet, Pencil, Trash2 } from "lucide-react";
import {
  CURRENCIES,
  STREAMS,
  convertAmount,
  formatCurrency,
  getCategoryStream,
  toUSD,
} from "../utils/currency";

const CATEGORY_SUGGESTIONS = [
  "Food",
  "Utilities",
  "Transport",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Housing",
];

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(dateObj.getTime())) return monthKey;
  return dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function BudgetForm({
  budgets: propBudgets,
  expenses = [],
  onSaveBudget,
  onDeleteBudget,
  currentCurrency = "USD",
}) {
  const [localBudgets, setLocalBudgets] = useState([]);
  const budgets = propBudgets !== undefined ? propBudgets : localBudgets;

  const [category, setCategory] = useState("");
  const [stream, setStream] = useState("Essential Needs");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [feedback, setFeedback] = useState("");

  const currencySymbol = CURRENCIES[currentCurrency]?.symbol || "$";

  const availableMonths = useMemo(() => {
    const months = new Set(
      expenses.map((e) => (e.date || "").slice(0, 7)).filter(Boolean)
    );
    if (months.size === 0) {
      months.add(new Date().toISOString().slice(0, 7));
    }
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const [selectedMonth, setSelectedMonth] = useState(() => availableMonths[0]);

  const activeMonth = availableMonths.includes(selectedMonth)
    ? selectedMonth
    : availableMonths[0];

  const monthlySpendByCategory = useMemo(() => {
    const map = new Map();
    expenses.forEach((item) => {
      const monthKey = (item.date || "").slice(0, 7);
      if (monthKey === activeMonth) {
        const key = (item.category || "Other").trim().toLowerCase();
        map.set(key, (map.get(key) || 0) + (parseFloat(item.amount) || 0));
      }
    });
    return map;
  }, [expenses, activeMonth]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedCategory = category.trim();
    const numericInput = parseFloat(budgetAmount);
    if (!trimmedCategory || Number.isNaN(numericInput) || numericInput <= 0) {
      return;
    }

    const amountUSD = Number(toUSD(numericInput, currentCurrency).toFixed(2));

    if (onSaveBudget) {
      onSaveBudget({
        category: trimmedCategory,
        budgetAmount: amountUSD,
        stream,
      });
    } else {
      setLocalBudgets((prev) => {
        const idx = prev.findIndex(
          (b) => b.category.toLowerCase() === trimmedCategory.toLowerCase()
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            category: trimmedCategory,
            budgetAmount: amountUSD,
            stream,
          };
          return next;
        }
        return [
          ...prev,
          { category: trimmedCategory, budgetAmount: amountUSD, stream },
        ];
      });
    }

    setCategory("");
    setStream("Essential Needs");
    setBudgetAmount("");
    setFeedback(`Monthly budget for ${trimmedCategory} saved!`);
  };

  const handleEdit = (budget) => {
    setCategory(budget.category);
    setStream(getCategoryStream(budget.category, budget.stream));
    const converted = convertAmount(
      parseFloat(budget.budgetAmount) || 0,
      currentCurrency
    );
    setBudgetAmount(
      currentCurrency === "JPY"
        ? String(Math.round(converted))
        : converted.toFixed(2)
    );
    setFeedback("");
  };

  const handleDelete = (cat) => {
    if (onDeleteBudget) {
      onDeleteBudget(cat);
    } else {
      setLocalBudgets((prev) =>
        prev.filter((b) => b.category.toLowerCase() !== cat.toLowerCase())
      );
    }
    setFeedback(`Removed budget limit for ${cat}.`);
  };

  const totalBudgetUSD = budgets.reduce(
    (sum, item) => sum + (parseFloat(item.budgetAmount) || 0),
    0
  );

  const totalSpentInBudgetedCategoriesUSD = budgets.reduce((sum, item) => {
    const key = item.category.trim().toLowerCase();
    return sum + (monthlySpendByCategory.get(key) || 0);
  }, 0);

  return (
    <div className="flex-1 bg-[#f8f9ff] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
              Monthly Budgets
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Define monthly spending limits by category and stream in{" "}
              {currentCurrency}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label
              htmlFor="budget-month-select"
              className="text-xs font-medium text-slate-600"
            >
              Viewing month:
            </label>
            <select
              id="budget-month-select"
              value={activeMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
            >
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthLabel(monthKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-emerald-50 text-[#006948] border border-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#0b1c30] mb-1">
              Set Category Limit
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Add a new category limit or update an existing monthly cap
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="budget-category"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  Category
                </label>
                <input
                  id="budget-category"
                  type="text"
                  list="budget-category-suggestions"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setStream(getCategoryStream(e.target.value));
                  }}
                  placeholder="e.g. Food, Utilities, Transport"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                  required
                />
                <datalist id="budget-category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label
                  htmlFor="budget-stream"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  Allocation Stream
                </label>
                <select
                  id="budget-stream"
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                >
                  {STREAMS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="budget-amount"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  Monthly Limit ({currencySymbol} {currentCurrency})
                </label>
                <input
                  id="budget-amount"
                  type="number"
                  step={currentCurrency === "JPY" ? "1" : "0.01"}
                  min="1"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#006948] hover:bg-[#00855d] text-white text-sm font-semibold rounded-lg transition-colors duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Monthly Budget</span>
              </button>
            </form>
          </div>

          {/* Budgets Progress Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1c30]">
                  Category Budget Progress
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatMonthLabel(activeMonth)} · {budgets.length}{" "}
                  {budgets.length === 1 ? "category" : "categories"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500">Total Spent vs Limit</p>
                <p className="text-sm font-semibold font-mono tabular-nums text-[#0b1c30]">
                  {formatCurrency(
                    totalSpentInBudgetedCategoriesUSD,
                    currentCurrency
                  )}{" "}
                  <span className="text-slate-400 font-normal">
                    / {formatCurrency(totalBudgetUSD, currentCurrency)}
                  </span>
                </p>
              </div>
            </div>

            {budgets.length > 0 ? (
              <div className="divide-y divide-slate-200">
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
                      className="px-6 py-4 hover:bg-[#eff4ff]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="text-sm font-semibold text-[#0b1c30] truncate">
                            {budget.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            · {getCategoryStream(budget.category, budget.stream)}
                          </span>
                          <span
                            className={`text-xs font-medium ${status.textClass}`}
                          >
                            · {status.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-mono tabular-nums text-[#0b1c30] font-semibold">
                            {formatCurrency(spentUSD, currentCurrency, {
                              showCents: false,
                            })}
                            <span className="text-slate-400 font-normal">
                              {" "}
                              /{" "}
                              {formatCurrency(limitUSD, currentCurrency, {
                                showCents: false,
                              })}
                            </span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(budget)}
                              aria-label={`Edit ${budget.category} budget`}
                              className="p-1.5 rounded-md text-slate-400 hover:text-[#006948] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(budget.category)}
                              aria-label={`Delete ${budget.category} budget`}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div
                        className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={Math.min(pct, 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${budget.category} monthly budget progress`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${status.barClass}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono tabular-nums">{pct}% used</span>
                        <span className="font-mono tabular-nums">
                          {remainingUSD >= 0
                            ? `${formatCurrency(
                                remainingUSD,
                                currentCurrency
                              )} remaining`
                            : `${formatCurrency(
                                Math.abs(remainingUSD),
                                currentCurrency
                              )} over limit`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-[#0b1c30]">
                  No budgets added yet.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Create your first category budget using the form on the left.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetForm;
