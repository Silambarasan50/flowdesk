import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute, { homeFor } from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import KanbanPage from './pages/KanbanPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CustomerTicketsPage from './pages/CustomerTicketsPage';
import SubmitTicketPage from './pages/SubmitTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';

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
        <Route path="/portal/tickets" element={<CustomerTicketsPage />} />
        <Route path="/portal/submit" element={<SubmitTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
