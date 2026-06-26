import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Crown } from 'lucide-react';
import { useRealtimeSync } from '../lib/realtime';
import { useToast } from './ToastContext';
import './LiveFeed.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const HINT_KEY = 'live-feed-hint-seen';
const EXPANDED_MAX = 5;
const TICKER_MS = 3500;

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
  stats: FeedStats | null;
  events: FeedEvent[];
  insights: string[];
};

function timeAgo(iso: string, now: number) {
  const sec = Math.floor((now - new Date(iso).getTime()) / 1000);
  if (sec < 10) return 'now';
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h`;
}

function buildTickerMessages(data: LiveFeedData): string[] {
  const msgs: string[] = [];

  data.events.slice(0, 10).forEach((e) => {
    const emoji = e.categoryEmoji || '👑';
    msgs.push(`${emoji} ${e.voterName} voted for ${e.nomineeName.split(' ')[0]} · ${e.categoryName}`);
  });

  if (data.stats) {
    const { votesLastHour, votesToday, totalVotes } = data.stats;
    if (votesLastHour > 0) {
      msgs.push(`⚡ ${votesLastHour} vote${votesLastHour === 1 ? '' : 's'} in the last hour`);
    }
    if (votesToday > 0) {
      msgs.push(`📈 ${votesToday} vote${votesToday === 1 ? '' : 's'} today`);
    }
    if (totalVotes > 0) {
      msgs.push(`🗳️ ${totalVotes} total votes cast`);
    }
  }

  msgs.push(...data.insights);

  const unique = [...new Set(msgs.filter(Boolean))];
  return unique.length > 0 ? unique : ['Waiting for the first vote…'];
}

export const LiveFeed = () => {
  const toast = useToast();
  const [data, setData] = useState<LiveFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [justUpdated, setJustUpdated] = useState(false);
  const [now, setNow] = useState(Date.now());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const hintShownRef = useRef(false);

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
        setJustUpdated(true);
        setTickerIndex(0);
        setTimeout(() => {
          setNewIds(new Set());
          setJustUpdated(false);
        }, 2500);
      }

      json.events.forEach((e) => seenIdsRef.current.add(e.id));
      setData(json);
      setNow(Date.now());
    } catch (err) {
      console.error('Live feed error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(clock);
  }, []);

  useRealtimeSync('public-live-feed', [{ table: 'votes', event: 'INSERT' }, { table: 'votes', event: 'UPDATE' }], fetchFeed);

  const tickerMessages = useMemo(() => (data ? buildTickerMessages(data) : []), [data]);

  useEffect(() => {
    if (tickerMessages.length <= 1) return;
    const timer = setInterval(() => {
      setTickerIndex((i) => (i + 1) % tickerMessages.length);
    }, TICKER_MS);
    return () => clearInterval(timer);
  }, [tickerMessages]);

  useEffect(() => {
    if (tickerIndex >= tickerMessages.length) setTickerIndex(0);
  }, [tickerIndex, tickerMessages.length]);

  useEffect(() => {
    if (loading || !data?.enabled || hintShownRef.current) return;
    if (localStorage.getItem(HINT_KEY)) return;
    hintShownRef.current = true;
    const t = setTimeout(() => {
      toast.info('Tap Live Feed to expand recent votes 👆');
      localStorage.setItem(HINT_KEY, '1');
    }, 1200);
    return () => clearTimeout(t);
  }, [loading, data?.enabled, toast]);

  if (loading) {
    return (
      <div className="live-bar live-bar--loading">
        <span className="live-bar__dot" />
        <span className="live-bar__label">Live Feed</span>
      </div>
    );
  }

  if (!data?.enabled) return null;

  const stats = data.stats;
  const tickerText = tickerMessages[tickerIndex] || 'Waiting for votes…';
  const visibleEvents = data.events.slice(0, EXPANDED_MAX);

  return (
    <section
      className={`live-bar${expanded ? ' live-bar--open' : ''}${justUpdated ? ' live-bar--updated' : ''}`}
      aria-label="Live Feed"
    >
      <button
        type="button"
        className="live-bar__row"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse Live Feed' : 'Expand Live Feed'}
      >
        <span className="live-bar__badge">
          <span className="live-bar__dot" />
          <span className="live-bar__label">Live Feed</span>
        </span>

        <span className="live-bar__ticker-wrap">
          <span className="live-bar__ticker" key={`${tickerIndex}-${tickerText}`}>
            {tickerText}
          </span>
        </span>

        {stats && (
          <span className="live-bar__chips">
            <span className={`live-bar__chip${stats.votesLastHour >= 1 ? ' live-bar__chip--hot' : ''}`}>
              {stats.votesLastHour}/hr
            </span>
            <span className="live-bar__chip">{stats.votesToday} today</span>
          </span>
        )}

        <span className="live-bar__chevron">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      <div className="live-bar__panel" aria-hidden={!expanded}>
        <div className="live-bar__panel-inner">
          {stats && (
            <div className="live-bar__mini-stats">
              <span><strong>{stats.votesLastHour}</strong> last hour</span>
              <span className="live-bar__sep">·</span>
              <span><strong>{stats.votesToday}</strong> today</span>
              <span className="live-bar__sep">·</span>
              <span><strong>{stats.totalVotes}</strong> total</span>
            </div>
          )}

          {visibleEvents.length === 0 ? (
            <p className="live-bar__empty">No votes yet — cast the first one! 🗳️</p>
          ) : (
            <ul className="live-bar__list">
              {visibleEvents.map((event) => (
                <li
                  key={event.id}
                  className={`live-bar__item${newIds.has(event.id) ? ' live-bar__item--new' : ''}`}
                >
                  <span className="live-bar__item-emoji">
                    {event.nomineePhoto ? (
                      <img src={event.nomineePhoto} alt="" />
                    ) : (
                      event.categoryEmoji || '👑'
                    )}
                  </span>
                  <span className="live-bar__item-text">
                    <strong>{event.voterName}</strong> → <strong>{event.nomineeName.split(' ')[0]}</strong>
                    <span className="live-bar__item-cat"> · {event.categoryName}</span>
                  </span>
                  <span className="live-bar__item-time">{timeAgo(event.createdAt, now)}</span>
                  <Crown size={12} className="live-bar__item-crown" />
                </li>
              ))}
            </ul>
          )}

          {data.events.length > EXPANDED_MAX && (
            <p className="live-bar__more">+{data.events.length - EXPANDED_MAX} more recent votes</p>
          )}
        </div>
      </div>
    </section>
  );
};
