import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import LoginForm from "./Components/LoginForm";
import SignupForm from "./Components/SignupForm";
import Expenses from "./Components/Expenses";
import GoalForm from "./Components/GoalForm";
import BudgetForm from "./Components/BudgetForm";
import Dashboard from "./Components/Dashboard";
import Navbar from "./Components/Navbar";
import WealthWise from "./Components/WealthWise";
import { useState, useEffect } from "react";

function App() {
  // Use a more descriptive state variable name
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch initial authentication state from storage (handle potential errors)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("isLoggedIn");
      setIsAuthenticated(storedUser === "true");
    } catch (error) {
      console.error("Error fetching authentication status:", error);
      // Consider redirecting to login or handling gracefully
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <Navbar handleLogout={handleLogout} isAuthenticated={isAuthenticated} />
      <Routes>
        <Route
          path="/dashboard"
          element={<Dashboard onSubmit={handleLogin} />}
        />
        <Route path="/" element={<WealthWise />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/wealthwise" element={<WealthWise />} />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/expenses"
          element={
            isAuthenticated ? <Expenses /> : <Navigate to="/login" replace />
          }
        />
        
        <Route
          path="/budget"
          element={
            isAuthenticated ? <BudgetForm /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/goals"
          element={
            isAuthenticated ? <GoalForm /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/wealthwise"
          element={
            isAuthenticated ? <WealthWise /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
