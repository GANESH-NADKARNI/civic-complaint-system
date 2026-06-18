import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ClipboardList, Users, LogOut,
  Shield, Activity
} from 'lucide-react';

export default function Layout() {
  const { officer, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-badge">
            <div className="logo-emblem">🚔</div>
            <div>
              <div className="logo-text">KSP Portal</div>
              <div className="logo-sub">ADMIN DASHBOARD</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/complaints" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ClipboardList size={16} /> Complaints
          </NavLink>
          {officer?.role === 'super_admin' && (
            <NavLink to="/officers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={16} /> Officers
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="officer-pill">
            <div className="officer-avatar">
              {officer?.name?.[0]?.toUpperCase() || 'O'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="officer-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {officer?.name}
              </div>
              <div className="officer-role">{officer?.role?.replace('_', ' ')}</div>
            </div>
            <button className="btn-logout" onClick={logout} title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            Test — Complaint Management System
          </div>
          <div className="topbar-badge">
            <Activity size={11} style={{ display: 'inline', marginRight: 4 }} />
            LIVE
          </div>
          <div className="topbar-badge">
            <Shield size={11} style={{ display: 'inline', marginRight: 4 }} />
            {officer?.department || 'HQ'}
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
