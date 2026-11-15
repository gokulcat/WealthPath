import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import Footer from "./Footer";
import Wealthwise from "../assests/WealthwiseLogo.png";
import WW from "../assests/WW.jpg";

function SignupForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const userExists = users.some((user) => user.email === email);
    if (userExists) {
      setError("User ID already exists! Try a different email.");
      return;
    }

    const newUser = { email, password };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);

    setEmail("");
    setPassword("");
    console.log("Registered Users:", updatedUsers);

    navigate("/login", {
      state: { message: "User Registered Successfully!" },
    });
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
              Create your account
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Start tracking expenses, budgets, and goals with WealthWise
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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
                placeholder="you@example.com"
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
                  placeholder="Create a password"
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
              className="w-full py-2.5 px-4 bg-violet-700 hover:bg-violet-800 text-white font-semibold rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            >
              Sign Up
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-sm font-medium text-violet-700 hover:text-violet-800 hover:underline"
              >
                Have an account? Login for WealthWise
              </Link>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default SignupForm;
