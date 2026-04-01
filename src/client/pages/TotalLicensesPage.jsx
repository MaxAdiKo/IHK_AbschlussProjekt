import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './TotalLicensesPage.css';

function sortLicenses(licenses, key, dir) {
  return [...licenses].sort((a, b) => {
    let valA, valB;
    if (key === 'cost') {
      valA = parseFloat(String(a.cost).replace(/[^0-9.]/g, '')) || 0;
      valB = parseFloat(String(b.cost).replace(/[^0-9.]/g, '')) || 0;
    } else if (key === 'date') {
      valA = a.date ? new Date(a.date).getTime() : 0;
      valB = b.date ? new Date(b.date).getTime() : 0;
    } else {
      valA = String(a[key] ?? '').toLowerCase();
      valB = String(b[key] ?? '').toLowerCase();
    }
    if (valA < valB) return dir === 'asc' ? -1 : 1;
    if (valA > valB) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function SortIcon({ active, dir }) {
  return (
    <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 11 }}>
      {active && dir === 'desc' ? '↓' : '↑'}
    </span>
  );
}

export default function TotalLicensesPage({ navigate, employeeId }) {
  const [allLicenses, setAllLicenses] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const displayed = sortKey ? sortLicenses(allLicenses, sortKey, sortDir) : allLicenses;

  const handleBackHome = () => navigate('');

  if (loading) return <p>Loading licenses...</p>;
  if (error)   return <p>Error: {error}</p>;

  const thStyle = { cursor: 'pointer', userSelect: 'none' };

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
                <th style={thStyle} onClick={() => handleSort('id')}>
                  Product ID <SortIcon active={sortKey === 'id'} dir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => handleSort('name')}>
                  Product <SortIcon active={sortKey === 'name'} dir={sortDir} />
                </th>
                <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('date')}>
                  Last Used <SortIcon active={sortKey === 'date'} dir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => handleSort('status')}>
                  Status <SortIcon active={sortKey === 'status'} dir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => handleSort('cost')}>
                  Cost <SortIcon active={sortKey === 'cost'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((license, index) => (
                <tr key={index} className="table-row">
                  <td className="license-id">{license.id}</td>
                  <td className="license-name">{license.name}</td>
                  <td className="license-date" style={{ textAlign: 'center' }}>{license.date || '—'}</td>
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