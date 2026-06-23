import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getCategoryById } from '../data/mockData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, CreditCard } from 'lucide-react';
import './Payment.css';

export const Payment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const category = getCategoryById(id || '');
  
  const nomineeId = location.state?.nomineeId;
  const nominee = category?.nominees.find(n => n.id === nomineeId);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!category || !nominee) {
    return (
      <div className="text-center mt-6">
        <p>Invalid selection.</p>
        <Button onClick={() => navigate('/')} className="mt-4">Return Home</Button>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email for the receipt.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reference = `vote_${category.id}_${nominee.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/transaction/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          reference,
          metadata: {
            categoryId: category.id,
            categoryName: category.name,
            nomineeId: nominee.id,
            nomineeName: nominee.name,
          }
        })
      });

      const data = await response.json();
      
      if (data.status && data.data && data.data.authorization_url) {
        window.location.href = data.data.authorization_url; // Redirect to Paystack
      } else {
        setError('Failed to initialize payment. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="payment-view flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-4 border-b border-white-10 pb-4">
        <button onClick={() => navigate(-1)} className="back-btn text-muted">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl">Confirm Vote</h1>
          <p className="text-muted text-sm">You are about to cast your vote.</p>
        </div>
      </div>

      <Card className="summary-card">
        <div className="flex items-center gap-4">
          <img src={nominee.photoUrl} alt={nominee.name} className="summary-photo" />
          <div className="summary-info">
            <p className="text-muted text-sm">{category.name}</p>
            <h2 className="font-display text-xl">{nominee.name}</h2>
          </div>
        </div>
        <div className="price-row flex justify-between items-center mt-4 pt-4 border-t border-white-10">
          <span className="text-muted">Total Amount</span>
          <span className="text-xl font-bold text-gold">₦100</span>
        </div>
      </Card>

      <form onSubmit={handlePayment} className="payment-form flex-col gap-4">
        <div className="form-group">
          <label htmlFor="email" className="text-sm text-muted">Email Address (for receipt)</label>
          <input 
            type="email" 
            id="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@school.edu"
            className="input-field mt-1"
            required
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <Button 
          type="submit" 
          fullWidth 
          disabled={loading || !email}
          className="mt-2"
        >
          {loading ? 'Processing...' : (
            <span className="flex items-center justify-center gap-2">
              <CreditCard size={18} /> Pay ₦100
            </span>
          )}
        </Button>
      </form>
    </div>
  );
};
