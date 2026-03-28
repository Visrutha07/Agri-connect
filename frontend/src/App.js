import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import FarmerApp from './pages/FarmerApp';
import CustomerApp from './pages/CustomerApp';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={
        user
          ? <Navigate to={user.role === 'farmer' ? '/farmer' : '/customer'} replace />
          : <Landing />
      } />
      <Route path="/login"    element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/farmer/*" element={
        <ProtectedRoute role="farmer"><FarmerApp /></ProtectedRoute>
      } />
      <Route path="/customer/*" element={
        <ProtectedRoute role="customer"><CustomerApp /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
