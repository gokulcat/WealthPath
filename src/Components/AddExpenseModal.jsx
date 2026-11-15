import React, { useState, useEffect } from "react";
import { X, Plus, Save, AlertTriangle } from "lucide-react";
import {
  CURRENCIES,
  convertAmount,
  toUSD,
  getCurrencySymbol,
  formatCurrency,
} from "../utils/currency";
import { getMonthCategorySpendUSD } from "../utils/budgetAlerts";

const PRESET_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Shopping",
  "Housing",
];

function AddExpenseModal({
  isOpen,
  onClose,
  onAddExpense,
  onUpdateExpense,
  editingExpense = null,
  currentCurrency = "USD",
  expenses = [],
  budgets = [],
  alertThreshold = 80,
}) {
  const today = new Date().toISOString().split("T")[0];
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState("Food");
  const [customCategory, setCustomCategory] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const isEditing = Boolean(editingExpense);
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const currencyCode = CURRENCIES[currentCurrency]?.code || "USD";

  useEffect(() => {
    if (!isOpen) return;
    if (editingExpense) {
      const converted = convertAmount(
        parseFloat(editingExpense.amount) || 0,
        currentCurrency
      );
      setAmount(
        currentCurrency === "JPY"
          ? String(Math.round(converted))
          : converted.toFixed(2)
      );
      setDate(editingExpense.date || today);
      const cat = (editingExpense.category || "Food").trim();
      if (PRESET_CATEGORIES.includes(cat)) {
        setCategory(cat);
        setCustomCategory("");
      } else {
        setCategory("__custom__");
        setCustomCategory(cat);
      }
      setNote(editingExpense.note || editingExpense.description || "");
    } else {
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("Food");
      setCustomCategory("");
      setNote("");
    }
    setError("");
  }, [isOpen, editingExpense, currentCurrency, today]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const numericInput = parseFloat(amount);
    if (Number.isNaN(numericInput) || numericInput <= 0) {
      setError("Please enter an amount greater than 0.");
      return;
    }

    const resolvedCategory =
      category === "__custom__" ? customCategory.trim() : category;

    if (!resolvedCategory) {
      setError("Please enter a category name.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    const amountInUSD = Number(toUSD(numericInput, currentCurrency).toFixed(2));
    const payload = {
      amount: amountInUSD,
      date,
      category: resolvedCategory,
      note: note.trim(),
      description: note.trim() || resolvedCategory,
    };

    if (isEditing && onUpdateExpense) {
      onUpdateExpense(editingExpense, payload);
    } else if (onAddExpense) {
      onAddExpense(payload);
    }

    onClose();
  };

  const resolvedCatPreview =
    category === "__custom__" ? customCategory.trim() : category;
  const numericPreview = parseFloat(amount) || 0;
  const previewAmountUSD = toUSD(numericPreview, currentCurrency);
  const matchingBudget = budgets.find(
    (b) =>
      (b.category || "").trim().toLowerCase() ===
      resolvedCatPreview.trim().toLowerCase()
  );
  const previewMonthKey = (date || "").slice(0, 7);
  let liveBudgetPreview = null;
  if (matchingBudget && previewMonthKey && numericPreview > 0) {
    const limitUSD = parseFloat(matchingBudget.budgetAmount) || 0;
    if (limitUSD > 0) {
      const existingSpent = getMonthCategorySpendUSD(
        isEditing
          ? expenses.filter((item) => item !== editingExpense)
          : expenses,
        matchingBudget.category,
        previewMonthKey
      );
      const projectedSpent = existingSpent + previewAmountUSD;
      const projectedPct = Math.round((projectedSpent / limitUSD) * 100);
      if (projectedPct >= alertThreshold) {
        liveBudgetPreview = {
          category: matchingBudget.category,
          projectedPct,
          limitUSD,
          projectedSpent,
          isExceeded: projectedPct >= 100,
        };
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/55 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-expense-title"
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="quick-add-expense-title"
              className="text-xl font-bold tracking-tight text-[#0b1c30]"
            >
              {isEditing ? "Edit Expense" : "Quick Add Expense"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? "Update transaction details and recalculate analytics"
                : "Record a new transaction to update your spending charts"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="px-3.5 py-2.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="modal-expense-amount"
                className="block text-sm font-medium text-[#0b1c30]"
              >
                Amount ({currencySymbol} {currencyCode})
              </label>
              <input
                id="modal-expense-amount"
                type="number"
                step={currentCurrency === "JPY" ? "1" : "0.01"}
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                required
                className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
              />
            </div>

            <div>
              <label
                htmlFor="modal-expense-date"
                className="block text-sm font-medium text-[#0b1c30]"
              >
                Date
              </label>
              <input
                id="modal-expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-expense-category"
              className="block text-sm font-medium text-[#0b1c30]"
            >
              Category
            </label>
            <select
              id="modal-expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
            >
              {PRESET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__custom__">Other / Custom</option>
            </select>
          </div>

          {category === "__custom__" && (
            <div>
              <label
                htmlFor="modal-expense-custom-category"
                className="block text-sm font-medium text-[#0b1c30]"
              >
                Custom Category
              </label>
              <input
                id="modal-expense-custom-category"
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter category name"
                required
                className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="modal-expense-note"
              className="block text-sm font-medium text-[#0b1c30]"
            >
              Note
            </label>
            <textarea
              id="modal-expense-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional description or memo (e.g. Grocery run, Metro pass)"
              className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948] resize-none"
            />
          </div>

          {liveBudgetPreview && (
            <div
              role="status"
              className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg text-xs border ${
                liveBudgetPreview.isExceeded
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                This entry puts <strong>{liveBudgetPreview.category}</strong>{" "}
                at{" "}
                <strong className="font-mono tabular-nums">
                  {liveBudgetPreview.projectedPct}%
                </strong>{" "}
                (
                {formatCurrency(
                  liveBudgetPreview.projectedSpent,
                  currentCurrency,
                  { showCents: false }
                )}{" "}
                /{" "}
                {formatCurrency(liveBudgetPreview.limitUSD, currentCurrency, {
                  showCents: false,
                })}
                ) for {previewMonthKey}.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg transition-colors cursor-pointer"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Expense</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddExpenseModal;
