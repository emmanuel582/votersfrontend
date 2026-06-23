import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useRealtimeSync } from '../lib/realtime';
import { LiveFeed } from '../components/LiveFeed';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const Home = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API}/api/categories`);
      if (res.ok) {
        const { settings: s, categories: cats } = await res.json();
        setSettings(s);
        setCategories(cats || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useRealtimeSync('public-home', ['nominees', 'categories', 'votes', 'app_settings'], fetchData);

  // Live countdown timer with seconds
  useEffect(() => {
    if (!settings?.voting_end_time || settings?.voting_status !== 'OPEN') {
      if (settings?.voting_status === 'PAUSED') setTimeLeft('Voting is PAUSED');
      else if (settings?.voting_status === 'CLOSED') setTimeLeft('Voting is CLOSED');
      else if (settings?.voting_status === 'RESULTS') setTimeLeft('🏆 Results Revealed');
      else setTimeLeft('');
      return;
    }

    const tick = () => {
      const now = Date.now();
      const distance = new Date(settings.voting_end_time).getTime() - now;

      if (distance < 0) {
        setTimeLeft('Voting is CLOSED');
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeft(`${d}d : ${pad(h)}h : ${pad(m)}m : ${pad(s)}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  const singularCats = categories.filter(c => c.type === 'singular');
  const splitCats = categories.filter(c => c.type !== 'singular');

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="flex-col items-center gap-4">
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span className="text-muted text-sm">Loading categories...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="app-container flex-col gap-6 animate-fade-up" style={{ padding: '0 16px' }}>
      {/* Timer Banner */}
      {timeLeft && (
        <div className="w-full flex items-center justify-center gap-3 p-4 rounded-md"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}>
          {settings?.voting_status === 'OPEN' && (
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-gold)', animation: 'pulse 2s infinite' }} />
          )}
          <span className="font-sans font-bold" style={{
            color: 'var(--color-gold)',
            letterSpacing: '0.05em',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '15px',
          }}>
            {settings?.voting_status === 'OPEN' ? `Voting closes in ${timeLeft}` : timeLeft}
          </span>
        </div>
      )}

      <LiveFeed />

      {categories.length === 0 && !loading && (
        <div className="glass-panel p-12 flex items-center justify-center text-center mt-8">
          <p className="text-muted font-sans">No categories available yet. Check back soon!</p>
        </div>
      )}

      <div className="flex-col gap-10 mt-2">
        <CategorySection title="SINGULAR AWARDS" categories={singularCats} />
        <CategorySection title="MALE & FEMALE AWARDS" categories={splitCats} />
      </div>
    </div>
  );
};

const CategorySection = ({ title, categories }: { title: string; categories: any[] }) => {
  if (!categories.length) return null;
  return (
    <div className="flex-col gap-4">
      <h2 className="font-sans" style={{
        fontSize: '12px',
        letterSpacing: '0.2em',
        fontWeight: 700,
        color: 'var(--color-gold-dim)',
        textTransform: 'uppercase',
      }}>
        {title}
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
        gap: '16px',
      }}>
        {categories.map((c, i) => (
          <Link
            to={`/category/${c.id}`}
            key={c.id}
            className="glass-panel flex-col gap-3"
            style={{
              textDecoration: 'none',
              padding: '20px',
              transition: 'transform 150ms ease, border-color 200ms ease',
              animationDelay: `${i * 50}ms`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'var(--color-gold)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-sans font-bold" style={{ fontSize: '16px', color: 'var(--color-text)', lineHeight: 1.3 }}>
                {c.name}
              </h3>
              {c.emoji && <span style={{ fontSize: '18px' }}>{c.emoji}</span>}
            </div>

            <p className="font-sans" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {c.nomineeCount} nominees
            </p>

            {c.leadingNominee && (
              <div className="flex justify-between items-center" style={{
                marginTop: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-border)',
              }}>
                <span className="font-sans" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Leader
                </span>
                <div className="flex items-center gap-1">
                  <Crown size={13} style={{ color: 'var(--color-gold)' }} />
                  <span className="font-sans" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                    {c.leadingNominee.name}
                  </span>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};
