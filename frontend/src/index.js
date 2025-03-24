import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
<<<<<<< HEAD
import { ClerkProvider } from '@clerk/clerk-react'
import {  RedirectToSignIn, SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";


const clerk_key=process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

console.log(clerk_key);
if(!clerk_key){
  throw new Error("Key WAS NOT FOUND");
}

const ClerkWithRoutes = () => {


  const navigate = useNavigate();
 

  return (
    <ClerkProvider publishableKey={clerk_key} navigate={(to) => navigate(to)}>
      <Routes>
      <Route
          path="/*"
          element={
            <>
              <SignedIn>
                <App />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* Sign-in and Sign-up routes */}
        <Route
          path="/sign-in/*"
          element={
            <SignIn
              afterSignInUrl="/"
              afterSignOutUrl="/sign-in"
              routing="path"
              path="/sign-in"
            />
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <SignUp
              afterSignUpUrl="/"
              routing="path"
              path="/sign-up"
            />
          }
        />
       
      </Routes>
    </ClerkProvider>
  );
}
=======
>>>>>>> original/Frontend

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
<<<<<<< HEAD
    {/* <ClerkProvider publishableKey={clerk_key}>
      <App />
    </ClerkProvider> */}
    <BrowserRouter>
      <ClerkWithRoutes />
    </BrowserRouter>
=======
    <App />
>>>>>>> original/Frontend
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
