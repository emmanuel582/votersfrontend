import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { Download, FileSpreadsheet } from 'lucide-react';

export const AdminExport = () => {
  const { admin } = useOutletContext<any>();
  const [exporting, setExporting] = useState<string | null>(null);

  if (admin.role !== 'super_admin') return <div className="text-error">Access denied</div>;

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const escapeCSV = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;

  const handleExportAllVotes = async () => {
    setExporting('all_votes');
    try {
      const { data } = await supabase.from('votes').select('*, nominees(name, categories(name))').order('created_at', { ascending: false });
      if (!data) return;
      
      const headers = ['Reference', 'Voter Name', 'Voter Email', 'Category', 'Nominee', 'Amount', 'Paystack Status', 'Vote Recorded', 'Mismatch', 'Resolved', 'Timestamp'];
      const rows = data.map(v => [
        v.reference,
        v.voter_name,
        v.voter_email,
        v.nominees?.categories?.name,
        v.nominees?.name,
        v.amount / 100,
        v.paystack_status,
        v.vote_recorded,
        v.mismatch,
        !!v.resolved_by,
        new Date(v.created_at).toISOString()
      ].map(escapeCSV).join(','));

      downloadCSV(`all_votes_export_${new Date().toISOString().slice(0,10)}.csv`, [headers.join(','), ...rows].join('\n'));
    } finally {
      setExporting(null);
    }
  };

  const handleExportWinners = async () => {
    setExporting('winners');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/leaderboard`);
      const categories = await res.json();
      
      const headers = ['Category', 'Winner Name', 'Vote Count'];
      const rows = categories.map((c: any) => {
        const winner = c.nominees[0];
        return [c.name, winner?.name || 'None', winner?.voteCount || 0].map(escapeCSV).join(',');
      });

      downloadCSV(`winners_report_${new Date().toISOString().slice(0,10)}.csv`, [headers.join(','), ...rows].join('\n'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-up max-w-[800px]">
      <h1 className="font-sans font-bold text-2xl text-text">Data Export</h1>
      <p className="text-muted">Generate and download CSV reports.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        
        <ExportCard 
          title="All Votes & Transactions" 
          description="A complete dump of the votes table including mismatches, voter details, and timestamps."
          onExport={handleExportAllVotes}
          loading={exporting === 'all_votes'}
        />

        <ExportCard 
          title="Winners Report" 
          description="A clean list of every category and its current #1 nominee. Perfect for the principal."
          onExport={handleExportWinners}
          loading={exporting === 'winners'}
        />

        {/* Other exports like Revenue could be added similarly */}
        
      </div>
    </div>
  );
};

const ExportCard = ({ title, description, onExport, loading }: { title: string, description: string, onExport: () => void, loading: boolean }) => (
  <div className="glass-panel p-6 flex-col gap-4">
    <div className="flex items-center gap-3 text-gold">
      <FileSpreadsheet size={24} />
      <h3 className="font-bold text-lg text-text">{title}</h3>
    </div>
    <p className="text-sm text-muted mb-2 flex-1">{description}</p>
    <button 
      onClick={onExport} 
      disabled={loading}
      className="btn-primary w-full flex items-center gap-2 justify-center"
    >
      {loading ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-gold" /> : <Download size={16} />}
      {loading ? 'Generating CSV...' : 'Download CSV'}
    </button>
  </div>
);
