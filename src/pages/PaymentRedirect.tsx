import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from '../lib/realtime';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const PaymentRedirect = () => {
  const { id: categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const nomineeId = location.state?.nomineeId;

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [voteCount, setVoteCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nominee, setNominee] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  const fetchData = async () => {
    if (!nomineeId || !categoryId) return;
    try {
      const [catRes, settingsRes] = await Promise.all([
        fetch(`${API}/api/categories/${categoryId}`),
        supabase.from('app_settings').select('voting_status, vote_price_kobo, bulk_voting_enabled').eq('id', 'singleton').single(),
      ]);
      if (catRes.ok) {
        const cat = await catRes.json();
        setCategory(cat);
        const n = cat.nominees?.find((nom: any) => nom.id === nomineeId);
        setNominee(n || null);
      }
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!nomineeId) {
      navigate(-1);
      return;
    }
    fetchData();
  }, [nomineeId, categoryId, navigate]);

  useRealtimeSync(`payment-${categoryId}`, ['nominees', 'categories', 'app_settings'], fetchData, [categoryId, nomineeId]);

  const votePrice = settings?.vote_price_kobo ? settings.vote_price_kobo / 100 : 100;
  const bulkEnabled = !!settings?.bulk_voting_enabled;
  const totalPrice = votePrice * voteCount;
  const votingBlocked = settings && settings.voting_status !== 'OPEN';

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required for your receipt.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/vote/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomineeId,
          categoryId,
          voterEmail: email,
          voterName: name || undefined,
          voteCount: bulkEnabled ? voteCount : 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payment.');
      }

      if (data.status && data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error('Invalid payment response from server.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="app-container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!nominee || !category) {
    return (
      <div className="app-container flex-col items-center gap-4 mt-8">
        <p className="text-muted font-sans">Nominee not found.</p>
        <button onClick={() => navigate('/')} className="text-gold font-sans font-bold" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>← Back Home</button>
      </div>
    );
  }

  if (votingBlocked) {
    return (
      <div className="app-container flex-col items-center gap-4 mt-8 text-center">
        <p className="text-muted font-sans">
          {settings.voting_status === 'PAUSED' ? 'Voting is temporarily paused.' : 'Voting is currently closed.'}
        </p>
        <button onClick={() => navigate('/')} className="text-gold font-sans font-bold" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>← Back Home</button>
      </div>
    );
  }

  return (
    <div className="app-container flex-col gap-6 animate-fade-up" style={{ maxWidth: '420px', margin: '0 auto', padding: '0 16px' }}>
      <button
        onClick={() => navigate(-1)}
        className="font-sans"
        style={{ alignSelf: 'flex-start', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
      >
        ← Back
      </button>

      {/* Nominee Card */}
      <div className="glass-panel flex-col items-center gap-4" style={{ padding: '0', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{
          width: '100%',
          aspectRatio: '3 / 4',
          maxHeight: 'min(70vw, 360px)',
          overflow: 'hidden',
          borderBottom: '2px solid var(--color-gold)',
        }}>
          <img
            src={nominee.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nominee.name)}&background=1a1a1a&color=D4AF37&bold=true&size=512`}
            alt={nominee.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <h2 className="font-sans font-bold" style={{ fontSize: '20px', color: 'var(--color-text)' }}>{nominee.name}</h2>
          <p className="font-sans" style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{category.name}</p>
        </div>
        <div style={{
          background: 'var(--color-surface-raised)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 700,
          color: 'var(--color-gold)',
          fontFamily: 'var(--font-sans)',
        }}>
          ₦{votePrice.toLocaleString()} per vote
        </div>
      </div>

      {/* Vote Quantity — only shown when bulk voting is enabled */}
      {bulkEnabled && (
        <div className="glass-panel flex-col gap-3" style={{ padding: '20px 24px' }}>
          <label className="font-sans font-bold" style={{ fontSize: '14px', color: 'var(--color-text)' }}>Number of Votes</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', fontSize: '20px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >−</button>
            <input
              type="number"
              min={1}
              value={voteCount}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1) setVoteCount(v);
              }}
              style={{
                width: '80px', textAlign: 'center',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: '10px', padding: '10px 8px',
                color: 'var(--color-gold)', fontFamily: 'var(--font-sans)',
                fontSize: '20px', fontWeight: 700, outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <button
              type="button"
              onClick={() => setVoteCount(voteCount + 1)}
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', fontSize: '20px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >+</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
            {[5, 10, 20, 50, 100].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => setVoteCount(q)}
                style={{
                  padding: '6px 14px', borderRadius: '8px',
                  background: voteCount === q ? 'rgba(212,175,55,0.15)' : 'var(--color-surface)',
                  border: voteCount === q ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                  color: voteCount === q ? 'var(--color-gold)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >{q} votes</button>
            ))}
          </div>
          <div style={{
            marginTop: '8px', padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span className="font-sans" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{voteCount} vote{voteCount > 1 ? 's' : ''} × ₦{votePrice.toLocaleString()}</span>
            <span className="font-sans font-bold" style={{ fontSize: '18px', color: 'var(--color-gold)' }}>₦{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Payment Form */}
      <form onSubmit={handlePay} className="flex-col gap-4" style={{ marginTop: '4px' }}>
        <div className="flex-col gap-1">
          <label className="font-sans" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="for your payment receipt"
            required
            className="w-full"
            style={{
              background: 'var(--color-surface)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              padding: '14px 16px',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 200ms',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        <div className="flex-col gap-1">
          <label className="font-sans" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Your Name (Optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="to display on share card"
            className="w-full"
            style={{
              background: 'var(--color-surface)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              padding: '14px 16px',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 200ms',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {error && <p className="font-sans" style={{ fontSize: '14px', color: 'var(--color-error-text)', marginTop: '4px' }}>{error}</p>}

        <button
          type="submit"
          className={clsx('btn-primary', loading && 'active')}
          disabled={loading}
          style={{ padding: '16px', marginTop: '8px', width: '100%' }}
        >
          {loading ? 'Processing...' : `Proceed to Pay ₦${totalPrice.toLocaleString()}`}
          {loading && <div className="loading-line" />}
        </button>

        <p className="font-sans" style={{ fontSize: '12px', color: 'var(--color-text-faint)', textAlign: 'center', marginTop: '8px' }}>
          You will be redirected to Paystack's secure checkout. Opay, GTBank, card, and more accepted.
        </p>
      </form>
    </div>
  );
};
