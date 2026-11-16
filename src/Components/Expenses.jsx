import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Download,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Search,
  Trash2,
  Pencil,
  Repeat,
  Calendar,
  X,
} from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import RecurringExpensesPanel from "./RecurringExpensesPanel";
import ExpenseCalendarView from "./ExpenseCalendarView";
import { exportExpensesAndAnalyticsCSV } from "../utils/exportCsv";
import {
  CURRENCIES,
  convertAmount,
  formatCurrency,
  getCategoryStream,
  toUSD,
} from "../utils/currency";

function ExpenseForm({
  expenses: propExpenses,
  budgets = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  recurringExpenses = [],
  onAddRecurring,
  onToggleRecurring,
  onDeleteRecurring,
  onRunDueNow,
  onTriggerSingleNow,
  currentCurrency = "USD",
  onCurrencyChange,
  alertThreshold = 80,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get("tab");
    if (t === "recurring") return "recurring";
    if (t === "calendar") return "calendar";
    return "ledger";
  });
  const [dateFilter, setDateFilter] = useState(
    () => searchParams.get("date") || ""
  );

  useEffect(() => {
    const t = searchParams.get("tab");
    const d = searchParams.get("date") || "";
    if (t === "recurring") {
      setActiveTab("recurring");
    } else if (t === "calendar") {
      setActiveTab("calendar");
    } else {
      setActiveTab("ledger");
    }
    if (d) {
      setDateFilter(d);
    }
  }, [searchParams]);

  const [localExpenses, setLocalExpenses] = useState([]);
  const expenses = propExpenses !== undefined ? propExpenses : localExpenses;

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const currencySymbol = CURRENCIES[currentCurrency]?.symbol || "$";

  const addExpenseRecord = (newExpense) => {
    if (onAddExpense) {
      onAddExpense(newExpense);
    } else {
      setLocalExpenses((prev) => [...prev, newExpense]);
    }
  };

  const updateExpenseRecord = (oldExpense, updatedExpense) => {
    if (onUpdateExpense) {
      onUpdateExpense(oldExpense, updatedExpense);
    } else {
      setLocalExpenses((prev) =>
        prev.map((item) => (item === oldExpense ? updatedExpense : item))
      );
    }
    setFeedback({
      type: "success",
      text: "Expense updated successfully!",
    });
  };

  const removeExpenseRecord = (expenseItem) => {
    if (onDeleteExpense) {
      onDeleteExpense(expenseItem);
    } else {
      setLocalExpenses((prev) => prev.filter((item) => item !== expenseItem));
    }
    setFeedback({
      type: "success",
      text: "Expense removed.",
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const numericInput = parseFloat(amount) || 0;
    const amountUSD = Number(toUSD(numericInput, currentCurrency).toFixed(2));
    const newExpense = {
      category: category.trim(),
      description: description.trim(),
      note: description.trim(),
      date,
      amount: amountUSD,
    };
    addExpenseRecord(newExpense);

    setCategory("");
    setDescription("");
    setDate("");
    setAmount("");

    setFeedback({
      type: "success",
      text: "Expense added successfully!",
    });
  };

  const handleModalAdd = (newExpense) => {
    addExpenseRecord(newExpense);
    setFeedback({
      type: "success",
      text: "Expense added successfully!",
    });
  };

  const exportToExcel = () => {
    if (expenses.length === 0) {
      setFeedback({
        type: "error",
        text: "No expenses to export!",
      });
      return;
    }

    const decimals = currentCurrency === "JPY" ? 0 : 2;
    const exportRows = expenses.map((item) => ({
      date: item.date,
      category: item.category,
      stream: getCategoryStream(item.category),
      description: item.note || item.description || "",
      currency: currentCurrency,
      amount: Number(
        convertAmount(parseFloat(item.amount) || 0, currentCurrency).toFixed(
          decimals
        )
      ),
      baseUSD: Number((parseFloat(item.amount) || 0).toFixed(2)),
    }));

    const budgetRows = budgets.map((b) => ({
      category: b.category,
      stream: getCategoryStream(b.category, b.stream),
      currency: currentCurrency,
      monthlyLimit: Number(
        convertAmount(parseFloat(b.budgetAmount) || 0, currentCurrency).toFixed(
          decimals
        )
      ),
      baseUSD: Number((parseFloat(b.budgetAmount) || 0).toFixed(2)),
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    if (budgetRows.length > 0) {
      const budgetSheet = XLSX.utils.json_to_sheet(budgetRows);
      XLSX.utils.book_append_sheet(workbook, budgetSheet, "Budgets");
    }
    XLSX.writeFile(
      workbook,
      `wealthwise-expenses-${currentCurrency.toLowerCase()}.xlsx`
    );
    setFeedback({
      type: "success",
      text: `Expenses exported to Excel (${currentCurrency}) successfully!`,
    });
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      setFeedback({
        type: "error",
        text: "No expenses to export!",
      });
      return;
    }
    exportExpensesAndAnalyticsCSV(expenses, budgets, "", currentCurrency);
    setFeedback({
      type: "success",
      text: `Expense history and analytics exported to CSV (${currentCurrency})!`,
    });
  };

  const categories = useMemo(() => {
    const unique = new Set(
      expenses.map((item) => (item.category || "Other").trim())
    );
    return Array.from(unique).sort();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...expenses]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .filter((item) => {
        const matchesDate =
          !dateFilter || (item.date || "").slice(0, 10) === dateFilter;
        const matchesCategory =
          categoryFilter === "all" ||
          (item.category || "").trim() === categoryFilter;
        const matchesQuery =
          !query ||
          (item.category || "").toLowerCase().includes(query) ||
          (item.note || item.description || "").toLowerCase().includes(query) ||
          (item.date || "").includes(query);
        return matchesDate && matchesCategory && matchesQuery;
      });
  }, [expenses, searchQuery, categoryFilter, dateFilter]);

  const filteredTotalUSD = filteredExpenses.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  return (
    <div className="flex-1 bg-[#f8f9ff] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
              Expense Ledger
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Log, edit, search, and export your transactions in{" "}
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
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-[#006948]" />
              <span>Quick Add Modal</span>
            </button>
            {expenses.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#006948]" />
                  <span>Export CSV Report</span>
                </button>
                <button
                  type="button"
                  onClick={exportToExcel}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Export to Excel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-[#006948] border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Section Tabs: Transaction Ledger, Calendar View, Recurring Bills */}
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#eff4ff] rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab("ledger");
              setSearchParams(dateFilter ? { date: dateFilter } : {});
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "ledger"
                ? "bg-[#0b1c30] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0b1c30]"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Expense Ledger ({expenses.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("calendar");
              setSearchParams({ tab: "calendar" });
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "calendar"
                ? "bg-[#0b1c30] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0b1c30]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar View</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("recurring");
              setSearchParams({ tab: "recurring" });
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "recurring"
                ? "bg-[#0b1c30] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0b1c30]"
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>
              Recurring Bills (
              {recurringExpenses.filter((r) => r.active !== false).length})
            </span>
          </button>
        </div>

        {activeTab === "recurring" ? (
          <RecurringExpensesPanel
            recurringExpenses={recurringExpenses}
            onAddRecurring={onAddRecurring}
            onToggleRecurring={onToggleRecurring}
            onDeleteRecurring={onDeleteRecurring}
            onRunDueNow={onRunDueNow}
            onTriggerSingleNow={onTriggerSingleNow}
            currentCurrency={currentCurrency}
          />
        ) : activeTab === "calendar" ? (
          <ExpenseCalendarView
            expenses={expenses}
            recurringExpenses={recurringExpenses}
            currentCurrency={currentCurrency}
            onJumpToDate={(dateStr) => {
              setDateFilter(dateStr);
              setCategoryFilter("all");
              setSearchQuery("");
              setActiveTab("ledger");
              setSearchParams({ date: dateStr });
            }}
            onAddForDate={(dateStr) => {
              setDate(dateStr);
              setDateFilter(dateStr);
              setActiveTab("ledger");
              setSearchParams({ date: dateStr });
            }}
            onOpenRecurringTab={() => {
              setActiveTab("recurring");
              setSearchParams({ tab: "recurring" });
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#0b1c30] mb-4">
              New Expense Entry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="expense-category"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  Category
                </label>
                <input
                  id="expense-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Food, Transport, Utilities"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="expense-description"
                  className="block text-sm font-medium text-[#0b1c30]"
                >
                  Description / Note
                </label>
                <input
                  id="expense-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Weekly groceries"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="expense-date"
                    className="block text-sm font-medium text-[#0b1c30]"
                  >
                    Date
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="expense-amount"
                    className="block text-sm font-medium text-[#0b1c30]"
                  >
                    Amount ({currencySymbol} {currentCurrency})
                  </label>
                  <input
                    id="expense-amount"
                    type="number"
                    step={currentCurrency === "JPY" ? "1" : "0.01"}
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#006948] hover:bg-[#00855d] text-white text-sm font-semibold rounded-lg transition-colors duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </form>
          </div>

          {/* Expenses Table Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#0b1c30]">
                    Your Expenses
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {filteredExpenses.length}{" "}
                    {filteredExpenses.length === 1 ? "entry" : "entries"} · Total{" "}
                    <span className="font-mono tabular-nums font-medium text-[#0b1c30]">
                      {formatCurrency(filteredTotalUSD, currentCurrency)}
                    </span>
                  </p>
                </div>
              </div>

              {expenses.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search notes, categories, dates..."
                      aria-label="Search expenses"
                      className="w-full pl-9 pr-3 py-2 text-xs text-[#0b1c30] bg-[#eff4ff]/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:bg-white"
                    />
                  </div>
                  <input
                    type="date"
                    aria-label="Filter expenses by date"
                    value={dateFilter}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setDateFilter(nextDate);
                      setSearchParams(nextDate ? { date: nextDate } : {});
                    }}
                    className="px-3 py-2 text-xs font-medium text-[#0b1c30] bg-[#eff4ff]/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:bg-white font-mono tabular-nums"
                  />
                  <select
                    aria-label="Filter expenses by category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-medium text-[#0b1c30] bg-[#eff4ff]/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {dateFilter && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs">
                  <span className="text-[#0b1c30]">
                    Showing expenses for{" "}
                    <strong className="font-mono tabular-nums">
                      {dateFilter}
                    </strong>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("calendar");
                        setSearchParams({ tab: "calendar" });
                      }}
                      className="font-semibold text-[#006948] hover:underline cursor-pointer"
                    >
                      Back to Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilter("");
                        setSearchParams({});
                      }}
                      className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-[#0b1c30] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Clear Date</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {filteredExpenses.length > 0 ? (
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#eff4ff]">
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Note / Description</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right w-20">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredExpenses.map((expense, index) => (
                      <tr
                        key={`${expense.date}-${expense.category}-${index}`}
                        className="hover:bg-[#eff4ff]/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#0b1c30]">
                              {expense.category}
                            </span>
                            {expense.isRecurring && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#006948]">
                                Recurring
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {getCategoryStream(expense.category)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {expense.note || expense.description || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono tabular-nums text-xs whitespace-nowrap">
                          {expense.date}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums font-semibold text-[#0b1c30] whitespace-nowrap">
                          {formatCurrency(expense.amount, currentCurrency)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpense(expense);
                              setIsModalOpen(true);
                            }}
                            aria-label={`Edit ${expense.category} expense`}
                            className="p-1.5 rounded-md text-slate-400 hover:text-[#006948] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExpenseRecord(expense)}
                            aria-label={`Delete ${expense.category} expense`}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-[#0b1c30]">
                  {expenses.length === 0
                    ? "No expenses added yet."
                    : "No matching expenses found."}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {expenses.length === 0
                    ? "Use the form on the left to record your first expense."
                    : "Try clearing your search or category filter."}
                </p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        onAddExpense={handleModalAdd}
        onUpdateExpense={updateExpenseRecord}
        editingExpense={editingExpense}
        currentCurrency={currentCurrency}
        expenses={expenses}
        budgets={budgets}
        alertThreshold={alertThreshold}
      />
    </div>
  );
}

export default ExpenseForm;
