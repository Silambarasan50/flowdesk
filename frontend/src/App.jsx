import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute, { homeFor } from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import KanbanPage from './pages/KanbanPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MyTicketsPage from './pages/MyTicketsPage';
import SubmitTicketPage from './pages/SubmitTicketPage';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homeFor(user)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route
          path="/workspace/kanban"
          element={
            <ProtectedRoute roles={['Admin', 'Agent']}>
              <KanbanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['Admin', 'Agent']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/portal/tickets" element={<MyTicketsPage />} />
        <Route path="/portal/submit" element={<SubmitTicketPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
