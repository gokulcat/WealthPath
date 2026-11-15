import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

const USERS_STORAGE_KEY = "wealthwise_users";

function AuthModal({ mode, onClose, onSwitchMode, onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error("Error loading registered users:", error);
    }
    return [];
  });
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

    const normalizedEmail = email.trim().toLowerCase();
    const isDemoUser =
      normalizedEmail === "test@wealthwise.com" && password === "password123";
    const matchedRegistered = users.some(
      (u) =>
        (u.email || "").trim().toLowerCase() === normalizedEmail &&
        u.password === password
    );

    if (isDemoUser || matchedRegistered) {
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

    const normalizedEmail = email.trim().toLowerCase();
    const userExists =
      normalizedEmail === "test@wealthwise.com" ||
      users.some(
        (user) => (user.email || "").trim().toLowerCase() === normalizedEmail
      );

    if (userExists) {
      setFeedback({
        type: "error",
        text: "User ID already exists! Try a different email.",
      });
      return;
    }

    const updatedUsers = [...users, { email: email.trim(), password }];
    setUsers(updatedUsers);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error("Error saving registered users:", error);
    }

    setEmail("");
    setPassword("");
    setFeedback({
      type: "success",
      text: "User Registered Successfully! You can now log in.",
    });
    onSwitchMode("login");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/60 backdrop-blur-xs"
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
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto mb-3.5 w-11 h-11 rounded-xl bg-[#006948] text-white flex items-center justify-center text-xl font-bold shadow-xs">
            W
          </div>
          <h2
            id="auth-modal-title"
            className="text-2xl font-bold tracking-tight text-[#0b1c30]"
          >
            {isLogin ? "Login to WealthWise" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isLogin
              ? "Enter your credentials to access your financial workspace"
              : "Start planning income, budgets, expenses, and savings vaults"}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 mb-5 bg-[#eff4ff] rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              onSwitchMode("login");
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              isLogin
                ? "bg-[#006948] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0b1c30] hover:bg-white/70"
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
                ? "bg-[#006948] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0b1c30] hover:bg-white/70"
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
                ? "bg-emerald-50 text-[#006948] border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
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
              className="block text-sm font-medium text-[#0b1c30]"
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
              className="mt-1.5 block w-full px-3.5 py-2.5 text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="auth-modal-password"
                className="block text-sm font-medium text-[#0b1c30]"
              >
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail("test@wealthwise.com");
                    setPassword("password123");
                    setFeedback(null);
                  }}
                  className="text-xs font-medium text-[#006948] hover:text-[#00855d] hover:underline cursor-pointer"
                >
                  Fill demo account
                </button>
              )}
            </div>
            <div className="relative mt-1.5">
              <input
                id="auth-modal-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isLogin ? "Enter your password" : "Create a password"}
                required
                className="block w-full px-3.5 py-2.5 pr-10 text-sm text-[#0b1c30] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-[#0b1c30] cursor-pointer"
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
            className="w-full bg-[#0b1c30] hover:bg-[#132c4a] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006948]"
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
                className="text-sm font-medium text-[#006948] hover:text-[#00855d] hover:underline cursor-pointer"
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
                className="text-sm font-medium text-[#006948] hover:text-[#00855d] hover:underline cursor-pointer"
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
