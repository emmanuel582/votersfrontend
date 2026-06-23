import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

/** Tables published for Supabase Realtime (see schema.sql). */
export const REALTIME_TABLES = [
  'votes',
  'app_settings',
  'action_logs',
  'nominees',
  'categories',
  'admins',
] as const;

export type RealtimeTable = (typeof REALTIME_TABLES)[number];
type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export type RealtimeSubscription =
  | RealtimeTable
  | { table: RealtimeTable; event?: PostgresEvent };

export function subscribeRealtime(
  channelName: string,
  tables: readonly RealtimeSubscription[],
  onChange: () => void
) {
  let channel = supabase.channel(channelName);

  for (const entry of tables) {
    const table = typeof entry === 'string' ? entry : entry.table;
    const event = typeof entry === 'string' ? '*' : (entry.event ?? '*');
    channel = channel.on('postgres_changes', { event, schema: 'public', table }, onChange);
  }

  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Subscribe to specific tables and refetch when they change. */
export function useRealtimeSync(
  channelName: string,
  tables: readonly RealtimeSubscription[],
  onChange: () => void,
  deps: unknown[] = []
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    return subscribeRealtime(channelName, tables, () => onChangeRef.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, ...deps]);
}

/** Subscribe to every app table — use when a page depends on cross-cutting data. */
export function useAppRealtimeSync(channelName: string, onChange: () => void, deps: unknown[] = []) {
  useRealtimeSync(channelName, REALTIME_TABLES, onChange, deps);
}
