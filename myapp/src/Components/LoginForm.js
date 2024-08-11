import React, { useState } from 'react';
import axios from 'axios';
import '../styles/LoginForm.css';
import '../styles/footer.css';


function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const url = "http://localhost:4000/auth/login";

    try {
      const response = await axios.post(url, { email, password });
      console.log(response.data);
      localStorage.setItem('isLoggedIn', 'true'); // Set login status in localStorage
      window.location.href = "/dashboard"; // Redirect to dashboard
    } catch (error) {
      console.error(error.response.data);
      alert("Invalid Credentials"); // Show error alert
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <img src="WealthwiseLogo.png" alt='Wealthwise Logo' />
        <h1> Login</h1>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit">Log In</button>
        <br />
        <a href='/signup'>Don't have an account? Sign Up for WealthWise</a>


      </form>
      <footer className="footer">
        <div className="container">
          <div className='conatiner'>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
              Facebook
            </a>|
            <a href="https://twitter.com/" target="_blank" rel="noreferrer">
              Twitter
            </a>|
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">
              Linkedin
            </a>|
          </div>
          &copy; WealthWise 2024, Inc. All rights reserved &nbsp; &nbsp;
          Terms & Conditions &nbsp; &nbsp;
          Privacy &nbsp; &nbsp;
        </div>
      </footer>


    </div>
  );
}

export default LoginForm;