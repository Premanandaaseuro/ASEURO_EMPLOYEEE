import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, LogIn, UserPlus, Briefcase, Camera, Scan, User, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'facelogin'
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '' });

  // Biometric / Face login states
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'warmup' | 'scanning' | 'verifying' | 'success' | 'error'
  const [scanProgress, setScanProgress] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Cleanup camera when switching tabs or unmounting
    return () => {
      stopCamera();
    };
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const stopCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setCameraActive(false);
    setScanStatus('idle');
    setScanProgress(0);
  };

  const handleModeChange = (newMode) => {
    stopCamera();
    setMode(newMode);
  };

  const startFaceScan = async () => {
    if (!form.username.trim()) {
      toast.error('Please enter your username first');
      return;
    }
    
    setScanStatus('warmup');
    setCameraActive(true);
    setScanProgress(5);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 300, height: 300 } 
      });
      
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setScanStatus('scanning');
      setScanProgress(20);
      
      // Simulate face scan scanning indicator
      let progress = 20;
      const interval = setInterval(() => {
        progress += 16;
        if (progress >= 100) {
          clearInterval(interval);
          setScanProgress(100);
          captureAndLogin();
        } else {
          setScanProgress(progress);
        }
      }, 300);
      
    } catch (err) {
      console.error(err);
      toast.error('Unable to access webcam. Please check site permissions.');
      stopCamera();
    }
  };

  const captureAndLogin = async () => {
    setScanStatus('verifying');
    try {
      const video = videoRef.current;
      if (!video) throw new Error('Video element not found');

      // Draw video frame to canvas
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 300, 300);
      const base64Photo = canvas.toDataURL('image/jpeg');

      // Call API
      const res = await authApi.faceLogin({
        username: form.username,
        capturedPhoto: base64Photo
      });

      setScanStatus('success');
      toast.success(res.data.message || 'Face verification successful!');
      
      setTimeout(() => {
        stopCamera();
        login(res.data);
        navigate('/dashboard');
      }, 1000);

    } catch (err) {
      const msg = err.response?.data?.message || 'Face verification failed.';
      toast.error(msg);
      setScanStatus('error');
      setTimeout(() => {
        stopCamera();
      }, 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authApi.login({ username: form.username, password: form.password })
        : await authApi.register(form);
      login(res.data);
      toast.success(res.data.message || 'Welcome!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      {/* CSS Animations style tag */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); border-color: rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.8); border-color: rgba(99, 102, 241, 0.8); }
        }
        @keyframes pulse-glow-success {
          0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); border-color: rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 35px rgba(16, 185, 129, 0.8); border-color: rgba(16, 185, 129, 0.8); }
        }
        @keyframes pulse-glow-error {
          0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 35px rgba(239, 68, 68, 0.8); border-color: rgba(239, 68, 68, 0.8); }
        }
        .scanner-ring {
          animation: pulse-glow 2s infinite ease-in-out;
        }
        .scanner-ring.success {
          animation: pulse-glow-success 1.5s infinite ease-in-out;
          border-color: var(--success) !important;
        }
        .scanner-ring.error {
          animation: pulse-glow-error 1.5s infinite ease-in-out;
          border-color: var(--danger) !important;
        }
        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 3px;
          background: linear-gradient(to right, transparent, rgba(99, 102, 241, 0.8), transparent);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.8);
          animation: scan 2s linear infinite;
          z-index: 10;
          pointer-events: none;
        }
        .scan-line.scanning {
          background: linear-gradient(to right, transparent, rgba(16, 185, 129, 0.9), transparent);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.9);
        }
      `}} />

      {/* Background blobs */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', right: '10%',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 10 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
          }}>
            <Briefcase size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>EMS Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Employee Management System
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '36px', border: '1px solid var(--border-glass)' }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex', marginBottom: '28px',
            background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)',
            padding: '4px', gap: '4px',
          }}>
            {[
              { id: 'login', label: 'Sign In' },
              { id: 'facelogin', label: 'Face Sign In' },
              { id: 'register', label: 'Register' }
            ].map(tab => (
              <button key={tab.id} onClick={() => handleModeChange(tab.id)} style={{
                flex: 1, padding: '10px 6px', border: 'none', borderRadius: '8px',
                background: mode === tab.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                color: mode === tab.id ? '#fff' : 'var(--text-muted)',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8rem',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: mode === tab.id ? '0 2px 10px rgba(99,102,241,0.4)' : 'none',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* FACE LOGIN VIEW */}
          {mode === 'facelogin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div className="form-group" style={{ width: '100%' }}>
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <User size={16} />
                  </span>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter username for biometric verification"
                    style={{ paddingLeft: '38px' }}
                    required
                    disabled={cameraActive}
                  />
                </div>
              </div>

              {/* Live Scanner Circular Stream */}
              {cameraActive ? (
                <div 
                  className={`scanner-ring ${scanStatus === 'success' ? 'success' : scanStatus === 'error' ? 'error' : ''}`}
                  style={{
                    position: 'relative', width: '220px', height: '220px',
                    borderRadius: '50%', overflow: 'hidden',
                    border: '3px solid var(--accent)', background: '#020617',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: '10px'
                  }}
                >
                  <video 
                    ref={videoRef}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      transform: 'scaleX(-1)' // mirror display
                    }}
                    muted
                    playsInline
                  />

                  {/* Scan animations based on status */}
                  {(scanStatus === 'scanning' || scanStatus === 'verifying') && (
                    <div className={`scan-line ${scanStatus === 'scanning' ? 'scanning' : ''}`} />
                  )}

                  {/* Screen Overlays */}
                  {scanStatus === 'warmup' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 30, 0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <RefreshCw className="spin" size={24} style={{ marginBottom: '8px', color: 'var(--accent-light)' }} />
                      Initializing Biometrics...
                    </div>
                  )}

                  {scanStatus === 'verifying' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 30, 0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <Scan size={24} className="pulse" style={{ marginBottom: '8px', color: 'var(--accent-light)' }} />
                      Verifying Face...
                    </div>
                  )}

                  {scanStatus === 'success' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      <CheckCircle size={32} style={{ marginBottom: '6px' }} />
                      ACCESS GRANTED
                    </div>
                  )}

                  {scanStatus === 'error' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#fff', fontWeight: 600, padding: '10px', textAlign: 'center' }}>
                      <AlertCircle size={32} style={{ marginBottom: '6px' }} />
                      MATCH FAILED
                    </div>
                  )}

                  {/* Progress ring or scanner indicator */}
                  {scanStatus === 'scanning' && (
                    <div style={{ position: 'absolute', bottom: '12px', background: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', color: '#fff', fontWeight: 600 }}>
                      SCANNING {scanProgress}%
                    </div>
                  )}
                </div>
              ) : (
                /* Scanner Locked / Idle View */
                <div 
                  style={{
                    width: '220px', height: '220px', borderRadius: '50%',
                    border: '2px dashed var(--border-glass)', background: 'rgba(255,255,255,0.01)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    marginTop: '10px', color: 'var(--text-muted)'
                  }}
                >
                  <Camera size={36} style={{ marginBottom: '10px' }} />
                  <span style={{ fontSize: '0.75rem' }}>Biometric Camera Offline</span>
                </div>
              )}

              {/* Status Message Text */}
              {scanStatus === 'scanning' && (
                <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 500, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                  LOOK DIRECTLY AT CAMERA
                </div>
              )}

              {/* Control Action Buttons */}
              <div style={{ width: '100%', marginTop: '10px', display: 'flex', gap: '10px' }}>
                {!cameraActive ? (
                  <button 
                    onClick={startFaceScan} 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                  >
                    <Camera size={16} />
                    Activate Face Scanner
                  </button>
                ) : (
                  <button 
                    onClick={stopCamera} 
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                    disabled={scanStatus === 'success' || scanStatus === 'verifying'}
                  >
                    Cancel Scan
                  </button>
                )}
              </div>

              <div style={{
                padding: '12px 16px', background: 'rgba(99,102,241,0.08)', 
                borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99,102,241,0.2)', 
                fontSize: '0.8rem', color: 'var(--text-secondary)', width: '100%'
              }}>
                <strong style={{ color: 'var(--accent-light)' }}>Note:</strong> Register your face profile first inside the portal using standard credentials before attempting Face Sign In.
              </div>
            </div>
          )}

          {/* STANDARD PASSWORD LOGIN OR REGISTER VIEW */}
          {mode !== 'facelogin' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <User size={16} />
                  </span>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter username"
                    style={{ paddingLeft: '38px' }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter email"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter password"
                    style={{ paddingRight: '44px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}
                style={{ padding: '12px', fontSize: '0.95rem', marginTop: '4px', justifyContent: 'center' }}>
                {loading
                  ? <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />Processing...</>
                  : mode === 'login'
                    ? <><LogIn size={16} />Sign In</>
                    : <><UserPlus size={16} />Create Account</>
                }
              </button>
            </form>
          )}

          {mode === 'login' && (
            <div style={{
              marginTop: '20px', padding: '12px 16px',
              background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}>
              <strong style={{ color: 'var(--accent-light)' }}>Demo credentials:</strong>
              <br />Username: <code style={{ color: 'var(--text-primary)' }}>admin</code> &nbsp;|&nbsp;
              Password: <code style={{ color: 'var(--text-primary)' }}>admin123</code>
              <br />Username: <code style={{ color: 'var(--text-primary)' }}>user</code> &nbsp;|&nbsp;
              Password: <code style={{ color: 'var(--text-primary)' }}>user123</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
