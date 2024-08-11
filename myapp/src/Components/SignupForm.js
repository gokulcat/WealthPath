


import React, { useState } from 'react';
import axios from 'axios';
import '../styles/SignupForm.css';
import '../styles/footer.css';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const url = "http://localhost:4000/auth/signup"

  const handleSubmit = async (event) => {
    event.preventDefault();


    try {
      const response = await axios.post(url, {
        email,
        password,
      });

      console.log(response.data);
      window.location.href = "/Login";
      alert("User Registered Successfully");
      // handle successful signup here
    } catch (error) {
      console.error(error.response.data);
      // handle error here
      alert("User Id already Exists or Try different Email and Password");
    }
  };

  return (
    <div>
      <form className='ak' onSubmit={handleSubmit}>
        <img src="WealthwiseLogo.png" alt='Wealthwise Logo' />
        <h1>Signup</h1>
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

        <button type="submit">Sign Up</button>
        <br />
        <a href='Login'>Have an account ? Login for WealthWise</a>
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

export default SignupForm;