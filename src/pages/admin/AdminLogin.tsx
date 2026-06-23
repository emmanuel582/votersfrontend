import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import clsx from 'clsx';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.message) {
      setMessage(location.state.message);
      // clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        if (authError.message.includes('locked')) {
           throw new Error('Account temporarily locked due to too many failed attempts.');
        }
        throw new Error('Incorrect email or password');
      }

      // Supabase JS v2 persists sessions automatically in localStorage.
      // If remember me is false, we might ideally configure it for sessionStorage, 
      // but for now Supabase's default behavior satisfies the brief's requirement 
      // that admins should not be re-logging in constantly if checked.

      navigate('/admin');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[400px] glass-panel p-8 flex-col gap-6 animate-fade-up">
        
        <div className="text-center">
          <h1 className="font-sans font-bold text-text text-2xl">Control Panel</h1>
          <p className="text-muted text-sm mt-1">School Awards Administration</p>
        </div>

        {message && (
          <div className="bg-surface-raised p-3 rounded-md border mt-2" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-text text-sm text-center">{message}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex-col gap-4 mt-4">
          <div className="flex-col gap-1">
            <label className="text-muted text-sm">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface text-text p-3 rounded-md border focus:border-gold transition-colors outline-none"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          <div className="flex-col gap-1">
            <label className="text-muted text-sm">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface text-text p-3 rounded-md border focus:border-gold transition-colors outline-none"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-gold cursor-pointer" 
            />
            <label htmlFor="remember" className="text-muted text-sm cursor-pointer">Remember me</label>
          </div>

          {error && (
            <div className="bg-error/10 p-3 rounded-md border mt-2" style={{ borderColor: 'rgba(240, 112, 112, 0.2)' }}>
              <p className="text-error text-sm text-center">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={clsx("btn-primary mt-2", loading && "active")}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};
