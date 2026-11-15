import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import Footer from "./Footer";
import Wealthwise from "../assests/WealthwiseLogo.png";
import WW from "../assests/WW.jpg";

function LoginForm({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(() =>
    location.state?.message
      ? { type: "success", text: location.state.message }
      : null
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    // Mock login validation for client-side functionality (credentials kept as-is)
    if (email === "test@wealthwise.com" && password === "password123") {
      localStorage.setItem("isLoggedIn", "true");
      if (onLogin) {
        onLogin();
      }
      navigate("/dashboard");
    } else {
      setFeedback({
        type: "error",
        text: "Invalid Credentials",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="relative flex-1 flex items-center justify-center px-4 py-12 bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${WW})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-slate-950/60"
          aria-hidden="true"
        />

        <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <img
              src={Wealthwise}
              alt="Wealthwise Logo"
              className="mx-auto mb-4 h-14 w-auto object-contain"
            />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Login to WealthWise
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your credentials to access your financial workspace
            </p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="test@wealthwise.com"
                required
                className="mt-1.5 block w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
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
              Log In
            </button>

            <div className="text-center pt-2">
              <Link
                to="/signup"
                className="text-sm font-medium text-violet-700 hover:text-violet-800 hover:underline"
              >
                Don&apos;t have an account? Sign Up for WealthWise
              </Link>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default LoginForm;
