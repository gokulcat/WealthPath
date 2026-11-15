import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import Wealthwise from "../assests/WealthwiseLogo.png";

function AuthModal({ mode, onClose, onSwitchMode, onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!mode) return;
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setFeedback((prev) =>
      prev?.type === "success" && mode === "login" ? prev : null
    );
  }, [mode]);

  useEffect(() => {
    if (!mode) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mode, onClose]);

  if (!mode) return null;

  const isLogin = mode === "login";

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    setFeedback(null);

    if (email === "test@wealthwise.com" && password === "password123") {
      localStorage.setItem("isLoggedIn", "true");
      if (onLogin) {
        onLogin();
      }
      onClose();
      navigate("/dashboard");
    } else {
      setFeedback({
        type: "error",
        text: "Invalid Credentials",
      });
    }
  };

  const handleSignupSubmit = (event) => {
    event.preventDefault();
    setFeedback(null);

    const userExists = users.some((user) => user.email === email);
    if (userExists) {
      setFeedback({
        type: "error",
        text: "User ID already exists! Try a different email.",
      });
      return;
    }

    const updatedUsers = [...users, { email, password }];
    setUsers(updatedUsers);
    setEmail("");
    setPassword("");
    console.log("Registered Users:", updatedUsers);

    setFeedback({
      type: "success",
      text: "User Registered Successfully!",
    });
    onSwitchMode("login");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <img
            src={Wealthwise}
            alt="Wealthwise Logo"
            className="mx-auto mb-4 h-12 w-auto object-contain"
          />
          <h2
            id="auth-modal-title"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            {isLogin ? "Login to WealthWise" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isLogin
              ? "Enter your credentials to access your financial workspace"
              : "Start tracking expenses, budgets, and goals with WealthWise"}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 mb-5 bg-slate-100 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              onSwitchMode("login");
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              isLogin
                ? "bg-blue-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              onSwitchMode("signup");
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              !isLogin
                ? "bg-blue-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            Sign Up
          </button>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`mb-5 flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form
          onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="auth-modal-email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="auth-modal-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={isLogin ? "test@wealthwise.com" : "you@example.com"}
              autoFocus
              required
              className="mt-1.5 block w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
            />
          </div>

          <div>
            <label
              htmlFor="auth-modal-password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="auth-modal-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isLogin ? "Enter your password" : "Create a password"}
                required
                className="block w-full px-3.5 py-2.5 pr-10 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>

          <div className="text-center pt-1">
            {isLogin ? (
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  onSwitchMode("signup");
                }}
                className="text-sm font-medium text-violet-700 hover:text-violet-800 hover:underline cursor-pointer"
              >
                Don&apos;t have an account? Sign Up for WealthWise
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  onSwitchMode("login");
                }}
                className="text-sm font-medium text-violet-700 hover:text-violet-800 hover:underline cursor-pointer"
              >
                Have an account? Login for WealthWise
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
