import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Expenses.css';

// ExpenseForm.jsx
function ExpenseForm() {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const url = "http://localhost:4000/expenses" // Replace with your API endpoint

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Expense Added")

    try {
      const response = await axios.post(url, {
        category,
        description,
        date,
        amount,
      });

      console.log(response.data);
      // handle successful expense creation here
      alert('Expense added successfully!');
    } catch (error) {
      console.error(error.response.data);
      // handle error here
      alert('Error creating expense. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Your Expenses</h2>
      <div className="form-group">
        <label htmlFor="category">Category:</label>
        <input
          type="text"
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="form-group__input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="form-group__input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="form-group__input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="form-group__input"
        />
      </div>

      <button type="submit">Add Expenses</button>
    </form>
  );
}

export default ExpenseForm;