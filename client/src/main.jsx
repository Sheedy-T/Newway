// src/main.jsx - CORRECTED
// import React from 'react'
// import { createRoot } from 'react-dom/client'
// import App from './App'

// import './index.css'  // Remove ../src prefix
// import './App.css'
// import { AuthProvider } from "./components/AuthContext";

// createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <AuthProvider>
//         <App />
//  </AuthProvider>
//   </React.StrictMode>
// )
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';
import './App.css';
import { BrowserRouter } from "react-router-dom";
import 'globalthis/auto'; // polyfills globalThis for old-style "global"

// IMPORTANT: This line is added to fix the Simple-Peer "global is not defined" error
window.global = window;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

