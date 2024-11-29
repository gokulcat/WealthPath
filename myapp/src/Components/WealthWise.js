import React, { useState } from "react";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import WW from "../assests/WW.jpg"; // Add your image import

const WelcomePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleGetStarted = () => {
    navigate("/signup");
  };

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (email) {
      alert(`Thank you for subscribing, ${email}!`);
      setEmail(""); // Clear the email input after subscribing
    } else {
      alert("Please enter a valid email address!");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${WW})` }} // Add background image
    >
      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
          <h1 className="text-4xl font-bold text-purple-600 mb-4">
            Welcome to WealthWise!
          </h1>
          <p className="text-lg font-medium text-purple-900 mb-6">
            "We're here to help you get there"
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-full transition duration-300"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Subscribe Section */}
      <div className="bg-purple-250 bg-opacity-90 p-6 shadow-md text-center">
        <h2 className="text-2xl font-semibold text-purple-600 mb-2">
          Stay up to date with WealthWise
        </h2>
        <p className="text-white mb-4">
          Subscribe to our newsletter for updates, tips, and financial insights.
        </p>
        <form onSubmit={handleSubscribe} className="flex justify-center">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-l-md focus:ring-purple-500 focus:border-purple-500 w-80"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-r-md transition duration-300"
          >
            Subscribe
          </button>
        </form>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default WelcomePage;
