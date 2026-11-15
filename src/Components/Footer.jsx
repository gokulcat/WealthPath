import React from "react";

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-white">WealthWise</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span>&copy; WealthWise 2024, Inc. All rights reserved</span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            Terms &amp; Conditions
          </span>
          <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            Privacy
          </span>
          <div className="flex items-center gap-4 pl-2 border-l border-slate-800">
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="text-slate-400 hover:text-white transition-colors duration-150"
            >
              <i className="fab fa-facebook-f text-base"></i>
            </a>
            <a
              href="https://twitter.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="text-slate-400 hover:text-white transition-colors duration-150"
            >
              <i className="fab fa-twitter text-base"></i>
            </a>
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="text-slate-400 hover:text-white transition-colors duration-150"
            >
              <i className="fab fa-linkedin-in text-base"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
