import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, Maximize2 } from 'lucide-react';
import clsx from 'clsx';
import { useRealtimeSync } from '../lib/realtime';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const photoUrl = (n: any) =>
  n.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.name)}&background=1a1a1a&color=D4AF37&bold=true&size=512`;

export const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedNominee, setExpandedNominee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategory = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API}/api/categories/${id}`);
      if (res.ok) {
        setCategory(await res.json());
      }
    } catch (err) {
      console.error('Failed to load category:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [id]);

  useRealtimeSync(`category-${id}`, ['nominees', 'categories', 'app_settings'], fetchCategory, [id]);

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="app-container flex-col items-center gap-4 mt-8">
        <p className="text-muted">Category not found.</p>
        <button onClick={() => navigate('/')} className="text-gold font-sans font-bold">← Back Home</button>
      </div>
    );
  }

  const goToPayment = (nomineeId: string) => {
    navigate(`/category/${category.id}/payment`, { state: { nomineeId } });
  };

  const handleVoteClick = () => {
    if (!selectedId) return;
    goToPayment(selectedId);
  };

  const selectedNominee = category.nominees?.find((n: any) => n.id === selectedId);

  return (
    <div className="app-container flex-col gap-5 animate-fade-up" style={{ padding: '0 16px' }}>
      <button
        onClick={() => navigate(-1)}
        className="text-muted flex items-center gap-2 font-sans"
        style={{ alignSelf: 'flex-start', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
      >
        ← Back
      </button>

      <div className="flex-col gap-1">
        <h1 className="font-display" style={{ fontSize: 'clamp(24px, 6vw, 32px)', color: 'var(--color-text)', lineHeight: 1.2 }}>
          {category.name}
        </h1>
        <p className="font-sans" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Tap a photo to view full size · Pick your nominee
        </p>
      </div>

      <div className="nominee-portrait-grid">
        {category.nominees?.map((n: any) => {
          const isSelected = selectedId === n.id;
          return (
            <div
              key={n.id}
              className={clsx('nominee-portrait-card', isSelected && 'nominee-portrait-card--selected')}
              style={{
                opacity: selectedId && !isSelected ? 0.5 : 1,
              }}
            >
              <button
                type="button"
                className="nominee-portrait-photo-btn"
                onClick={() => {
                  setSelectedId(n.id);
                  setExpandedNominee(n);
                }}
                aria-label={`View ${n.name} full size`}
              >
                <img
                  src={photoUrl(n)}
                  alt={n.name}
                  className="nominee-portrait-img"
                  loading="lazy"
                />
                <span className="nominee-portrait-expand-hint">
                  <Maximize2 size={14} />
                  View
                </span>
                {isSelected && (
                  <span className="nominee-portrait-selected-badge">
                    <Check size={16} strokeWidth={3} />
                  </span>
                )}
              </button>

              <button
                type="button"
                className="nominee-portrait-info"
                onClick={() => setSelectedId(n.id)}
              >
                <span className="font-sans font-bold nominee-portrait-name">{n.name}</span>
                {n.subtitle && (
                  <span className="font-sans nominee-portrait-subtitle">{n.subtitle}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Full-screen nominee focus */}
      {expandedNominee && (
        <div
          className="nominee-lightbox"
          onClick={() => setExpandedNominee(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${expandedNominee.name} profile`}
        >
          <button
            type="button"
            className="nominee-lightbox-close"
            onClick={() => setExpandedNominee(null)}
            aria-label="Close"
          >
            <X size={22} />
          </button>

          <div
            className="nominee-lightbox-inner"
            onClick={e => e.stopPropagation()}
          >
            <div className="nominee-lightbox-image-wrap">
              <img
                src={photoUrl(expandedNominee)}
                alt={expandedNominee.name}
                className="nominee-lightbox-img"
              />
              <div className="nominee-lightbox-gradient">
                <div className="nominee-lightbox-meta">
                  <h2 className="font-display nominee-lightbox-name">{expandedNominee.name}</h2>
                  {expandedNominee.subtitle && (
                    <p className="font-sans nominee-lightbox-subtitle">{expandedNominee.subtitle}</p>
                  )}
                  <p className="font-sans nominee-lightbox-category">{category.name}</p>
                </div>
                <button
                  type="button"
                  className="btn-primary nominee-lightbox-vote"
                  onClick={() => goToPayment(expandedNominee.id)}
                >
                  Vote for {expandedNominee.name.split(' ')[0]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom bar */}
      <div className="nominee-bottom-bar">
        <div className="app-container">
          <button
            className={clsx('btn-primary w-full', selectedId && 'active')}
            disabled={!selectedId}
            onClick={handleVoteClick}
            style={{ padding: '16px' }}
          >
            {selectedId ? `Vote for ${selectedNominee?.name}` : 'Select a nominee'}
          </button>
        </div>
      </div>

      <div style={{ height: '88px' }} />

      <style>{`
        .nominee-portrait-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-top: 4px;
        }
        @media (min-width: 520px) {
          .nominee-portrait-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 900px) {
          .nominee-portrait-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .nominee-portrait-card {
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid var(--color-border);
          background: var(--color-surface);
          transition: border-color 200ms ease, transform 200ms ease, opacity 200ms ease;
        }
        .nominee-portrait-card--selected {
          border-color: var(--color-gold);
          transform: scale(1.01);
          box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.25);
        }

        .nominee-portrait-photo-btn {
          position: relative;
          display: block;
          width: 100%;
          padding: 0;
          border: none;
          background: #000;
          cursor: pointer;
          aspect-ratio: 3 / 4;
          overflow: hidden;
        }
        .nominee-portrait-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          display: block;
        }
        .nominee-portrait-expand-hint {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(6px);
          color: #fff;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .nominee-portrait-selected-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-gold);
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleUp 150ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .nominee-portrait-info {
          width: 100%;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: center;
          text-align: center;
          background: var(--color-surface);
          border: none;
          cursor: pointer;
        }
        .nominee-portrait-name {
          color: var(--color-text);
          font-size: 16px;
          line-height: 1.3;
        }
        .nominee-portrait-subtitle {
          color: var(--color-text-muted);
          font-size: 13px;
        }

        .nominee-lightbox {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0, 0, 0, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          animation: fadeIn 200ms ease;
        }
        .nominee-lightbox-close {
          position: absolute;
          top: max(12px, env(safe-area-inset-top));
          right: 12px;
          z-index: 210;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--color-border);
          background: rgba(17, 17, 17, 0.9);
          color: var(--color-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .nominee-lightbox-inner {
          width: 100%;
          max-width: 480px;
          max-height: 100%;
          display: flex;
          flex-direction: column;
        }
        .nominee-lightbox-image-wrap {
          position: relative;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid var(--color-gold);
          background: #000;
          max-height: calc(100dvh - 24px);
        }
        .nominee-lightbox-img {
          width: 100%;
          max-height: calc(100dvh - 24px);
          object-fit: contain;
          object-position: center center;
          display: block;
          background: #000;
        }
        .nominee-lightbox-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 48px 20px 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 55%, transparent 100%);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .nominee-lightbox-name {
          font-size: clamp(26px, 7vw, 34px);
          color: #fff;
          line-height: 1.1;
        }
        .nominee-lightbox-subtitle {
          font-size: 15px;
          color: rgba(255,255,255,0.75);
        }
        .nominee-lightbox-category {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-gold);
          font-weight: 700;
        }
        .nominee-lightbox-vote {
          width: 100%;
          padding: 16px !important;
          font-size: 17px;
        }

        .nominee-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 16px;
          padding-bottom: max(16px, env(safe-area-inset-bottom));
          background: var(--color-base);
          border-top: 1px solid var(--color-border);
          z-index: 10;
        }

        @keyframes scaleUp {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
