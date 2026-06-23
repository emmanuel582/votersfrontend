import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  interactive = false
}) => {
  return (
    <div 
      className={`card ${interactive ? 'card-interactive' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
