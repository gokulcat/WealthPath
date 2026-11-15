import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Expenses from "./Components/Expenses";
import GoalForm from "./Components/GoalForm";
import BudgetForm from "./Components/BudgetForm";
import Dashboard from "./Components/Dashboard";
import SalaryPlanner from "./Components/SalaryPlanner";
import Settings from "./Components/Settings";
import Navbar from "./Components/Navbar";
import WealthWise from "./Components/WealthWise";
import AuthModal from "./Components/AuthModal";
import FXRoutesModal from "./Components/FXRoutesModal";
import { CURRENCIES } from "./utils/currency";

const INITIAL_EXPENSES = [
  { category: "Food", description: "Groceries & dining", note: "Groceries & dining", date: "2026-01-12", amount: 180 },
  { category: "Utilities", description: "Electricity & water", note: "Electricity & water", date: "2026-01-18", amount: 120 },
  { category: "Transport", description: "Monthly transit pass", note: "Monthly transit pass", date: "2026-01-22", amount: 100 },
  { category: "Healthcare", description: "Pharmacy & checkup", note: "Pharmacy & checkup", date: "2026-01-27", amount: 100 },
  { category: "Food", description: "Supermarket & coffee", note: "Supermarket & coffee", date: "2026-02-08", amount: 120 },
  { category: "Utilities", description: "Internet & heating", note: "Internet & heating", date: "2026-02-14", amount: 100 },
  { category: "Transport", description: "Fuel & rideshare", note: "Fuel & rideshare", date: "2026-02-19", amount: 100 },
  { category: "Entertainment", description: "Cinema & streaming", note: "Cinema & streaming", date: "2026-02-25", amount: 80 },
  { category: "Food", description: "Fresh market", note: "Fresh market", date: "2026-03-05", amount: 100 },
  { category: "Utilities", description: "Water & power", note: "Water & power", date: "2026-03-11", amount: 80 },
  { category: "Entertainment", description: "Concert tickets", note: "Concert tickets", date: "2026-03-17", amount: 70 },
  { category: "Healthcare", description: "Dental visit", note: "Dental visit", date: "2026-03-23", amount: 100 },
];

const INITIAL_BUDGETS = [
  { category: "Food", budgetAmount: 200, stream: "Essential Needs" },
  { category: "Utilities", budgetAmount: 100, stream: "Essential Needs" },
  { category: "Transport", budgetAmount: 150, stream: "Essential Needs" },
  { category: "Healthcare", budgetAmount: 120, stream: "Essential Needs" },
  { category: "Entertainment", budgetAmount: 100, stream: "Lifestyle & Wants" },
];

const INITIAL_GOALS = [
  {
    goal: "Emergency Fund",
    categoryTag: "Safety Net Tier 1",
    target_amount: 15000,
    saved_amount: 12500,
    monthlyAuto: 500,
    targetDate: "Dec 2026",
  },
  {
    goal: "First Home Downpayment",
    categoryTag: "Primary Residence",
    target_amount: 60000,
    saved_amount: 10800,
    monthlyAuto: 400,
    targetDate: "Aug 2028",
  },
  {
    goal: "Japan Vacation",
    categoryTag: "Tokyo & Kyoto Trip",
    target_amount: 4500,
    saved_amount: 3150,
    monthlyAuto: 250,
    targetDate: "Apr 2027",
    foreignCurrency: "JPY",
    foreignCurrentAmount: 470000,
    foreignTargetAmount: 670000,
  },
  {
    goal: "Tech & Gadget Upgrade",
    categoryTag: "Workstation Fund",
    target_amount: 2000,
    saved_amount: 1900,
    monthlyAuto: 150,
    targetDate: "Nov 2026",
  },
  {
    goal: "New Vehicle Replacement",
    categoryTag: "EV Sinking Fund",
    target_amount: 12000,
    saved_amount: 1100,
    monthlyAuto: 100,
    targetDate: "Open",
  },
];

const INITIAL_INCOME_CONFIG = {
  monthlyIncomeUSD: 6500,
  frequency: "monthly",
  ruleKey: "50_30_20",
  split: { needs: 50, wants: 30, wealth: 20 },
};

const INITIAL_SETTINGS = {
  apyRate: 4.85,
  roundUpMultiplier: 1,
  autoSweepDay: "sunday",
  autoSaveEngineActive: true,
  planScheduleLocked: false,
  autoFundingPaused: false,
  zeroDeficitProtection: true,
  fdicPassThrough: true,
  twoFactorAuth: true,
  accounts: [
    {
      name: "Premier Checking",
      last4: "4921",
      role: "Primary Ingest",
      note: "Direct deposit detected · ACH split on 1st of month",
    },
    {
      name: "High-Yield Savings",
      last4: "8921",
      role: "Linked Overflow",
      note: "Bi-weekly auto-deposit execution rail",
    },
  ],
};

const EXPENSES_STORAGE_KEY = "wealthwise_expenses";
const BUDGETS_STORAGE_KEY = "wealthwise_budgets";
const GOALS_STORAGE_KEY = "wealthwise_goals";
const CURRENCY_STORAGE_KEY = "wealthwise_currency";
const INCOME_STORAGE_KEY = "wealthwise_income";
const SETTINGS_STORAGE_KEY = "wealthwise_settings";

function loadJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed !== null && parsed !== undefined) return parsed;
    }
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
  }
  return fallback;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem("isLoggedIn") === "true";
    } catch (error) {
      console.error("Error fetching authentication status:", error);
      return false;
    }
  });

  const [authModalMode, setAuthModalMode] = useState(null);
  const [fxModalOpen, setFxModalOpen] = useState(false);

  const [currentCurrency, setCurrentCurrency] = useState(() => {
    try {
      return localStorage.getItem(CURRENCY_STORAGE_KEY) || "USD";
    } catch {
      return "USD";
    }
  });

  const [expenses, setExpenses] = useState(() => {
    const loaded = loadJSON(EXPENSES_STORAGE_KEY, INITIAL_EXPENSES);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : INITIAL_EXPENSES;
  });

  const [budgets, setBudgets] = useState(() => {
    const loaded = loadJSON(BUDGETS_STORAGE_KEY, INITIAL_BUDGETS);
    return Array.isArray(loaded) ? loaded : INITIAL_BUDGETS;
  });

  const [goals, setGoals] = useState(() => {
    const loaded = loadJSON(GOALS_STORAGE_KEY, INITIAL_GOALS);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : INITIAL_GOALS;
  });

  const [incomeConfig, setIncomeConfig] = useState(() =>
    loadJSON(INCOME_STORAGE_KEY, INITIAL_INCOME_CONFIG)
  );

  const [settings, setSettings] = useState(() => {
    const loaded = loadJSON(SETTINGS_STORAGE_KEY, INITIAL_SETTINGS);
    return {
      ...INITIAL_SETTINGS,
      ...loaded,
      accounts:
        Array.isArray(loaded?.accounts) && loaded.accounts.length > 0
          ? loaded.accounts
          : INITIAL_SETTINGS.accounts,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error("Error saving expenses:", error);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
    } catch (error) {
      console.error("Error saving budgets:", error);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error("Error saving goals:", error);
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currentCurrency);
    } catch (error) {
      console.error("Error saving currency:", error);
    }
  }, [currentCurrency]);

  useEffect(() => {
    try {
      localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(incomeConfig));
    } catch (error) {
      console.error("Error saving income config:", error);
    }
  }, [incomeConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }, [settings]);

  useEffect(() => {
    const syncAuth = () => {
      try {
        setIsAuthenticated(localStorage.getItem("isLoggedIn") === "true");
      } catch (error) {
        console.error("Error syncing authentication status:", error);
      }
    };
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (location.pathname === "/login") {
        setAuthModalMode("login");
      } else if (location.pathname === "/signup") {
        setAuthModalMode("signup");
      }
    }
  }, [location.pathname, isAuthenticated]);

  const handleLogin = () => {
    try {
      localStorage.setItem("isLoggedIn", "true");
    } catch (error) {
      console.error("Error saving authentication status:", error);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("isLoggedIn");
    } catch (error) {
      console.error("Error clearing authentication status:", error);
    }
    setAuthModalMode(null);
    setFxModalOpen(false);
    setIsAuthenticated(false);
    navigate("/", { replace: true });
  };

  const handleAddExpense = (newExpense) => {
    setExpenses((prev) => [...prev, newExpense]);
  };

  const handleUpdateExpense = (oldExpense, updatedExpense) => {
    setExpenses((prev) =>
      prev.map((item) => (item === oldExpense ? updatedExpense : item))
    );
  };

  const handleDeleteExpense = (expenseToDelete) => {
    setExpenses((prev) => prev.filter((item) => item !== expenseToDelete));
  };

  const handleSaveBudget = ({ category, budgetAmount, stream }) => {
    const normalized = category.trim().toLowerCase();
    const numericAmount = parseFloat(budgetAmount) || 0;
    setBudgets((prev) => {
      const existingIndex = prev.findIndex(
        (b) => b.category.trim().toLowerCase() === normalized
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          category: category.trim(),
          budgetAmount: numericAmount,
          stream: stream || updated[existingIndex].stream,
        };
        return updated;
      }
      return [
        ...prev,
        { category: category.trim(), budgetAmount: numericAmount, stream },
      ];
    });
  };

  const handleDeleteBudget = (categoryToDelete) => {
    const normalized = categoryToDelete.trim().toLowerCase();
    setBudgets((prev) =>
      prev.filter((b) => b.category.trim().toLowerCase() !== normalized)
    );
  };

  const handleApplySplitToBudgets = ({
    monthlyIncomeUSD,
    split,
    housingPct,
    groceryPct,
    transportPct,
  }) => {
    const totalNeeds = Math.max(1, housingPct + groceryPct + transportPct);
    const needsUSD = (monthlyIncomeUSD * split.needs) / 100;
    const wantsUSD = (monthlyIncomeUSD * split.wants) / 100;

    const generated = [
      {
        category: "Food",
        budgetAmount: Math.round((needsUSD * groceryPct) / totalNeeds),
        stream: "Essential Needs",
      },
      {
        category: "Transport",
        budgetAmount: Math.round((needsUSD * transportPct) / totalNeeds),
        stream: "Essential Needs",
      },
      {
        category: "Housing",
        budgetAmount: Math.round((needsUSD * housingPct) / totalNeeds),
        stream: "Essential Needs",
      },
      {
        category: "Entertainment",
        budgetAmount: Math.round(wantsUSD * 0.5),
        stream: "Lifestyle & Wants",
      },
      {
        category: "Shopping",
        budgetAmount: Math.round(wantsUSD * 0.5),
        stream: "Lifestyle & Wants",
      },
    ];

    generated.forEach((item) => {
      if (item.budgetAmount > 0) handleSaveBudget(item);
    });
  };

  const handleAddGoal = (newGoal) => {
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleContributeGoal = (index, deltaUSD) => {
    setGoals((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const current = parseFloat(item.saved_amount) || 0;
        const nextSaved = Math.max(0, Number((current + deltaUSD).toFixed(2)));
        const nextItem = {
          ...item,
          saved_amount: nextSaved,
        };
        if (item.foreignCurrency && CURRENCIES[item.foreignCurrency]) {
          const rate = CURRENCIES[item.foreignCurrency].rateAgainstUSD;
          nextItem.foreignCurrentAmount = Math.round(nextSaved * rate);
        }
        return nextItem;
      })
    );
  };

  const handleDeleteGoal = (index) => {
    setGoals((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateSettings = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleResetDemoData = () => {
    setExpenses(INITIAL_EXPENSES);
    setBudgets(INITIAL_BUDGETS);
    setGoals(INITIAL_GOALS);
    setIncomeConfig(INITIAL_INCOME_CONFIG);
    setSettings(INITIAL_SETTINGS);
    setCurrentCurrency("USD");
  };

  const openAuthModal = (mode) => {
    setAuthModalMode(mode);
  };

  const closeAuthModal = () => {
    setAuthModalMode(null);
    if (location.pathname === "/login" || location.pathname === "/signup") {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] text-[#0b1c30]">
      <Navbar
        handleLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        openAuthModal={openAuthModal}
        authModalMode={authModalMode}
        currentCurrency={currentCurrency}
        onCurrencyChange={setCurrentCurrency}
        onOpenFXModal={() => setFxModalOpen(true)}
      />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <WealthWise openAuthModal={openAuthModal} />
              )
            }
          />
          <Route
            path="/wealthwise"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <WealthWise openAuthModal={openAuthModal} />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <WealthWise openAuthModal={openAuthModal} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <WealthWise openAuthModal={openAuthModal} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard
                  expenses={expenses}
                  budgets={budgets}
                  goals={goals}
                  incomeConfig={incomeConfig}
                  onAddExpense={handleAddExpense}
                  currentCurrency={currentCurrency}
                  apyRate={settings.apyRate}
                  onOpenFXModal={() => setFxModalOpen(true)}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/planner"
            element={
              isAuthenticated ? (
                <SalaryPlanner
                  currentCurrency={currentCurrency}
                  onOpenFXModal={() => setFxModalOpen(true)}
                  incomeConfig={incomeConfig}
                  onUpdateIncomeConfig={setIncomeConfig}
                  expenses={expenses}
                  budgets={budgets}
                  onSaveBudget={handleSaveBudget}
                  onApplySplitToBudgets={handleApplySplitToBudgets}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/expenses"
            element={
              isAuthenticated ? (
                <Expenses
                  expenses={expenses}
                  budgets={budgets}
                  onAddExpense={handleAddExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                  currentCurrency={currentCurrency}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/budget"
            element={
              isAuthenticated ? (
                <BudgetForm
                  budgets={budgets}
                  expenses={expenses}
                  onSaveBudget={handleSaveBudget}
                  onDeleteBudget={handleDeleteBudget}
                  currentCurrency={currentCurrency}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/goals"
            element={
              isAuthenticated ? (
                <GoalForm
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onContributeGoal={handleContributeGoal}
                  onDeleteGoal={handleDeleteGoal}
                  currentCurrency={currentCurrency}
                  roundUpMultiplier={settings.roundUpMultiplier}
                  autoFundingPaused={settings.autoFundingPaused}
                  onUpdateSettings={handleUpdateSettings}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ? (
                <Settings
                  currentCurrency={currentCurrency}
                  onCurrencyChange={setCurrentCurrency}
                  onOpenFXModal={() => setFxModalOpen(true)}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  expenses={expenses}
                  budgets={budgets}
                  goals={goals}
                  onResetDemoData={handleResetDemoData}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>

      <AuthModal
        mode={authModalMode}
        onClose={closeAuthModal}
        onSwitchMode={setAuthModalMode}
        onLogin={handleLogin}
      />

      <FXRoutesModal
        isOpen={fxModalOpen}
        onClose={() => setFxModalOpen(false)}
        baseCurrency={currentCurrency}
        onSelectBaseCurrency={setCurrentCurrency}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
