import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ShieldAlert,
  X,
  ArrowRight,
  SlidersHorizontal,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { formatAlertSummaryText } from "../utils/budgetAlerts";

const TOAST_TTL_MS = 8000;

function ToastItem({
  toast,
  currentCurrency,
  onDismiss,
  onInspect,
  onAdjustLimit,
}) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => {
      onDismiss(toast.toastId);
    }, TOAST_TTL_MS);
    return () => clearTimeout(timer);
  }, [toast.toastId, paused, onDismiss]);

  const isExceeded = toast.severity === "exceeded";
  const barWidth = Math.min(toast.pct, 100);

  return (
    <div
      role="alert"
      aria-live={isExceeded ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto w-full sm:w-[380px] rounded-xl bg-white shadow-xl border p-4 transition-all duration-200 ${
        isExceeded ? "border-rose-200" : "border-amber-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 p-2 rounded-lg ${
            isExceeded
              ? "bg-rose-50 text-rose-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {isExceeded ? (
            <ShieldAlert className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isExceeded ? "text-rose-600" : "text-amber-700"
                }`}
              >
                {isExceeded ? "Budget Limit Exceeded" : "Approaching Budget Limit"}
              </p>
              <h4 className="text-sm font-bold text-[#0b1c30] truncate mt-0.5">
                {toast.category} · {toast.monthLabel}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.toastId)}
              aria-label="Dismiss budget alert"
              className="p-1 rounded-md text-slate-400 hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            {formatAlertSummaryText(toast, currentCurrency)}
          </p>

          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
              <span className="text-slate-600">
                {formatCurrency(toast.spentUSD, currentCurrency, {
                  showCents: false,
                })}{" "}
                /{" "}
                {formatCurrency(toast.limitUSD, currentCurrency, {
                  showCents: false,
                })}
              </span>
              <span
                className={`font-bold ${
                  isExceeded ? "text-rose-600" : "text-amber-700"
                }`}
              >
                {toast.pct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isExceeded ? "bg-rose-600" : "bg-amber-500"
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onInspect(toast)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0b1c30] hover:bg-[#162d49] transition-colors cursor-pointer"
            >
              <span>Inspect Breakdown</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onAdjustLimit(toast.toastId)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#006948] bg-[#eff4ff] hover:bg-[#dce9ff] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Adjust Cap</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BudgetAlertModal({
  alert,
  expenses = [],
  currentCurrency = "USD",
  onClose,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!alert) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [alert, onClose]);

  if (!alert) return null;

  const isExceeded = alert.severity === "exceeded";
  const matchingExpenses = expenses
    .filter(
      (item) =>
        (item.category || "").trim().toLowerCase() ===
          alert.category.trim().toLowerCase() &&
        (item.date || "").slice(0, 7) === alert.monthKey
    )
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/55 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-alert-modal-title"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isExceeded
                  ? "bg-rose-50 text-rose-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {isExceeded ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider ${
                  isExceeded ? "text-rose-600" : "text-amber-700"
                }`}
              >
                {isExceeded
                  ? "Monthly Budget Exceeded"
                  : "Approaching Monthly Limit"}
              </p>
              <h2
                id="budget-alert-modal-title"
                className="text-xl font-bold text-[#0b1c30] mt-0.5"
              >
                {alert.category} · {alert.monthLabel}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close budget alert details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`rounded-xl border p-4 space-y-3 ${
            isExceeded
              ? "bg-rose-50/60 border-rose-200"
              : "bg-amber-50/60 border-amber-200"
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-xs text-slate-600">Spent vs. Monthly Cap</p>
              <p className="text-lg font-bold font-mono tabular-nums text-[#0b1c30] mt-0.5">
                {formatCurrency(alert.spentUSD, currentCurrency)}{" "}
                <span className="text-sm font-normal text-slate-500">
                  / {formatCurrency(alert.limitUSD, currentCurrency)}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600">
                {alert.remainingUSD >= 0 ? "Remaining" : "Over Limit"}
              </p>
              <p
                className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
                  isExceeded ? "text-rose-600" : "text-amber-700"
                }`}
              >
                {formatCurrency(Math.abs(alert.remainingUSD), currentCurrency)}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 bg-white/90 rounded-full overflow-hidden border border-slate-200/70">
              <div
                className={`h-full rounded-full ${
                  isExceeded ? "bg-rose-600" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(alert.pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono tabular-nums text-slate-600">
              <span>{alert.pct}% of monthly allowance used</span>
              <span>{alert.stream || "Active Budget"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#006948]" />
              <span>
                Contributing Transactions ({matchingExpenses.length})
              </span>
            </h3>
          </div>

          {matchingExpenses.length > 0 ? (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl max-h-52 overflow-y-auto">
              {matchingExpenses.map((item, idx) => (
                <div
                  key={`${item.date}-${idx}`}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0b1c30] truncate">
                      {item.note || item.description || item.category}
                    </p>
                    <p className="text-slate-500 font-mono tabular-nums mt-0.5">
                      {item.date}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-[#0b1c30] shrink-0">
                    {formatCurrency(item.amount, currentCurrency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">
              No individual line items found for this month.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/expenses");
            }}
            className="px-4 py-2 text-xs font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg transition-colors cursor-pointer"
          >
            Review Expense Ledger
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/budget");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust Budget Limit</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function BudgetAlertSystem({
  toasts = [],
  onDismissToast,
  activeModalAlert,
  onOpenAlertModal,
  onCloseAlertModal,
  expenses = [],
  currentCurrency = "USD",
}) {
  const navigate = useNavigate();

  const handleAdjustLimit = (toastId) => {
    onDismissToast(toastId);
    navigate("/budget");
  };

  const handleInspect = (toast) => {
    onDismissToast(toast.toastId);
    onOpenAlertModal(toast);
  };

  return (
    <>
      {toasts.length > 0 && (
        <div
          aria-label="Budget threshold notifications"
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col items-end gap-3 pointer-events-none"
        >
          {toasts.slice(-3).map((toast) => (
            <ToastItem
              key={toast.toastId}
              toast={toast}
              currentCurrency={currentCurrency}
              onDismiss={onDismissToast}
              onInspect={handleInspect}
              onAdjustLimit={handleAdjustLimit}
            />
          ))}
        </div>
      )}

      <BudgetAlertModal
        alert={activeModalAlert}
        expenses={expenses}
        currentCurrency={currentCurrency}
        onClose={onCloseAlertModal}
      />
    </>
  );
}

export default BudgetAlertSystem;
