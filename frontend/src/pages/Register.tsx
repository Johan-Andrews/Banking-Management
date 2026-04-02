import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    dob: '',
    gender: '',
    govId: '',
    address: '',
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: '', color: '' };

    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'text-accent-rose', bg: 'bg-accent-rose' };
    if (score === 2) return { score, label: 'Fair', color: 'text-accent-gold', bg: 'bg-accent-gold' };
    if (score === 3) return { score, label: 'Good', color: 'text-accent-teal', bg: 'bg-accent-teal' };
    return { score, label: 'Strong', color: 'text-accent-teal', bg: 'bg-accent-teal' };
  }, [formData.password]);

  const passwordValid = passwordStrength.score === 4;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Password must be at least 8 characters with 1 uppercase letter, 1 digit, and 1 special character.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('register_customer', {
        p_name: formData.name,
        p_email: formData.email,
        p_contact: formData.contact,
        p_dob: formData.dob,
        p_gov_id: formData.govId,
        p_address: formData.address,
        p_username: formData.username,
        p_password: formData.password,
        p_gender: formData.gender || null,
      });

      if (rpcError) throw rpcError;

      if (data) {
        login({ id: data, role: 'customer', username: formData.username });
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      if (msg.includes('duplicate key') && msg.includes('email')) {
        setError('An account with this email already exists.');
      } else if (msg.includes('duplicate key') && msg.includes('username')) {
        setError('This username is already taken. Please choose another.');
      } else if (msg.includes('duplicate key') && msg.includes('contact_number')) {
        setError('This phone number is already registered.');
      } else if (msg.includes('duplicate key') && msg.includes('government_id')) {
        setError('This Government ID is already registered.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-app rounded-[40px] p-8 md:p-12 w-full max-w-xl shadow-2xl transition-all duration-200 my-8">
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-semibold text-primary tracking-wide uppercase">AeroBank</h1>
      </div>
      
      <div className="text-center mb-8">
        <h2 className="text-[22px] font-semibold text-primary">Create Account</h2>
        <p className="text-sm text-secondary">Register with your email to start banking</p>
      </div>

      <div className="flex bg-card rounded-2xl p-1 mb-8">
        <Link to="/login" className="flex-1 text-center py-2 text-sm font-medium rounded-xl text-secondary hover:text-primary transition-colors">
          Sign In
        </Link>
        <button className="flex-1 py-2 text-sm font-medium rounded-xl bg-elevated shadow-sm text-primary transition-colors">
          Create Account
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-accent-rose/10 border border-accent-rose/30 rounded-[16px] text-accent-rose text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full bg-card rounded-full px-5 py-3 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            value={formData.name}
            onChange={update('name')}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            className="w-full bg-card rounded-full px-5 py-3 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            value={formData.email}
            onChange={update('email')}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full bg-card rounded-full px-5 py-3 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            value={formData.contact}
            onChange={update('contact')}
            required
          />
          <input
            type="date"
            placeholder="Date of Birth"
            className="w-full bg-card rounded-full px-5 py-3 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            value={formData.dob}
            onChange={update('dob')}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            className="w-full bg-card rounded-full px-5 py-3 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all appearance-none"
            value={formData.gender}
            onChange={update('gender')}
            required
          >
            <option value="" disabled>Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Government ID (Aadhaar/PAN)"
            className="w-full bg-card rounded-full px-5 py-3 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            value={formData.govId}
            onChange={update('govId')}
            required
          />
        </div>

        <input
          type="text"
          placeholder="Residential Address"
          className="w-full bg-card rounded-full px-5 py-3 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          value={formData.address}
          onChange={update('address')}
          required
        />

        <div className="h-px bg-card my-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Choose Username"
            className="w-full bg-card rounded-full px-5 py-3 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            value={formData.username}
            onChange={update('username')}
            required
            autoComplete="username"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create Password"
              className="w-full bg-card rounded-full px-5 py-3 text-[15px] text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all pr-12"
              value={formData.password}
              onChange={update('password')}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors p-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {formData.password && (
          <div className="mt-2 text-sm">
            <div className="h-1 w-full bg-card rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${passwordStrength.bg}`}
                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className={`font-medium ${passwordStrength.color}`}>{passwordStrength.label}</span>
              <div className="flex gap-3 text-secondary">
                <span className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-accent-teal' : ''}`}>
                  {formData.password.length >= 8 && <CheckCircle2 size={12} />} 8+ chars
                </span>
                <span className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-accent-teal' : ''}`}>
                  {/[A-Z]/.test(formData.password) && <CheckCircle2 size={12} />} A-Z
                </span>
                <span className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-accent-teal' : ''}`}>
                  {/[0-9]/.test(formData.password) && <CheckCircle2 size={12} />} 0-9
                </span>
                <span className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-accent-teal' : ''}`}>
                  {/[^A-Za-z0-9]/.test(formData.password) && <CheckCircle2 size={12} />} !@#
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary text-white rounded-full py-3 font-medium text-[15px] hover:bg-[#6c5e6a] transition-colors active:scale-95 disabled:opacity-60 mt-6"
        >
          {loading ? 'Creating Account...' : 'Create Account & Start Banking'}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline transition-all">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
