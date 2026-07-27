/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Passenger from './pages/Passenger';
import Driver from './pages/Driver';
import DriverAccount from './pages/DriverAccount';
import Admin from './pages/Admin';
import UserProfile from './pages/UserProfile';
import RideHistory from './pages/RideHistory';
import { AuthProvider, useAuth } from './AuthContext';

import HomePage from './pages/HomePage';

// A simple protective wrapper
const ProtectedRoute = ({ children, allowedRole }: { children: any, allowedRole?: string }) => {
  const { token, user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;
  }
  
  if (!token || !user) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route path="/home" element={
              <ProtectedRoute>
                  <HomePage />
              </ProtectedRoute>
          } />
          <Route path="/passenger" element={
              <ProtectedRoute allowedRole="passenger">
                  <Passenger />
              </ProtectedRoute>
          } />
          <Route path="/driver" element={
              <ProtectedRoute allowedRole="driver">
                  <Driver />
              </ProtectedRoute>
          } />
          <Route path="/driver/account" element={
              <ProtectedRoute allowedRole="driver">
                  <DriverAccount />
              </ProtectedRoute>
          } />
          <Route path="/history" element={
              <ProtectedRoute>
                  <RideHistory />
              </ProtectedRoute>
          } />
          <Route path="/admin" element={
              <ProtectedRoute allowedRole="admin">
                  <Admin />
              </ProtectedRoute>
          } />
          <Route path="/profile" element={
              <ProtectedRoute>
                  <UserProfile />
              </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
