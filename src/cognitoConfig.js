// src/cognitoConfig.js
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_aPb7guMjd', // Replace with your User Pool ID
  ClientId: '56h5bg6lnv1tbdsliulmr31da4', // Replace with your App Client ID
};

const userPool = new CognitoUserPool(poolData); // Assign to a variable

export default userPool; // Export the variable