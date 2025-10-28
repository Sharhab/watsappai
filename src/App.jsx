import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import QAManager from "./QAManager";
import IntroManager from "./IntroManager";
import ReceiptsManager from "./ReceiptsManager";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Register from "./Register";
import PaymentPage from "./PaymentPage";
import  PaymentMethod  from "./PaymentMethod";
import TwilioSetup from "./TwilioSetup";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider, useAuth } from "./AuthContext";
import "./App.css";


function Sidebar({ open, setOpen }) {
  const { token, tenantId, logout } = useAuth();
  return (
    <>
      <button className="toggle-btn" onClick={() => setOpen(!open)}>☰</button>
      <nav className={`sidebar ${open ? "open" : "closed"}`}>
        <h2>📋 Menu</h2>
        <ul>
          <li><Link to="/">Q&A Manager</Link></li>
          <li><Link to="/intro">Intro Manager</Link></li>
          <li><Link to="/receipts">Receipts</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
        </ul>
        <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          {token ? (
            <>
              <div>Tenant: <b>{tenantId?.slice(0, 6)}...</b></div>
              <button className="btn red" onClick={logout} style={{ marginTop: 8 }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <div><Link to="/login">Login</Link> · <Link to="/register">Register</Link></div>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className="main-content">
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected */}
              <Route path="/" element={
                <ProtectedRoute><QAManager /></ProtectedRoute>
              }/>
              <Route path="/intro" element={
                <ProtectedRoute><IntroManager /></ProtectedRoute>
              }/>
              <Route path="/receipts" element={
                <ProtectedRoute><ReceiptsManager /></ProtectedRoute>
              }/>
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              }/>

              <Route path="/payment" element={
             <ProtectedRoute><PaymentPage /></ProtectedRoute>
             }/>
         <Route path="/payment-method" element={
         <ProtectedRoute><PaymentMethod /></ProtectedRoute>
           }/>

    <Route path="/business-setup" element={
    <ProtectedRoute><TwilioSetup /></ProtectedRoute>
      }/>


            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
