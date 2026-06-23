import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ToastContext';
import { useRealtimeSync } from '../../lib/realtime';
import { CheckCircle2, XCircle, AlertTriangle, Search } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AdminTransactions = () => {
  const toast = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token;

  const fetchTransactions = useCallback(async () => {
    try {
      await fetch(`${API}/api/admin/votes/sync-pending`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      const res = await fetch(`${API}/api/admin/votes`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      if (res.ok) setTransactions(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 8000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  useRealtimeSync('admin-transactions', ['votes', 'nominees', 'categories'], fetchTransactions);

  const flagTransaction = async (id: string, currentFlag: boolean) => {
    const note = currentFlag ? null : prompt('Reason for flagging:');
    if (!currentFlag && !note) return;
    try {
      await fetch(`${API}/api/admin/votes/${id}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ flag: !currentFlag, note })
      });
      toast.success(currentFlag ? 'Transaction unflagged' : 'Transaction flagged');
    } catch {
      toast.error('Action failed');
    }
  };

  const reviewMismatch = async (id: string) => {
    const note = prompt('Resolution note:');
    if (!note) return;
    try {
      await fetch(`${API}/api/admin/votes/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ note })
      });
      toast.success('Mismatch reviewed');
    } catch {
      toast.error('Action failed');
    }
  };

  const filtered = transactions.filter(t => {
    if (filter === 'success' && t.paystack_status !== 'success') return false;
    if (filter === 'failed' && t.paystack_status !== 'failed') return false;
    if (filter === 'mismatch' && !t.mismatch) return false;
    if (filter === 'flagged' && !t.flagged) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!t.reference.toLowerCase().includes(s) && 
          !t.voter_name?.toLowerCase().includes(s) &&
          !t.nominees?.name?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '22px', color: 'var(--color-text)' }}>
          Transactions Ledger
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '8px', padding: '8px 12px',
          }}>
            <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search ref or name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--color-text)', fontFamily: 'var(--font-sans)', fontSize: '13px',
                width: '180px'
              }}
            />
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '8px', padding: '4px',
          }}>
            {['all', 'success', 'failed', 'mismatch', 'flagged'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 12px', borderRadius: '6px',
                  background: filter === f ? 'var(--color-surface-raised)' : 'transparent',
                  color: filter === f ? 'var(--color-text)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)', fontWeight: filter === f ? 600 : 400, fontSize: '12px',
                  textTransform: 'capitalize',
                  border: 'none', transition: 'all 0.2s',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflowX: 'auto',
      }}>
        <div style={{ minWidth: '800px' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr 1fr',
            padding: '16px', borderBottom: '1px solid var(--color-border)',
            background: 'rgba(255,255,255,0.02)',
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '11px',
            color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <span>Reference / Date</span>
            <span>Status</span>
            <span>Amount</span>
            <span>Voter</span>
            <span>Vote For</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {/* Table Body */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((t, i) => (
              <div key={t.id} style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr 1fr',
                padding: '16px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                background: t.mismatch ? 'rgba(245, 158, 11, 0.05)' : t.flagged ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
              }}>
                {/* Ref & Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text)' }}>
                    {t.reference}
                  </span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {new Date(t.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Status */}
                <div>
                  {t.mismatch ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning-text)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                      <AlertTriangle size={12} /> Mismatch
                    </span>
                  ) : t.paystack_status === 'success' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                      <CheckCircle2 size={12} /> Success
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error-text)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                      <XCircle size={12} /> {t.paystack_status}
                    </span>
                  )}
                </div>

                {/* Amount */}
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--color-text)' }}>
                  ₦{t.amount / 100}
                </span>

                {/* Voter */}
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.voter_name || 'Anonymous'}
                </span>

                {/* Vote For */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--color-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {t.nominees?.name || '-'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {t.nominees?.categories?.name || '-'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  {t.mismatch && (
                    <button 
                      onClick={() => reviewMismatch(t.id)}
                      style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--color-surface-raised)', color: 'var(--color-warning-text)', border: '1px solid var(--color-border)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-sans)' }}
                    >
                      Review
                    </button>
                  )}
                  <button 
                    onClick={() => flagTransaction(t.id, t.flagged)}
                    style={{ padding: '4px 8px', borderRadius: '6px', background: t.flagged ? 'rgba(239,68,68,0.1)' : 'var(--color-surface-raised)', color: t.flagged ? 'var(--color-error-text)' : 'var(--color-text)', border: '1px solid var(--color-border)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-sans)' }}
                  >
                    {t.flagged ? 'Unflag' : 'Flag'}
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                No transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
