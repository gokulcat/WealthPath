import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

function ExpensesForm() {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const url = "http://localhost:4000/expenses/export";

  

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("expesense added");


   

    try {
      const response = await axios.post(url, {
        amount,
        date,
        description,
        category,
        
      });

      console.log(response.data);
      // handle successful expense creation here

      // Clear form fields
      setAmount("");
      setDate("");
      setDescription("");
      setCategory("");

      // Export data to Excel
      exportToExcel();
    } catch (error) {
      console.error(error.response.data);
      // handle error here
    }
  };




  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        amount,
        date,
        description,
        category,
        
      },
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, "expenses.xlsx");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Download My Expenses</h2>
      {/* <button type="submit">Add Expense</button> */}
      <button type="submit" onClick={exportToExcel}>
        Click to Download My Expenses
      </button>
    </form>
  );
}

export default ExpensesForm;