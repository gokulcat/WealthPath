import React, { useState } from "react";
import Footer from "./Footer";
import Wealthwise from "../assests/WealthwiseLogo.png";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    // Mock login validation for client-side functionality
    if (email === "test@wealthwise.com" && password === "password123") {
      localStorage.setItem("isLoggedIn", "true"); // Set login status in localStorage
      window.location.href = "/dashboard"; // Redirect to dashboard
      alert("Login successful! Redirecting to dashboard...");
    } else {
      alert("Invalid Credentials"); // Show error alert
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-gray-100 via-purple-200 to-purple-300">
      {/* Login Form */}

      <div className="flex items-center justify-center flex-grow">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full"
        >
          <img
            src={Wealthwise}
            alt="Wealthwise Logo"
            className="mx-auto mb-6 w-30"
          />
          <h1 className="text-2xl font-bold text-center text-purple-600 mb-4">
            Login
          </h1>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            Log In
          </button>
          <div className="text-center mt-4">
            <a
              href="/signup"
              className="text-sm text-purple-600 hover:underline"
            >
              Don't have an account? Sign Up for WealthWise
            </a>
          </div>
        </form>
      </div>

      {/* Footer */}
      <Footer/>
    </div>
  );
}

export default LoginForm;
