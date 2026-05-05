import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import AppLayout from './components/ui/AppLayout';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import PlanosPage from './pages/PlanosPage';
import CronogramasPage from './pages/CronogramasPage';
import TarefasPage from './pages/TarefasPage';
import IndicadoresPage from './pages/IndicadoresPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={
            <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>
          } />
          <Route element={
            <ProtectedRoute><AppLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/planos" element={<PlanosPage />} />
            <Route path="/cronogramas" element={<CronogramasPage />} />
            <Route path="/tarefas" element={<TarefasPage />} />
            <Route path="/indicadores" element={<IndicadoresPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
