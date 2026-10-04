import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store/authSlice';

function App() {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Failsafe: if somehow User is stored but no Token exists, clear it out.
  useEffect(() => {
    if (user && !token) {
      dispatch(logout());
    }
  }, [user, token, dispatch]);

  const isAuthenticated = user && token;

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/resetpassword" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
