import React from 'react';
import './SoftwarePage.css';

export default function SoftwarePage({ navigate }) {
  const handleBackHome = () => {
    navigate('');
  };

  const softwareCategories = [
    { name: 'Design & Creative', count: 3, icon: '🎨' },
    { name: 'Development Tools', count: 5, icon: '⚡' },
    { name: 'Communication', count: 2, icon: '💬' },
    { name: 'Project Management', count: 4, icon: '📋' },
    { name: 'Productivity', count: 1, icon: '📊' }
  ];

  return (
    <div className="software-page">
      <div className="page-header">
        <button className="back-btn" onClick={handleBackHome}>← Back to License Center</button>
        <h1>Software</h1>
      </div>
      
      <div className="software-grid">
        {softwareCategories.map((category, index) => (
          <div key={index} className="software-category-card">
            <div className="category-icon">{category.icon}</div>
            <h3 className="category-name">{category.name}</h3>
            <div className="category-count">{category.count} licenses</div>
          </div>
        ))}
      </div>

      <div className="coming-soon">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">🚀</div>
          <h3>More Software Analytics Coming Soon</h3>
          <p>Advanced software analytics, usage metrics, and optimization recommendations will be available here.</p>
        </div>
      </div>
    </div>
  );
}