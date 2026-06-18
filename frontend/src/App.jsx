import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import ComplaintDetail from './pages/ComplaintDetail';
import Officers from './pages/Officers';
import Layout from './components/Layout';
import './styles.css';

// Show spinner while verifying token with server; redirect only once we're sure
function PrivateRoute({ children }) {
  const { officer, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!officer) {
    // Preserve the URL the user was trying to reach so Login can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// If already logged in, skip the login page entirely
function PublicRoute({ children }) {
  const { officer, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return officer ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={<PublicRoute><Login /></PublicRoute>}
          />
          <Route
            path="/"
            element={<PrivateRoute><Layout /></PrivateRoute>}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"        element={<Dashboard />} />
            <Route path="complaints"       element={<Complaints />} />
            <Route path="complaints/:id"   element={<ComplaintDetail />} />
            <Route path="officers"         element={<Officers />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
