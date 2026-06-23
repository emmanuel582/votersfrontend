import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from '../lib/realtime';

export const VotingStatusBanner = () => {
  const [settings, setSettings] = useState<any>(null);

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('voting_status, event_name').eq('id', 'singleton').single();
    if (data) setSettings(data);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useRealtimeSync('public-voting-status', ['app_settings'], fetchSettings);

  if (!settings || settings.voting_status === 'OPEN') return null;

  const isPaused = settings.voting_status === 'PAUSED';
  const isResults = settings.voting_status === 'RESULTS';

  const message = isResults
    ? '🏆 Final results have been revealed'
    : isPaused
      ? 'Voting is temporarily paused'
      : 'Voting is currently closed';

  const color = isResults ? 'var(--color-gold)' : 'var(--color-warning-text)';
  const bg = isResults ? 'rgba(212, 175, 55, 0.08)' : 'rgba(245, 158, 11, 0.08)';

  return (
    <div
      className="w-full text-center font-sans font-bold"
      style={{
        padding: '10px 16px',
        fontSize: '13px',
        letterSpacing: '0.03em',
        color,
        background: bg,
        borderBottom: `1px solid ${color}`,
      }}
    >
      {message}
    </div>
  );
};
