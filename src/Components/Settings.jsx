import React, { useState } from "react";
import {
  CheckCircle2,
  ArrowLeftRight,
  Download,
  RotateCcw,
  Landmark,
  ShieldCheck,
  Plus,
  Trash2,
  Bell,
} from "lucide-react";
import { CURRENCIES } from "../utils/currency";
import { exportExpensesAndAnalyticsCSV } from "../utils/exportCsv";

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-t border-slate-100 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm font-semibold text-[#0b1c30]">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
          checked ? "bg-[#006948]" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function Settings({
  currentCurrency = "USD",
  onCurrencyChange,
  onOpenFXModal,
  settings,
  onUpdateSettings,
  expenses = [],
  budgets = [],
  goals = [],
  onResetDemoData,
  onTriggerSampleAlert,
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newBankLast4, setNewBankLast4] = useState("");
  const [newBankRole, setNewBankRole] = useState("Linked Savings");

  const apyRate = settings?.apyRate ?? 4.85;
  const roundUpMultiplier = settings?.roundUpMultiplier ?? 1;
  const autoSweepDay = settings?.autoSweepDay ?? "sunday";
  const zeroDeficitProtection = settings?.zeroDeficitProtection ?? true;
  const fdicPassThrough = settings?.fdicPassThrough ?? true;
  const twoFactorAuth = settings?.twoFactorAuth ?? true;
  const budgetAlertsEnabled = settings?.budgetAlertsEnabled ?? true;
  const budgetAlertThreshold = settings?.budgetAlertThreshold ?? 80;
  const accounts = settings?.accounts || [];

  const handleAddAccount = (e) => {
    e.preventDefault();
    const trimmedName = newBankName.trim();
    const cleanedLast4 = newBankLast4.replace(/\D/g, "").slice(-4);
    if (!trimmedName || cleanedLast4.length < 4) return;

    const nextAccounts = [
      ...accounts,
      {
        name: trimmedName,
        last4: cleanedLast4,
        role: newBankRole,
        note: "Verified ACH rail · Eligible for automated vault sweeps",
      },
    ];
    onUpdateSettings && onUpdateSettings({ accounts: nextAccounts });
    setNewBankName("");
    setNewBankLast4("");
    setShowAddAccount(false);
    setFeedback(`Linked ${trimmedName} (···· ${cleanedLast4}).`);
  };

  const handleRemoveAccount = (idx) => {
    const target = accounts[idx];
    const nextAccounts = accounts.filter((_, i) => i !== idx);
    onUpdateSettings && onUpdateSettings({ accounts: nextAccounts });
    if (target) {
      setFeedback(`Unlinked ${target.name} (···· ${target.last4}).`);
    }
  };

  const handleExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      currency: currentCurrency,
      settings,
      expenses,
      budgets,
      goals,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "wealthwise-workspace-backup.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback("Full workspace backup exported as JSON!");
  };

  return (
    <div className="flex-1 bg-[#f8f9ff] py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
            Workspace &amp; Automation Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage linked bank rails, multi-currency settlement, autonomous
            sweep rules, security, and backups
          </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connected Bank Accounts */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#eff4ff] text-[#006948]">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0b1c30]">
                    Connected Bank Accounts
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ACH deposit &amp; overflow rails feeding your budget streams
                    and vaults
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAccount((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#006948] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddAccount ? "Close" : "Link Account"}</span>
              </button>
            </div>

            {showAddAccount && (
              <form
                onSubmit={handleAddAccount}
                className="rounded-xl bg-[#eff4ff]/70 border border-slate-200 p-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="bank-name"
                      className="block text-[11px] font-semibold text-[#0b1c30] mb-1"
                    >
                      Institution / Account Name
                    </label>
                    <input
                      id="bank-name"
                      type="text"
                      required
                      placeholder="e.g., Treasury Reserve"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      className="w-full px-3 py-2 text-xs text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bank-last4"
                      className="block text-[11px] font-semibold text-[#0b1c30] mb-1"
                    >
                      Last 4 Digits
                    </label>
                    <input
                      id="bank-last4"
                      type="text"
                      required
                      maxLength={4}
                      placeholder="3044"
                      value={newBankLast4}
                      onChange={(e) => setNewBankLast4(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <select
                    aria-label="Account role"
                    value={newBankRole}
                    onChange={(e) => setNewBankRole(e.target.value)}
                    className="px-3 py-2 text-xs font-medium text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  >
                    <option value="Primary Ingest">Primary Ingest</option>
                    <option value="Linked Overflow">Linked Overflow</option>
                    <option value="Linked Savings">Linked Savings</option>
                    <option value="FX Multi-Currency">FX Multi-Currency</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg cursor-pointer"
                  >
                    Connect Rail
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {accounts.map((acc, idx) => (
                <div
                  key={`${acc.name}-${acc.last4}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#eff4ff]/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0b1c30]">
                      <span className="truncate">{acc.name}</span>
                      <span className="font-mono text-xs text-slate-500 shrink-0">
                        ···· {acc.last4}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {acc.role} · {acc.note}
                    </p>
                  </div>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(idx)}
                      aria-label={`Remove ${acc.name}`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 8-Currency Settlement Selector */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#0b1c30]">
                  Base Settlement Currency
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  All expenses, budgets, salary splits, and vaults convert live
                </p>
              </div>
              {onOpenFXModal && (
                <button
                  type="button"
                  onClick={onOpenFXModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#006948] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>FX Matrix</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.values(CURRENCIES).map((c) => {
                const isActive = currentCurrency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onCurrencyChange && onCurrencyChange(c.code);
                      setFeedback(
                        `Display currency switched to ${c.code} (${c.name}).`
                      );
                    }}
                    className={`text-left rounded-xl p-3 border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#0b1c30] text-white border-[#0b1c30]"
                        : "bg-[#eff4ff]/50 text-[#0b1c30] border-slate-200 hover:border-[#006948]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold font-mono">
                        {c.symbol}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isActive ? "text-[#85f8c4]" : "text-[#006948]"
                        }`}
                      >
                        {c.code}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-[11px] truncate ${
                        isActive ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {c.name}
                    </p>
                    <p
                      className={`mt-0.5 text-[10px] font-mono tabular-nums ${
                        isActive ? "text-slate-400" : "text-slate-400"
                      }`}
                    >
                      1 USD = {c.rateAgainstUSD}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Autonomous Sweep Execution Rules */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#0b1c30]">
                Autonomous Sweep Execution Rules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Used by Dashboard projections, Goal vaults, and the Spending
                Simulator
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="settings-apy"
                  className="block text-xs font-semibold text-[#0b1c30] mb-1.5"
                >
                  Annual APY (%)
                </label>
                <input
                  id="settings-apy"
                  type="number"
                  step="0.05"
                  min="0"
                  max="20"
                  value={apyRate}
                  onChange={(e) =>
                    onUpdateSettings &&
                    onUpdateSettings({
                      apyRate: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono tabular-nums text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              <div>
                <label
                  htmlFor="settings-sweep-day"
                  className="block text-xs font-semibold text-[#0b1c30] mb-1.5"
                >
                  Surplus Sweep Day
                </label>
                <select
                  id="settings-sweep-day"
                  value={autoSweepDay}
                  onChange={(e) => {
                    onUpdateSettings &&
                      onUpdateSettings({ autoSweepDay: e.target.value });
                    setFeedback("Surplus sweep schedule updated.");
                  }}
                  className="w-full px-3.5 py-2 text-sm font-medium text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948]"
                >
                  <option value="sunday">Every Sunday</option>
                  <option value="friday">Every Friday</option>
                  <option value="monthly">End of Month</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-[#0b1c30]">
                Round-Up Spare Change Multiplier
              </span>
              <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200">
                {[1, 2, 5].map((mult) => (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => {
                      onUpdateSettings &&
                        onUpdateSettings({ roundUpMultiplier: mult });
                      setFeedback(`Round-up multiplier set to ${mult}x.`);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                      roundUpMultiplier === mult
                        ? "bg-[#006948] text-white"
                        : "text-slate-600 hover:text-[#0b1c30]"
                    }`}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <ToggleSwitch
                checked={zeroDeficitProtection}
                onChange={(val) => {
                  onUpdateSettings &&
                    onUpdateSettings({ zeroDeficitProtection: val });
                  setFeedback(
                    val
                      ? "Zero-Deficit Balance Protection enabled."
                      : "Zero-Deficit Balance Protection disabled."
                  );
                }}
                label="Zero-Deficit Balance Protection"
                description="Pause automated vault sweeps whenever checking reserve drops below your 10% safety buffer."
              />
              <ToggleSwitch
                checked={fdicPassThrough}
                onChange={(val) => {
                  onUpdateSettings && onUpdateSettings({ fdicPassThrough: val });
                  setFeedback(
                    val
                      ? "Multi-Bank FDIC Pass-Through Sweeps enabled."
                      : "Multi-Bank FDIC Pass-Through Sweeps paused."
                  );
                }}
                label="Multi-Bank FDIC Pass-Through Sweeps"
                description="Distribute high-yield vault balances across partner program banks for extended coverage."
              />
            </div>
          </section>

          {/* Security, Encryption & Budget Alert Preferences */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#eff4ff] text-[#006948]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0b1c30]">
                    Security &amp; Real-Time Budget Alerts
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Multi-factor verification and live budget threshold alert
                    rules
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <ToggleSwitch
                  checked={twoFactorAuth}
                  onChange={(val) => {
                    onUpdateSettings && onUpdateSettings({ twoFactorAuth: val });
                    setFeedback(
                      val
                        ? "Two-Factor Authentication (TOTP) enabled."
                        : "Two-Factor Authentication (TOTP) disabled."
                    );
                  }}
                  label="Two-Factor Authentication (TOTP)"
                  description="Require authenticator verification for external bank transfers and vault unlinking."
                />

                <ToggleSwitch
                  checked={budgetAlertsEnabled}
                  onChange={(val) => {
                    onUpdateSettings &&
                      onUpdateSettings({ budgetAlertsEnabled: val });
                    setFeedback(
                      val
                        ? "Real-time budget threshold alerts enabled."
                        : "Real-time budget threshold alerts paused."
                    );
                  }}
                  label="Real-Time Budget Threshold Alerts"
                  description="Alert via live toast and bell indicator when category spending approaches or exceeds its monthly cap."
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <div>
                  <p className="text-xs font-semibold text-[#0b1c30]">
                    Approaching Warning Threshold
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Fires warning alert before reaching 100% cap
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200 self-start sm:self-auto">
                  {[70, 75, 80, 90].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        onUpdateSettings &&
                          onUpdateSettings({ budgetAlertThreshold: pct });
                        setFeedback(`Warning threshold set to ${pct}%.`);
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                        budgetAlertThreshold === pct
                          ? "bg-[#006948] text-white"
                          : "text-slate-600 hover:text-[#0b1c30]"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {onTriggerSampleAlert && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onTriggerSampleAlert}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#006948] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Test Real-Time Budget Toast Alert</span>
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#0b1c30] text-white p-4 space-y-1.5">
              <p className="text-xs font-semibold text-[#85f8c4]">
                Local-First Ledger Persistence Active
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                All expenses, monthly limits, salary splits, and vault goals are
                stored cleanly in USD inside your browser workspace with
                instant JSON &amp; CSV portability.
              </p>
            </div>
          </section>

          {/* Data Portability & Reset */}
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0b1c30]">
                Data Portability &amp; Workspace Reset
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Export your complete ledger, budgets, and vaults or restore the
                starter demo workspace
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#006948]" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportExpensesAndAnalyticsCSV(
                    expenses,
                    budgets,
                    "",
                    currentCurrency
                  );
                  setFeedback(`CSV report exported (${currentCurrency}).`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#006948]" />
                <span>Export CSV Report</span>
              </button>

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDemoData && onResetDemoData();
                      setConfirmReset(false);
                      setFeedback("Workspace restored to initial demo data.");
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#eff4ff] rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
