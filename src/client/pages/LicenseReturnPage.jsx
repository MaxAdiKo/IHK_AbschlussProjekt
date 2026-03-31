import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './LicenseReturnPage.css';

export default function LicenseReturnPage({ navigate, employeeId }) {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLicense, setSelectedLicense] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await LicenseDataService.getLicensesForReturn(employeeId);
        setLicenses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeId]);

  const handleLicenseClick = (license) => setSelectedLicense(license);

  const handleReturn = () => {
    if (selectedLicense) {
      const currentUser = window.g_user?.getUserName() || 'current_user';
      console.log(`User ${currentUser} wants to return license ${selectedLicense.software} with ID ${selectedLicense.id}`);
    }
  };

  const handleBackHome = () => navigate('');

  if (loading) return <p>Loading licenses...</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="license-return-page">
      <div className="page-header">
        <button className="back-btn" onClick={handleBackHome}>← Back to License Center</button>
        <h1>License Return</h1>
      </div>

      <div className="return-layout">
        <div className="licenses-table-section">
          <h2>Your Licenses ({licenses.length} total)</h2>
          <div className="scrollable-table">
            <table className="return-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product</th>
                  <th>Last Used</th>
                  <th>Status</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
               {licenses.map((license, index) => (
                  <tr
                    key={index}
                    className={`table-row ${selectedLicense?.id === license.id ? 'selected' : ''}`}
                    onClick={() => handleLicenseClick(license)}
                  >
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

        <div className="detail-panel">
          {selectedLicense ? (
            <div className="license-details">
              <h2>License Details</h2>
              <div className="detail-field">
                <label>Software Name</label>
                <div className="field-value">{selectedLicense.name}</div>
              </div>
              <div className="detail-field">
                <label>Price</label>
                <div className="field-value">{selectedLicense.cost}</div>
              </div>
              <div className="detail-field">
                <label>Product ID</label>
                <div className="field-value">{selectedLicense.id}</div>
              </div>
              <button className="return-btn" onClick={handleReturn}>
                Return License
              </button>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a license from the table to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}