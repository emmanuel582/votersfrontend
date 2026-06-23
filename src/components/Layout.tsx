import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import './Layout.css';

export const Layout: React.FC = () => {
  return (
    <div className="layout">
      <header className="header">
        <div className="container header-container">
          <Link to="/" className="logo">
            <h2>School Awards <span className="text-gold">2026</span></h2>
          </Link>
          <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
        </div>
      </header>
      
      <main className="main-content">
        <div className="container animate-fade-in">
          <Outlet />
        </div>
      </main>
      
      <footer className="footer">
        <div className="container text-muted text-center">
          <small>&copy; 2026 School Awards. All rights reserved.</small>
        </div>
      </footer>
    </div>
  );
};
