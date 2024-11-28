import React, { useState } from "react";
import * as XLSX from "xlsx";

function ExpenseForm() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState([]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const newExpense = { category, description, date, amount };
    setExpenses([...expenses, newExpense]);

    // Reset fields
    setCategory("");
    setDescription("");
    setDate("");
    setAmount("");

    alert("Expense added successfully!");
  };

  const exportToExcel = () => {
    if (expenses.length === 0) {
      alert("No expenses to export!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(expenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "expenses.xlsx");
    alert("Expenses exported to Excel successfully!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 py-10">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-purple-600">
            Add Your Expenses
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Add Expense
          </button>
        </form>

        {/* Expenses Table */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-center text-gray-800">Your Expenses</h3>
          {expenses.length > 0 ? (
            <div className="mt-4">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border border-gray-300">Category</th>
                    <th className="p-2 border border-gray-300">Description</th>
                    <th className="p-2 border border-gray-300">Date</th>
                    <th className="p-2 border border-gray-300">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 text-center">{expense.category}</td>
                      <td className="p-2 text-center">{expense.description}</td>
                      <td className="p-2 text-center">{expense.date}</td>
                      <td className="p-2 text-center">${expense.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={exportToExcel}
                className="w-full mt-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export to Excel
              </button>
            </div>
          ) : (
            <p className="text-center mt-4 text-gray-600">No expenses added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseForm;
