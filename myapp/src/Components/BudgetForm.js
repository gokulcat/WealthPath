import React, { useState } from "react";

function BudgetForm() {
  const [budgetAmount, setBudgetAmount] = useState("");
  const [category, setCategory] = useState("");
  const [budgets, setBudgets] = useState([]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const newBudget = { category, budgetAmount };
    setBudgets([...budgets, newBudget]);

    setCategory("");
    setBudgetAmount("");

    alert("Budget set successfully!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 py-10">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-purple-600">
            Add Your Budget
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
            <label className="block text-sm font-medium text-gray-700">Budget Amount</label>
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Set Budget
          </button>
        </form>

        {/* Budgets Table */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-center text-gray-800">Your Budgets</h3>
          {budgets.length > 0 ? (
            <div className="mt-4">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border border-gray-300">Category</th>
                    <th className="p-2 border border-gray-300">Budget Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 text-center">{budget.category}</td>
                      <td className="p-2 text-center">${budget.budgetAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center mt-4 text-gray-600">No budgets added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BudgetForm;
