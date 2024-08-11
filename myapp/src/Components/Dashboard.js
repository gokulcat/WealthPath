import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto"; // Add this line to register missing elements

const Dashboard = () => {
  const [expensesOverview, setExpensesOverview] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const url = "http://localhost:4000/dashboard";
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(url);
        console.log(response);
        setExpensesOverview(response.data.expenses_overview);
        setTotalExpenses(
          response.data.expenses_overview.total_expenses[0].total
        );
        console.log("sssss");
      } catch (error) {
        console.log("Error occurred");
        console.error(error);
      }
    };

    fetchData();
  }, []);

  if (!expensesOverview) {
    return <div>Loading...</div>;
  }

  let categoryLabels = [];
  let categoryData = [];
  let monthLabels = [];
  let monthData = [];

  if (Array.isArray(expensesOverview.expenses_by_category)) {
    categoryLabels = expensesOverview.expenses_by_category.map(
      (expense) => expense.category
    );
    categoryData = expensesOverview.expenses_by_category.map(
      (expense) => expense.total
    );
  } else {
    console.log("expenses_by_category is not an array");
  }

  if (Array.isArray(expensesOverview.expenses_by_month)) {
    monthLabels = expensesOverview.expenses_by_month.map(
      (expense) => expense._id
    );
    monthData = expensesOverview.expenses_by_month.map(
      (expense) => expense.total
    );
  } else {
    console.log("expenses_by_month is not an array");
  }

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
          "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
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
      style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "black", opacity: 0.9 }}
    >
      <div style={{ backgroundColor: '#f5f5f5', borderRadius: '5px', padding: '20px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', margin: '10px' }}>
        <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 ,textAlign:'center',textDecoration:"underline"}}>
          Dashboard
        </h2>
        <h3 style={{ fontSize: 18, marginBottom: 20 ,textAlign:'center'}}>
          Total Expenses: {totalExpenses}
        </h3>
        <div style={{ width: 500, height: 300, marginBottom: 20 }}>
          <Pie data={pieData} />

        </div>
        <h3 style={
          {textAlign:'center'}
        }>Expenses By Month</h3>
        <div style={{ width: 500, height: 300 }}>
          <Bar data={barData} />
        </div>
      </div>

    </div>

  );
};

export default Dashboard;