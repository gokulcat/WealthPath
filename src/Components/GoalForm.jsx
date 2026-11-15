import React, { useState, useRef } from "react";
import {
  Plus,
  CheckCircle2,
  Target,
  Trash2,
  X,
  ArrowUpRight,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import {
  CURRENCIES,
  convertAmount,
  formatCurrency,
  toUSD,
} from "../utils/currency";

const VAULT_TEMPLATES = [
  {
    goal: "Annual Taxes Reserve",
    categoryTag: "Tax Reserve",
    target_amount: 4000,
    monthlyAuto: 350,
    targetDate: "Apr 2027",
  },
  {
    goal: "Holiday Gifts",
    categoryTag: "Seasonal Lifestyle",
    target_amount: 1500,
    monthlyAuto: 125,
    targetDate: "Dec 2026",
  },
  {
    goal: "Home Repairs & Maintenance",
    categoryTag: "Real Estate Reserve",
    target_amount: 5000,
    monthlyAuto: 200,
    targetDate: "Open",
  },
  {
    goal: "Pet Care Fund",
    categoryTag: "Veterinary Reserve",
    target_amount: 2000,
    monthlyAuto: 100,
    targetDate: "Open",
  },
  {
    goal: "EUR Travel Sinking Fund",
    categoryTag: "European Hedged Trip",
    target_amount: 3500,
    monthlyAuto: 250,
    targetDate: "Sep 2027",
    foreignCurrency: "EUR",
  },
];

function GoalForm({
  goals = [],
  onAddGoal,
  onContributeGoal,
  onDeleteGoal,
  currentCurrency = "USD",
  onCurrencyChange,
  roundUpMultiplier = 1,
  autoFundingPaused = false,
  onUpdateSettings,
}) {
  const [goal, setGoal] = useState("");
  const [categoryTag, setCategoryTag] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [monthlyAuto, setMonthlyAuto] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [foreignCurrency, setForeignCurrency] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [feedback, setFeedback] = useState("");

  const [depositIndex, setDepositIndex] = useState(null);
  const [depositInput, setDepositInput] = useState("250");
  const formInputRef = useRef(null);

  const currencySymbol = CURRENCIES[currentCurrency]?.symbol || "$";

  const handleSubmit = (event) => {
    event.preventDefault();
    const targetUSD = Number(
      toUSD(parseFloat(targetAmount) || 0, currentCurrency).toFixed(2)
    );
    const savedUSD = Number(
      toUSD(parseFloat(savedAmount) || 0, currentCurrency).toFixed(2)
    );
    const monthlyUSD = Number(
      toUSD(parseFloat(monthlyAuto) || 0, currentCurrency).toFixed(2)
    );

    if (!goal.trim() || targetUSD <= 0) return;

    const newGoal = {
      goal: goal.trim(),
      categoryTag: categoryTag.trim() || "Personal Vault",
      target_amount: targetUSD,
      saved_amount: savedUSD,
      monthlyAuto: monthlyUSD,
      targetDate: targetDate.trim() || "Flexible",
    };

    if (foreignCurrency && CURRENCIES[foreignCurrency]) {
      const rate = CURRENCIES[foreignCurrency].rateAgainstUSD;
      newGoal.foreignCurrency = foreignCurrency;
      newGoal.foreignCurrentAmount = Math.round(savedUSD * rate);
      newGoal.foreignTargetAmount = Math.round(targetUSD * rate);
    }

    if (onAddGoal) {
      onAddGoal(newGoal);
    }

    setFeedback(`Savings vault "${newGoal.goal}" created!`);
    setGoal("");
    setCategoryTag("");
    setTargetAmount("");
    setSavedAmount("");
    setMonthlyAuto("");
    setTargetDate("");
    setForeignCurrency("");
  };

  const handleApplyTemplate = (tpl) => {
    const newGoal = {
      goal: tpl.goal,
      categoryTag: tpl.categoryTag,
      target_amount: tpl.target_amount,
      saved_amount: 0,
      monthlyAuto: tpl.monthlyAuto,
      targetDate: tpl.targetDate,
    };
    if (tpl.foreignCurrency && CURRENCIES[tpl.foreignCurrency]) {
      const rate = CURRENCIES[tpl.foreignCurrency].rateAgainstUSD;
      newGoal.foreignCurrency = tpl.foreignCurrency;
      newGoal.foreignCurrentAmount = 0;
      newGoal.foreignTargetAmount = Math.round(tpl.target_amount * rate);
    }
    if (onAddGoal) {
      onAddGoal(newGoal);
    }
    setFeedback(`Created "${tpl.goal}" sinking fund from template!`);
  };

  const handleCustomDepositSubmit = (event) => {
    event.preventDefault();
    if (depositIndex === null) return;
    const numeric = parseFloat(depositInput) || 0;
    if (numeric <= 0) return;
    const deltaUSD = Number(toUSD(numeric, currentCurrency).toFixed(2));
    if (onContributeGoal) {
      onContributeGoal(depositIndex, deltaUSD);
    }
    const vaultName = goals[depositIndex]?.goal || "vault";
    setFeedback(
      `Deposited ${formatCurrency(deltaUSD, currentCurrency)} into ${vaultName}!`
    );
    setDepositIndex(null);
  };

  const filteredGoals = goals
    .map((item, originalIndex) => ({ ...item, originalIndex }))
    .filter((item) => {
      const target = parseFloat(item.target_amount) || 0;
      const saved = parseFloat(item.saved_amount) || 0;
      const reached = target > 0 && saved >= target;
      if (filterMode === "active") return !reached;
      if (filterMode === "completed") return reached;
      return true;
    });

  const totalTargetUSD = goals.reduce(
    (sum, item) => sum + (parseFloat(item.target_amount) || 0),
    0
  );
  const totalSavedUSD = goals.reduce(
    (sum, item) => sum + (parseFloat(item.saved_amount) || 0),
    0
  );
  const totalMonthlyAutoUSD = goals.reduce(
    (sum, item) => sum + (parseFloat(item.monthlyAuto) || 0),
    0
  );

  const monthlyRoundUpBoostUSD = 84.2 * roundUpMultiplier;

  return (
    <div className="flex-1 bg-[#f8f9ff] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
              Savings Vaults &amp; Sinking Funds
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage auto-funded sinking funds, dual-currency travel vaults, and
              spare-change round-ups in {currentCurrency}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onCurrencyChange && (
              <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200">
                {Object.keys(CURRENCIES).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onCurrencyChange(code)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                      currentCurrency === code
                        ? "bg-[#006948] text-white"
                        : "text-slate-600 hover:text-[#0b1c30]"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onUpdateSettings &&
                  onUpdateSettings({ autoFundingPaused: !autoFundingPaused });
                setFeedback(
                  !autoFundingPaused
                    ? "Vault auto-funding paused."
                    : "Vault auto-funding resumed."
                );
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                autoFundingPaused
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-white border-slate-200 text-[#0b1c30] hover:bg-[#eff4ff]"
              }`}
            >
              {autoFundingPaused ? (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Auto-Funding</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Auto-Funding</span>
                </>
              )}
            </button>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-emerald-50 text-[#006948] border border-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Vault Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Total Funded</p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#006948]">
              {formatCurrency(totalSavedUSD, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
              of{" "}
              {formatCurrency(totalTargetUSD, currentCurrency, {
                showCents: false,
              })}{" "}
              combined target
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Monthly Vault Contribution
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {formatCurrency(totalMonthlyAutoUSD, currentCurrency, {
                showCents: false,
              })}
              <span className="text-xs font-normal text-slate-400"> / mo</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {autoFundingPaused
                ? "Auto-funding paused"
                : `Active across ${goals.length} vaults`}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Vault Round-Up Reserve ({roundUpMultiplier}x)
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#006948]">
              +{formatCurrency(monthlyRoundUpBoostUSD, currentCurrency)}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              {[1, 2, 5].map((mult) => (
                <button
                  key={mult}
                  type="button"
                  onClick={() =>
                    onUpdateSettings &&
                    onUpdateSettings({ roundUpMultiplier: mult })
                  }
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded cursor-pointer ${
                    roundUpMultiplier === mult
                      ? "bg-[#006948] text-white"
                      : "bg-[#eff4ff] text-slate-600 hover:text-[#0b1c30]"
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Templates Row */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#006948] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#0b1c30]">
                Quick Sinking Fund Templates
              </p>
              <p className="text-xs text-slate-500">
                Launch an auto-yielding vault in one click
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {VAULT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.goal}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-3 py-1.5 text-xs font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#006948] hover:text-white rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                + {tpl.goal.replace(" Reserve", "").replace(" Fund", "")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#0b1c30] mb-4">
              Create Custom Sinking Fund
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="goal"
                    className="block text-sm font-medium text-[#0b1c30]"
                  >
                    Vault / Goal Name
                  </label>
                  <input
                    ref={formInputRef}
                    type="text"
                    id="goal"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    placeholder="e.g. Emergency Fund"
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="goal-tag"
                    className="block text-sm font-medium text-[#0b1c30]"
                  >
                    Purpose Tag
                  </label>
                  <input
                    type="text"
                    id="goal-tag"
                    value={categoryTag}
                    onChange={(event) => setCategoryTag(event.target.value)}
                    placeholder="e.g. Safety Net"
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="targetAmount"
                    className="block text-sm font-medium text-[#0b1c30]"
                  >
                    Target ({currencySymbol} {currentCurrency})
                  </label>
                  <input
                    type="number"
                    step={currentCurrency === "JPY" ? "1" : "0.01"}
                    min="1"
                    id="targetAmount"
                    value={targetAmount}
                    onChange={(event) => setTargetAmount(event.target.value)}
                    placeholder="5000.00"
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="savedAmount"
                    className="block text-sm font-medium text-[#0b1c30]"
                  >
                    Saved So Far ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step={currentCurrency === "JPY" ? "1" : "0.01"}
                    min="0"
                    id="savedAmount"
                    value={savedAmount}
                    onChange={(event) => setSavedAmount(event.target.value)}
                    placeholder="0.00"
                    className="mt-1.5 px-3.5 py-2.5 w-full text-sm text-[#0b1c30] font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="monthlyAuto"
                    className="block text-xs font-medium text-[#0b1c30]"
                  >
                    Monthly ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step={currentCurrency === "JPY" ? "1" : "0.01"}
                    min="0"
                    id="monthlyAuto"
                    value={monthlyAuto}
                    onChange={(event) => setMonthlyAuto(event.target.value)}
                    placeholder="250"
                    className="mt-1.5 px-3 py-2.5 w-full text-sm text-[#0b1c30] font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="targetDate"
                    className="block text-xs font-medium text-[#0b1c30]"
                  >
                    Target Date
                  </label>
                  <input
                    type="text"
                    id="targetDate"
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    placeholder="Dec 2026"
                    className="mt-1.5 px-3 py-2.5 w-full text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="foreignCurrency"
                    className="block text-xs font-medium text-[#0b1c30]"
                  >
                    FX Hedge
                  </label>
                  <select
                    id="foreignCurrency"
                    value={foreignCurrency}
                    onChange={(e) => setForeignCurrency(e.target.value)}
                    className="mt-1.5 px-2.5 py-2.5 w-full text-xs font-semibold text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  >
                    <option value="">None</option>
                    {Object.keys(CURRENCIES)
                      .filter((c) => c !== "USD")
                      .map((code) => (
                        <option key={code} value={code}>
                          {code} ({CURRENCIES[code].symbol})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#006948] hover:bg-[#00855d] text-white text-sm font-semibold rounded-lg transition-colors duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Savings Vault</span>
              </button>
            </form>
          </div>

          {/* Vaults Progress Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1c30]">
                  Active Target Vaults
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {filteredGoals.length}{" "}
                  {filteredGoals.length === 1 ? "vault" : "vaults"} tracked
                </p>
              </div>
              <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200 self-start sm:self-auto">
                {[
                  { id: "all", label: "All" },
                  { id: "active", label: "In Progress" },
                  { id: "completed", label: "Reached" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterMode(tab.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      filterMode === tab.id
                        ? "bg-[#0b1c30] text-white"
                        : "text-slate-600 hover:text-[#0b1c30]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredGoals.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {filteredGoals.map((goalObj) => {
                  const targetUSD = parseFloat(goalObj.target_amount) || 0;
                  const savedUSD = parseFloat(goalObj.saved_amount) || 0;
                  const monthlyUSD = parseFloat(goalObj.monthlyAuto) || 0;
                  const pct =
                    targetUSD > 0
                      ? Math.round((savedUSD / targetUSD) * 100)
                      : 0;
                  const barWidth = Math.min(pct, 100);
                  const reached = pct >= 100;
                  const statusLabel = reached
                    ? "Goal reached"
                    : pct >= 75
                    ? "Almost done"
                    : pct >= 35
                    ? "On track"
                    : "In progress";

                  const foreignInfo =
                    goalObj.foreignCurrency &&
                    CURRENCIES[goalObj.foreignCurrency]
                      ? {
                          symbol: CURRENCIES[goalObj.foreignCurrency].symbol,
                          code: goalObj.foreignCurrency,
                          saved:
                            goalObj.foreignCurrentAmount ??
                            Math.round(
                              savedUSD *
                                CURRENCIES[goalObj.foreignCurrency]
                                  .rateAgainstUSD
                            ),
                          target:
                            goalObj.foreignTargetAmount ??
                            Math.round(
                              targetUSD *
                                CURRENCIES[goalObj.foreignCurrency]
                                  .rateAgainstUSD
                            ),
                        }
                      : null;

                  return (
                    <div
                      key={`${goalObj.goal}-${goalObj.originalIndex}`}
                      className="px-6 py-4 hover:bg-[#eff4ff]/40 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#0b1c30] truncate">
                              {goalObj.goal}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                reached ? "text-[#006948]" : "text-teal-700"
                              }`}
                            >
                              · {statusLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {goalObj.categoryTag || "Personal Vault"} · Target:{" "}
                            {goalObj.targetDate || "Flexible"}
                            {monthlyUSD > 0 && (
                              <>
                                {" "}
                                ·{" "}
                                <span className="font-mono tabular-nums">
                                  {formatCurrency(monthlyUSD, currentCurrency, {
                                    showCents: false,
                                  })}
                                  /mo
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const suggested = Math.round(
                                convertAmount(100, currentCurrency)
                              );
                              setDepositInput(String(suggested));
                              setDepositIndex(goalObj.originalIndex);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#006948] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-md transition-colors cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Deposit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onDeleteGoal && onDeleteGoal(goalObj.originalIndex)
                            }
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
                            reached ? "bg-[#00855d]" : "bg-[#006948]"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-mono tabular-nums">
                        <span>{pct}% funded</span>
                        <div className="text-right">
                          {foreignInfo ? (
                            <>
                              <span className="font-semibold text-[#0b1c30]">
                                {foreignInfo.symbol}
                                {foreignInfo.saved.toLocaleString()} /{" "}
                                {foreignInfo.symbol}
                                {foreignInfo.target.toLocaleString()}{" "}
                                {foreignInfo.code}
                              </span>
                              <span className="ml-2 text-[#006948]">
                                (
                                {formatCurrency(savedUSD, currentCurrency, {
                                  showCents: false,
                                })}{" "}
                                /{" "}
                                {formatCurrency(targetUSD, currentCurrency, {
                                  showCents: false,
                                })}
                                )
                              </span>
                            </>
                          ) : (
                            <span>
                              {formatCurrency(savedUSD, currentCurrency, {
                                showCents: false,
                              })}{" "}
                              /{" "}
                              {formatCurrency(targetUSD, currentCurrency, {
                                showCents: false,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-[#0b1c30]">
                  No vaults match this filter.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Create a new savings vault or use a template above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Deposit Modal */}
      {depositIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/55 backdrop-blur-xs"
          onClick={() => setDepositIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deposit-modal-title"
        >
          <div
            className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  id="deposit-modal-title"
                  className="text-lg font-bold text-[#0b1c30]"
                >
                  Deposit to {goals[depositIndex]?.goal}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add funds in {currentCurrency} to accelerate your goal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDepositIndex(null)}
                aria-label="Close deposit modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomDepositSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="vault-deposit-amount"
                  className="block text-xs font-semibold text-[#0b1c30] mb-1.5"
                >
                  Amount ({currencySymbol} {currentCurrency})
                </label>
                <input
                  id="vault-deposit-amount"
                  type="number"
                  step={currentCurrency === "JPY" ? "1" : "0.01"}
                  min="1"
                  value={depositInput}
                  onChange={(e) => setDepositInput(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              <div className="flex items-center gap-2">
                {[50, 100, 250, 500].map((presetUSD) => {
                  const val = Math.round(
                    convertAmount(presetUSD, currentCurrency)
                  );
                  return (
                    <button
                      key={presetUSD}
                      type="button"
                      onClick={() => setDepositInput(String(val))}
                      className="flex-1 py-1.5 text-xs font-mono font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-md cursor-pointer"
                    >
                      +{currencySymbol}
                      {val}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDepositIndex(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#eff4ff] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg cursor-pointer"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalForm;
