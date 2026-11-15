import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertCircle,
  Receipt,
} from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import { exportExpensesAndAnalyticsCSV } from "../utils/exportCsv";

function ExpenseForm({ expenses: propExpenses, budgets = [], onAddExpense }) {
  const [localExpenses, setLocalExpenses] = useState([]);
  const expenses = propExpenses !== undefined ? propExpenses : localExpenses;

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addExpenseRecord = (newExpense) => {
    if (onAddExpense) {
      onAddExpense(newExpense);
    } else {
      setLocalExpenses((prev) => [...prev, newExpense]);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newExpense = {
      category,
      description,
      note: description,
      date,
      amount: parseFloat(amount) || amount,
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

    const exportRows = expenses.map((item) => ({
      category: item.category,
      description: item.note || item.description || "",
      date: item.date,
      amount: item.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "expenses.xlsx");
    setFeedback({
      type: "success",
      text: "Expenses exported to Excel successfully!",
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
    exportExpensesAndAnalyticsCSV(expenses, budgets);
    setFeedback({
      type: "success",
      text: "Expense history and analytics exported to CSV!",
    });
  };

  const totalAmount = expenses.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  return (
    <div className="flex-1 bg-slate-50 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Add Your Expenses
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Log new transactions and export your expense history &amp;
              analytics report
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add Modal</span>
            </button>
            {expenses.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  <span>Export CSV Report</span>
                </button>
                <button
                  type="button"
                  onClick={exportToExcel}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
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
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              New Expense Entry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="expense-category"
                  className="block text-sm font-medium text-slate-700"
                >
                  Category
                </label>
                <input
                  id="expense-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Food, Transport, Utilities"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="expense-description"
                  className="block text-sm font-medium text-slate-700"
                >
                  Description / Note
                </label>
                <input
                  id="expense-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Weekly groceries"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="expense-date"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Date
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="expense-amount"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Amount ($)
                  </label>
                  <input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold rounded-lg transition-colors duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </form>
          </div>

          {/* Expenses Table Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Your Expenses
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {expenses.length} {expenses.length === 1 ? "entry" : "entries"}{" "}
                  · Total{" "}
                  <span className="font-mono tabular-nums font-medium text-slate-700">
                    ${totalAmount.toFixed(2)}
                  </span>
                </p>
              </div>
              {expenses.length > 0 && (
                <button
                  type="button"
                  onClick={exportToExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to Excel</span>
                </button>
              )}
            </div>

            {expenses.length > 0 ? (
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Note / Description</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {expenses.map((expense, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {expense.category}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {expense.note || expense.description || "—"}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 font-mono tabular-nums text-xs">
                          {expense.date}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                          ${expense.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  No expenses added yet.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Use the form on the left to record your first expense.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddExpense={handleModalAdd}
      />
    </div>
  );
}

export default ExpenseForm;
