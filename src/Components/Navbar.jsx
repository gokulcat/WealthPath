import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Info,
  Copy,
  Check,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings as SettingsIcon,
  ArrowLeftRight,
} from "lucide-react";
import { CURRENCIES } from "../utils/currency";

const Navbar = ({
  isAuthenticated,
  handleLogout,
  openAuthModal,
  authModalMode,
  currentCurrency = "USD",
  onCurrencyChange,
  onOpenFXModal,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreds, setShowCreds] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const popoverRef = useRef(null);
  const currencyRef = useRef(null);

  const isLoggedIn =
    typeof isAuthenticated === "boolean"
      ? isAuthenticated
      : localStorage.getItem("isLoggedIn") === "true";

  const activeCurrencyObj = CURRENCIES[currentCurrency] || CURRENCIES.USD;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowCreds(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setShowCurrencyMenu(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowCreds(false);
        setShowCurrencyMenu(false);
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
    setShowCurrencyMenu(false);
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
        ? "text-[#006948] border-[#006948]"
        : "text-slate-600 border-transparent hover:text-[#0b1c30] hover:border-slate-300"
    }`;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#f8f9ff]/95 backdrop-blur-md border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to={isLoggedIn ? "/dashboard" : "/"}
          className="flex items-center text-xl font-bold tracking-tight text-[#0b1c30] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006948] rounded-md"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#006948] text-white text-base font-bold mr-0.5">
            W
          </span>
          <span>ealthWise</span>
        </Link>

        {/* Zone 2: Primary Nav Links (Authenticated) */}
        {isLoggedIn ? (
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-6"
          >
            <Link to="/dashboard" className={navLinkClass("/dashboard")}>
              Dashboard
            </Link>
            <Link to="/planner" className={navLinkClass("/planner")}>
              Salary &amp; Plan
            </Link>
            <Link to="/expenses" className={navLinkClass("/expenses")}>
              Expenses
            </Link>
            <Link to="/budget" className={navLinkClass("/budget")}>
              Budgets
            </Link>
            <Link to="/goals" className={navLinkClass("/goals")}>
              Goals
            </Link>
          </nav>
        ) : (
          <div className="hidden lg:block" />
        )}

        {/* Zone 3: Actions */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {isLoggedIn ? (
            <>
              {/* Currency Switcher Dropdown */}
              <div className="relative" ref={currencyRef}>
                <button
                  type="button"
                  onClick={() => setShowCurrencyMenu((prev) => !prev)}
                  aria-expanded={showCurrencyMenu}
                  aria-label="Select active currency"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e5eeff] border border-[#006948]/20 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#85f8c4]/60 text-[#005137] text-[10px] font-bold">
                    {activeCurrencyObj.symbol}
                  </span>
                  <span>{activeCurrencyObj.code}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showCurrencyMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                      Workspace Currency
                    </div>
                    {Object.values(CURRENCIES).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          if (onCurrencyChange) onCurrencyChange(c.code);
                          setShowCurrencyMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-[#eff4ff] transition-colors cursor-pointer ${
                          currentCurrency === c.code
                            ? "font-bold text-[#006948] bg-[#eff4ff]/70"
                            : "text-[#0b1c30]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#eff4ff] flex items-center justify-center font-bold text-[11px]">
                            {c.symbol}
                          </span>
                          <span>
                            {c.code} · {c.name}
                          </span>
                        </span>
                        {currentCurrency === c.code && (
                          <Check className="w-3.5 h-3.5 text-[#006948]" />
                        )}
                      </button>
                    ))}
                    {onOpenFXModal && (
                      <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCurrencyMenu(false);
                            onOpenFXModal();
                          }}
                          className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-[#006948] hover:bg-[#eff4ff] flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>FX Spot Matrix &amp; Routes</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link
                to="/settings"
                aria-label="Workspace settings"
                title="Workspace settings"
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                  location.pathname === "/settings"
                    ? "bg-[#006948] text-white border-[#006948]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={onLogoutClick}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e5eeff] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006948]"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex items-center gap-1" ref={popoverRef}>
                <button
                  type="button"
                  onClick={() => handleOpenAuth("login")}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    authModalMode === "login"
                      ? "text-[#006948] bg-[#eff4ff]"
                      : "text-slate-700 hover:text-[#0b1c30] hover:bg-[#eff4ff]"
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
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006948] ${
                    showCreds
                      ? "bg-[#eff4ff] border-[#006948]/40 text-[#006948]"
                      : "bg-white border-slate-200 text-slate-500 hover:text-[#006948] hover:border-[#006948]/30 hover:bg-[#eff4ff]/70"
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
                      <p className="text-xs font-semibold text-[#0b1c30]">
                        Demo Login Credentials
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowCreds(false)}
                        aria-label="Close credentials"
                        className="text-slate-400 hover:text-[#0b1c30] p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 bg-[#eff4ff]/70 border border-slate-200 rounded-lg px-2.5 py-2">
                        <div className="min-w-0">
                          <span className="block text-[11px] text-slate-500">
                            Email
                          </span>
                          <code className="font-mono text-[#0b1c30] font-medium break-all">
                            test@wealthwise.com
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyValue("email", "test@wealthwise.com")
                          }
                          aria-label="Copy email"
                          className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-[#006948] hover:bg-white transition-colors cursor-pointer"
                        >
                          {copiedField === "email" ? (
                            <Check className="w-3.5 h-3.5 text-[#006948]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-[#eff4ff]/70 border border-slate-200 rounded-lg px-2.5 py-2">
                        <div className="min-w-0">
                          <span className="block text-[11px] text-slate-500">
                            Password
                          </span>
                          <code className="font-mono text-[#0b1c30] font-medium">
                            password123
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyValue("password", "password123")}
                          aria-label="Copy password"
                          className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-[#006948] hover:bg-white transition-colors cursor-pointer"
                        >
                          {copiedField === "password" ? (
                            <Check className="w-3.5 h-3.5 text-[#006948]" />
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
                className="px-4 py-2 text-sm font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006948]"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-2">
          {isLoggedIn && onOpenFXModal && (
            <button
              type="button"
              onClick={onOpenFXModal}
              aria-label="Switch currency"
              className="inline-flex items-center gap-1 px-2.5 h-10 rounded-lg border border-slate-200 bg-[#eff4ff] text-xs font-bold text-[#0b1c30] cursor-pointer"
            >
              <span>{activeCurrencyObj.symbol}</span>
              <span>{activeCurrencyObj.code}</span>
            </button>
          )}
          {!isLoggedIn && (
            <button
              type="button"
              onClick={() => setShowCreds((prev) => !prev)}
              aria-label="Demo login credentials"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-600 hover:text-[#006948] hover:bg-[#eff4ff] cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Credentials Banner when toggled */}
      {!isLoggedIn && showCreds && (
        <div className="lg:hidden border-t border-slate-200 bg-[#eff4ff] px-4 py-3 text-xs space-y-2">
          <p className="font-semibold text-[#0b1c30]">Demo Login Credentials</p>
          <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <span className="text-slate-500 mr-1.5">Email:</span>
              <code className="font-mono text-[#0b1c30] font-medium break-all">
                test@wealthwise.com
              </code>
            </div>
            <button
              type="button"
              onClick={() => copyValue("email", "test@wealthwise.com")}
              aria-label="Copy email"
              className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-[#006948] cursor-pointer"
            >
              {copiedField === "email" ? (
                <Check className="w-3.5 h-3.5 text-[#006948]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <span className="text-slate-500 mr-1.5">Password:</span>
              <code className="font-mono text-[#0b1c30] font-medium">
                password123
              </code>
            </div>
            <button
              type="button"
              onClick={() => copyValue("password", "password123")}
              aria-label="Copy password"
              className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-[#006948] cursor-pointer"
            >
              {copiedField === "password" ? (
                <Check className="w-3.5 h-3.5 text-[#006948]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff]"
              >
                Dashboard
              </Link>
              <Link
                to="/planner"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff]"
              >
                Salary &amp; Plan
              </Link>
              <Link
                to="/expenses"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff]"
              >
                Expenses
              </Link>
              <Link
                to="/budget"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff]"
              >
                Budgets
              </Link>
              <Link
                to="/goals"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff]"
              >
                Goals
              </Link>
              <Link
                to="/settings"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff]"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={onLogoutClick}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleOpenAuth("login")}
                className="w-full text-left block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuth("signup")}
                className="w-full text-left block px-3 py-2.5 rounded-lg text-sm font-semibold text-[#006948] hover:bg-[#eff4ff] cursor-pointer"
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
