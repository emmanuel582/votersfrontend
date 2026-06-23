import { Outlet, Link } from 'react-router-dom';
import { VotingStatusBanner } from './VotingStatusBanner';

export const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <VotingStatusBanner />
      <header className="w-full border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="app-container flex justify-between items-center py-4">
          <Link to="/" className="font-display text-text font-bold" style={{ fontSize: '24px', textDecoration: 'none' }}>
            School Awards
          </Link>
          <nav className="flex gap-4 items-center">
            <Link to="/leaderboard" className="text-muted hover:text-text transition-colors" style={{ textDecoration: 'none' }}>
              Leaderboard
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col pt-6 pb-12">
        <Outlet />
      </main>
    </div>
  );
};
