import React from 'react';
import './Header.css';

export default function Header({ currentRoute, navigate }) {
  const getPageTitle = (route) => {
    switch (route) {
      case 'license-center/return':
        return 'License Return';
      case 'license-center/cost':
        return 'Cost';
      case 'license-center/licenses':
        return 'All Licenses';
      case 'license-center/software':
        return 'Software';
      case 'license-center/effectiveness':
        return 'Cost effectiveness'
      default:
        return 'License Center';
    }
  };

  const getBreadcrumb = (route) => {
    if (!route) return null;
    

    return (
      <nav className="breadcrumb">
        <span className="breadcrumb-item" onClick={() => navigate('')}>Home</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item" onClick={() => navigate('')}>License Center</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item breadcrumb-current">{getPageTitle(route)}</span>
      </nav>
    );
  };

  const getDefaultBreadcrumb = () => (
    <nav className="breadcrumb">
      <span className="breadcrumb-item">Home</span>
      <span className="breadcrumb-separator">&gt;</span>
      <span className="breadcrumb-item breadcrumb-current">License Center</span>
    </nav>
  );


  return (
    <header className="header">
      <div className="container">
        {currentRoute ? getBreadcrumb(currentRoute) : getDefaultBreadcrumb()}
      </div>
    </header>
  );

}