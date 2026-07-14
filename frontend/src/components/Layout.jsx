import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Briefcase, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees',  icon: Users },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 100, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '240px', minHeight: '100vh', flexShrink: 0,
        background: 'rgba(9,14,30,0.95)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-glass)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 200,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px', borderBottom: '1px solid var(--border-glass)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}>
            <Briefcase size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>EMS</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Management Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: '8px' }}>
            Navigation
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              marginBottom: '4px', textDecoration: 'none', fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500, transition: 'all 0.2s',
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            })}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-glass)', marginBottom: '8px',
          }}>
            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, truncate: true }}>{user?.username}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isAdmin ? '👑 Admin' : '👤 User'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px' }}>
            <LogOut size={15} />Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ marginLeft: '240px', flex: 1, minWidth: 0 }}>
        {/* Top bar (mobile) */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,15,30,0.8)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-glass)',
          padding: '14px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            className="btn btn-icon btn-secondary"
            onClick={() => setSidebarOpen(s => !s)}
            style={{ display: 'none' }}
          >
            <Menu size={18} />
          </button>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Employee Management System
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Welcome, <strong style={{ color: 'var(--accent-light)' }}>{user?.username}</strong>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '32px 28px', maxWidth: '1400px', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
