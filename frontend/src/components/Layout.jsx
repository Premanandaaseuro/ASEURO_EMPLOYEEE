import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Briefcase, Menu, X, Key, Camera, Shield, Check } from 'lucide-react';
import { useState, useRef } from 'react';
import { authApi } from '../services/api';
import { toast } from 'react-hot-toast';

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Face Registration states
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceCameraActive, setFaceCameraActive] = useState(false);
  const [capturedFace, setCapturedFace] = useState(null);
  const [savingFace, setSavingFace] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const videoRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const startRegisterCamera = async () => {
    setCapturedFace(null);
    setFaceCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 300, height: 300 }
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not access camera. Please check browser permissions.');
      setFaceCameraActive(false);
    }
  };

  const stopRegisterCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setFaceCameraActive(false);
  };

  const closeFaceModal = () => {
    stopRegisterCamera();
    setShowFaceModal(false);
    setCapturedFace(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedFace(dataUrl);
      stopRegisterCamera();
    }
  };

  const saveFaceProfile = async () => {
    if (!capturedFace) return;
    setSavingFace(true);
    try {
      await authApi.registerFace({ capturedPhoto: capturedFace });
      toast.success('Face profile registered successfully!');
      closeFaceModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save face profile');
      console.error(err);
    } finally {
      setSavingFace(false);
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees',  icon: Users },
    { to: '/licenses',  label: 'Licenses',   icon: Key },
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
          
          {/* Face Profile Button */}
          <button 
            onClick={() => setShowFaceModal(true)}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '8px', marginBottom: '8px', fontSize: '0.8rem', gap: '6px' }}
          >
            <Camera size={14} /> Biometric Face
          </button>

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

      {/* FACE REGISTRATION MODAL */}
      {showFaceModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div 
            className="glass-card fade-in" 
            style={{ 
              width: '100%', maxWidth: '440px', padding: '32px', 
              background: '#0d1526', border: '1px solid var(--border-glass)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}
          >
            <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
              <Shield size={20} color="var(--accent-light)" />
              Setup Biometric Face Profile
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '24px', alignSelf: 'flex-start', lineHeight: 1.4 }}>
              Register your face to enable high-speed Face Sign In. Make sure your face is well-lit and fully visible inside the scanning circle.
            </p>

            {/* Webcam viewport */}
            <div style={{
              width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden',
              border: '3px solid var(--border-glass)', background: '#020617',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', marginBottom: '24px',
              boxShadow: '0 0 15px rgba(255,255,255,0.02)'
            }}>
              {faceCameraActive && (
                <video 
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  muted
                  playsInline
                />
              )}

              {capturedFace && (
                <img 
                  src={capturedFace} 
                  alt="Captured face preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              {!faceCameraActive && !capturedFace && (
                <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.75rem' }}>
                  <Camera size={32} style={{ marginBottom: '8px' }} />
                  Camera Inactive
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
              {!faceCameraActive && !capturedFace && (
                <button onClick={startRegisterCamera} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Camera size={15} /> Start Camera
                </button>
              )}

              {faceCameraActive && (
                <button onClick={capturePhoto} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Capture Snapshot
                </button>
              )}

              {capturedFace && (
                <>
                  <button onClick={startRegisterCamera} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    Retake
                  </button>
                  <button 
                    onClick={saveFaceProfile} 
                    className="btn btn-primary" 
                    style={{ flex: 1, justifyContent: 'center', background: 'var(--success)', border: 'none', color: '#fff' }}
                    disabled={savingFace}
                  >
                    {savingFace ? 'Saving...' : 'Save Profile'}
                  </button>
                </>
              )}

              <button onClick={closeFaceModal} className="btn btn-secondary" disabled={savingFace}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
