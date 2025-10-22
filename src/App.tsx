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
  const { user, isAuthenticated, isLoading } = useAuth();

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Si no hay sesión, llevar siempre a /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se exige rol específico y no coincide, llevar al dashboard (o a donde definas)
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirecciones por rol cuando el usuario entra a "/" o "/dashboard"
  if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
    // Cocinero → cocina
    if (user.role === 'cook' || user.role === 'cocinero') {
      return <Navigate to="/cocina" replace />;
    }
    // Cajero → caja
    if (user.role === 'cashier' || user.role === 'cajero') {
      return <Navigate to="/caja" replace />;
    }
    // Mesero → órdenes
    if (user.role === 'waiter' || user.role === 'mesero') {
      return <Navigate to="/ordenes" replace />;
    }
    // Admin → métricas
    if (user.role === 'admin') {
      return <Navigate to="/metricas" replace />;
    }
  }

  return children;
};

export function App() {
  return (
    <div className="w-full h-full bg-white">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <CashRegisterProvider>
              <Router>
                <Routes>
                  {/* ===== Página inicial deseada: LOGIN ===== */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Resto de la app protegida bajo "/" */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <GastrobarLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Importante: quitamos el redirect al dashboard para que
                        la ruta "/" caiga en ProtectedRoute y éste decida:
                        - Sin sesión → /login
                        - Con sesión → redirección por rol */}
                    {/* <Route index element={<Navigate to="/dashboard" replace />} /> */}

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

                  {/* Cualquier ruta desconocida → login */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Router>
            </CashRegisterProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}
