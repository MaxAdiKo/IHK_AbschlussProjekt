import React from 'react';
import './ActionCards.css';

export default function ActionCards({ navigate }) {
  const cards = [
    {
      title: 'Cost',
      icon: '💰',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      route: 'license-center/cost'
    },
    {
      title: 'License return',
      icon: '↩️',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      route: 'license-center/return'
    },
    {
      title: 'Software',
      icon: '🖥️',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      route: 'license-center/software'
    }
  ];

  const handleCardClick = (card) => {
    navigate(card.route);
  };

  return (
    <section className="action-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className="action-card"
          style={{ background: card.gradient }}
          onClick={() => handleCardClick(card)}
        >
          <div className="card-icon">{card.icon}</div>
          <h3 className="card-title">{card.title}</h3>
        </div>
      ))}
    </section>
  );
}