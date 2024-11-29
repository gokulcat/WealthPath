import React, { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto"; // Register missing chart elements
import WealthManagement from "../assests/WealthManagement.jpg";

const Dashboard = () => {
  const [expensesOverview, setExpensesOverview] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const mockData = {
      expenses_overview: {
        total_expenses: [{ total: 1250 }], // Total expenses
        expenses_by_category: [
          { category: "Food", total: 400 },
          { category: "Transport", total: 200 },
          { category: "Entertainment", total: 150 },
          { category: "Utilities", total: 300 },
          { category: "Healthcare", total: 200 },
        ],
        expenses_by_month: [
          { _id: "January", total: 500 },
          { _id: "February", total: 400 },
          { _id: "March", total: 350 },
        ],
      },
    };

    setExpensesOverview(mockData.expenses_overview);
    setTotalExpenses(mockData.expenses_overview.total_expenses[0].total);
  }, []);

  if (!expensesOverview) {
    return <div className="text-center mt-10 text-gray-500">Loading...</div>;
  }

  const categoryLabels = expensesOverview.expenses_by_category.map(
    (expense) => expense.category
  );
  const categoryData = expensesOverview.expenses_by_category.map(
    (expense) => expense.total
  );

  const monthLabels = expensesOverview.expenses_by_month.map(
    (expense) => expense._id
  );
  const monthData = expensesOverview.expenses_by_month.map(
    (expense) => expense.total
  );

  const pieData = {
    labels: categoryLabels,
    datasets: [
      {
        label: "Expenses by Category",
        data: categoryData,
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: "Expenses by Month",
        data: monthData,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${WealthManagement})` }}
    >
      <div className="w-full max-w-xl h-[630px] bg-white bg-opacity-60 p-6 rounded-lg shadow-md space-y-2 overflow-hidden">
        <h2 className="text-3xl font-semibold text-center text-purple-600 underline ">
          Dashboard
        </h2>
        <h3 className="text-xl font-medium text-center text-gray-800 ">
          Total Expenses: <span className="font-bold">${totalExpenses}</span>
        </h3>

        {/* Expenses by Category */}
        <div className="mb-8">
          <h3 className="text-center text-lg font-medium text-gray-700 mb-4">
            Expenses by Category
          </h3>
          <div className="flex justify-center">
            <div className="w-[250px] h-[250px]">
              <Pie data={pieData} />
            </div>
          </div>
        </div>

        {/* Expenses by Month */}
        <div>
          <h3 className="text-center text-lg font-medium text-gray-700 mb-4">
            Expenses by Month
          </h3>
          <div className="flex justify-center">
            <div className="w-[300px] h-[250px]">
              <Bar data={barData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
