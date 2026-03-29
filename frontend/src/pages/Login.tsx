import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Fingerprint, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Calling our custom RPC `authenticate_user`
      const { data, error: rpcError } = await supabase.rpc('authenticate_user', {
        p_username: username,
        p_password: password,
        p_ip: '127.0.0.1' // Ideally from server, mocked for client project
      });

      if (rpcError) throw rpcError;

      if (data && data.success) {
        login(data.customer_id);
      } else {
        setError(data?.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ width: '400px', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ background: 'rgba(52, 152, 219, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(52, 152, 219, 0.2)' }}>
          <Shield size={32} color="var(--accent-blue)" />
        </div>
        <h1 className="text-gradient">Secure Login</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>Enter your credentials to access your accounts.</p>
      </div>

      {error && (
        <div className="badge danger" style={{ padding: '12px', marginBottom: '20px', display: 'block', textAlign: 'center', borderRadius: '8px', textTransform: 'none' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Username</label>
          <div style={{ position: 'relative' }}>
            <Fingerprint size={18} style={{ position: 'absolute', top: '15px', left: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. johndoe123" 
              style={{ paddingLeft: '40px', width: '100%' }}
              value={username} onChange={e => setUsername(e.target.value)} required 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', top: '15px', left: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              style={{ paddingLeft: '40px', width: '100%' }}
              value={password} onChange={e => setPassword(e.target.value)} required 
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In To Dashboard'}
        </button>
      </form>
    </div>
  );
}
