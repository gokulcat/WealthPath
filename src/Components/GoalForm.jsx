import React, { useState } from "react";
import { Plus, CheckCircle2, Target } from "lucide-react";

function GoalForm() {
  const [goal, setGoal] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [goals, setGoals] = useState([]);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Goal Added");

    const newGoal = {
      goal,
      target_amount: targetAmount,
    };

    setGoals([...goals, newGoal]);
    setFeedback("Financial goal set successfully!");

    setGoal("");
    setTargetAmount("");
  };

  const totalTarget = goals.reduce(
    (sum, item) => sum + (parseFloat(item.target_amount) || 0),
    0
  );

  return (
    <div className="flex-1 bg-slate-50 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Add Your Goals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define savings targets and track your financial milestones
          </p>
        </div>

        {feedback && (
          <div
            role="status"
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              New Financial Goal
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="goal"
                  className="block text-sm font-medium text-slate-700"
                >
                  Goal
                </label>
                <input
                  type="text"
                  id="goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="e.g. Emergency Fund, Home Down Payment"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="targetAmount"
                  className="block text-sm font-medium text-slate-700"
                >
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="targetAmount"
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Set Financial Goals</span>
              </button>
            </form>
          </div>

          {/* Goals Table Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">My Goals</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {goals.length} {goals.length === 1 ? "goal" : "goals"} · Total
                Target{" "}
                <span className="font-mono tabular-nums font-medium text-slate-700">
                  ${totalTarget.toFixed(2)}
                </span>
              </p>
            </div>

            {goals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="px-6 py-3">Goal</th>
                      <th className="px-6 py-3 text-right">Target Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {goals.map((goalObj, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {goalObj.goal}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                          ${goalObj.target_amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  No goals added yet.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Add a savings goal using the form on the left.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalForm;
