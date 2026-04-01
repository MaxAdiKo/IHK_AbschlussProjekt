import React from 'react';
import './ActionCards.css';

const icons = {
  cost: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <text x="32" y="38" textAnchor="middle" fontSize="30" fill="white"
        fontWeight="300" opacity="0.35"
        transform="rotate(-15 32 30)">$</text>
      <text x="22" y="36" textAnchor="middle" fontSize="30" fill="white"
        fontWeight="300" opacity="0.95">$</text>
    </svg>
  ),
  return: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <g opacity="0.35" transform="translate(5, -4) rotate(-8 26 26)">
        <line x1="12" y1="38" x2="36" y2="14" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <polyline points="12,26 12,38 24,38" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="36,26 36,14 24,14" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <g opacity="0.95">
        <line x1="10" y1="40" x2="34" y2="16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <polyline points="10,28 10,40 22,40" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="34,28 34,16 22,16" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  ),
  software: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <rect x="16" y="8" width="28" height="20" rx="3" stroke="white" strokeWidth="2.5"
        fill="none" opacity="0.35" transform="rotate(-8 30 18)"/>
      <rect x="8" y="16" width="28" height="20" rx="3" stroke="white" strokeWidth="2.5" fill="none" opacity="0.95"/>
      <polyline points="14,24 18,28 26,20" fill="none" stroke="white" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
    </svg>
  )
};

export default function ActionCards({ navigate }) {
  const cards = [
    { title: 'Cost',           icon: icons.cost,     route: 'license-center/cost'   },
    { title: 'License return', icon: icons.return,   route: 'license-center/return' },
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