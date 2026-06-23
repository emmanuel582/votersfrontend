import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../components/ToastContext';
import { useRealtimeSync } from '../../lib/realtime';
import { Shield, UserPlus, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AdminUsers = () => {
  const { admin } = useOutletContext<{ admin: { role: string; id: string } }>();
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);

  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token;

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch {}
  };

  useEffect(() => { fetchUsers(); }, []);

  useRealtimeSync('admin-users', ['admins', 'action_logs'], fetchUsers);

  if (admin.role !== 'super_admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <p style={{ color: 'var(--color-error-text)', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Super Admin Access Required</p>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({ email, role }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned an unexpected response. Please try again.');
      }

      if (!res.ok) throw new Error(data.error || 'Failed to invite');

      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      setShowInvite(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite admin');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      toast.success('Role updated');
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }} className="animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '22px', color: 'var(--color-text)' }}>
          Admin Management
        </h1>
        <button
          onClick={() => setShowInvite(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px', borderRadius: '10px',
            background: 'var(--color-gold)', color: '#000',
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px',
            border: 'none',
          }}
        >
          <UserPlus size={16} /> Invite
        </button>
      </div>

      {/* Users List */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {users.map((u, i) => (
          <div
            key={u.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', gap: '12px',
              borderBottom: i < users.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '14px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.email}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: u.role === 'super_admin' ? 'var(--color-gold)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}>
                {u.role === 'super_admin' && <Shield size={10} />}
                {u.role.replace('_', ' ')}
              </span>
            </div>

            {u.id !== admin.id && (
              <select
                value={u.role}
                onChange={(e) => changeRole(u.id, e.target.value)}
                style={{
                  background: 'var(--color-base)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  flexShrink: 0,
                }}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            )}
          </div>
        ))}
        {users.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>No admins found.</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }}
        >
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '18px', color: 'var(--color-text)' }}>
                Invite New Admin
              </h2>
              <button onClick={() => setShowInvite(false)} style={{ color: 'var(--color-text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.edu"
                  style={{
                    width: '100%',
                    background: 'var(--color-base)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--color-base)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--color-gold)',
                  color: '#000',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '16px',
                  border: 'none',
                  marginTop: '4px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
