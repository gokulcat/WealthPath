import React from "react";

function Footer() {
  return (
    <footer className="bg-purple-600 text-white py-4">
      <div className="container mx-auto text-center">
        <div className="flex justify-center items-center space-x-6">
          <a
            href="https://www.facebook.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-purple-300 transition duration-200"
          >
            <i className="fab fa-facebook-f text-xl"></i> {/* Facebook Icon */}
          </a>
          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-purple-300 transition duration-200"
          >
            <i className="fab fa-twitter text-xl"></i> {/* Twitter Icon */}
          </a>
          <a
            href="https://www.linkedin.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-purple-300 transition duration-200"
          >
            <i className="fab fa-linkedin-in text-xl"></i> {/* Linkedin Icon */}
          </a>
        </div>
        <p className="mt-2">
          &copy; WealthWise 2024, Inc. All rights reserved &nbsp; | &nbsp;
          <span className="hover:underline">Terms & Conditions</span> &nbsp; |
          &nbsp;
          <span className="hover:underline">Privacy</span>
        </p>
      </div>
    </footer>
  );
}
export default Footer;
