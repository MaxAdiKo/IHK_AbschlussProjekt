import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './TotalLicensesPage.css';

export default function TotalLicensesPage({ navigate, employeeId }) {
  const [allLicenses, setAllLicenses] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [licenses, cost] = await Promise.all([
          LicenseDataService.getAllLicenses(employeeId),
          LicenseDataService.getTotalCost(employeeId)
        ]);
        setAllLicenses(licenses);
        setTotalCost(cost);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeId]);

  const handleBackHome = () => navigate('');

  if (loading) return <p>Loading licenses...</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="total-licenses-page">
      <div className="page-header">
        <button className="back-btn" onClick={handleBackHome}>← Back to License Center</button>
        <div className="header-content">
          <h1>All Licenses</h1>
          <div className="licenses-summary">
            <div className="summary-item">
              <span className="summary-label">Total Licenses</span>
              <span className="summary-value">{allLicenses.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Cost</span>
              <span className="summary-value">
                ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="licenses-container">
        <div className="scrollable-table">
          <table className="all-licenses-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product</th>
                <th>Last Used</th>
                <th>Status</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {allLicenses.map((license, index) => (
                <tr key={index} className="table-row">
                  <td className="license-id">{license.id}</td>
                  <td className="license-name">{license.name}</td>
                  <td className="license-date">{license.date}</td>
                  <td>
                    <span className={`status-badge ${license.status.toLowerCase()}`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="license-cost">{license.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}