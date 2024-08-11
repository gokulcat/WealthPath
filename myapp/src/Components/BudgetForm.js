import React, { useState } from 'react';
import axios from 'axios';

function BudgetForm() {
  const [budgetAmount, setBudgetAmount] = useState('');
  const [category, setCategory] = useState('');
  const url = "http://localhost:4000/budgets";

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Budget Set Successfully")

    try {
      const response = await axios.post(url, {
        budget_amount: budgetAmount,
        category,
      });

      console.log(response.data);
      // handle successful budget creation here
      alert('Budget set successfully!');
    } catch (error) {
      console.error(error.response.data);
      // handle error here
      alert('Error creating budget. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Your Budget</h2>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <label htmlFor="category" style={{ marginRight: '10px' }}>Category:</label>
        <input
          type="text"
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          style={{ flexGrow: 1, marginRight: '10px' }}
        />
      </div>

      <div style={{ display: 'flex', marginBottom: '10px' }}>
        <label htmlFor="budgetAmount" style={{ marginRight: '10px' }}>Budget Amount:</label>
        <input
          type="number"
          id="budgetAmount"
          value={budgetAmount}
          onChange={(event) => setBudgetAmount(event.target.value)}
          style={{ flexGrow: 1 }}
        />
      </div>

      <button type="submit">Set Budget</button>
    </form>
  );
}

export default BudgetForm;