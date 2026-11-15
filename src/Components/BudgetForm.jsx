import React, { useState, useMemo } from "react";
import {
  Plus,
  CheckCircle2,
  Wallet,
  Pencil,
  Trash2,
  Sparkles,
  RotateCcw,
  Globe2,
  X,
} from "lucide-react";
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
  onCurrencyChange,
  incomeConfig,
  apyRate = 4.85,
}) {
  const [localBudgets, setLocalBudgets] = useState([]);
  const budgets = propBudgets !== undefined ? propBudgets : localBudgets;

  const [category, setCategory] = useState("");
  const [stream, setStream] = useState("Essential Needs");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [feedback, setFeedback] = useState("");

  // MintVault 3-Stream Breakdown & What-If Simulator states
  const [streamFilter, setStreamFilter] = useState("all");
  const [showOriginalFX, setShowOriginalFX] = useState(false);
  const [simTargetUSD, setSimTargetUSD] = useState(120);
  const [ruleLocked, setRuleLocked] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatStream, setNewCatStream] = useState("Essential Needs");
  const [newCatBudget, setNewCatBudget] = useState("150");

  const currencySymbol = CURRENCIES[currentCurrency]?.symbol || "$";
  const monthlyIncomeUSD = incomeConfig?.monthlyIncomeUSD || 6500;
  const split = incomeConfig?.split || { needs: 50, wants: 30, wealth: 20 };

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

  // 3-Stream Breakdown metrics for the active month
  const streamCategories = useMemo(() => {
    const seen = new Set();
    const rows = [];

    budgets.forEach((b) => {
      const name = b.category.trim();
      const key = name.toLowerCase();
      seen.add(key);
      rows.push({
        name,
        stream: getCategoryStream(name, b.stream),
        projected: parseFloat(b.budgetAmount) || 0,
        actual: monthlySpendByCategory.get(key) || 0,
      });
    });

    monthlySpendByCategory.forEach((spentVal, key) => {
      if (!seen.has(key)) {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        rows.push({
          name: label,
          stream: getCategoryStream(label),
          projected: spentVal,
          actual: spentVal,
        });
      }
    });

    return rows;
  }, [budgets, monthlySpendByCategory]);

  const filteredStreamRows =
    streamFilter === "all"
      ? streamCategories
      : streamCategories.filter((r) => r.stream === streamFilter);

  const needsCapUSD = (monthlyIncomeUSD * split.needs) / 100;
  const wantsCapUSD = (monthlyIncomeUSD * split.wants) / 100;
  const wealthCapUSD = (monthlyIncomeUSD * split.wealth) / 100;

  const streamSummary = useMemo(() => {
    const targets = {
      "Essential Needs": needsCapUSD,
      "Lifestyle & Wants": wantsCapUSD,
      "Wealth Building": wealthCapUSD,
    };
    return STREAMS.map((st) => {
      const items = streamCategories.filter((r) => r.stream === st);
      const projected = items.reduce((s, r) => s + r.projected, 0);
      const actual = items.reduce((s, r) => s + r.actual, 0);
      const ruleCap = targets[st] || 0;
      return { stream: st, items, projected, actual, ruleCap };
    });
  }, [streamCategories, needsCapUSD, wantsCapUSD, wealthCapUSD]);

  const totalActualOutUSD = streamCategories.reduce(
    (s, r) => s + r.actual,
    0
  );
  const safeToSpendUSD = Math.max(0, monthlyIncomeUSD - totalActualOutUSD);

  // What-If Lifestyle Spend Simulator
  const currentWantsActual =
    streamSummary.find((s) => s.stream === "Lifestyle & Wants")?.actual || 150;
  const monthlyFreedUSD = Math.max(0, currentWantsActual - simTargetUSD);
  const annualFreedUSD = monthlyFreedUSD * 12;
  const monthlyRate = apyRate / 100 / 12;
  const compound10YrUSD =
    monthlyRate > 0
      ? monthlyFreedUSD * ((Math.pow(1 + monthlyRate, 120) - 1) / monthlyRate)
      : annualFreedUSD * 10;

  const handleLockSimulationCap = () => {
    if (onSaveBudget) {
      onSaveBudget({
        category: "Entertainment",
        budgetAmount: simTargetUSD,
        stream: "Lifestyle & Wants",
      });
    }
    setRuleLocked(true);
    setFeedback(
      `Locked Lifestyle cap: Entertainment budget updated to ${formatCurrency(
        simTargetUSD,
        currentCurrency,
        { showCents: false }
      )}/mo!`
    );
  };

  const handleCreateStreamCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    const numeric = parseFloat(newCatBudget);
    if (!trimmed || Number.isNaN(numeric) || numeric <= 0) return;
    const budgetUSD = Number(toUSD(numeric, currentCurrency).toFixed(2));
    if (onSaveBudget) {
      onSaveBudget({
        category: trimmed,
        budgetAmount: budgetUSD,
        stream: newCatStream,
      });
    }
    setNewCatName("");
    setNewCatBudget("150");
    setIsCatModalOpen(false);
    setFeedback(`Added "${trimmed}" under ${newCatStream}!`);
  };

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
              Budgets &amp; 3-Stream Breakdown
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Compare 3-stream rule caps against actual expenses, simulate
              savings impact, and manage monthly category limits in{" "}
              {currentCurrency}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {onCurrencyChange && (
              <select
                aria-label="Select base currency"
                value={currentCurrency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="px-3 py-2 text-xs font-semibold text-[#0b1c30] bg-[#eff4ff] border border-[#006948]/25 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] cursor-pointer"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            )}

            <select
              aria-label="Viewing month"
              value={activeMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-[#0b1c30] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
            >
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthLabel(monthKey)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowOriginalFX((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showOriginalFX
                  ? "bg-[#006948] text-white border-[#006948]"
                  : "bg-white text-[#0b1c30] border-slate-200 hover:bg-[#eff4ff]"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>FX Pair Visible</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCatModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Category</span>
            </button>
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

        {/* 4 Inflow/Outflow Cash-Flow Cards (Always Visible) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Total Inflow</p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {formatCurrency(monthlyIncomeUSD, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-[#006948]">Monthly net salary</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Tracked Outflows ({formatMonthLabel(activeMonth)})
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {formatCurrency(totalActualOutUSD, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              {monthlyIncomeUSD > 0
                ? `${((totalActualOutUSD / monthlyIncomeUSD) * 100).toFixed(
                    1
                  )}% of monthly income`
                : "0%"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Safe-to-Spend Residual
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#006948]">
              {formatCurrency(safeToSpendUSD, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Available unspent liquidity
            </p>
          </div>

          <div className="bg-[#eff4ff] border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-600">
              Active Budgeted Categories
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {streamCategories.length}
            </p>
            <p className="mt-1 text-xs text-[#006948] font-semibold">
              Synced across 3 streams
            </p>
          </div>
        </div>

        {/* 3 Pillar Rule Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {streamSummary.map((item) => {
            const cap = Math.max(item.projected, item.ruleCap);
            const pctOfIncome =
              monthlyIncomeUSD > 0
                ? ((item.actual / monthlyIncomeUSD) * 100).toFixed(1)
                : "0.0";
            const fillPct =
              cap > 0
                ? Math.min(100, Math.round((item.actual / cap) * 100))
                : 0;
            const buffer = cap - item.actual;

            return (
              <div
                key={item.stream}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[#0b1c30]">
                    {item.stream}
                  </h2>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#006948]">
                    {pctOfIncome}% Actual
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono tabular-nums text-[#0b1c30]">
                    {formatCurrency(item.actual, currentCurrency, {
                      showCents: false,
                    })}
                  </span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Rule Cap:{" "}
                    {formatCurrency(item.ruleCap, currentCurrency, {
                      showCents: false,
                    })}
                  </span>
                </div>

                <div className="w-full h-2 bg-[#eff4ff] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#006948] rounded-full transition-all duration-300"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 font-mono tabular-nums">
                  <span>
                    {buffer >= 0
                      ? `${formatCurrency(buffer, currentCurrency, {
                          showCents: false,
                        })} buffer left`
                      : `${formatCurrency(Math.abs(buffer), currentCurrency, {
                          showCents: false,
                        })} over`}
                  </span>
                  <span className="font-sans font-semibold text-[#006948]">
                    {buffer >= 0 ? "Optimal" : "Over Cap"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stream Ledger Breakdown + What-If Expense Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#0b1c30]">
                  Stream Ledger Breakdown ({formatMonthLabel(activeMonth)})
                </h2>
                <p className="text-xs text-slate-500">
                  Compare category budget caps vs. actual recorded expenses
                </p>
              </div>

              <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200">
                {["all", ...STREAMS].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStreamFilter(st)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      streamFilter === st
                        ? "bg-[#0b1c30] text-white"
                        : "text-slate-600 hover:text-[#0b1c30]"
                    }`}
                  >
                    {st === "all" ? "All" : st.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#eff4ff]/70 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Stream</th>
                    <th className="px-5 py-3 text-right">Budget Cap</th>
                    <th className="px-5 py-3 text-right">Actual</th>
                    <th className="px-5 py-3 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredStreamRows.map((row) => {
                    const diff = row.projected - row.actual;
                    return (
                      <tr
                        key={row.name}
                        className="hover:bg-[#eff4ff]/40 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-[#0b1c30]">
                          <span>{row.name}</span>
                          {showOriginalFX && (
                            <span className="block text-[11px] font-mono text-[#006948] mt-0.5">
                              USD Base: {formatCurrency(row.actual, "USD")} ·{" "}
                              {currentCurrency === "USD"
                                ? `EUR Eq: ${formatCurrency(row.actual, "EUR")}`
                                : `Rate: 1 USD = ${CURRENCIES[currentCurrency]?.rateAgainstUSD} ${currentCurrency}`}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {row.stream}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-700">
                          {formatCurrency(row.projected, currentCurrency)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums font-semibold text-[#0b1c30]">
                          {formatCurrency(row.actual, currentCurrency)}
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right font-mono tabular-nums font-semibold ${
                            diff >= 0 ? "text-[#006948]" : "text-rose-600"
                          }`}
                        >
                          {diff >= 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(diff), currentCurrency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* What-If Expense Simulator */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#006948]">
              <Sparkles className="w-4 h-4" />
              <h2 className="text-base font-bold text-[#0b1c30]">
                What-If Expense Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Adjust your monthly Lifestyle &amp; Wants target to preview
              immediate liquidity freed and {apyRate}% compounded wealth over 10
              years.
            </p>

            <div className="space-y-2 p-3.5 rounded-xl bg-[#eff4ff]">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#0b1c30]">Discretionary Target</span>
                <span className="font-mono tabular-nums text-[#006948]">
                  {formatCurrency(simTargetUSD, currentCurrency, {
                    showCents: false,
                  })}
                  /mo
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(400, Math.round(currentWantsActual * 1.5))}
                step="10"
                value={simTargetUSD}
                onChange={(e) => {
                  setSimTargetUSD(Number(e.target.value));
                  setRuleLocked(false);
                }}
                className="w-full accent-[#006948] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#eff4ff]">
                <span className="text-slate-500 block">Monthly Freed</span>
                <span className="mt-1 block text-base font-bold font-mono tabular-nums text-[#006948]">
                  +
                  {formatCurrency(monthlyFreedUSD, currentCurrency, {
                    showCents: false,
                  })}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#eff4ff]">
                <span className="text-slate-500 block">Annual Freed</span>
                <span className="mt-1 block text-base font-bold font-mono tabular-nums text-[#0b1c30]">
                  +
                  {formatCurrency(annualFreedUSD, currentCurrency, {
                    showCents: false,
                  })}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1c30] text-white space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">10-Year Compounded</span>
                <span className="font-mono tabular-nums font-bold text-[#85f8c4]">
                  +
                  {formatCurrency(compound10YrUSD, currentCurrency, {
                    showCents: false,
                  })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Assumes surplus swept to {apyRate}% APY savings vaults
              </p>
            </div>

            <button
              type="button"
              onClick={handleLockSimulationCap}
              className={`w-full py-2.5 rounded-lg text-white text-xs font-semibold transition-colors cursor-pointer ${
                ruleLocked
                  ? "bg-[#00855d]"
                  : "bg-[#006948] hover:bg-[#00855d]"
              }`}
            >
              {ruleLocked
                ? "Allocation Rule Locked & Synced!"
                : "Lock Allocation Rule to Budgets"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSimTargetUSD(120);
                setRuleLocked(false);
                setFeedback("Simulator reset to defaults.");
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b1c30] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Simulator Defaults</span>
            </button>
          </div>
        </div>

        {/* Category Budget Limits Form + Progress Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

      {/* Add Stream Category Modal */}
      {isCatModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/55 backdrop-blur-xs"
          onClick={() => setIsCatModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Add Stream Category Budget
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-[#0b1c30] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateStreamCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Category Label
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Subscriptions, Pet Care"
                  required
                  className="w-full px-3 py-2 text-sm text-[#0b1c30] bg-[#eff4ff]/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Bucket Stream
                </label>
                <select
                  value={newCatStream}
                  onChange={(e) => setNewCatStream(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-[#0b1c30] bg-[#eff4ff]/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                >
                  {STREAMS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Monthly Cap ({currencySymbol} {currentCurrency})
                </label>
                <input
                  type="number"
                  min="1"
                  step={currentCurrency === "JPY" ? "1" : "0.01"}
                  value={newCatBudget}
                  onChange={(e) => setNewCatBudget(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums text-[#0b1c30] bg-[#eff4ff]/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#eff4ff] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetForm;
