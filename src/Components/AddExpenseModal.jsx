import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

const PRESET_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Shopping",
  "Housing",
];

function AddExpenseModal({ isOpen, onClose, onAddExpense }) {
  const today = new Date().toISOString().split("T")[0];
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState("Food");
  const [customCategory, setCustomCategory] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("Food");
    setCustomCategory("");
    setNote("");
    setError("");
  }, [isOpen]);

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
    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
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

    onAddExpense({
      amount: numericAmount,
      date,
      category: resolvedCategory,
      note: note.trim(),
      description: note.trim() || resolvedCategory,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
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
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Quick Add Expense
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record a new transaction to update your spending charts
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="px-3.5 py-2.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="modal-expense-amount"
                className="block text-sm font-medium text-slate-700"
              >
                Amount ($)
              </label>
              <input
                id="modal-expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                required
                className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
              />
            </div>

            <div>
              <label
                htmlFor="modal-expense-date"
                className="block text-sm font-medium text-slate-700"
              >
                Date
              </label>
              <input
                id="modal-expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-expense-category"
              className="block text-sm font-medium text-slate-700"
            >
              Category
            </label>
            <select
              id="modal-expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
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
                className="block text-sm font-medium text-slate-700"
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
                className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="modal-expense-note"
              className="block text-sm font-medium text-slate-700"
            >
              Note
            </label>
            <textarea
              id="modal-expense-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional description or memo (e.g. Grocery run, Metro pass)"
              className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddExpenseModal;
