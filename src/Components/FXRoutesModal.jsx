import React, { useState, useEffect } from "react";
import { X, ArrowLeftRight, RefreshCw, RotateCcw } from "lucide-react";
import {
  CURRENCIES,
  setCustomExchangeRates,
  resetExchangeRates,
} from "../utils/currency";

function FXRoutesModal({
  isOpen,
  onClose,
  baseCurrency,
  onSelectBaseCurrency,
  onRatesUpdated,
  onSavePreferences,
}) {
  const [autoLockDuration, setAutoLockDuration] = useState("24h");
  const [targetHedgePair, setTargetHedgePair] = useState("USD_JPY");
  const [dualCurrencySweepEnabled, setDualCurrencySweepEnabled] =
    useState(true);
  const [draftRates, setDraftRates] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const initial = {};
    Object.entries(CURRENCIES).forEach(([code, info]) => {
      initial[code] = String(info.rateAgainstUSD);
    });
    setDraftRates(initial);
    setSyncStatus("");

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRateInputChange = (code, value) => {
    setDraftRates((prev) => ({ ...prev, [code]: value }));
  };

  const handleSyncLiveRates = async () => {
    setSyncing(true);
    setSyncStatus("");
    try {
      const res = await fetch("/api/fx-rates");
      const data = await res.json();
      if (data?.rates) {
        setCustomExchangeRates(data.rates);
        const updatedDraft = {};
        Object.entries(CURRENCIES).forEach(([code, info]) => {
          updatedDraft[code] = String(info.rateAgainstUSD);
        });
        setDraftRates(updatedDraft);
        onRatesUpdated && onRatesUpdated();
        setSyncStatus(
          data.source === "live"
            ? "Synced live mid-market FX rates."
            : "Applied standard reference FX rates."
        );
      }
    } catch {
      setSyncStatus("Could not reach live FX feed; keeping current rates.");
    } finally {
      setSyncing(false);
    }
  };

  const handleResetDefaults = () => {
    resetExchangeRates();
    const updatedDraft = {};
    Object.entries(CURRENCIES).forEach(([code, info]) => {
      updatedDraft[code] = String(info.rateAgainstUSD);
    });
    setDraftRates(updatedDraft);
    onRatesUpdated && onRatesUpdated();
    setSyncStatus("Restored default FX rates.");
  };

  const handleSave = () => {
    const numericRates = {};
    Object.entries(draftRates).forEach(([code, val]) => {
      const num = parseFloat(val);
      if (Number.isFinite(num) && num > 0) {
        numericRates[code] = num;
      }
    });
    setCustomExchangeRates(numericRates);
    onRatesUpdated && onRatesUpdated();

    if (onSavePreferences) {
      onSavePreferences({
        autoLockDuration,
        targetHedgePair,
        dualCurrencySweepEnabled,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/60 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fx-routes-modal-title"
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="fx-routes-modal-title"
                className="text-lg font-bold text-[#0b1c30]"
              >
                Global Currency &amp; FX Rate Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Switch workspace base currency or sync exchange rates across 8
                currencies
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close FX modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#0b1c30]">
            Select Active Base Currency (Rate per 1 USD)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncLiveRates}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#eff4ff] text-[#006948] hover:bg-[#dce9ff] disabled:opacity-50 cursor-pointer transition-colors"
            >
              <RefreshCw
                className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`}
              />
              <span>{syncing ? "Syncing..." : "Sync Live Rates"}</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-[#006948]">
            {syncStatus}
          </div>
        )}

        {/* Live FX Rates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.entries(CURRENCIES).map(([code, cur]) => {
            const active = baseCurrency === code;
            return (
              <div
                key={code}
                className={`p-2.5 rounded-xl border transition-colors ${
                  active
                    ? "border-[#006948] bg-[#006948]/8"
                    : "border-slate-200 bg-[#eff4ff]/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectBaseCurrency(code)}
                  className="w-full text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#0b1c30]">
                      {cur.symbol} {code}
                    </span>
                    {active && (
                      <span className="text-[10px] font-bold text-[#006948]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {cur.name}
                  </p>
                </button>
                <div className="mt-2">
                  {code === "USD" ? (
                    <div className="px-2 py-1 text-[11px] font-mono tabular-nums text-slate-500 bg-white/70 border border-slate-200 rounded">
                      1.0000
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      aria-label={`${code} rate per 1 USD`}
                      value={draftRates[code] ?? cur.rateAgainstUSD}
                      onChange={(e) =>
                        handleRateInputChange(code, e.target.value)
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono tabular-nums text-[#0b1c30] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#006948]"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Routing Options */}
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-xl bg-[#eff4ff] flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#0b1c30]">
                Auto-Convert Multi-Currency Vault Targets
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Keep target vaults synchronized when switching workspace display
                currency
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={dualCurrencySweepEnabled}
                onChange={(e) => setDualCurrencySweepEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006948]"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="fx-lock-window"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Rate Lock Window
              </label>
              <select
                id="fx-lock-window"
                value={autoLockDuration}
                onChange={(e) => setAutoLockDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs font-semibold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006948]"
              >
                <option value="12h">12 Hours Pre-Deposit</option>
                <option value="24h">24 Hours Standard</option>
                <option value="48h">48 Hours Extended</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="fx-target-pair"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Priority Foreign Vault Pair
              </label>
              <select
                id="fx-target-pair"
                value={targetHedgePair}
                onChange={(e) => setTargetHedgePair(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs font-semibold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006948]"
              >
                <option value="USD_JPY">JPY · Travel &amp; Reserve</option>
                <option value="EUR_USD">EUR · European Settlement</option>
                <option value="GBP_USD">GBP · UK Reserve</option>
                <option value="INR_USD">INR · Domestic Transfers</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-[#eff4ff] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#006948] text-white hover:bg-[#00855d] cursor-pointer"
          >
            Apply Currency &amp; Rates
          </button>
        </div>
      </div>
    </div>
  );
}

export default FXRoutesModal;
