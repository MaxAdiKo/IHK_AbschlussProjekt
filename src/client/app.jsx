import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import { LicenseDataService } from './services/LicenseDataService.js';
import LicenseCenterHome from './pages/LicenseCenterHome.jsx';
import LicenseReturnPage from './pages/LicenseReturnPage.jsx';
import CostPage from './pages/CostPage.jsx';
import CostEffectivenessPage from './pages/CostEffectivenessPage.jsx';
import TotalLicensesPage from './pages/TotalLicensesPage.jsx';
import SoftwarePage from './pages/SoftwarePage.jsx';
import Login from './components/Login.jsx';
import './app.css';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('');
  const [employeeId, setEmployeeId] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '';
      setCurrentRoute(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route) => {
    window.location.hash = route;
  };

  const handleLogin = async (id) => {
    const licenses = await LicenseDataService.getLicensesByEmployee(id);
    if (licenses.length === 0) {
      throw new Error('No licenses found for this Employee ID.');
    }
    setEmployeeId(id);
  };

  // Wenn noch nicht eingeloggt → Login Screen anzeigen
  if (!employeeId) {
    return <Login onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case 'license-center/return':
        return <LicenseReturnPage navigate={navigate} employeeId={employeeId} />;
      case 'license-center/cost':
        return <CostPage navigate={navigate} employeeId={employeeId} />;
      case 'license-center/licenses':
        return <TotalLicensesPage navigate={navigate} employeeId={employeeId} />;
      case 'license-center/software':
        return <SoftwarePage navigate={navigate} />;
      case 'license-center/effectiveness':
        return <CostEffectivenessPage navigate={navigate} employeeId={employeeId} />;
      default:
        return <LicenseCenterHome navigate={navigate} employeeId={employeeId} />;
    }
  };

  return (
    <div className="license-center">
      <Header currentRoute={currentRoute} navigate={navigate} />
      <main className="main-content">
        {renderCurrentPage()}
      </main>
    </div>
  );
}