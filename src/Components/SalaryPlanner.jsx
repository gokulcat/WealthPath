import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Sliders,
  Sparkles,
  RotateCcw,
  Wallet,
  TrendingUp,
  Lock,
  Plus,
  X,
  Zap,
  ShieldCheck,
  Download,
} from "lucide-react";
import {
  CURRENCIES,
  STREAMS,
  convertAmount,
  formatCurrency,
  getCategoryStream,
  toUSD,
} from "../utils/currency";

const FRAMEWORKS = {
  "50_30_20": {
    label: "50 / 30 / 20 Standard",
    needs: 50,
    wants: 30,
    wealth: 20,
    desc: "Classic split between essentials, lifestyle, and long-term savings.",
  },
  "60_20_20": {
    label: "60 / 20 / 20 Balanced",
    needs: 60,
    wants: 20,
    wealth: 20,
    desc: "Higher room for housing & utilities while preserving 20% savings.",
  },
  "70_20_10": {
    label: "70 / 20 / 10 Metro",
    needs: 70,
    wants: 20,
    wealth: 10,
    desc: "Designed for high-cost cities while keeping automated savings active.",
  },
  custom: {
    label: "Custom Sliders",
    needs: 55,
    wants: 25,
    wealth: 20,
    desc: "Fine-tune housing, groceries, transport, and lifestyle weights.",
  },
};

function SalaryPlanner({
  currentCurrency = "USD",
  onOpenFXModal,
  incomeConfig,
  onUpdateIncomeConfig,
  expenses = [],
  budgets = [],
  onSaveBudget,
  onApplySplitToBudgets,
  settings,
  onUpdateSettings,
}) {
  const [activeView, setActiveView] = useState("splitter");
  const [frequency, setFrequency] = useState(
    incomeConfig?.frequency || "monthly"
  );
  const [ruleKey, setRuleKey] = useState(incomeConfig?.ruleKey || "50_30_20");
  const [salaryInput, setSalaryInput] = useState(() =>
    String(
      Math.round(
        convertAmount(incomeConfig?.monthlyIncomeUSD || 6500, currentCurrency)
      )
    )
  );
  const [housingPct, setHousingPct] = useState(30);
  const [groceryPct, setGroceryPct] = useState(12);
  const [transportPct, setTransportPct] = useState(8);
  const [wantsPct, setWantsPct] = useState(25);
  const [streamFilter, setStreamFilter] = useState("all");
  const [simTargetUSD, setSimTargetUSD] = useState(120);
  const [ruleLocked, setRuleLocked] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatStream, setNewCatStream] = useState("Essential Needs");
  const [newCatBudget, setNewCatBudget] = useState("150");
  const [feedback, setFeedback] = useState("");

  const currencySymbol = CURRENCIES[currentCurrency]?.symbol || "$";
  const apyRate = settings?.apyRate ?? 4.85;
  const engineActive = settings?.autoSaveEngineActive ?? true;
  const planLocked = settings?.planScheduleLocked ?? false;
  const primaryAccount = settings?.accounts?.[0] || {
    name: "Premier Checking",
    last4: "4921",
  };

  useEffect(() => {
    const factor =
      frequency === "annual" ? 12 : frequency === "biweekly" ? 12 / 26 : 1;
    setSalaryInput(
      String(
        Math.round(
          convertAmount(
            (incomeConfig?.monthlyIncomeUSD || 6500) * factor,
            currentCurrency
          )
        )
      )
    );
  }, [currentCurrency]);

  const rawNumeric = Math.max(0, parseFloat(salaryInput) || 0);
  const inputInUSD = toUSD(rawNumeric, currentCurrency);
  const monthlyIncomeUSD =
    frequency === "annual"
      ? inputInUSD / 12
      : frequency === "biweekly"
      ? (inputInUSD * 26) / 12
      : inputInUSD;

  const activeRule = useMemo(() => {
    if (ruleKey === "custom") {
      const needs = Math.min(90, housingPct + groceryPct + transportPct);
      const wants = Math.min(100 - needs, wantsPct);
      const wealth = Math.max(0, 100 - needs - wants);
      return { needs, wants, wealth };
    }
    const preset = FRAMEWORKS[ruleKey] || FRAMEWORKS["50_30_20"];
    return { needs: preset.needs, wants: preset.wants, wealth: preset.wealth };
  }, [ruleKey, housingPct, groceryPct, transportPct, wantsPct]);

  const needsUSD = (monthlyIncomeUSD * activeRule.needs) / 100;
  const wantsUSD = (monthlyIncomeUSD * activeRule.wants) / 100;
  const wealthUSD = (monthlyIncomeUSD * activeRule.wealth) / 100;

  const syncIncome = (nextMonthlyUSD, nextFreq = frequency, nextRule = ruleKey) => {
    const split =
      nextRule === "custom"
        ? activeRule
        : {
            needs: FRAMEWORKS[nextRule].needs,
            wants: FRAMEWORKS[nextRule].wants,
            wealth: FRAMEWORKS[nextRule].wealth,
          };
    if (onUpdateIncomeConfig) {
      onUpdateIncomeConfig({
        monthlyIncomeUSD: Math.round(nextMonthlyUSD),
        frequency: nextFreq,
        ruleKey: nextRule,
        split,
      });
    }
  };

  const handleSalaryChange = (val) => {
    setSalaryInput(val);
    const num = Math.max(0, parseFloat(val) || 0);
    const usd = toUSD(num, currentCurrency);
    const nextMonthly =
      frequency === "annual"
        ? usd / 12
        : frequency === "biweekly"
        ? (usd * 26) / 12
        : usd;
    syncIncome(nextMonthly);
  };

  const handleFrequencyChange = (nextFreq) => {
    setFrequency(nextFreq);
    const factor =
      nextFreq === "annual" ? 12 : nextFreq === "biweekly" ? 12 / 26 : 1;
    const nextDisplay = Math.round(
      convertAmount(monthlyIncomeUSD * factor, currentCurrency)
    );
    setSalaryInput(String(nextDisplay));
    syncIncome(monthlyIncomeUSD, nextFreq);
  };

  const handleRuleSelect = (nextRule) => {
    setRuleKey(nextRule);
    syncIncome(monthlyIncomeUSD, frequency, nextRule);
  };

  const handleSimulateRaise = () => {
    const boostedMonthlyUSD = Math.round(monthlyIncomeUSD * 1.1);
    const factor =
      frequency === "annual" ? 12 : frequency === "biweekly" ? 12 / 26 : 1;
    setSalaryInput(
      String(Math.round(convertAmount(boostedMonthlyUSD * factor, currentCurrency)))
    );
    syncIncome(boostedMonthlyUSD);
    setFeedback(
      `Simulated +10% raise! New monthly income: ${formatCurrency(
        boostedMonthlyUSD,
        currentCurrency,
        { showCents: false }
      )}`
    );
  };

  const handleApplyAndLock = () => {
    if (onApplySplitToBudgets) {
      onApplySplitToBudgets({
        monthlyIncomeUSD,
        split: activeRule,
        housingPct,
        groceryPct,
        transportPct,
      });
    }
    if (onUpdateSettings) {
      onUpdateSettings({ planScheduleLocked: !planLocked });
    }
    setFeedback(
      !planLocked
        ? `Schedule locked and ${activeRule.needs}/${activeRule.wants}/${activeRule.wealth} limits synced to Monthly Budgets!`
        : "Plan schedule unlocked for editing."
    );
  };

  const handleExportPlanCSV = () => {
    const decimals = currentCurrency === "JPY" ? 0 : 2;
    const fmt = (usd) => convertAmount(usd, currentCurrency).toFixed(decimals);
    const rows = [
      "WealthWise Salary & Stream Plan",
      `Currency,${currentCurrency}`,
      `Cadence,${frequency}`,
      `Framework,${FRAMEWORKS[ruleKey]?.label || ruleKey}`,
      `Monthly Income,${fmt(monthlyIncomeUSD)}`,
      "",
      "Bucket,Percentage,Monthly Allocation,Annual Allocation",
      `Essential Needs,${activeRule.needs}%,${fmt(needsUSD)},${fmt(needsUSD * 12)}`,
      `Lifestyle & Wants,${activeRule.wants}%,${fmt(wantsUSD)},${fmt(wantsUSD * 12)}`,
      `Wealth Building,${activeRule.wealth}%,${fmt(wealthUSD)},${fmt(wealthUSD * 12)}`,
    ];
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "wealthwise-salary-plan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback(`Salary plan summary exported (${currentCurrency})!`);
  };

  // 3-Stream Breakdown calculations synced to actual Expenses & Budgets
  const latestMonth = useMemo(() => {
    const months = Array.from(
      new Set(expenses.map((e) => (e.date || "").slice(0, 7)).filter(Boolean))
    ).sort();
    return months[months.length - 1] || new Date().toISOString().slice(0, 7);
  }, [expenses]);

  const streamCategories = useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) => (e.date || "").slice(0, 7) === latestMonth
    );
    const actualByCat = new Map();
    monthExpenses.forEach((item) => {
      const cat = (item.category || "Other").trim();
      actualByCat.set(
        cat.toLowerCase(),
        (actualByCat.get(cat.toLowerCase()) || 0) + (parseFloat(item.amount) || 0)
      );
    });

    const seen = new Set();
    const rows = [];

    budgets.forEach((b) => {
      const name = b.category.trim();
      const key = name.toLowerCase();
      seen.add(key);
      rows.push({
        name,
        stream: getCategoryStream(name, b.stream),
        projected: parseFloat(b.budgetAmount) || 0,
        actual: actualByCat.get(key) || 0,
      });
    });

    monthExpenses.forEach((e) => {
      const name = (e.category || "Other").trim();
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        rows.push({
          name,
          stream: getCategoryStream(name, e.stream),
          projected: actualByCat.get(key) || 0,
          actual: actualByCat.get(key) || 0,
        });
      }
    });

    return rows;
  }, [expenses, budgets, latestMonth]);

  const filteredStreamRows =
    streamFilter === "all"
      ? streamCategories
      : streamCategories.filter((r) => r.stream === streamFilter);

  const streamSummary = useMemo(() => {
    const targets = {
      "Essential Needs": needsUSD,
      "Lifestyle & Wants": wantsUSD,
      "Wealth Building": wealthUSD,
    };
    return STREAMS.map((stream) => {
      const items = streamCategories.filter((r) => r.stream === stream);
      const projected = items.reduce((s, r) => s + r.projected, 0);
      const actual = items.reduce((s, r) => s + r.actual, 0);
      const ruleCap = targets[stream] || 0;
      return { stream, items, projected, actual, ruleCap, count: items.length };
    });
  }, [streamCategories, needsUSD, wantsUSD, wealthUSD]);

  const totalActualOutUSD = streamCategories.reduce(
    (s, r) => s + r.actual,
    0
  );
  const safeToSpendUSD = Math.max(0, monthlyIncomeUSD - totalActualOutUSD);

  // What-If Lifestyle Spend Simulator
  const currentWantsActual =
    streamSummary.find((s) => s.stream === "Lifestyle & Wants")?.actual || 150;
  const monthlyFreedUSD = Math.max(0, currentWantsActual - simTargetUSD);
  const annualFreedUSD = monthlyFreedUSD * 12;
  const monthlyRate = apyRate / 100 / 12;
  const compound10YrUSD =
    monthlyRate > 0
      ? monthlyFreedUSD * ((Math.pow(1 + monthlyRate, 120) - 1) / monthlyRate)
      : annualFreedUSD * 10;

  const handleLockSimulationCap = () => {
    if (onSaveBudget) {
      onSaveBudget({
        category: "Entertainment",
        budgetAmount: simTargetUSD,
        stream: "Lifestyle & Wants",
      });
    }
    setRuleLocked(true);
    setFeedback(
      `Locked Lifestyle cap: Entertainment budget updated to ${formatCurrency(
        simTargetUSD,
        currentCurrency,
        { showCents: false }
      )}/mo!`
    );
  };

  const handleCreateStreamCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    const numeric = parseFloat(newCatBudget);
    if (!trimmed || Number.isNaN(numeric) || numeric <= 0) return;
    const budgetUSD = Number(toUSD(numeric, currentCurrency).toFixed(2));
    if (onSaveBudget) {
      onSaveBudget({
        category: trimmed,
        budgetAmount: budgetUSD,
        stream: newCatStream,
      });
    }
    setNewCatName("");
    setNewCatBudget("150");
    setIsCatModalOpen(false);
    setFeedback(`Added "${trimmed}" under ${newCatStream}!`);
  };

  // SVG Ring Math for Allocation Visual
  const ringCircumference = 2 * Math.PI * 44;
  const needsDash = (activeRule.needs / 100) * ringCircumference;
  const wantsDash = (activeRule.wants / 100) * ringCircumference;
  const wealthDash = (activeRule.wealth / 100) * ringCircumference;

  return (
    <div className="flex-1 bg-[#f8f9ff] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
              Salary Splitter &amp; 3-Stream Planner
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Automated salary distribution, multi-currency FX settlement,
              3-stream breakdown, and what-if compounding in {currentCurrency}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveView("splitter")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeView === "splitter"
                    ? "bg-[#006948] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0b1c30]"
                }`}
              >
                Salary Splitter
              </button>
              <button
                type="button"
                onClick={() => setActiveView("streams")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeView === "streams"
                    ? "bg-[#006948] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0b1c30]"
                }`}
              >
                3-Stream Breakdown
              </button>
            </div>

            {onOpenFXModal && (
              <button
                type="button"
                onClick={onOpenFXModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#006948]" />
                <span>Manage FX Routes ({currentCurrency})</span>
              </button>
            )}
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

        {activeView === "splitter" ? (
          <div className="space-y-6">
            {/* Top Controls + Multi-Currency Settlement Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
                <div className="lg:col-span-4 space-y-1.5">
                  <label
                    htmlFor="planner-income-input"
                    className="block text-xs font-semibold text-slate-600"
                  >
                    Take-Home Income ({currencySymbol} {currentCurrency})
                  </label>
                  <input
                    id="planner-income-input"
                    type="number"
                    min="0"
                    step="100"
                    value={salaryInput}
                    onChange={(e) => handleSalaryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-lg font-bold font-mono tabular-nums text-[#0b1c30] bg-[#eff4ff]/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:bg-white"
                  />
                </div>

                <div className="lg:col-span-4 space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-600">
                    Paycheck Cadence
                  </span>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200">
                    {["biweekly", "monthly", "annual"].map((cadence) => (
                      <button
                        key={cadence}
                        type="button"
                        onClick={() => handleFrequencyChange(cadence)}
                        className={`py-2 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                          frequency === cadence
                            ? "bg-white text-[#006948] shadow-xs"
                            : "text-slate-600 hover:text-[#0b1c30]"
                        }`}
                      >
                        {cadence === "biweekly" ? "Bi-Weekly" : cadence}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-1.5">
                  <label
                    htmlFor="planner-rule-select"
                    className="block text-xs font-semibold text-slate-600"
                  >
                    Automation Framework
                  </label>
                  <select
                    id="planner-rule-select"
                    value={ruleKey}
                    onChange={(e) => handleRuleSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold text-[#0b1c30] bg-[#eff4ff] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  >
                    {Object.entries(FRAMEWORKS).map(([key, fw]) => (
                      <option key={key} value={key}>
                        {fw.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {ruleKey === "custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                  {[
                    { label: "Housing", val: housingPct, set: setHousingPct, max: 50 },
                    { label: "Food & Groceries", val: groceryPct, set: setGroceryPct, max: 30 },
                    { label: "Transport & Bills", val: transportPct, set: setTransportPct, max: 25 },
                    { label: "Lifestyle & Wants", val: wantsPct, set: setWantsPct, max: 50 },
                  ].map((slider) => (
                    <div key={slider.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          {slider.label}
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-[#0b1c30]">
                          {slider.val}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={slider.max}
                        value={slider.val}
                        onChange={(e) => slider.set(Number(e.target.value))}
                        className="w-full accent-[#006948] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* International Settlement Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#eff4ff] border border-[#006948]/20">
                <div>
                  <p className="text-xs font-bold text-[#0b1c30]">
                    Multi-Currency Settlement &amp; FX Lock
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Split payroll across USD, EUR, GBP, JPY, CAD, AUD, INR, and
                    CHF with 0.05% interbank spread.
                  </p>
                </div>
                {onOpenFXModal && (
                  <button
                    type="button"
                    onClick={onOpenFXModal}
                    className="px-3 py-1.5 rounded-lg bg-white text-[#006948] hover:bg-[#006948] hover:text-white transition-colors text-xs font-bold border border-slate-200 cursor-pointer"
                  >
                    Open FX Spot Matrix
                  </button>
                )}
              </div>
            </div>

            {/* 4 Metric Pillar Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500">
                  Monthly Gross Take-Home
                </p>
                <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
                  {formatCurrency(monthlyIncomeUSD, currentCurrency)}
                </p>
                <p className="mt-1 text-xs text-[#006948] font-medium">
                  Ready for scheduled split
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">
                    Automated Needs
                  </span>
                  <span className="font-mono tabular-nums font-bold text-[#0b1c30]">
                    {activeRule.needs}%
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
                  {formatCurrency(needsUSD, currentCurrency)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Shelter, groceries &amp; baseline
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">
                    Discretionary Fun
                  </span>
                  <span className="font-mono tabular-nums font-bold text-teal-700">
                    {activeRule.wants}%
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
                  {formatCurrency(wantsUSD, currentCurrency)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Dining, hobbies &amp; lifestyle
                </p>
              </div>

              <div className="bg-[#006948] text-white rounded-xl p-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-emerald-100">
                    Wealth Auto-Transfer
                  </span>
                  <span className="font-mono tabular-nums font-bold text-[#85f8c4]">
                    {activeRule.wealth}%
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
                  {formatCurrency(wealthUSD, currentCurrency)}
                </p>
                <p className="mt-1 text-xs text-[#85f8c4]">
                  {formatCurrency(wealthUSD * 12, currentCurrency, {
                    showCents: false,
                  })}
                  /yr savings pace
                </p>
              </div>
            </div>

            {/* Bottom 2-Column Split: Visual Allocation Ring + Smart Auto-Save Engine & Executive Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Allocation Ring & Zero-Deficit Breakdown */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#0b1c30]">
                      Zero-Based Split Breakdown
                    </h2>
                    <p className="text-xs text-slate-500">
                      100% of paycheck assigned across 3 streams
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#006948]">
                    Zero-Deficit
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative w-32 h-32 shrink-0">
                    <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
                      <circle
                        cx="55"
                        cy="55"
                        r="44"
                        fill="none"
                        stroke="#eff4ff"
                        strokeWidth="12"
                      />
                      <circle
                        cx="55"
                        cy="55"
                        r="44"
                        fill="none"
                        stroke="#0b1c30"
                        strokeWidth="12"
                        strokeDasharray={`${needsDash} ${ringCircumference}`}
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="55"
                        cy="55"
                        r="44"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="12"
                        strokeDasharray={`${wantsDash} ${ringCircumference}`}
                        strokeDashoffset={-needsDash}
                      />
                      <circle
                        cx="55"
                        cy="55"
                        r="44"
                        fill="none"
                        stroke="#006948"
                        strokeWidth="12"
                        strokeDasharray={`${wealthDash} ${ringCircumference}`}
                        strokeDashoffset={-(needsDash + wantsDash)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-slate-500">
                        Allocated
                      </span>
                      <span className="text-sm font-bold font-mono tabular-nums text-[#0b1c30]">
                        100%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-[#0b1c30]">
                        <span className="w-3 h-3 rounded-sm bg-[#0b1c30]" />
                        Fixed Needs ({activeRule.needs}%)
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#0b1c30]">
                        {formatCurrency(needsUSD, currentCurrency, {
                          showCents: false,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-[#0b1c30]">
                        <span className="w-3 h-3 rounded-sm bg-teal-600" />
                        Discretionary ({activeRule.wants}%)
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#0b1c30]">
                        {formatCurrency(wantsUSD, currentCurrency, {
                          showCents: false,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-medium text-[#0b1c30]">
                        <span className="w-3 h-3 rounded-sm bg-[#006948]" />
                        Wealth &amp; Savings ({activeRule.wealth}%)
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#006948]">
                        {formatCurrency(wealthUSD, currentCurrency, {
                          showCents: false,
                        })}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500">Surplus Buffer:</span>
                      <span className="font-mono tabular-nums font-bold text-[#006948]">
                        {formatCurrency(0, currentCurrency, {
                          showCents: false,
                        })}{" "}
                        (Zero-Deficit)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Auto-Save Engine + Executive Actions Deck */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#85f8c4]/40 text-[#006948] flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#0b1c30]">
                          Smart Auto-Save Engine
                        </h3>
                        <p className="text-xs text-slate-500">
                          Automatic split on the 1st into {apyRate}% APY Vaults
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={engineActive}
                        onChange={(e) => {
                          onUpdateSettings &&
                            onUpdateSettings({
                              autoSaveEngineActive: e.target.checked,
                            });
                          setFeedback(
                            e.target.checked
                              ? "Smart Auto-Save Engine activated."
                              : "Auto-Save Engine paused."
                          );
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006948]"></div>
                    </label>
                  </div>

                  {/* Bank Card Preview Widget */}
                  <div className="p-3.5 rounded-xl bg-[#eff4ff] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-2.5 py-1 rounded bg-[#0b1c30] text-white text-[10px] font-mono font-bold tracking-wider shrink-0">
                        BANK
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0b1c30] truncate">
                          {primaryAccount.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono tabular-nums">
                          ···· {primaryAccount.last4} · Direct Deposit Ingest
                        </p>
                      </div>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#006948] shrink-0" />
                  </div>

                  {/* Executive Actions */}
                  <button
                    type="button"
                    onClick={handleApplyAndLock}
                    className={`w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      planLocked
                        ? "bg-[#00855d] hover:bg-[#006948]"
                        : "bg-[#006948] hover:bg-[#00855d]"
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {planLocked
                        ? "Schedule Locked · Synced to Budgets"
                        : "Apply Split & Lock Plan Schedule"}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleSimulateRaise}
                      className="py-2 px-3 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-[#006948]" />
                      <span>Simulate Raise (+10%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPlanCSV}
                      className="py-2 px-3 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#006948]" />
                      <span>Export Plan CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 3-Stream Breakdown & What-If Simulator View */
          <div className="space-y-6">
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500">Total Inflow</p>
                <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
                  {formatCurrency(monthlyIncomeUSD, currentCurrency, {
                    showCents: false,
                  })}
                </p>
                <p className="mt-1 text-xs text-[#006948]">
                  Monthly net salary
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500">
                  Tracked Outflows ({latestMonth})
                </p>
                <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
                  {formatCurrency(totalActualOutUSD, currentCurrency, {
                    showCents: false,
                  })}
                </p>
                <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                  {monthlyIncomeUSD > 0
                    ? `${((totalActualOutUSD / monthlyIncomeUSD) * 100).toFixed(
                        1
                      )}% of monthly income`
                    : "0%"}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500">
                  Safe-to-Spend Residual
                </p>
                <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#006948]">
                  {formatCurrency(safeToSpendUSD, currentCurrency, {
                    showCents: false,
                  })}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Available unspent liquidity
                </p>
              </div>
              <div className="bg-[#eff4ff] border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-600">
                  Active Categories
                </p>
                <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
                  {streamCategories.length}
                </p>
                <p className="mt-1 text-xs text-[#006948] font-semibold">
                  Synced across 3 streams
                </p>
              </div>
            </div>

            {/* 3 Pillar Rule Comparison Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {streamSummary.map((item) => {
                const cap = Math.max(item.projected, item.ruleCap);
                const pctOfIncome =
                  monthlyIncomeUSD > 0
                    ? ((item.actual / monthlyIncomeUSD) * 100).toFixed(1)
                    : "0.0";
                const fillPct =
                  cap > 0 ? Math.min(100, Math.round((item.actual / cap) * 100)) : 0;
                const buffer = cap - item.actual;

                return (
                  <div
                    key={item.stream}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-[#0b1c30]">
                        {item.stream}
                      </h3>
                      <span className="text-xs font-mono tabular-nums font-semibold text-[#006948]">
                        {pctOfIncome}% Actual
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold font-mono tabular-nums text-[#0b1c30]">
                        {formatCurrency(item.actual, currentCurrency, {
                          showCents: false,
                        })}
                      </span>
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        Rule Cap:{" "}
                        {formatCurrency(item.ruleCap, currentCurrency, {
                          showCents: false,
                        })}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-[#eff4ff] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#006948] rounded-full transition-all duration-300"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 font-mono tabular-nums">
                      <span>
                        {buffer >= 0
                          ? `${formatCurrency(buffer, currentCurrency, {
                              showCents: false,
                            })} buffer left`
                          : `${formatCurrency(
                              Math.abs(buffer),
                              currentCurrency,
                              { showCents: false }
                            )} over`}
                      </span>
                      <span className="font-sans font-semibold text-[#006948]">
                        {buffer >= 0 ? "Optimal" : "Over Cap"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category Table + What-If Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[#0b1c30]">
                      Stream Ledger Breakdown ({latestMonth})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Compare category budget caps vs. real recorded expenses
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200">
                      {["all", ...STREAMS].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStreamFilter(st)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            streamFilter === st
                              ? "bg-[#0b1c30] text-white"
                              : "text-slate-600 hover:text-[#0b1c30]"
                          }`}
                        >
                          {st === "all" ? "All" : st.split(" ")[0]}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCatModalOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Category</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#eff4ff]/70 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Stream</th>
                        <th className="px-5 py-3 text-right">Budget Cap</th>
                        <th className="px-5 py-3 text-right">Actual</th>
                        <th className="px-5 py-3 text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredStreamRows.map((row) => {
                        const diff = row.projected - row.actual;
                        return (
                          <tr
                            key={row.name}
                            className="hover:bg-[#eff4ff]/40 transition-colors"
                          >
                            <td className="px-5 py-3.5 font-medium text-[#0b1c30]">
                              {row.name}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-500">
                              {row.stream}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-700">
                              {formatCurrency(row.projected, currentCurrency)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono tabular-nums font-semibold text-[#0b1c30]">
                              {formatCurrency(row.actual, currentCurrency)}
                            </td>
                            <td
                              className={`px-5 py-3.5 text-right font-mono tabular-nums font-semibold ${
                                diff >= 0 ? "text-[#006948]" : "text-rose-600"
                              }`}
                            >
                              {diff >= 0 ? "+" : "-"}
                              {formatCurrency(Math.abs(diff), currentCurrency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* What-If Expense Simulator */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-[#006948]">
                  <Sparkles className="w-4 h-4" />
                  <h2 className="text-base font-bold text-[#0b1c30]">
                    What-If Expense Simulator
                  </h2>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Adjust your monthly Lifestyle &amp; Wants target to preview
                  immediate liquidity freed and {apyRate}% compounded wealth
                  over 10 years.
                </p>

                <div className="space-y-2 p-3.5 rounded-xl bg-[#eff4ff]">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#0b1c30]">Discretionary Target</span>
                    <span className="font-mono tabular-nums text-[#006948]">
                      {formatCurrency(simTargetUSD, currentCurrency, {
                        showCents: false,
                      })}
                      /mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(400, Math.round(currentWantsActual * 1.5))}
                    step="10"
                    value={simTargetUSD}
                    onChange={(e) => {
                      setSimTargetUSD(Number(e.target.value));
                      setRuleLocked(false);
                    }}
                    className="w-full accent-[#006948] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#eff4ff]">
                    <span className="text-slate-500 block">Monthly Freed</span>
                    <span className="mt-1 block text-base font-bold font-mono tabular-nums text-[#006948]">
                      +{formatCurrency(monthlyFreedUSD, currentCurrency, {
                        showCents: false,
                      })}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#eff4ff]">
                    <span className="text-slate-500 block">Annual Freed</span>
                    <span className="mt-1 block text-base font-bold font-mono tabular-nums text-[#0b1c30]">
                      +{formatCurrency(annualFreedUSD, currentCurrency, {
                        showCents: false,
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0b1c30] text-white space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">10-Year Compounded</span>
                    <span className="font-mono tabular-nums font-bold text-[#85f8c4]">
                      +{formatCurrency(compound10YrUSD, currentCurrency, {
                        showCents: false,
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Assumes surplus swept to {apyRate}% APY savings vaults
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLockSimulationCap}
                  className={`w-full py-2.5 rounded-lg text-white text-xs font-semibold transition-colors cursor-pointer ${
                    ruleLocked
                      ? "bg-[#00855d]"
                      : "bg-[#006948] hover:bg-[#00855d]"
                  }`}
                >
                  {ruleLocked
                    ? "Allocation Rule Locked & Synced!"
                    : "Lock Allocation Rule to Budgets"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimTargetUSD(120);
                    setRuleLocked(false);
                    setFeedback("Simulator reset to defaults.");
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b1c30] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Simulator Defaults</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Category Modal inside Stream Breakdown */}
      {isCatModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/55 backdrop-blur-xs"
          onClick={() => setIsCatModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Add Stream Category Budget
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-[#0b1c30] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateStreamCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Category Label
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Subscriptions, Pet Care"
                  required
                  className="w-full px-3 py-2 text-sm text-[#0b1c30] bg-[#eff4ff]/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Bucket Stream
                </label>
                <select
                  value={newCatStream}
                  onChange={(e) => setNewCatStream(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-[#0b1c30] bg-[#eff4ff]/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                >
                  {STREAMS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Monthly Cap ({currencySymbol} {currentCurrency})
                </label>
                <input
                  type="number"
                  min="1"
                  step={currentCurrency === "JPY" ? "1" : "0.01"}
                  value={newCatBudget}
                  onChange={(e) => setNewCatBudget(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums text-[#0b1c30] bg-[#eff4ff]/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#eff4ff] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalaryPlanner;
