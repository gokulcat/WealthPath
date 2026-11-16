import React, { useMemo, useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Plus,
  Repeat,
  Receipt,
} from "lucide-react";
import { formatCurrency, getCategoryStream } from "../utils/currency";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getLocalTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthLabel(monthKey) {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const dateObj = new Date(year, month, 1);
  return dateObj.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatFullDateLabel(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function shiftMonthKey(monthKey, delta) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getLatestExpenseMonth(expenses) {
  let latestDate = "";
  for (const exp of expenses) {
    if (exp?.date && /^\d{4}-\d{2}-\d{2}$/.test(exp.date)) {
      if (!latestDate || exp.date > latestDate) {
        latestDate = exp.date;
      }
    }
  }
  return latestDate ? latestDate.slice(0, 7) : getLocalTodayISO().slice(0, 7);
}

function ExpenseCalendarView({
  expenses = [],
  recurringExpenses = [],
  currentCurrency = "USD",
  onJumpToDate,
  onAddForDate,
  onOpenRecurringTab,
}) {
  const todayISO = useMemo(() => getLocalTodayISO(), []);
  const latestExpenseMonth = useMemo(
    () => getLatestExpenseMonth(expenses),
    [expenses]
  );

  const [currentMonthKey, setCurrentMonthKey] = useState(
    () => latestExpenseMonth
  );
  const [selectedDate, setSelectedDate] = useState("");

  // Group logged expenses by YYYY-MM-DD
  const expensesByDate = useMemo(() => {
    const map = {};
    expenses.forEach((exp) => {
      const dateStr = (exp?.date || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
      if (!map[dateStr]) {
        map[dateStr] = { items: [], totalUSD: 0 };
      }
      map[dateStr].items.push(exp);
      map[dateStr].totalUSD += parseFloat(exp.amount) || 0;
    });
    // Sort items per day descending by amount for crisp visual prioritization
    Object.values(map).forEach((bucket) => {
      bucket.items.sort(
        (a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0)
      );
    });
    return map;
  }, [expenses]);

  // Group upcoming active recurring bills by nextRunDate
  const scheduledByDate = useMemo(() => {
    const map = {};
    recurringExpenses.forEach((rec) => {
      if (rec?.active === false) return;
      const dateStr = (rec?.nextRunDate || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(rec);
    });
    return map;
  }, [recurringExpenses]);

  // Keep selectedDate defaulted to a meaningful day inside currentMonthKey
  useEffect(() => {
    if (selectedDate && selectedDate.startsWith(currentMonthKey)) return;
    const monthDates = Object.keys(expensesByDate)
      .filter((d) => d.startsWith(currentMonthKey))
      .sort((a, b) => b.localeCompare(a));
    if (monthDates.length > 0) {
      setSelectedDate(monthDates[0]);
    } else if (todayISO.startsWith(currentMonthKey)) {
      setSelectedDate(todayISO);
    } else {
      setSelectedDate(`${currentMonthKey}-01`);
    }
  }, [currentMonthKey, expensesByDate, selectedDate, todayISO]);

  // Build 35 or 42 day cells for the displayed month
  const calendarCells = useMemo(() => {
    const [year, month] = currentMonthKey.split("-").map(Number);
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0=Sun..6=Sat
    const daysInMonth = new Date(year, month, 0).getDate();

    const totalSlots = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
    const cells = [];

    for (let i = 0; i < totalSlots; i += 1) {
      const dayOffset = i - startWeekday + 1;
      const cellDateObj = new Date(year, month - 1, dayOffset);
      const cellYear = cellDateObj.getFullYear();
      const cellMonth = String(cellDateObj.getMonth() + 1).padStart(2, "0");
      const cellDay = String(cellDateObj.getDate()).padStart(2, "0");
      const dateStr = `${cellYear}-${cellMonth}-${cellDay}`;
      const isCurrentMonth = `${cellYear}-${cellMonth}` === currentMonthKey;

      cells.push({
        dateStr,
        dayNumber: cellDateObj.getDate(),
        isCurrentMonth,
        isToday: dateStr === todayISO,
      });
    }
    return { cells, daysInMonth };
  }, [currentMonthKey, todayISO]);

  // Monthly metrics
  const monthSummary = useMemo(() => {
    let totalUSD = 0;
    let txCount = 0;
    let activeDays = 0;
    let peakDay = null;

    Object.entries(expensesByDate).forEach(([dateStr, bucket]) => {
      if (!dateStr.startsWith(currentMonthKey)) return;
      totalUSD += bucket.totalUSD;
      txCount += bucket.items.length;
      activeDays += 1;
      if (!peakDay || bucket.totalUSD > peakDay.totalUSD) {
        peakDay = { dateStr, totalUSD: bucket.totalUSD, count: bucket.items.length };
      }
    });

    return { totalUSD, txCount, activeDays, peakDay };
  }, [expensesByDate, currentMonthKey]);

  const selectedBucket = expensesByDate[selectedDate] || {
    items: [],
    totalUSD: 0,
  };
  const selectedScheduled = scheduledByDate[selectedDate] || [];

  const handleJump = (dateStr) => {
    if (onJumpToDate) {
      onJumpToDate(dateStr);
    }
  };

  return (
    <div className="space-y-6">
      {/* Monthly Header & Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-[#006948]" />
              <h2 className="text-xl font-bold tracking-tight text-[#0b1c30]">
                {formatMonthLabel(currentMonthKey)}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Click any expense event on the calendar to jump directly to the
              expense list for that date.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center border border-slate-200 rounded-lg bg-[#eff4ff]/50 overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonthKey((prev) => shiftMonthKey(prev, -1))
                }
                aria-label="Previous month"
                className="p-2 text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                aria-label="Select month and year"
                value={currentMonthKey}
                onChange={(e) => {
                  if (e.target.value) setCurrentMonthKey(e.target.value);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-[#0b1c30] bg-transparent border-x border-slate-200 focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() =>
                  setCurrentMonthKey((prev) => shiftMonthKey(prev, 1))
                }
                aria-label="Next month"
                className="p-2 text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {latestExpenseMonth && currentMonthKey !== latestExpenseMonth && (
              <button
                type="button"
                onClick={() => setCurrentMonthKey(latestExpenseMonth)}
                className="px-3 py-2 text-xs font-semibold text-[#006948] bg-[#eff4ff] hover:bg-[#e1ebff] border border-[#006948]/20 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Latest Activity
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setCurrentMonthKey(todayISO.slice(0, 7));
                setSelectedDate(todayISO);
              }}
              className="px-3 py-2 text-xs font-medium text-[#0b1c30] bg-white hover:bg-[#eff4ff] border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>

        {/* Monthly Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Month Total Spend
            </p>
            <p className="mt-1 text-xl font-bold text-[#0b1c30] font-mono tabular-nums">
              {formatCurrency(monthSummary.totalUSD, currentCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              Active Spending Days
            </p>
            <p className="mt-1 text-xl font-bold text-[#0b1c30] font-mono tabular-nums">
              {monthSummary.activeDays}
              <span className="text-xs font-normal text-slate-500 ml-1.5 font-sans">
                / {calendarCells.daysInMonth} days · {monthSummary.txCount}{" "}
                {monthSummary.txCount === 1 ? "entry" : "entries"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              Highest Spend Day
            </p>
            {monthSummary.peakDay ? (
              <button
                type="button"
                onClick={() => handleJump(monthSummary.peakDay.dateStr)}
                className="mt-1 inline-flex items-baseline gap-2 text-left group cursor-pointer"
              >
                <span className="text-xl font-bold text-[#006948] font-mono tabular-nums group-hover:underline">
                  {formatCurrency(
                    monthSummary.peakDay.totalUSD,
                    currentCurrency
                  )}
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums group-hover:text-[#0b1c30]">
                  on {monthSummary.peakDay.dateStr} →
                </span>
              </button>
            ) : (
              <p className="mt-1 text-sm text-slate-400">
                No expenses recorded in this month
              </p>
            )}
          </div>
        </div>

        {/* 7-Column Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[740px] border border-slate-200 rounded-xl overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-[#eff4ff] border-b border-slate-200">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="px-3 py-2.5 text-xs font-semibold text-slate-600 text-left border-r last:border-r-0 border-slate-200"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-white">
              {calendarCells.cells.map((cell) => {
                const bucket = expensesByDate[cell.dateStr];
                const dayExpenses = bucket?.items || [];
                const dayTotalUSD = bucket?.totalUSD || 0;
                const scheduled = scheduledByDate[cell.dateStr] || [];
                const isSelected = selectedDate === cell.dateStr;
                const visibleExpenses = dayExpenses.slice(0, 3);
                const hiddenCount = dayExpenses.length - visibleExpenses.length;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedDate(cell.dateStr);
                      }
                    }}
                    aria-label={`${cell.dateStr}, ${dayExpenses.length} expenses`}
                    className={`min-h-[124px] p-2 flex flex-col justify-between transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#006948] ${
                      !cell.isCurrentMonth
                        ? "bg-slate-50/70 text-slate-400"
                        : isSelected
                        ? "bg-[#eff4ff]/80"
                        : "bg-white hover:bg-[#f8f9ff]"
                    }`}
                  >
                    <div>
                      {/* Cell Header: Day Number + Daily Total */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-md tabular-nums ${
                            isSelected
                              ? "bg-[#0b1c30] text-white"
                              : cell.isToday
                              ? "bg-[#006948] text-white"
                              : cell.isCurrentMonth
                              ? "text-[#0b1c30]"
                              : "text-slate-400"
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {dayTotalUSD > 0 && (
                          <span className="text-[11px] font-mono tabular-nums font-semibold text-[#006948]">
                            {formatCurrency(dayTotalUSD, currentCurrency, {
                              compact: dayTotalUSD >= 1000,
                              showCents: false,
                            })}
                          </span>
                        )}
                      </div>

                      {/* Clickable Daily Expense Events */}
                      <div className="space-y-1">
                        {visibleExpenses.map((exp, idx) => (
                          <button
                            key={`${cell.dateStr}-${exp.category}-${idx}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJump(cell.dateStr);
                            }}
                            title={`${exp.category}${
                              exp.note || exp.description
                                ? ` · ${exp.note || exp.description}`
                                : ""
                            } (${formatCurrency(
                              exp.amount,
                              currentCurrency
                            )}) — Click to view in Expense List`}
                            className="w-full flex items-center justify-between gap-1.5 px-1.5 py-1 rounded text-[11px] bg-[#eff4ff] hover:bg-[#006948] text-[#0b1c30] hover:text-white border border-slate-200/80 hover:border-[#006948] transition-colors cursor-pointer group"
                          >
                            <span className="truncate font-medium">
                              {exp.note || exp.description || exp.category}
                            </span>
                            <span className="font-mono tabular-nums font-semibold shrink-0 text-[#006948] group-hover:text-white">
                              {formatCurrency(exp.amount, currentCurrency, {
                                showCents: false,
                              })}
                            </span>
                          </button>
                        ))}

                        {hiddenCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJump(cell.dateStr);
                            }}
                            className="w-full text-left px-1.5 py-0.5 text-[11px] font-semibold text-[#006948] hover:underline cursor-pointer"
                          >
                            +{hiddenCount} more · View day
                          </button>
                        )}

                        {/* Upcoming Scheduled Recurring Bills */}
                        {scheduled.slice(0, 1).map((rec) => (
                          <button
                            key={`sched-${rec.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenRecurringTab) {
                                onOpenRecurringTab();
                              }
                            }}
                            title={`Scheduled ${rec.frequency} bill: ${rec.category} — ${rec.note || rec.description}`}
                            className="w-full flex items-center justify-between gap-1 px-1.5 py-0.5 rounded text-[10px] border border-dashed border-[#006948]/40 text-[#006948] bg-emerald-50/40 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <span className="truncate flex items-center gap-1">
                              <Repeat className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{rec.category}</span>
                            </span>
                            <span className="font-mono tabular-nums shrink-0">
                              {formatCurrency(rec.amount, currentCurrency, {
                                showCents: false,
                              })}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Breakdown Panel */}
      {selectedDate && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0b1c30]">
                {formatFullDateLabel(selectedDate)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedBucket.items.length}{" "}
                {selectedBucket.items.length === 1 ? "expense" : "expenses"}
                {" · "}Daily total{" "}
                <span className="font-mono tabular-nums font-semibold text-[#0b1c30]">
                  {formatCurrency(selectedBucket.totalUSD, currentCurrency)}
                </span>
                {selectedScheduled.length > 0 && (
                  <span>
                    {" · "}
                    {selectedScheduled.length} scheduled recurring{" "}
                    {selectedScheduled.length === 1 ? "bill" : "bills"}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {onAddForDate && (
                <button
                  type="button"
                  onClick={() => onAddForDate(selectedDate)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#006948]" />
                  <span>Add Expense for Date</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleJump(selectedDate)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Open Expense List for Date</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {selectedBucket.items.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {selectedBucket.items.map((exp, idx) => (
                <button
                  key={`detail-${selectedDate}-${idx}`}
                  type="button"
                  onClick={() => handleJump(selectedDate)}
                  className="w-full px-6 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[#eff4ff]/50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0b1c30]">
                      <span>{exp.category}</span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs font-normal text-slate-500">
                        {getCategoryStream(exp.category)}
                      </span>
                      {exp.isRecurring && (
                        <>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-xs font-medium text-[#006948]">
                            Recurring
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {exp.note || exp.description || "No memo added"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold font-mono tabular-nums text-[#0b1c30]">
                      {formatCurrency(exp.amount, currentCurrency)}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-[#0b1c30]">
                No expenses logged on {selectedDate}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Select another date with activity above, or add a new expense
                for this day.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExpenseCalendarView;
