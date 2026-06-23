import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Crown } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AdminLeaderboard = () => {
  const [categories, setCategories] = useState<any[]>([]);

  const fetchLeaders = async () => {
    try {
      const res = await fetch(`${API}/api/admin/leaderboard`, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
      });
      if (res.ok) setCategories(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchLeaders();
    const channel = supabase.channel('admin-leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, fetchLeaders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nominees' }, fetchLeaders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchLeaders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-up">
      <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '22px', color: 'var(--color-text)' }}>
        Real-Time Leaderboard
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              background: 'var(--color-surface-raised)',
              borderBottom: '1px solid var(--color-border)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {cat.emoji && <span style={{ fontSize: '18px' }}>{cat.emoji}</span>}
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--color-text)' }}>
                  {cat.name}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                {cat.nominees?.reduce((sum: number, n: any) => sum + (n.voteCount || 0), 0) || 0} total
              </span>
            </div>

            {/* Nominees */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cat.nominees?.map((nominee: any, index: number) => {
                const maxVotes = cat.nominees?.[0]?.voteCount || 1;
                const percentage = nominee.voteCount > 0 ? (nominee.voteCount / maxVotes) * 100 : 0;
                
                return (
                  <div key={nominee.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: index === 0 ? 'var(--color-gold)' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--color-surface-raised)',
                          color: index <= 2 ? '#000' : 'var(--color-text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-sans)',
                        }}>
                          {index + 1}
                        </div>
                        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
                          {nominee.name}
                        </span>
                        {index === 0 && nominee.voteCount > 0 && <Crown size={14} style={{ color: 'var(--color-gold)' }} />}
                      </div>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: index === 0 && nominee.voteCount > 0 ? 'var(--color-gold)' : 'var(--color-text)' }}>
                        {nominee.voteCount.toLocaleString()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'var(--color-surface-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${percentage}%`,
                        background: index === 0 ? 'var(--color-gold)' : 'var(--color-text-muted)',
                        borderRadius: '3px', transition: 'width 500ms ease',
                      }} />
                    </div>
                  </div>
                );
              })}
              {(!cat.nominees || cat.nominees.length === 0) && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
                  No nominees yet.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
