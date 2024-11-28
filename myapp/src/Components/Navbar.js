import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedInStatus = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(loggedInStatus === "true");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  return (
    <nav className="bg-purple-600 text-white py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold flex items-center">
          <span className="text-white bg-purple-800 px-2 py-1 rounded-full mr-0.5 ml-1">
            W
          </span>
          ealthWise
        </Link>

        {/* Navigation Links */}
        <ul className="flex space-x-6">
          {isLoggedIn ? (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md hover:bg-white hover:text-purple-600 transition duration-300"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/goals"
                  className="px-3 py-2 rounded-md hover:bg-white hover:text-purple-600 transition duration-300"
                >
                  Goals
                </Link>
              </li>
              <li>
                <Link
                  to="/expenses"
                  className="px-3 py-2 rounded-md hover:bg-white hover:text-purple-600 transition duration-300"
                >
                  Add Expenses
                </Link>
              </li>
              <li>
                <Link
                  to="/budget"
                  className="px-3 py-2 rounded-md hover:bg-white hover:text-purple-600 transition duration-300"
                >
                  Budgets
                </Link>
              </li>
              <li>
                <Link
                  to="/wealthwise"
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md hover:bg-white hover:text-purple-600 transition duration-300"
                >
                  Logout
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md hover:bg-white hover:text-purple-600 transition duration-300"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="px-3 py-2 rounded-md hover:bg-white hover:text-purple-600 transition duration-300"
                >
                  SignUp
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
      
    </nav>
    
  );
};

export default Navbar;
