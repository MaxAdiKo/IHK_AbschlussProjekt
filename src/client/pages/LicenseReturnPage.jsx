import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './LicenseReturnPage.css';

function sortLicenses(licenses, key, dir) {
  return [...licenses].sort((a, b) => {
    let valA, valB;
    if (key === 'cost') {
      valA = parseFloat(String(a.cost ?? '').replace(/[^0-9.]/g, '')) || 0;
      valB = parseFloat(String(b.cost ?? '').replace(/[^0-9.]/g, '')) || 0;
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

export default function LicenseReturnPage({ navigate, employeeId }) {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [returnedIds, setReturnedIds] = useState(new Set());

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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleLicenseClick = (license) => {
    setSelectedLicense(license);
    setResult(null);
  };

  const handleReturn = async () => {
    if (!selectedLicense) return;

    // Bereits zurückgegeben – blockieren
    if (returnedIds.has(selectedLicense.id)) {
      setResult({ type: 'warning', message: 'A return request for this license already exists.' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const token = window.g_ck || '';
      const response = await fetch(
        '/api/1917927/license_return/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-UserToken': token
          },
          body: JSON.stringify({
            employeeId: employeeId,
            licenseName: selectedLicense.name,
            licenseId: selectedLicense.id
          })
        }
      );

      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', data);

      if (response.status === 409) {
        // Duplikat vom Server erkannt
        setReturnedIds(prev => new Set(prev).add(selectedLicense.id));
        setResult({ type: 'warning', message: `Already requested: ${data.result?.message || 'Ticket already exists.'}` });
      } else if (response.ok && data.result?.success) {
        // Erfolgreich erstellt – ID als returned markieren
        setReturnedIds(prev => new Set(prev).add(selectedLicense.id));
        setResult({ type: 'success', message: `Ticket created: ${data.result.incident}` });
      } else {
        setResult({ type: 'error', message: 'Failed to create ticket.' });
      }
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = sortKey ? sortLicenses(licenses, sortKey, sortDir) : licenses;
  const thStyle = { cursor: 'pointer', userSelect: 'none' };

  const resultColors = {
    success: { bg: '#dcfce7', color: '#166534' },
    warning: { bg: '#fef9c3', color: '#854d0e' },
    error:   { bg: '#fff5f5', color: '#e53e3e' }
  };

  if (loading) return <p>Loading licenses...</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="license-return-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('')}>← Back to License Center</button>
        <h1>License Return</h1>
      </div>

      <div className="return-layout">
        <div className="licenses-table-section">
          <h2>Your Licenses ({licenses.length} total)</h2>
          <div className="scrollable-table">
            <table className="return-table">
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
                    Price <SortIcon active={sortKey === 'cost'} dir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((license, index) => (
                  <tr
                    key={index}
                    className={`table-row ${selectedLicense?.id === license.id ? 'selected' : ''}`}
                    onClick={() => handleLicenseClick(license)}
                    style={{ opacity: returnedIds.has(license.id) ? 0.45 : 1 }}
                  >
                    <td className="license-id">{license.id}</td>
                    <td className="license-name">
                      {license.name}
                      {returnedIds.has(license.id) && (
                        <span style={{
                          marginLeft: 8, fontSize: 11, color: '#854d0e',
                          background: '#fef9c3', padding: '2px 6px', borderRadius: 10
                        }}>
                          requested
                        </span>
                      )}
                    </td>
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
              <button
                className="return-btn"
                onClick={handleReturn}
                disabled={submitting || returnedIds.has(selectedLicense.id)}
                style={{ opacity: returnedIds.has(selectedLicense.id) ? 0.5 : 1 }}
              >
                {submitting ? 'Creating ticket...' : returnedIds.has(selectedLicense.id) ? 'Already requested' : 'Return License'}
              </button>
              {result && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
                  backgroundColor: resultColors[result.type].bg,
                  color: resultColors[result.type].color
                }}>
                  {result.message}
                </div>
              )}
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