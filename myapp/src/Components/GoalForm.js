import React, { useState } from "react";
import WealthManagement from "../assests/WealthManagement.jpg";

function GoalForm() {
  const [goal, setGoal] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [goals, setGoals] = useState([]); // Local state to store goals

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Goal Added");

    // Add the new goal to the goals state
    const newGoal = {
      goal,
      target_amount: targetAmount,
    };

    setGoals([...goals, newGoal]); // Update the goals list
    alert("Financial goal set successfully!");

    // Reset input fields
    setGoal("");
    setTargetAmount("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${WealthManagement})` }}
    >
      <div className="w-full max-w-lg bg-white bg-opacity-50 p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-purple-600">
            Add Your Goals
          </h2>
          <div>
            <label
              htmlFor="goal"
              className="block text-sm font-medium text-gray-700"
            >
              Goal:
            </label>
            <input
              type="text"
              id="goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>

          <div>
            <label
              htmlFor="targetAmount"
              className="block text-sm font-medium text-gray-700"
            >
              Target Amount:
            </label>
            <input
              type="number"
              id="targetAmount"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            Set Financial Goals
          </button>
        </form>

        {/* Goals Table */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-center text-gray-800">
            My Goals
          </h3>
          {goals.length ? (
            <table className="w-full mt-4 border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left border-b bg-gray-100 text-gray-600">
                    Goal
                  </th>
                  <th className="px-4 py-2 text-left border-b bg-gray-100 text-gray-600">
                    Target Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goalObj, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2 text-gray-700">{goalObj.goal}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {goalObj.target_amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center mt-4 text-gray-600">
              No goals added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default GoalForm;
