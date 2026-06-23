import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCategoryById, type Nominee } from '../data/mockData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import './Category.css';

export const Category: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const category = getCategoryById(id || '');
  const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);

  if (!category) {
    return (
      <div className="text-center mt-6">
        <p>Category not found.</p>
        <Link to="/" className="text-gold mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  const handleVoteClick = () => {
    if (selectedNominee) {
      // Pass selected nominee ID in state or use a global store
      // For simplicity, we navigate and use URL params or state
      navigate(`/category/${category.id}/payment`, { state: { nomineeId: selectedNominee.id } });
    }
  };

  return (
    <div className="category-view flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-4 border-b border-white-10 pb-4">
        <button onClick={() => navigate(-1)} className="back-btn text-muted">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl">{category.name}</h1>
          <p className="text-muted text-sm">Select one nominee to vote.</p>
        </div>
      </div>

      <div className="nominee-grid">
        {category.nominees.map(nominee => (
          <Card 
            key={nominee.id}
            interactive 
            className={`nominee-card ${selectedNominee?.id === nominee.id ? 'selected' : ''}`}
            onClick={() => setSelectedNominee(nominee)}
          >
            <div className="nominee-photo-wrapper">
              <img src={nominee.photoUrl} alt={nominee.name} className="nominee-photo" />
            </div>
            <div className="nominee-info text-center mt-3">
              <h3 className="nominee-name font-display">{nominee.name}</h3>
              {nominee.classOrHouse && <p className="text-muted text-sm">{nominee.classOrHouse}</p>}
            </div>
          </Card>
        ))}
      </div>

      <div className="fixed-bottom-cta container">
        <Button 
          fullWidth 
          disabled={!selectedNominee}
          onClick={handleVoteClick}
        >
          {selectedNominee ? `Vote for ${selectedNominee.name}` : 'Select a Nominee'}
        </Button>
      </div>
    </div>
  );
};
