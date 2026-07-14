import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Key, ShieldCheck, ShieldAlert, Copy, Plus, Trash2, 
  RefreshCw, User, Mail, FileText, CheckCircle, Calendar,
  Shield, Check, AlertTriangle, Layers, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { licenseApi } from '../services/api';

export default function LicensesPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('verify'); // 'verify' or 'manage'
  
  // Verification states
  const [verifyKeyInput, setVerifyKeyInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // Management states
  const [licenses, setLicenses] = useState([]);
  const [publicKey, setPublicKey] = useState('');
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);
  const [regeneratingKeys, setRegeneratingKeys] = useState(false);

  // Form states for generating license
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    productName: 'Enterprise Suite',
    expiryDate: '',
    maxSeats: 1,
    features: []
  });

  const availableFeatures = [
    { id: 'analytics', label: 'Advanced Analytics' },
    { id: 'billing', label: 'Billing Integrations' },
    { id: 'custom_reports', label: 'Custom Reports' },
    { id: 'audit_logs', label: 'Security Audit Logs' },
    { id: 'sso', label: 'Single Sign-On (SSO)' }
  ];

  useEffect(() => {
    if (isAdmin && activeTab === 'manage') {
      fetchLicenses();
      fetchPublicKey();
    }
  }, [activeTab, isAdmin]);

  const fetchLicenses = async () => {
    setLoadingLicenses(true);
    try {
      const response = await licenseApi.getAll();
      setLicenses(response.data);
    } catch (err) {
      toast.error('Failed to load licenses');
      console.error(err);
    } finally {
      setLoadingLicenses(false);
    }
  };

  const fetchPublicKey = async () => {
    try {
      const response = await licenseApi.getPublicKey();
      setPublicKey(response.data.publicKey);
    } catch (err) {
      console.error('Failed to load public key', err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyKeyInput.trim()) {
      toast.error('Please paste a license key first');
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const response = await licenseApi.verify(verifyKeyInput.trim());
      setVerifyResult(response.data);
      if (response.data.valid) {
        toast.success('License verification successful!');
      } else {
        toast.error(`License is invalid: ${response.data.status}`);
      }
    } catch (err) {
      toast.error('Verification failed. Server returned an error.');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleGenerateLicense = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.customerName || !formData.customerEmail || !formData.expiryDate || !formData.maxSeats) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await licenseApi.generate(formData);
      toast.success('License generated successfully!');
      setShowGenerateModal(false);
      setFormData({
        customerName: '',
        customerEmail: '',
        productName: 'Enterprise Suite',
        expiryDate: '',
        maxSeats: 1,
        features: []
      });
      fetchLicenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate license');
      console.error(err);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this license? The customer will no longer be able to use it.')) {
      return;
    }
    try {
      await licenseApi.revoke(id);
      toast.success('License revoked');
      fetchLicenses();
    } catch (err) {
      toast.error('Failed to revoke license');
      console.error(err);
    }
  };

  const handleRegenerateKeys = async () => {
    setRegeneratingKeys(true);
    try {
      const response = await licenseApi.regenerateKeys();
      setPublicKey(response.data.publicKey);
      toast.success('RSA cryptographic keys regenerated successfully!');
      setShowRegenerateWarning(false);
      if (activeTab === 'manage') {
        fetchLicenses();
      }
    } catch (err) {
      toast.error('Failed to regenerate keys');
      console.error(err);
    } finally {
      setRegeneratingKeys(false);
    }
  };

  const copyToClipboard = (text, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleFeatureChange = (featureId) => {
    setFormData(prev => {
      const currentFeatures = prev.features;
      if (currentFeatures.includes(featureId)) {
        return { ...prev, features: currentFeatures.filter(f => f !== featureId) };
      } else {
        return { ...prev, features: [...currentFeatures, featureId] };
      }
    });
  };

  // Stats calculation
  const totalCount = licenses.length;
  const activeCount = licenses.filter(l => l.status === 'ACTIVE' && new Date(l.expiryDate) >= new Date()).length;
  const revokedCount = licenses.filter(l => l.status === 'REVOKED').length;
  const expiredCount = licenses.filter(l => l.status === 'ACTIVE' && new Date(l.expiryDate) < new Date()).length;

  return (
    <div style={{ position: 'relative', zIndex: 5 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--accent-light)' }}><Key size={28} /></span>
            License Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Securely generate, distribute, and verify RSA-2048 cryptographically signed licenses.
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex', background: 'var(--bg-secondary)', padding: '4px',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)'
        }}>
          <button 
            onClick={() => setActiveTab('verify')}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: activeTab === 'verify' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'verify' ? '#fff' : 'var(--text-secondary)',
              transition: 'var(--transition)'
            }}
          >
            Verify License
          </button>
          
          <button 
            onClick={() => {
              if (!isAdmin) {
                toast.error('Admin privileges required to manage licenses');
                return;
              }
              setActiveTab('manage');
            }}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
              cursor: isAdmin ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 600,
              background: activeTab === 'manage' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'manage' ? '#fff' : 'var(--text-secondary)',
              opacity: isAdmin ? 1 : 0.5,
              transition: 'var(--transition)'
            }}
          >
            Manage {!isAdmin && '🔒'}
          </button>
        </div>
      </div>

      {/* VERIFY TAB */}
      {activeTab === 'verify' && (
        <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
          
          {/* Paste Section */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color="var(--accent-light)" />
              Validate a License Key
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Pasting a license key checks the cryptographic signature using the system's RSA public key, extracts features, and checks the status and expiration date.
            </p>

            <form onSubmit={handleVerify}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">License Key String</label>
                <textarea 
                  className="form-control"
                  rows="6"
                  placeholder="Paste the full cryptographic license key string here (looks like: ey... . MII...)"
                  value={verifyKeyInput}
                  onChange={(e) => setVerifyKeyInput(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={verifying} style={{ padding: '12px 24px' }}>
                  {verifying ? <RefreshCw size={16} className="spin" /> : <ShieldCheck size={16} />}
                  Verify Key
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setVerifyKeyInput('');
                    setVerifyResult(null);
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Verification Results Panel */}
          {verifyResult && (
            <div 
              className="glass-card fade-in" 
              style={{ 
                padding: '32px',
                border: verifyResult.valid 
                  ? '1px solid rgba(16, 185, 129, 0.4)' 
                  : verifyResult.status === 'EXPIRED'
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(239, 68, 68, 0.4)',
                boxShadow: verifyResult.valid 
                  ? '0 0 40px rgba(16, 185, 129, 0.15)' 
                  : '0 0 40px rgba(239, 68, 68, 0.1)'
              }}
            >
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                
                {/* Visual Status Shield */}
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: verifyResult.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {verifyResult.valid ? (
                    <ShieldCheck size={36} color="var(--success)" />
                  ) : (
                    <ShieldAlert size={36} color="var(--danger)" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  {/* Status Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      License Status: 
                      <span style={{ 
                        color: verifyResult.valid ? 'var(--success)' : 'var(--danger)',
                        marginLeft: '8px'
                      }}>
                        {verifyResult.status}
                      </span>
                    </h3>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', marginBottom: '24px' }}>
                    {verifyResult.message}
                  </p>

                  {/* Metadata display if cryptographically readable */}
                  {verifyResult.metadata && (
                    <div style={{ 
                      background: 'rgba(0,0,0,0.2)', padding: '24px', 
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' 
                    }}>
                      <h4 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        📜 License Certificate Metadata
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={13} color="var(--text-secondary)" />
                            {verifyResult.metadata.customerName}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={13} color="var(--text-secondary)" />
                            {verifyResult.metadata.customerEmail}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Product Name</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={13} color="var(--text-secondary)" />
                            {verifyResult.metadata.productName}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expiration Date</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', color: new Date(verifyResult.metadata.expiryDate) < new Date() ? 'var(--danger)' : 'var(--success)' }}>
                            <Calendar size={13} />
                            {verifyResult.metadata.expiryDate}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Seat Limit</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={13} color="var(--text-secondary)" />
                            {verifyResult.metadata.maxSeats} active user seats
                          </div>
                        </div>
                      </div>

                      {/* Active Features Badges */}
                      <div style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Licensed Modules / Features</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {verifyResult.metadata.features && verifyResult.metadata.features.length > 0 ? (
                            verifyResult.metadata.features.map(f => (
                              <span key={f} style={{
                                padding: '4px 10px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 600,
                                background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: '4px'
                              }}>
                                <Layers size={11} />
                                {availableFeatures.find(af => af.id === f)?.label || f}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Core Standard Features only</span>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MANAGE TAB (ADMIN ONLY) */}
      {activeTab === 'manage' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={20} color="var(--accent-light)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Licenses</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalCount}</div>
              </div>
            </div>
            
            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} color="var(--success)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active Licenses</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{activeCount}</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} color="var(--danger)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Revoked</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)' }}>{revokedCount}</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="var(--warning)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Expired</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--warning)' }}>{expiredCount}</div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowGenerateModal(true)}
            >
              <Plus size={16} />
              Issue New License
            </button>

            <button 
              className="btn btn-secondary btn-danger" 
              onClick={() => setShowRegenerateWarning(true)}
            >
              <RefreshCw size={15} />
              Regenerate System Keys
            </button>
          </div>

          {/* Licenses Table */}
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            {loadingLicenses ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
                Loading license database...
              </div>
            ) : licenses.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No licenses generated yet. Click "Issue New License" to get started.
              </div>
            ) : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Product</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Seats</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expiry</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map(lic => {
                    const isExpired = new Date(lic.expiryDate) < new Date();
                    const isActive = lic.status === 'ACTIVE' && !isExpired;
                    const statusText = lic.status === 'REVOKED' 
                      ? 'REVOKED' 
                      : isExpired ? 'EXPIRED' : 'ACTIVE';

                    return (
                      <tr key={lic.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lic.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lic.customerEmail}</div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{lic.productName}</td>
                        <td style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{lic.maxSeats}</td>
                        <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: isExpired && lic.status !== 'REVOKED' ? 'var(--danger)' : 'inherit' }}>
                          {lic.expiryDate}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '30px', fontSize: '0.7rem', fontWeight: 700,
                            background: statusText === 'ACTIVE' 
                              ? 'rgba(16, 185, 129, 0.15)' 
                              : statusText === 'EXPIRED'
                                ? 'rgba(245, 158, 11, 0.15)' 
                                : 'rgba(239, 68, 68, 0.15)',
                            color: statusText === 'ACTIVE' 
                              ? 'var(--success)' 
                              : statusText === 'EXPIRED' 
                                ? 'var(--warning)' 
                                : 'var(--danger)',
                            border: statusText === 'ACTIVE'
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : statusText === 'EXPIRED'
                                ? '1px solid rgba(245, 158, 11, 0.3)'
                                : '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            {statusText}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => copyToClipboard(lic.licenseKey, 'License key copied!')}
                              title="Copy License Key String"
                              style={{ padding: '6px' }}
                            >
                              <Copy size={13} />
                            </button>
                            
                            <button 
                              className="btn btn-secondary btn-sm btn-danger"
                              onClick={() => handleRevoke(lic.id)}
                              disabled={lic.status === 'REVOKED'}
                              title="Revoke License"
                              style={{ padding: '6px' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Cryptographic Public Key Viewer */}
          {publicKey && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Key size={18} color="var(--accent-light)" />
                Active Public RSA Key (PEM)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                This is the public key. Client applications use this key to verify that license keys pasted into their dashboards are authentic, valid, and signed by our server.
              </p>
              
              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem', fontFamily: 'monospace', overflowX: 'auto',
                  border: '1px solid var(--border-glass)', maxHeight: '180px', color: 'var(--text-secondary)'
                }}>
                  {publicKey}
                </pre>
                
                <button 
                  onClick={() => copyToClipboard(publicKey, 'Public key PEM copied!')}
                  className="btn btn-secondary btn-sm"
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.05)' }}
                >
                  <Copy size={13} /> Copy PEM
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* GENERATE LICENSE FORM MODAL */}
      {showGenerateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div 
            className="glass-card fade-in" 
            style={{ 
              width: '100%', maxWidth: '600px', padding: '32px', 
              background: '#0d1526', border: '1px solid var(--border-accent)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
            }}
          >
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} color="var(--accent-light)" />
              Generate Crypto License
            </h3>

            <form onSubmit={handleGenerateLicense}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input 
                    type="text" className="form-control" placeholder="Acme Corp" required
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Email *</label>
                  <input 
                    type="email" className="form-control" placeholder="licensing@acme.com" required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <select 
                    className="form-control"
                    value={formData.productName}
                    onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  >
                    <option value="Enterprise Suite">Enterprise Suite</option>
                    <option value="Standard Cloud">Standard Cloud</option>
                    <option value="Developer API Pro">Developer API Pro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">User Seats Limit *</label>
                  <input 
                    type="number" className="form-control" min="1" required
                    value={formData.maxSeats}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxSeats: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Expiration Date *</label>
                <input 
                  type="date" className="form-control" required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>

              {/* Feature checkboxes */}
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Included Feature Modules</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {availableFeatures.map(feat => (
                    <label key={feat.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', 
                      fontSize: '0.85rem', cursor: 'pointer', padding: '6px 10px',
                      background: 'rgba(255,255,255,0.02)', borderRadius: '6px',
                      border: '1px solid var(--border-glass)', transition: 'all 0.2s'
                    }} className="checkbox-hover">
                      <input 
                        type="checkbox"
                        checked={formData.features.includes(feat.id)}
                        onChange={() => handleFeatureChange(feat.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                      {feat.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" className="btn btn-secondary"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate License Key
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* REGENERATE RSA KEYS WARNING MODAL */}
      {showRegenerateWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div 
            className="glass-card fade-in" 
            style={{ 
              width: '100%', maxWidth: '500px', padding: '32px', 
              background: '#0d1526', border: '1px solid var(--danger)',
              boxShadow: '0 10px 40px rgba(239, 68, 68, 0.15)'
            }}
          >
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
              <AlertTriangle size={22} />
              Critical Cryptographic Warning!
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Regenerating system keys will generate a brand new RSA 2048-bit key pair.
            </p>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              <strong>All previously issued licenses will immediately fail verification</strong> against the new public key. Customers using these old keys will experience license invalidation warnings. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" className="btn btn-secondary"
                disabled={regeneratingKeys}
                onClick={() => setShowRegenerateWarning(false)}
              >
                Cancel
              </button>
              
              <button 
                type="button" className="btn btn-danger"
                disabled={regeneratingKeys}
                onClick={handleRegenerateKeys}
              >
                {regeneratingKeys ? <RefreshCw size={15} className="spin" /> : 'Yes, Regenerate Keys'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
