import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from '../lib/realtime';
import clsx from 'clsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const Leaderboard = ({ adminView = false }: { adminView?: boolean }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const url = adminView ? `${API}/api/admin/leaderboard` : `${API}/api/leaderboard`;
      const headers: Record<string, string> = {};
      if (adminView) {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [adminView]);

  useRealtimeSync(
    adminView ? 'admin-leaderboard-page' : 'public-leaderboard',
    ['votes', 'nominees', 'categories', 'app_settings'],
    fetchLeaderboard,
    [adminView]
  );

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="app-container flex-col gap-8 animate-fade-up" style={{ padding: adminView ? 0 : '0 16px' }}>
      <div className="flex-col gap-1">
        <h1 className="font-display" style={{ fontSize: '28px', color: 'var(--color-text)' }}>Leaderboard</h1>
        <p className="font-sans" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Live standings</p>
      </div>

      {categories.length === 0 && (
        <div className="glass-panel p-12 flex items-center justify-center text-center">
          <p className="font-sans" style={{ color: 'var(--color-gold-dim)', fontSize: '18px' }}>No data yet</p>
        </div>
      )}

      <div className="flex-col gap-10">
        {categories.map(c => (
          <CategoryRanking key={c.id} category={c} adminView={adminView} />
        ))}
      </div>
    </div>
  );
};

const CategoryRanking = ({ category, adminView }: { category: any; adminView: boolean }) => {
  const totalVotes = category.nominees.reduce((sum: number, n: any) => sum + (n.voteCount || 0), 0);

  return (
    <div className="flex-col gap-3">
      <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
        <h2 className="font-sans font-bold" style={{
          fontSize: '14px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-gold-dim)',
        }}>
          {category.name}
        </h2>
        {adminView && (
          <span className="font-sans" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {totalVotes} total votes
          </span>
        )}
      </div>

      <div className="flex-col gap-2">
        {category.nominees.map((n: any, index: number) => {
          const isLeader = index === 0 && (n.voteCount == null || n.voteCount > 0);
          const percent = totalVotes > 0 ? ((n.voteCount || 0) / totalVotes) * 100 : 0;

          return (
            <div
              key={n.id}
              className="flex items-center gap-4"
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: isLeader ? 'var(--color-surface-raised)' : 'transparent',
                border: isLeader ? '1px solid var(--color-border)' : '1px solid transparent',
                transition: 'all 200ms ease',
              }}
            >
              {/* Rank + crown (left) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {isLeader && (
                  <div style={{ color: 'var(--color-gold)', display: 'flex', alignItems: 'center', width: '20px' }}>
                    <Crown size={18} fill="currentColor" />
                  </div>
                )}
                <div className="font-sans font-bold" style={{
                  width: isLeader ? '20px' : '24px',
                  textAlign: 'center',
                  fontSize: '16px',
                  color: isLeader ? 'var(--color-gold)' : 'var(--color-text-faint)',
                }}>
                  {index + 1}
                </div>
              </div>

              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: isLeader ? '56px' : '48px',
                  height: isLeader ? '56px' : '48px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: isLeader ? '2px solid var(--color-gold)' : '2px solid var(--color-border)',
                }}>
                  <img
                    src={n.photoUrl || n.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.name)}&background=1a1a1a&color=D4AF37&bold=true&size=200`}
                    alt={n.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-col" style={{ flex: 1, minWidth: 0 }}>
                <span className={clsx('font-sans', isLeader ? 'font-bold' : 'font-medium')} style={{
                  fontSize: isLeader ? '16px' : '14px',
                  color: isLeader ? 'var(--color-gold)' : 'var(--color-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {n.name}
                </span>

                {n.voteCount != null && (
                  <div className="flex items-center gap-2" style={{ marginTop: '3px' }}>
                    <span className="font-sans" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      {n.voteCount} votes
                    </span>
                    {adminView && (
                      <div style={{
                        flex: 1,
                        height: '4px',
                        background: 'var(--color-surface)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${percent}%`,
                          background: 'var(--color-gold)',
                          borderRadius: '2px',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
