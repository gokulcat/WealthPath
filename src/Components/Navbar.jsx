import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Info, Copy, Check, Menu, X, LogOut } from "lucide-react";

const Navbar = ({
  isAuthenticated,
  handleLogout,
  openAuthModal,
  authModalMode,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreds, setShowCreds] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const popoverRef = useRef(null);

  const isLoggedIn =
    typeof isAuthenticated === "boolean"
      ? isAuthenticated
      : localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowCreds(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowCreds(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowCreds(false);
  }, [location.pathname]);

  const onLogoutClick = () => {
    setMobileOpen(false);
    if (handleLogout) {
      handleLogout();
    } else {
      localStorage.removeItem("isLoggedIn");
      navigate("/", { replace: true });
    }
  };

  const handleOpenAuth = (mode) => {
    setMobileOpen(false);
    setShowCreds(false);
    if (openAuthModal) {
      openAuthModal(mode);
    } else {
      navigate(mode === "login" ? "/login" : "/signup");
    }
  };

  const copyValue = (field, value) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1600);
  };

  const navLinkClass = (path) => {
    const active = location.pathname === path;
    return `text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b-2 ${
      active
        ? "text-violet-700 border-violet-700"
        : "text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300"
    }`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to={isLoggedIn ? "/dashboard" : "/"}
          className="flex items-center text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 rounded-md"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-900 text-white text-base font-bold mr-0.5">
            W
          </span>
          <span>ealthWise</span>
        </Link>

        {/* Zone 2: Primary Nav Links (Authenticated) */}
        {isLoggedIn ? (
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-7"
          >
            <Link to="/dashboard" className={navLinkClass("/dashboard")}>
              Dashboard
            </Link>
            <Link to="/goals" className={navLinkClass("/goals")}>
              Goals
            </Link>
            <Link to="/expenses" className={navLinkClass("/expenses")}>
              Add Expenses
            </Link>
            <Link to="/budget" className={navLinkClass("/budget")}>
              Budgets
            </Link>
          </nav>
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Zone 3: Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={onLogoutClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex items-center gap-1" ref={popoverRef}>
                <button
                  type="button"
                  onClick={() => handleOpenAuth("login")}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    authModalMode === "login"
                      ? "text-violet-700 bg-violet-50"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreds((prev) => !prev)}
                  aria-expanded={showCreds}
                  aria-label="Demo login credentials"
                  title="Demo login credentials"
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
                    showCreds
                      ? "bg-violet-50 border-violet-300 text-violet-700"
                      : "bg-white border-slate-200 text-slate-500 hover:text-violet-700 hover:border-violet-200 hover:bg-violet-50/50"
                  }`}
                >
                  <Info className="w-4 h-4" />
                </button>

                {showCreds && (
                  <div
                    role="dialog"
                    aria-label="Demo credentials"
                    className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 text-left"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-xs font-semibold text-slate-900">
                        Demo Login Credentials
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowCreds(false)}
                        aria-label="Close credentials"
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">
                        <div className="min-w-0">
                          <span className="block text-[11px] text-slate-500">
                            Email
                          </span>
                          <code className="font-mono text-slate-900 font-medium break-all">
                            test@wealthwise.com
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyValue("email", "test@wealthwise.com")
                          }
                          aria-label="Copy email"
                          className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-violet-700 hover:bg-white transition-colors cursor-pointer"
                        >
                          {copiedField === "email" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">
                        <div className="min-w-0">
                          <span className="block text-[11px] text-slate-500">
                            Password
                          </span>
                          <code className="font-mono text-slate-900 font-medium">
                            password123
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyValue("password", "password123")}
                          aria-label="Copy password"
                          className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-violet-700 hover:bg-white transition-colors cursor-pointer"
                        >
                          {copiedField === "password" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenAuth("signup")}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          {!isLoggedIn && (
            <button
              type="button"
              onClick={() => setShowCreds((prev) => !prev)}
              aria-label="Demo login credentials"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Credentials Banner when toggled */}
      {!isLoggedIn && showCreds && (
        <div className="md:hidden border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs space-y-2">
          <p className="font-semibold text-slate-900">Demo Login Credentials</p>
          <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <span className="text-slate-500 mr-1.5">Email:</span>
              <code className="font-mono text-slate-900 font-medium break-all">
                test@wealthwise.com
              </code>
            </div>
            <button
              type="button"
              onClick={() => copyValue("email", "test@wealthwise.com")}
              aria-label="Copy email"
              className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-blue-800 cursor-pointer"
            >
              {copiedField === "email" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <span className="text-slate-500 mr-1.5">Password:</span>
              <code className="font-mono text-slate-900 font-medium">
                password123
              </code>
            </div>
            <button
              type="button"
              onClick={() => copyValue("password", "password123")}
              aria-label="Copy password"
              className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-blue-800 cursor-pointer"
            >
              {copiedField === "password" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                to="/goals"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Goals
              </Link>
              <Link
                to="/expenses"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Add Expenses
              </Link>
              <Link
                to="/budget"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Budgets
              </Link>
              <button
                type="button"
                onClick={onLogoutClick}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleOpenAuth("login")}
                className="w-full text-left block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuth("signup")}
                className="w-full text-left block px-3 py-2.5 rounded-lg text-sm font-semibold text-violet-700 hover:bg-violet-50 cursor-pointer"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
