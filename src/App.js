// src/App.js
import React, { useState, useEffect } from 'react';
import SignUp from './SignUp';
import SignIn from './SignIn';
import UserPool from './cognitoConfig';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = () => {
      const cognitoUser = UserPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
          if (err) {
            console.error(err);
          } else {
            setUser(session);
          }
        });
      }
    };
    getSession();
  }, []);

  return (
    <div>
      {!user ? (
        <>
          <SignUp />
          <SignIn />
        </>
      ) : (
        <div>
          <h2>Welcome, {user.getIdToken().payload['cognito:username']}</h2>
        </div>
      )}
    </div>
  );
}

export default App;
