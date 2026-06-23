import React from 'react';
import { Card } from '../components/ui/Card';

import { DollarSign, Users, AlertTriangle } from 'lucide-react';
import { categories } from '../data/mockData';

export const AdminDashboard: React.FC = () => {
  // Calculate mock stats
  const totalVotes = categories.reduce((sum, cat) => sum + cat.nominees.reduce((nSum, nom) => nSum + nom.votes, 0), 0);
  const revenue = totalVotes * 100;
  const flagged = 4; // Mock flagged transactions

  return (
    <div className="admin-view flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-4 border-b border-white-10 pb-4">
        <h1 className="text-2xl font-display">Admin Dashboard</h1>
        <div className="bg-gold-glow text-gold text-xs px-2 py-1 rounded-sm border border-gold">Authenticated</div>
      </div>

      <div className="stats-grid grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card className="flex-col gap-2">
          <div className="flex items-center gap-2 text-muted">
            <Users size={16} /> Total Votes
          </div>
          <div className="text-3xl font-bold">{totalVotes.toLocaleString()}</div>
        </Card>
        
        <Card className="flex-col gap-2">
          <div className="flex items-center gap-2 text-muted">
            <DollarSign size={16} /> Revenue (₦)
          </div>
          <div className="text-3xl font-bold text-success">₦{revenue.toLocaleString()}</div>
        </Card>

        <Card className="flex-col gap-2">
          <div className="flex items-center gap-2 text-muted">
            <AlertTriangle size={16} className="text-danger" /> Flagged Transactions
          </div>
          <div className="text-3xl font-bold text-danger">{flagged}</div>
          <p className="text-xs text-muted">Failed Paystack verifies</p>
        </Card>
      </div>

      <h2 className="text-xl font-display mt-6 mb-4 border-b border-white-10 pb-2">Recent Activity Log (Mock)</h2>
      <Card>
        <div className="flex-col gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-between items-center pb-2 border-b border-white-10" style={{ borderColor: 'rgba(255,255,255,0.05)'}}>
              <div className="text-sm">
                <span className="text-success mr-2">Success</span> 
                Vote for <strong>{categories[0].nominees[0].name}</strong> in {categories[0].name}
              </div>
              <div className="text-xs text-muted font-mono">Ref: vote_cat_beautiful_nom_${i}_xyz</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
