import React, { useState, useMemo } from "react";
import {
  CalendarClock,
  Plus,
  Pause,
  Play,
  Trash2,
  Zap,
  CheckCircle2,
  Repeat,
} from "lucide-react";
import {
  CURRENCIES,
  formatCurrency,
  getCategoryStream,
  toUSD,
} from "../utils/currency";
import {
  FREQUENCIES,
  getMonthlyEquivalentUSD,
  getTodayISO,
} from "../utils/recurringExpenses";

const PRESET_CATEGORIES = [
  "Utilities",
  "Housing",
  "Food",
  "Transport",
  "Entertainment",
  "Healthcare",
  "Shopping",
];

function RecurringExpensesPanel({
  recurringExpenses = [],
  onAddRecurring,
  onToggleRecurring,
  onDeleteRecurring,
  onRunDueNow,
  onTriggerSingleNow,
  currentCurrency = "USD",
}) {
  const today = getTodayISO();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Utilities");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(today);
  const [feedback, setFeedback] = useState("");

  const currencySymbol = CURRENCIES[currentCurrency]?.symbol || "$";

  const activeRules = useMemo(
    () => recurringExpenses.filter((r) => r.active !== false),
    [recurringExpenses]
  );

  const monthlyRunRateUSD = useMemo(
    () =>
      activeRules.reduce((sum, r) => sum + getMonthlyEquivalentUSD(r), 0),
    [activeRules]
  );

  const dueCount = useMemo(
    () =>
      activeRules.filter((r) => (r.nextRunDate || "") <= today).length,
    [activeRules, today]
  );

  const nextUpcoming = useMemo(() => {
    const sorted = [...activeRules].sort((a, b) =>
      (a.nextRunDate || "").localeCompare(b.nextRunDate || "")
    );
    return sorted[0] || null;
  }, [activeRules]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericInput = parseFloat(amount);
    if (!description.trim() || Number.isNaN(numericInput) || numericInput <= 0) {
      return;
    }

    const resolvedCategory =
      category === "__custom__" ? customCategory.trim() || "Utilities" : category;
    const amountUSD = Number(toUSD(numericInput, currentCurrency).toFixed(2));
    const chosenStart = startDate || today;

    const newRule = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: description.trim(),
      category: resolvedCategory,
      amountUSD,
      frequency,
      startDate: chosenStart,
      nextRunDate: chosenStart,
      lastProcessedDate: null,
      active: true,
    };

    onAddRecurring && onAddRecurring(newRule);

    setFeedback(
      chosenStart <= today
        ? `Scheduled "${newRule.description}" (${frequency}) and automatically added due entry to your Expense Ledger.`
        : `Scheduled "${newRule.description}" (${frequency}) starting ${chosenStart}.`
    );
    setDescription("");
    setAmount("");
    setCustomCategory("");
    setStartDate(today);
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            Active Recurring Bills
          </p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
            {activeRules.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {recurringExpenses.length - activeRules.length} paused schedules
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            Estimated Monthly Run-Rate
          </p>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#006948]">
            {formatCurrency(monthlyRunRateUSD, currentCurrency, {
              showCents: false,
            })}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Normalized across weekly, monthly &amp; yearly bills
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">
              Next Scheduled Auto-Entry
            </p>
            <p className="mt-1.5 text-base font-bold text-[#0b1c30] truncate">
              {nextUpcoming ? nextUpcoming.description : "No active schedules"}
            </p>
            <p className="mt-0.5 text-xs font-mono tabular-nums text-slate-500">
              {nextUpcoming
                ? `${nextUpcoming.nextRunDate} · ${formatCurrency(
                    nextUpcoming.amountUSD,
                    currentCurrency,
                    { showCents: false }
                  )}`
                : "Create a bill schedule below"}
            </p>
          </div>
          {dueCount > 0 && onRunDueNow && (
            <button
              type="button"
              onClick={() => {
                onRunDueNow();
                setFeedback("Processed all due recurring bills.");
              }}
              className="px-3 py-2 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg shrink-0 cursor-pointer"
            >
              Run Due ({dueCount})
            </button>
          )}
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
        {/* Create Recurring Schedule Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#006948] flex items-center justify-center shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0b1c30]">
                Schedule Recurring Bill
              </h2>
              <p className="text-xs text-slate-500">
                Auto-adds to your expense tracker on each billing date
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="rec-description"
                className="block text-sm font-medium text-[#0b1c30]"
              >
                Bill / Subscription Name
              </label>
              <input
                id="rec-description"
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Apartment Rent, Internet, Gym"
                className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rec-category"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  Category
                </label>
                <select
                  id="rec-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">Other / Custom</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="rec-amount"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  Amount ({currencySymbol} {currentCurrency})
                </label>
                <input
                  id="rec-amount"
                  type="number"
                  step={currentCurrency === "JPY" ? "1" : "0.01"}
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm font-mono tabular-nums text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>
            </div>

            {category === "__custom__" && (
              <div>
                <label
                  htmlFor="rec-custom-cat"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  Custom Category
                </label>
                <input
                  id="rec-custom-cat"
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category name"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rec-frequency"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  Frequency
                </label>
                <select
                  id="rec-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label} — {f.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="rec-start-date"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  First / Next Bill Date
                </label>
                <input
                  id="rec-start-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#006948] hover:bg-[#00855d] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Recurring Schedule</span>
            </button>
          </form>
        </div>

        {/* Scheduled Recurring Bills List */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0b1c30]">
                Scheduled Bills &amp; Auto-Add Rules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Due bills are automatically posted to your Expense Ledger
              </p>
            </div>
          </div>

          {recurringExpenses.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {recurringExpenses.map((rule) => {
                const isActive = rule.active !== false;
                return (
                  <div
                    key={rule.id}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
                      isActive ? "bg-white" : "bg-slate-50/75 opacity-75"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#0b1c30]">
                          {rule.description}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#eff4ff] text-[#0b1c30] capitalize">
                          {rule.frequency}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            isActive
                              ? "bg-emerald-50 text-[#006948]"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isActive ? "Active" : "Paused"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        {rule.category} ({getCategoryStream(rule.category)}) ·
                        Next bill:{" "}
                        <span className="font-mono tabular-nums font-medium text-[#0b1c30]">
                          {rule.nextRunDate}
                        </span>
                        {rule.lastProcessedDate && (
                          <span className="ml-2 text-slate-400">
                            · Last posted: {rule.lastProcessedDate}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-base font-bold font-mono tabular-nums text-[#0b1c30]">
                        {formatCurrency(rule.amountUSD, currentCurrency)}
                      </span>

                      <div className="flex items-center gap-1">
                        {onTriggerSingleNow && (
                          <button
                            type="button"
                            onClick={() => {
                              onTriggerSingleNow(rule);
                              setFeedback(
                                `Posted "${rule.description}" to Expense Ledger for today and advanced next billing date.`
                              );
                            }}
                            title="Log this recurring bill now"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#006948] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg transition-colors cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Post Now</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onToggleRecurring && onToggleRecurring(rule.id)
                          }
                          aria-label={
                            isActive
                              ? `Pause ${rule.description}`
                              : `Resume ${rule.description}`
                          }
                          title={isActive ? "Pause schedule" : "Resume schedule"}
                          className="p-2 rounded-lg text-slate-500 hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                        >
                          {isActive ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteRecurring && onDeleteRecurring(rule.id);
                            setFeedback(
                              `Deleted recurring schedule "${rule.description}".`
                            );
                          }}
                          aria-label={`Delete ${rule.description}`}
                          title="Delete schedule"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-[#0b1c30]">
                No recurring bills scheduled yet.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Add a weekly, monthly, or yearly bill on the left to automate
                your expense tracking.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecurringExpensesPanel;
