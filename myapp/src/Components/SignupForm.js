import React, { useState } from "react";
import Footer from "./Footer";
import Wealthwise from "../assests/WealthwiseLogo.png";

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState([]); // Local state to store users

  const handleSubmit = (event) => {
    event.preventDefault();

    // Check if the email is already registered
    const userExists = users.some((user) => user.email === email);
    if (userExists) {
      alert("User ID already exists! Try a different email.");
      return;
    }

    // Add the new user to the local state
    const newUser = { email, password };
    setUsers([...users, newUser]);

    // Clear the input fields
    setEmail("");
    setPassword("");

    alert("User Registered Successfully!");
    console.log("Registered Users:", users);

    // Redirect to login (simulated)
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-gray-100 via-purple-200 to-purple-300">
      {/* Signup Form */}
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
            Sign Up
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
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition duration-200"
          >
            Sign Up
          </button>
          <div className="text-center mt-4">
            <a
              href="/login"
              className="text-sm text-purple-600 hover:underline"
            >
              Have an account? Login for WealthWise
            </a>
          </div>
        </form>
      </div>

      {/* Footer */}
      <Footer/>
    </div>
  );
}

export default SignupForm;
