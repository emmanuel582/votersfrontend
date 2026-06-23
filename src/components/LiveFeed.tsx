import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Crown, Flame, TrendingUp, Zap } from 'lucide-react';
import { useRealtimeSync } from '../lib/realtime';
import './LiveFeed.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type FeedEvent = {
  id: string;
  voterName: string;
  nomineeName: string;
  nomineePhoto: string | null;
  categoryName: string;
  categoryEmoji: string | null;
  createdAt: string;
};

type FeedStats = {
  votesLastHour: number;
  votesToday: number;
  totalVotes: number;
};

type LiveFeedData = {
  enabled: boolean;
  eventName?: string;
  hashtag?: string;
  stats: FeedStats | null;
  events: FeedEvent[];
  insights: string[];
};

function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export const LiveFeed = () => {
  const [data, setData] = useState<LiveFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightIndex, setInsightIndex] = useState(0);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/live-feed`);
      if (!res.ok) return;
      const json: LiveFeedData = await res.json();

      const freshIds = new Set<string>();
      json.events.forEach((e) => {
        if (!seenIdsRef.current.has(e.id)) freshIds.add(e.id);
      });

      if (seenIdsRef.current.size > 0 && freshIds.size > 0) {
        setNewIds(freshIds);
        setTimeout(() => setNewIds(new Set()), 2500);
      }

      json.events.forEach((e) => seenIdsRef.current.add(e.id));
      setData(json);
    } catch (err) {
      console.error('Live feed error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    pollRef.current = setInterval(fetchFeed, 12000);
    return () => clearInterval(pollRef.current);
  }, [fetchFeed]);

  useRealtimeSync('public-live-feed', [{ table: 'votes', event: 'INSERT' }, { table: 'votes', event: 'UPDATE' }], fetchFeed);

  useEffect(() => {
    if (!data?.insights?.length) return;
    const timer = setInterval(() => {
      setInsightIndex((i) => (i + 1) % data.insights.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [data?.insights]);

  if (loading) {
    return (
      <div className="live-feed live-feed--loading">
        <div className="live-feed__pulse" />
        <span>Loading live feed…</span>
      </div>
    );
  }

  if (!data?.enabled) return null;

  const stats = data.stats;
  const currentInsight = data.insights[insightIndex] || 'Waiting for the first vote…';

  return (
    <section className="live-feed" aria-label="Live voting activity">
      <div className="live-feed__header">
        <div className="live-feed__title">
          <span className="live-feed__dot" />
          <span>LIVE FEED</span>
        </div>
        {data.hashtag && <span className="live-feed__hashtag">{data.hashtag}</span>}
      </div>

      {stats && (
        <div className="live-feed__stats">
          <StatPill icon={<Zap size={14} />} label="Last hour" value={stats.votesLastHour} hot={stats.votesLastHour >= 3} />
          <StatPill icon={<TrendingUp size={14} />} label="Today" value={stats.votesToday} />
          <StatPill icon={<Crown size={14} />} label="Total" value={stats.totalVotes} />
        </div>
      )}

      <div className="live-feed__ticker" key={insightIndex}>
        <Flame size={14} className="live-feed__ticker-icon" />
        <span className="live-feed__ticker-text">{currentInsight}</span>
      </div>

      <div className="live-feed__events">
        {data.events.length === 0 ? (
          <p className="live-feed__empty">No votes yet — be the first to vote! 🗳️</p>
        ) : (
          data.events.map((event, idx) => (
            <div
              key={event.id}
              className={`live-feed__event${newIds.has(event.id) ? ' live-feed__event--new' : ''}`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="live-feed__event-photo">
                {event.nomineePhoto ? (
                  <img src={event.nomineePhoto} alt="" />
                ) : (
                  <span>{event.categoryEmoji || '👑'}</span>
                )}
              </div>
              <div className="live-feed__event-body">
                <p className="live-feed__event-text">
                  <strong>{event.voterName}</strong> voted for{' '}
                  <strong className="live-feed__nominee">{event.nomineeName.split(' ')[0]}</strong>
                  {' '}in <span className="live-feed__category">{event.categoryName}</span>
                </p>
                <span className="live-feed__event-time">{timeAgo(event.createdAt)}</span>
              </div>
              <Crown size={14} className="live-feed__event-crown" />
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const StatPill = ({
  icon,
  label,
  value,
  hot = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hot?: boolean;
}) => (
  <div className={`live-feed__stat${hot ? ' live-feed__stat--hot' : ''}`}>
    <span className="live-feed__stat-icon">{icon}</span>
    <span className="live-feed__stat-value">{value}</span>
    <span className="live-feed__stat-label">{label}</span>
  </div>
);
