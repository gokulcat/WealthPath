import React, { useEffect, useState } from 'react';
import axios from 'axios'


function GoalForm() {
  const [goal, setGoal] = useState('');
  // const [goal2, setGoal2] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [goals,setGoals] =useState([]);
  const url = "http://localhost:4000/goals"

  useEffect(()=>{
    axios.get("http://localhost:4000/goals")
    // .then(res=> res.json())
    .then(goals=>setGoals(goals))
    .catch(error=>{
      console.error('Error getting goals', error);

    })
  },[])

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Goal Added")

    try {
      const response = await axios.post(url, {
        goal,
        target_amount: targetAmount,
      });

      console.log(response.data);
      // handle successful goal creation here
      alert('Financial goal set successfully!');
    } catch (error) {
      console.error(error.response.data);
      // handle error here
      alert('Error creating financial goal. Please try again.');
    }
  };

  return (
    <div>
    <form onSubmit={handleSubmit}>

      <h2>Add Your Goals</h2>
      <div style={{ display: 'flex', marginBottom: '10px' }}>
        
        <label htmlFor="goal" style={{ marginRight: '10px' }}>Goal:</label>
        
        <input
          type="text"
          id="goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          style={{ flexGrow: 1, marginRight: '10px' }}
        />
      </div>

      <div style={{ display: 'flex' }}>
        <label htmlFor="targetAmount" style={{ marginRight: '10px' }}>Target Amount:</label>
        <input
          type="number"
          id="targetAmount"
          value={targetAmount}
          onChange={(event) => setTargetAmount(event.target.value)}
          style={{ flexGrow: 1 }}
        />
      </div>

      <button type="submit">Set Financial Goals</button>
    </form>
    <div>
      <h3>My Goals</h3>
      {goals.length ? goals.map(goalObj=><div>{goalObj.goal}</div>):null}
    </div>
   </div>
  );
}

export default GoalForm;