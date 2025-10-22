import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CashRegisterProvider } from './contexts/CashRegisterContext';
import LoginPage from './pages/LoginPage';
import GastrobarLayout from './components/GastrobarLayout';
import TablesPage from './pages/gastrobar/TablesPage';
import OrdersPage from './pages/gastrobar/OrdersPage';
import MenuPage from './pages/gastrobar/MenuPage';
import ReservationsPage from './pages/gastrobar/ReservationsPage';
import KitchenView from './pages/gastrobar/KitchenView';
import CashRegisterPage from './pages/gastrobar/CashRegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsDashboardPage from './pages/gastrobar/AnalyticsDashboardPage';
import ConfigurationPage from './pages/gastrobar/ConfigurationPage';
const queryClient = new QueryClient();
// Componente protector de rutas
const ProtectedRoute = ({
  children,
  requiredRoles = []
}) => {
  const {
    user,
    isAuthenticated,
    isLoading
  } = useAuth();
  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  // Redirect users based on their roles when they access dashboard or home page
  if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
    // Redirect cook/cocinero users to kitchen view
    if (user.role === 'cook' || user.role === 'cocinero') {
      return <Navigate to="/cocina" replace />;
    }
    // Redirect cashier/cajero users to cash register
    if (user.role === 'cashier' || user.role === 'cajero') {
      return <Navigate to="/caja" replace />;
    }
    // Redirect waiter/mesero users to orders
    if (user.role === 'waiter' || user.role === 'mesero') {
      return <Navigate to="/ordenes" replace />;
    }
    // Redirect admin users to analytics
    if (user.role === 'admin') {
      return <Navigate to="/metricas" replace />;
    }
  }
  return children;
};
export function App() {
  return <div className="w-full h-full bg-white">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <CashRegisterProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={<ProtectedRoute>
                        <GastrobarLayout />
                      </ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="metricas" element={<AnalyticsDashboardPage />} />
                    <Route path="mesas" element={<TablesPage />} />
                    <Route path="ordenes" element={<OrdersPage />} />
                    <Route path="menu" element={<MenuPage />} />
                    <Route path="reservaciones" element={<ReservationsPage />} />
                    <Route path="cocina" element={<KitchenView />} />
                    <Route path="caja" element={<CashRegisterPage />} />
                    <Route path="configurar" element={<ConfigurationPage />} />
                  </Route>
                </Routes>
              </Router>
            </CashRegisterProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>;
}