import React from 'react';
import './ActionCards.css';

const icons = {
  cost: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22"/>
      <path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  return: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  software: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  )
};

export default function ActionCards({ navigate }) {
  const cards = [
    { title: 'Cost',           icon: icons.cost,     route: 'license-center/cost'     },
    { title: 'License return', icon: icons.return,   route: 'license-center/return'   },
    { title: 'Software',       icon: icons.software, route: 'license-center/software' }
  ];

  return (
    <section className="action-cards">
      {cards.map((card, index) => (
        <div key={index} className="action-card" onClick={() => navigate(card.route)}>
          <h3 className="card-title">{card.title}</h3>
          <div className="card-icon">{card.icon}</div>
        </div>
      ))}
    </section>
  );
}