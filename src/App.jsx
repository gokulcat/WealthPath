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
import Navbar from "./Components/Navbar";
import WealthWise from "./Components/WealthWise";
import AuthModal from "./Components/AuthModal";

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
  { category: "Food", budgetAmount: 200 },
  { category: "Utilities", budgetAmount: 100 },
  { category: "Transport", budgetAmount: 150 },
  { category: "Healthcare", budgetAmount: 120 },
  { category: "Entertainment", budgetAmount: 100 },
];

const EXPENSES_STORAGE_KEY = "wealthwise_expenses";
const BUDGETS_STORAGE_KEY = "wealthwise_budgets";

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

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    }
    return INITIAL_EXPENSES;
  });

  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem(BUDGETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error loading budgets:", error);
    }
    return INITIAL_BUDGETS;
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
    setIsAuthenticated(false);
    navigate("/", { replace: true });
  };

  const handleAddExpense = (newExpense) => {
    setExpenses((prev) => [...prev, newExpense]);
  };

  const handleSaveBudget = ({ category, budgetAmount }) => {
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
        };
        return updated;
      }
      return [...prev, { category: category.trim(), budgetAmount: numericAmount }];
    });
  };

  const handleDeleteBudget = (categoryToDelete) => {
    const normalized = categoryToDelete.trim().toLowerCase();
    setBudgets((prev) =>
      prev.filter((b) => b.category.trim().toLowerCase() !== normalized)
    );
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        handleLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        openAuthModal={openAuthModal}
        authModalMode={authModalMode}
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
                  onAddExpense={handleAddExpense}
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
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/goals"
            element={
              isAuthenticated ? <GoalForm /> : <Navigate to="/login" replace />
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
