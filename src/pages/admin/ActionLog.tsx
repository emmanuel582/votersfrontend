import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRealtimeSync } from '../../lib/realtime';


export const AdminActionLog = () => {
  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/action-logs`, {
      headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
    });
    if (res.ok) setLogs(await res.json());
  };

  useEffect(() => { fetchLogs(); }, []);

  useRealtimeSync('admin-action-log', ['action_logs', 'votes', 'admins'], fetchLogs);

  return (
    <div className="flex-col gap-6 animate-fade-up max-w-[800px]">
      <h1 className="font-sans font-bold text-2xl text-text">System Action Log</h1>
      <p className="text-muted text-sm -mt-4">Append-only operational audit trail.</p>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised text-muted uppercase text-[10px] tracking-wider border-b" style={{ borderColor: 'var(--color-border)' }}>
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Admin</th>
              <th className="p-4">Action</th>
              <th className="p-4">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {logs.map(log => (
              <tr key={log.id}>
                <td className="p-4 text-muted whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-4 font-medium text-text">{log.admins?.email || 'System'}</td>
                <td className="p-4 font-bold">{log.action}</td>
                <td className="p-4 text-[10px] font-mono text-muted max-w-[200px] overflow-hidden text-ellipsis">
                  {log.meta ? JSON.stringify(log.meta) : '-'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-muted">No actions logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
