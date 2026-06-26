import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ToastContext';
import { useRealtimeSync } from '../../lib/realtime';
import { Crown, CheckCircle2, AlertTriangle, XCircle, Settings as SettingsIcon, Pause, Play, Square, Calendar, RefreshCw } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AdminOverview = () => {
  const toast = useToast();
  const [stats, setStats] = useState({ totalVotes: 0, totalRevenue: 0, successRate: 100, activeSessions: 0, sparkline: [] as number[] });
  const [settings, setSettings] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState('');

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token;
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const syncPendingVotes = async () => {
    try {
      await fetch(`${API}/api/admin/votes/sync-pending`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('id', 'singleton').single();
    setSettings(data);
  };

  const fetchFeed = async () => {
    try {
      const token = await getToken();
      const [votesRes, logsRes] = await Promise.all([
        fetch(`${API}/api/admin/votes`, { headers: { Authorization: `Bearer ${token}` } }),
        supabase.from('action_logs').select('*, admins(email)').order('created_at', { ascending: false }).limit(20),
      ]);

      const recentVotes = votesRes.ok ? await votesRes.json() : [];
      const logs = logsRes.data || [];

      const combined = [
        ...(recentVotes || []).slice(0, 20).map((v: any) => ({ type: 'vote' as const, ...v, ts: new Date(v.created_at).getTime() })),
        ...(logs || []).map((l: any) => ({ type: 'log' as const, ...l, ts: new Date(l.created_at).getTime() }))
      ].sort((a, b) => b.ts - a.ts).slice(0, 20);

      setFeed(combined);
    } catch {}
  };

  const fetchLeaders = async () => {
    try {
      const res = await fetch(`${API}/api/admin/leaderboard`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      if (res.ok) setLeaders(await res.json());
    } catch {}
  };

  const refreshAll = useCallback(async () => {
    await syncPendingVotes();
    await Promise.all([fetchStats(), fetchSettings(), fetchFeed(), fetchLeaders()]);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useRealtimeSync('admin-overview', ['votes', 'app_settings', 'action_logs', 'nominees', 'categories'], refreshAll);

  const formatNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

  const updateSetting = async (updates: any) => {
    setActionLoading(true);
    try {
      await fetch(`${API}/api/admin/settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}` 
        },
        body: JSON.stringify(updates)
      });
      toast.success('Setting updated');
    } catch {
      toast.error('Failed to update');
    }
    setActionLoading(false);
  };

  const handlePauseResume = async () => {
    if (settings?.voting_status === 'OPEN') {
      if (confirm('Pause voting? Students will see the paused message.')) await updateSetting({ voting_status: 'PAUSED' });
    } else if (settings?.voting_status === 'PAUSED') {
      await updateSetting({ voting_status: 'OPEN' });
    }
  };

  const handleStop = async () => {
    if (confirm('Stop voting now? Students will immediately lose the ability to vote.')) {
      await updateSetting({ voting_status: 'CLOSED' });
    }
  };

  const handleReopen = async () => {
    if (confirm('Re-open voting? Students can start voting again.')) {
      await updateSetting({ voting_status: 'OPEN' });
    }
  };

  const handleSaveDeadline = async () => {
    if (!deadlineInput) return;
    await updateSetting({ voting_end_time: new Date(deadlineInput).toISOString() });
    setEditingDeadline(false);
  };

  const openDeadlineEditor = () => {
    if (settings?.voting_end_time) {
      const local = new Date(new Date(settings.voting_end_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDeadlineInput(local);
    } else {
      const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
      now.setHours(now.getHours() + 24);
      setDeadlineInput(now.toISOString().slice(0, 16));
    }
    setEditingDeadline(true);
  };

  // Status banner colors
  const isOpen = settings?.voting_status === 'OPEN';
  const isPaused = settings?.voting_status === 'PAUSED';
  const isClosed = settings?.voting_status === 'CLOSED';
  const isResults = settings?.voting_status === 'RESULTS';

  const bannerBg = isOpen ? 'rgba(16, 185, 129, 0.08)' : isResults ? 'rgba(212, 175, 55, 0.08)' : 'rgba(245, 158, 11, 0.08)';
  const bannerBorder = isOpen ? 'var(--color-success)' : isResults ? 'var(--color-gold)' : 'var(--color-warning)';
  const bannerColor = isOpen ? 'var(--color-success-text)' : isResults ? 'var(--color-gold)' : 'var(--color-warning-text)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-up">
      <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '22px', color: 'var(--color-text)' }}>
        Live Overview
      </h1>

      {/* Status Banner */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        border: `1px solid ${bannerBorder}`,
        background: bannerBg,
        color: bannerColor,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Status line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOpen && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 2s infinite' }} />}
            {!isOpen && <AlertTriangle size={16} />}
            <span style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.03em', fontFamily: 'var(--font-sans)' }}>
              {isResults ? '🏆 FINAL RESULTS REVEALED' : 
               isOpen ? 'VOTING IS OPEN' : 
               isPaused ? 'VOTING IS PAUSED' : 
               'VOTING CLOSED'}
            </span>
          </div>

          {/* Quick action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(isOpen || isPaused) && (
              <button 
                onClick={handlePauseResume} 
                disabled={actionLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: 'var(--color-surface)', border: '1px solid currentColor',
                  fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-sans)',
                  color: 'inherit',
                }}
              >
                {isOpen ? <Pause size={12} /> : <Play size={12} />}
                {isOpen ? 'Pause' : 'Resume'}
              </button>
            )}
            {isOpen && (
              <button 
                onClick={handleStop}
                disabled={actionLoading} 
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: 'var(--color-surface)', border: '1px solid currentColor',
                  fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-sans)',
                  color: 'inherit',
                }}
              >
                <Square size={12} /> Stop
              </button>
            )}
            {(isClosed || isPaused) && !isResults && (
              <button 
                onClick={handleReopen}
                disabled={actionLoading} 
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: 'var(--color-surface)', border: '1px solid currentColor',
                  fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-sans)',
                  color: 'inherit',
                }}
              >
                <RefreshCw size={12} /> Re-open
              </button>
            )}
          </div>
        </div>

        {/* Deadline row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
          <Calendar size={14} />
          {editingDeadline ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input 
                type="datetime-local" 
                value={deadlineInput}
                onChange={(e) => setDeadlineInput(e.target.value)}
                style={{
                  background: 'var(--color-base)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  colorScheme: 'dark',
                  outline: 'none',
                }}
              />
              <button 
                onClick={handleSaveDeadline}
                disabled={actionLoading}
                style={{
                  padding: '5px 12px', borderRadius: '6px',
                  background: 'var(--color-gold)', color: '#000',
                  fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-sans)',
                  border: 'none',
                }}
              >
                Save
              </button>
              <button 
                onClick={() => setEditingDeadline(false)}
                style={{
                  padding: '5px 10px', borderRadius: '6px',
                  fontSize: '11px', fontFamily: 'var(--font-sans)',
                  color: 'var(--color-text-muted)', background: 'none', border: 'none',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                {settings?.voting_end_time 
                  ? `Closes: ${new Date(settings.voting_end_time).toLocaleString()}`
                  : 'No deadline set'
                }
              </span>
              <button 
                onClick={openDeadlineEditor}
                style={{
                  padding: '3px 10px', borderRadius: '6px',
                  fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-sans)',
                  color: 'var(--color-gold)', background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <StatCard title="Total Votes" value={stats.totalVotes.toLocaleString()} />
        <StatCard title="Revenue" value={formatNaira(stats.totalRevenue)} />
        <StatCard title="Success Rate" value={`${stats.successRate}%`} warning={stats.successRate < 80} />
        <StatCard title="Active Now" value={stats.activeSessions} />
      </div>

      {/* Sparkline */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
          Payment Health (Last 60 mins)
        </span>
        <div style={{ display: 'flex', gap: '2px', height: '28px', alignItems: 'flex-end', maxWidth: '300px' }}>
          {stats.sparkline?.map((s: number, i: number) => (
            <div 
              key={i} 
              style={{ 
                flex: 1,
                borderRadius: '2px 2px 0 0',
                height: s !== 0 ? '100%' : '20%',
                background: s === 1 ? 'var(--color-success)' : s === -1 ? 'var(--color-error)' : 'var(--color-surface-raised)'
              }}
              title={s === 1 ? 'Success' : s === -1 ? 'Failure(s) detected' : 'No activity'}
            />
          ))}
        </div>
      </div>

      {/* Feed & Mini Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {/* Live Feed */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '500px',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--color-text)',
          }}>
            <span>Live Activity Feed</span>
            <div style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {feed.map((item, idx) => (
              <FeedItem key={`${item.type}-${item.id}-${idx}`} item={item} />
            ))}
            {feed.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0', fontFamily: 'var(--font-sans)' }}>
                Waiting for activity...
              </p>
            )}
          </div>
        </div>

        {/* Mini Leaderboard */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            color: 'var(--color-text)',
            position: 'sticky',
            top: 0,
            background: 'var(--color-surface)',
            zIndex: 2,
          }}>
            Mini Leaderboard
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {leaders.map(cat => {
              const leader = cat.nominees?.[0];
              return (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                    {cat.name}
                  </span>
                  {leader ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--color-surface-raised)', padding: '8px 12px', borderRadius: '8px',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)' }}>
                        {leader.name} <Crown size={12} style={{ color: 'var(--color-gold)' }} />
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}>
                        {leader.voteCount}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-faint)', fontFamily: 'var(--font-sans)' }}>
                      No votes yet
                    </span>
                  )}
                </div>
              );
            })}
            {leaders.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textAlign: 'center', padding: '12px 0', fontFamily: 'var(--font-sans)' }}>
                No categories yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========== Stat Card ========== */
const StatCard = ({ title, value, warning = false }: { title: string; value: string | number; warning?: boolean }) => (
  <div style={{
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }}>
    <span style={{
      color: 'var(--color-text-muted)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontWeight: 700,
      fontFamily: 'var(--font-sans)',
    }}>
      {title}
    </span>
    <span style={{
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: '22px',
      lineHeight: 1.2,
      color: warning ? 'var(--color-error-text)' : 'var(--color-text)',
    }}>
      {value}
    </span>
  </div>
);

/* ========== Feed Item ========== */
const FeedItem = ({ item }: { item: any }) => {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    fontSize: '13px',
    padding: '8px 10px',
    borderRadius: '8px',
    fontFamily: 'var(--font-sans)',
    alignItems: 'flex-start',
  };

  if (item.type === 'log') {
    return (
      <div style={{ ...baseStyle, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
        <SettingsIcon size={14} style={{ color: 'var(--color-gold-dim)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{item.action}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
            {item.admins?.email} · {new Date(item.created_at).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  }

  if (item.mismatch) {
    return (
      <div style={{ ...baseStyle, borderLeft: '3px solid var(--color-warning)', background: 'rgba(245, 158, 11, 0.04)' }}>
        <AlertTriangle size={14} style={{ color: 'var(--color-warning-text)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ color: 'var(--color-text)' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-warning-text)' }}>MISMATCH:</span> {item.reference}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
            {item.mismatch_note} · {new Date(item.created_at).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  }

  if (item.paystack_status === 'failed') {
    return (
      <div style={baseStyle}>
        <XCircle size={14} style={{ color: 'var(--color-error-text)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>Payment failed - {item.reference}</span>
          <span style={{ color: 'var(--color-text-faint)', fontSize: '11px' }}>{new Date(item.created_at).toLocaleTimeString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      {item.vote_recorded ? (
        <Crown size={14} style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
      ) : (
        <CheckCircle2 size={14} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        <span style={{ color: 'var(--color-text)' }}>
          {item.voter_name || 'Someone'} voted for <span style={{ fontWeight: 700 }}>{item.nominees?.name}</span> in {item.nominees?.categories?.name}
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
          ref: {item.reference} · {new Date(item.created_at).toLocaleTimeString()}
        </span>
      </div>
      <span style={{ color: 'var(--color-success-text)', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
        ₦{item.amount / 100}
      </span>
    </div>
  );
};
