// src/VerifyAccount.js
import React, { useState } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import UserPool from './cognitoConfig';

function VerifyAccount() {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();

    const userData = {
      Username: username,
      Pool: UserPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        setMessage(err.message || JSON.stringify(err));
      } else {
        setMessage('Verification successful! You can now sign in.');
      }
    });
  };

  return (
    <div>
      <h2>Verify Account</h2>
      <form onSubmit={onSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Verification Code"
        />
        <button type="submit">Verify</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default VerifyAccount;