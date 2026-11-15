import React, { useState, useEffect } from "react";
import { Plus, CheckCircle2, Target, Trash2 } from "lucide-react";

const GOALS_STORAGE_KEY = "wealthwise_goals";

function GoalForm() {
  const [goal, setGoal] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem(GOALS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error("Error loading goals:", error);
    }
    return [];
  });
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error("Error saving goals:", error);
    }
  }, [goals]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const newGoal = {
      goal: goal.trim(),
      target_amount: parseFloat(targetAmount) || 0,
      saved_amount: parseFloat(savedAmount) || 0,
    };

    setGoals((prev) => [...prev, newGoal]);
    setFeedback("Financial goal set successfully!");

    setGoal("");
    setTargetAmount("");
    setSavedAmount("");
  };

  const handleContribute = (index, delta) => {
    setGoals((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const current = parseFloat(item.saved_amount) || 0;
        return {
          ...item,
          saved_amount: Math.max(0, current + delta),
        };
      })
    );
  };

  const handleDeleteGoal = (index) => {
    setGoals((prev) => prev.filter((_, idx) => idx !== index));
    setFeedback("Financial goal removed.");
  };

  const totalTarget = goals.reduce(
    (sum, item) => sum + (parseFloat(item.target_amount) || 0),
    0
  );

  const totalSaved = goals.reduce(
    (sum, item) => sum + (parseFloat(item.saved_amount) || 0),
    0
  );

  return (
    <div className="flex-1 bg-slate-50 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Financial Goals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define savings targets, log progress contributions, and track your
            milestones
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    min="1"
                    id="targetAmount"
                    value={targetAmount}
                    onChange={(event) => setTargetAmount(event.target.value)}
                    placeholder="5000.00"
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="savedAmount"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Saved So Far ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="savedAmount"
                    value={savedAmount}
                    onChange={(event) => setSavedAmount(event.target.value)}
                    placeholder="0.00"
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-slate-900 font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
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

          {/* Goals Progress Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  My Goals
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {goals.length} {goals.length === 1 ? "goal" : "goals"} tracked
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500">Total Saved vs Target</p>
                <p className="text-sm font-semibold font-mono tabular-nums text-slate-900">
                  ${totalSaved.toFixed(2)}{" "}
                  <span className="text-slate-400 font-normal">
                    / ${totalTarget.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>

            {goals.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {goals.map((goalObj, index) => {
                  const target = parseFloat(goalObj.target_amount) || 0;
                  const saved = parseFloat(goalObj.saved_amount) || 0;
                  const pct =
                    target > 0 ? Math.round((saved / target) * 100) : 0;
                  const barWidth = Math.min(pct, 100);
                  const reached = pct >= 100;

                  return (
                    <div
                      key={`${goalObj.goal}-${index}`}
                      className="px-6 py-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {goalObj.goal}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              reached ? "text-emerald-700" : "text-blue-800"
                            }`}
                          >
                            · {reached ? "Goal reached" : "In progress"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleContribute(index, 100)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer font-mono tabular-nums"
                          >
                            + $100
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(index)}
                            aria-label={`Delete ${goalObj.goal}`}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div
                        className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={Math.min(pct, 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${goalObj.goal} progress`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            reached ? "bg-emerald-600" : "bg-blue-800"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                        <span>{pct}% funded</span>
                        <span>
                          ${saved.toFixed(2)} / ${target.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
