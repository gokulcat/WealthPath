import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  CheckCircle2,
  TrendingUp,
  Lock,
  Zap,
  ShieldCheck,
  Download,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import {
  CURRENCIES,
  convertAmount,
  formatCurrency,
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
  onCurrencyChange,
  onOpenFXModal,
  incomeConfig,
  onUpdateIncomeConfig,
  onApplySplitToBudgets,
  settings,
  onUpdateSettings,
}) {
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

  const syncIncome = (
    nextMonthlyUSD,
    nextFreq = frequency,
    nextRule = ruleKey
  ) => {
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
      String(
        Math.round(convertAmount(boostedMonthlyUSD * factor, currentCurrency))
      )
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
      `Essential Needs,${activeRule.needs}%,${fmt(needsUSD)},${fmt(
        needsUSD * 12
      )}`,
      `Lifestyle & Wants,${activeRule.wants}%,${fmt(wantsUSD)},${fmt(
        wantsUSD * 12
      )}`,
      `Wealth Building,${activeRule.wealth}%,${fmt(wealthUSD)},${fmt(
        wealthUSD * 12
      )}`,
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

  // SVG Ring Math for Allocation Visual
  const ringCircumference = 2 * Math.PI * 44;
  const needsDash = (activeRule.needs / 100) * ringCircumference;
  const wantsDash = (activeRule.wants / 100) * ringCircumference;
  const wealthDash = (activeRule.wealth / 100) * ringCircumference;

  return (
    <div className="flex-1 bg-[#f8f9ff] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header + Inline 8-Currency Quick Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
              Salary Calculator &amp; Automated Split
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Distribute take-home income across needs, wants, and high-yield
              wealth sweeps in {currentCurrency}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <Link
              to="/budget"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#006948]" />
              <span>3-Stream Breakdown</span>
            </Link>

            {onOpenFXModal && (
              <button
                type="button"
                onClick={onOpenFXModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#006948]" />
                <span>Manage FX Routes</span>
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
                {
                  label: "Food & Groceries",
                  val: groceryPct,
                  set: setGroceryPct,
                  max: 30,
                },
                {
                  label: "Transport & Bills",
                  val: transportPct,
                  set: setTransportPct,
                  max: 25,
                },
                {
                  label: "Lifestyle & Wants",
                  val: wantsPct,
                  set: setWantsPct,
                  max: 50,
                },
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
                Split payroll across USD, EUR, GBP, JPY, CAD, AUD, INR, and CHF
                with 0.05% interbank spread.
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
              <div className="relative w-36 h-36 shrink-0">
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
                  <span className="text-[10px] text-slate-500">Allocated</span>
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

          {/* Smart Auto-Save Engine + Executive Actions Deck + FDIC Assurance */}
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
                      Automatic ACH split on the 1st into {apyRate}% APY Vaults
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

              {/* Dual-Currency Sweep & Target Recipient */}
              <div className="space-y-2 text-xs">
                <div className="px-3.5 py-2 rounded-lg bg-[#eff4ff]/80 flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#006948]" />
                    <span>Dual-Currency Sweep</span>
                  </span>
                  <span className="font-semibold text-[#006948]">
                    {currentCurrency} Auto-Conversion Active
                  </span>
                </div>
                <div className="flex items-center justify-between px-1 text-slate-500">
                  <span>Target Recipient</span>
                  <span className="font-bold text-[#006948]">
                    WealthWise Treasury HYSA
                  </span>
                </div>
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

            {/* FDIC Insured Sweep Assurance */}
            <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-slate-200 flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#006948] shrink-0" />
              <p className="text-xs text-slate-600">
                FDIC Insured sweeps up to{" "}
                <span className="font-mono font-bold text-[#0b1c30]">
                  {formatCurrency(2500000, currentCurrency, {
                    showCents: false,
                  })}
                </span>{" "}
                across participating network banks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalaryPlanner;
