


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(loggedInStatus === 'true');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/WealthWise" className="logo"> <span className='sp'>W</span>ealthWise</Link>
        
        <ul className="nav-menu">
          {isLoggedIn ? (
            <>
            
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/goals">Goals</Link></li>
              <li><Link to="/expenses">Add Expenses</Link></li>
              <li><Link to="/budget">Budgets</Link></li>
              <li><Link to="/expenses/export">My Expenses</Link></li>

              <li><Link to="/WealthWise" onClick={handleLogout}>Logout</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;