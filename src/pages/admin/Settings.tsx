import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useRealtimeSync } from '../../lib/realtime';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AdminSettings = () => {
  const { admin } = useOutletContext<{ admin: { role: string } }>();
  const [settings, setSettings] = useState<any>(null);

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('id', 'singleton').single();
    setSettings(data);
  };

  useEffect(() => { fetchSettings(); }, []);

  useRealtimeSync('admin-settings', ['app_settings'], fetchSettings);

  if (admin.role !== 'super_admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <p style={{ color: 'var(--color-error-text)', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Super Admin Access Required</p>
      </div>
    );
  }

  if (!settings) return null;

  const handleSave = async (updates: any) => {
    await fetch(`${API}/api/admin/settings`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` 
      },
      body: JSON.stringify(updates)
    });
    setSettings({ ...settings, ...updates });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }} className="animate-fade-up">
      <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '22px', color: 'var(--color-text)' }}>
        Event Settings
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Voting Control */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            Voting Control
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Manual Pause</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-muted)' }}>Emergency override. Immediately blocks new payments.</span>
            </div>
            <Toggle 
              checked={settings.voting_status === 'PAUSED'} 
              onChange={() => handleSave({ voting_status: settings.voting_status === 'PAUSED' ? 'OPEN' : 'PAUSED' })} 
            />
          </div>
        </div>

        {/* Pricing */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            Pricing
          </h2>
          <div style={{
            background: 'rgba(122, 79, 30, 0.1)', border: '1px solid var(--color-warning)',
            padding: '12px', borderRadius: '8px', marginBottom: '8px'
          }}>
             <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-warning-text)', margin: 0 }}>
               Changing price affects future votes only. Ensure you communicate this to voters.
             </p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Vote Price (₦)</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-muted)' }}>Amount charged per vote.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--color-text-muted)' }}>₦</span>
              <input 
                type="number" 
                value={settings.vote_price_kobo / 100}
                onChange={(e) => handleSave({ vote_price_kobo: parseInt(e.target.value) * 100 })}
                style={{
                  background: 'var(--color-base)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', fontFamily: 'var(--font-sans)', fontSize: '14px',
                  borderRadius: '8px', padding: '10px 12px', width: '100px', textAlign: 'right',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Leaderboard Mode */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            Leaderboard Display
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Student View Mode</span>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['Full', 'Rank', 'Hidden'].map(mode => {
                const isActive = settings.leaderboard_mode === mode;
                return (
                  <button 
                    key={mode}
                    onClick={() => handleSave({ leaderboard_mode: mode })}
                    style={{
                      flex: 1, minWidth: '100px',
                      padding: '12px', borderRadius: '8px',
                      fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase',
                      background: isActive ? 'rgba(212,175,55,0.1)' : 'var(--color-base)',
                      color: isActive ? 'var(--color-gold)' : 'var(--color-text-muted)',
                      border: isActive ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                      transition: 'all 0.2s', cursor: 'pointer',
                    }}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '380px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--color-gold)' }}>Final Results Reveal</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Freezes leaderboard and displays ceremonial winner UI to students. Voting will be permanently disabled.
              </span>
            </div>
            <button 
              onClick={() => {
                if (window.prompt('Type REVEAL to confirm showing final results to students:') === 'REVEAL') {
                  handleSave({ results_revealed: true, voting_status: 'RESULTS', leaderboard_mode: 'Full' });
                }
              }}
              disabled={settings.results_revealed}
              style={{
                padding: '14px 20px', borderRadius: '10px',
                background: settings.results_revealed ? 'var(--color-surface-raised)' : 'var(--color-gold)',
                color: settings.results_revealed ? 'var(--color-text-muted)' : '#000',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px',
                border: 'none', cursor: settings.results_revealed ? 'not-allowed' : 'pointer',
              }}
            >
              {settings.results_revealed ? 'Revealed ✓' : 'Reveal Results'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button 
    onClick={onChange}
    style={{
      width: '48px', height: '26px', borderRadius: '13px',
      background: checked ? 'var(--color-warning-text)' : 'var(--color-base)',
      border: '1px solid var(--color-border)',
      position: 'relative', transition: 'background 0.2s',
      cursor: 'pointer', padding: 0,
    }}
  >
    <div style={{
      width: '20px', height: '20px', borderRadius: '50%',
      background: checked ? '#000' : 'var(--color-text-muted)',
      position: 'absolute', top: '2px', left: checked ? '24px' : '2px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }} />
  </button>
);
