import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import VehicleListing from './pages/customer/VehicleListing';
import VehicleDetails from './pages/customer/VehicleDetails';
import AIRecommendationsPage from './pages/customer/AIRecommendationsPage';
import BookingPaymentPage from './pages/customer/BookingPaymentPage';
import CustomerPaymentsPage from './pages/customer/CustomerPaymentsPage';
import CustomerRentalsAndReturn from './pages/customer/CustomerRentalsAndReturn';
import CustomerHistoryPage from './pages/customer/CustomerHistoryPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVehiclesPage from './pages/admin/AdminVehiclesPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminReturnsPage from './pages/admin/AdminReturnsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminDemandAnalysisPage from './pages/admin/AdminDemandAnalysisPage';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-bold text-slate-600">
        Verifying session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-bold text-slate-600">
        Verifying admin permissions...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/customer/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Customer & Public Storefront */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/vehicles" element={<VehicleListing />} />
            <Route path="/vehicles/:id" element={<VehicleDetails />} />

            <Route
              path="/customer/dashboard"
              element={
                <RequireAuth>
                  <CustomerDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/customer/recommendations"
              element={
                <RequireAuth>
                  <AIRecommendationsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/customer/payments"
              element={
                <RequireAuth>
                  <CustomerPaymentsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/customer/payment/:bookingId"
              element={
                <RequireAuth>
                  <BookingPaymentPage />
                </RequireAuth>
              }
            />
            <Route
              path="/customer/rentals"
              element={
                <RequireAuth>
                  <CustomerRentalsAndReturn />
                </RequireAuth>
              }
            />
            <Route
              path="/customer/history"
              element={
                <RequireAuth>
                  <CustomerHistoryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <RequireAuth>
                  <CustomerProfilePage />
                </RequireAuth>
              }
            />
          </Route>

          {/* Role-Protected Admin Console */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="vehicles" element={<AdminVehiclesPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="returns" element={<AdminReturnsPage />} />
            <Route path="history" element={<CustomerHistoryPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="demand" element={<AdminDemandAnalysisPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
