// src/SignIn.js
import React, { useState } from 'react';
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import UserPool from './cognitoConfig';

function SignIn({ onSignInSuccess }) {  // Add onSignInSuccess prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();

    const user = new CognitoUser({ Username: username, Pool: UserPool });
    const authDetails = new AuthenticationDetails({ Username: username, Password: password });

    user.authenticateUser(authDetails, {
      onSuccess: (data) => {
        console.log('onSuccess:', data);
        setMessage('Sign in successful!');
        onSignInSuccess();  // Trigger the callback
      },
      onFailure: (err) => {
        console.error('onFailure:', err);
        setMessage(err.message || JSON.stringify(err));
      },
      newPasswordRequired: (data) => {
        console.log('newPasswordRequired:', data);
        setMessage('New password is required.');
      },
    });
  };

  return (
    <div>
      <h2>Sign In</h2>
      <form onSubmit={onSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">Sign In</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default SignIn;