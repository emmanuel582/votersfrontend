import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as htmlToImage from 'html-to-image';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from '../lib/realtime';
import { triggerGoldParticles } from '../lib/particles';
import './Confirmation.css';

export const Confirmation = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const [vote, setVote] = useState<any>(null);
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'mismatch'>('verifying');
  const [nominee, setNominee] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchDetails = useCallback(async (nomineeId: string) => {
    const { data: n } = await supabase.from('nominees').select('*, categories(*)').eq('id', nomineeId).single();
    if (n) {
      setNominee(n);
      setCategory(n.categories);

      const { data: s } = await supabase.from('app_settings').select('event_name').eq('id', 'singleton').single();
      setSettings(s);

      setTimeout(() => {
        if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          triggerGoldParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }, 500);
    }
  }, []);

  const verifyPayment = useCallback(async () => {
    if (!reference) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/vote/verify/${reference}`);
    const data = await res.json();

    if (data.success && data.data) {
      const v = data.data;
      setVote(v);

      if (v.vote_recorded) {
        setStatus('success');
        fetchDetails(v.nominee_id);
      } else if (v.mismatch) {
        setStatus('mismatch');
      } else if (v.paystack_status === 'failed') {
        setStatus('failed');
      }
      return !v.vote_recorded && !v.mismatch && v.paystack_status !== 'failed';
    }
    return true;
  }, [reference, fetchDetails]);

  useEffect(() => {
    if (!reference) return;

    let pollingTimeout: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const pending = await verifyPayment();
        if (pending && !cancelled) pollingTimeout = setTimeout(poll, 2000);
      } catch {
        if (!cancelled) pollingTimeout = setTimeout(poll, 3000);
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(pollingTimeout);
    };
  }, [reference, verifyPayment]);

  useRealtimeSync(`confirmation-${reference ?? 'none'}`, ['votes', 'nominees'], () => { verifyPayment(); }, [reference]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3, // High res
        style: { transform: 'none', margin: '0' }
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `ivoted-${nominee?.name.replace(/\\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'I Voted!',
          text: `I just voted for ${nominee?.name} in ${category?.name}!`
        });
      } else {
        // Fallback download
        const link = document.createElement('a');
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="app-container flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-t-gold border-r-gold animate-spin" style={{ borderColor: 'var(--color-border) var(--color-gold) var(--color-gold) var(--color-gold)' }} />
        <p className="text-muted">Confirming your payment...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="app-container flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="bg-error rounded-full p-4 mb-4">
           <span className="text-error" style={{ fontSize: '32px' }}>✕</span>
        </div>
        <h2 className="text-text font-bold text-2xl">Payment Failed</h2>
        <p className="text-muted">Your transaction could not be completed.</p>
        <Link to="/" className="btn-primary mt-6">Return Home</Link>
      </div>
    );
  }

  if (status === 'mismatch') {
    return (
      <div className="app-container flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="bg-warning rounded-full p-4 mb-4">
           <span className="text-warning font-bold" style={{ fontSize: '32px' }}>!</span>
        </div>
        <h2 className="text-text font-bold text-2xl">Manual Review Needed</h2>
        <p className="text-muted">Your payment was received, but there was an issue matching the amount. The admins have been notified and will resolve it shortly.</p>
        <Link to="/" className="btn-primary mt-6">Return Home</Link>
      </div>
    );
  }

  // SUCCESS STATE
  if (!nominee) return null;

  return (
    <div className="app-container flex-col items-center gap-8 animate-fade-up confirmation-page">
      
      <div className="vote-share-card-wrap">
        <div className="vote-share-card-line" />

        <div ref={cardRef} className="vote-share-card">
          <div className="vote-share-card__glow" />

          <header className="vote-share-card__header">
            <span className="vote-share-card__brand">{settings?.event_name || 'School Awards'}</span>
            <span className="vote-share-card__badge">✓ Confirmed</span>
          </header>

          <div className="vote-share-card__body">
            <div className="vote-share-card__photo-frame">
              <img
                src={nominee.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nominee.name)}&background=111111&color=D4AF37`}
                alt={nominee.name}
                className="vote-share-card__photo"
                crossOrigin="anonymous"
              />
            </div>

            <div className="vote-share-card__info">
              {category?.emoji && (
                <span className="vote-share-card__emoji">{category.emoji}</span>
              )}
              <h2 className="vote-share-card__name">{nominee.name}</h2>
              <span className="vote-share-card__category">{category?.name}</span>
              <div className="vote-share-card__divider" />
              <p className="vote-share-card__vote-line">
                <strong>{vote?.voter_name || 'Someone'}</strong> voted for{' '}
                <strong>{nominee.name.split(' ')[0]}</strong> 👑
              </p>
            </div>
          </div>

          <footer className="vote-share-card__footer">
            <span>Confirmed Vote</span>
          </footer>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="confirmation-actions flex-col w-full gap-3">
        <button 
          onClick={handleShare}
          disabled={saving || saved}
          className="btn-primary w-full"
        >
          {saved ? 'Saved! ✓' : saving ? 'Preparing...' : 'Share / Save Card'}
        </button>
        
        <Link to="/" className="w-full text-center py-4 rounded-md font-bold text-text bg-surface hover:border-gold transition-colors" style={{ border: '1px solid var(--color-border)', textDecoration: 'none' }}>
          Vote Again
        </Link>
        <Link to="/leaderboard" className="w-full text-center py-4 text-muted hover:text-text transition-colors" style={{ textDecoration: 'none' }}>
          See Leaderboard
        </Link>
      </div>

    </div>
  );
};
