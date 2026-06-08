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
  const [licenses, setLicenses]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [sortKey, setSortKey]                 = useState(null);
  const [sortDir, setSortDir]                 = useState('asc');
  const [submitting, setSubmitting]           = useState(false);
  const [result, setResult]                   = useState(null);
  const [returnedIds, setReturnedIds]         = useState(new Set());

  useEffect(() => {
    async function load() {
      try {
        const [data, existingIds] = await Promise.all([
          LicenseDataService.getLicensesForReturn(employeeId),
          LicenseDataService.getExistingReturnRequests(employeeId)
        ]);
        setLicenses(data);
        setReturnedIds(existingIds);
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

    // Client-seitige Duplikatsperre
    if (returnedIds.has(selectedLicense.id)) {
      setResult({ type: 'warning', message: 'A return request for this license already exists.' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const token    = window.g_ck || '';
      const response = await fetch('/api/1917927/license_return/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
          'X-UserToken':   token
        },
        body: JSON.stringify({
          employeeId:  employeeId,
          licenseName: selectedLicense.name,
          licenseId:   selectedLicense.id
        })
      });

      // ServiceNow wrapt setBody() automatisch in { result: ... }
      const data   = await response.json();
      const result = data.result ?? data;

      console.log('Status:', response.status, 'Result:', result);

      if (response.status === 409) {
        // Server: Duplikat erkannt
        setReturnedIds(prev => new Set(prev).add(selectedLicense.id));
        const nr = result.incident ? ` (${result.incident})` : '';
        setResult({
          type: 'warning',
          message: `A return request for this license already exists${nr}.`
        });

      } else if (response.status === 201 && result.success) {
        // Erfolgreich erstellt
        setReturnedIds(prev => new Set(prev).add(selectedLicense.id));
        setResult({
          type: 'success',
          message: `Return request submitted successfully. Ticket: ${result.incident}`
        });

      } else if (response.status === 500 || result.error) {
        // Echter Serverfehler
        setResult({
          type: 'error',
          message: `Failed to create ticket: ${result.error || 'Unknown server error'}`
        });

      } else {
        // Unerwarteter Status
        setResult({
          type: 'error',
          message: `Unexpected response (${response.status}). Please try again.`
        });
      }

    } catch (err) {
      // Netzwerkfehler o.ä.
      setResult({ type: 'error', message: `Request failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = sortKey ? sortLicenses(licenses, sortKey, sortDir) : licenses;
  const thStyle   = { cursor: 'pointer', userSelect: 'none' };

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
                  <th style={{ textAlign: 'center' }}>Return</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((license, index) => {
                  const isRequested = returnedIds.has(license.id);
                  return (
                    <tr
                      key={index}
                      className={`table-row ${selectedLicense?.id === license.id ? 'selected' : ''}`}
                      onClick={() => handleLicenseClick(license)}
                      style={{ opacity: isRequested ? 0.5 : 1 }}
                    >
                      <td className="license-id">{license.id}</td>
                      <td className="license-name">
                        {license.name}
                        {isRequested && (
                          <span style={{
                            marginLeft: 8, fontSize: 11, color: '#854d0e',
                            background: '#fef9c3', padding: '2px 7px', borderRadius: 10,
                            fontWeight: 500
                          }}>
                            requested
                          </span>
                        )}
                      </td>
                      <td className="license-date" style={{ textAlign: 'center' }}>
                        {license.date || '—'}
                      </td>
                      <td>
                        <span className={`status-badge ${license.status.toLowerCase()}`}>
                          {license.status}
                        </span>
                      </td>
                      <td className="license-cost">{license.cost}</td>
                      <td style={{ textAlign: 'center' }}>
                        {isRequested
                          ? <span style={{ fontSize: 16 }} title="Return already requested">⏳</span>
                          : <span style={{ fontSize: 16, color: '#aaa' }}>—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
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
              {selectedLicense.manufacturerName && (
                <div className="detail-field">
                  <label>Manufacturer</label>
                  <div className="field-value">{selectedLicense.manufacturerName}</div>
                </div>
              )}

              {returnedIds.has(selectedLicense.id) && result?.type !== 'success' ? (
                // Bereits requested → kein Button, nur orange Info-Box
                <div style={{
                  marginTop: 16, padding: '12px 14px', borderRadius: 8,
                  backgroundColor: '#fef9c3', color: '#854d0e', fontSize: 13
                }}>
                  ⏳ A return request for this license has already been submitted.
                  An incident is open and being processed.
                </div>
              ) : !returnedIds.has(selectedLicense.id) ? (
                // Noch nicht requested → Button anzeigen
                <button
                  className="return-btn"
                  onClick={handleReturn}
                  disabled={submitting}
                >
                  {submitting ? 'Creating ticket...' : 'Return License'}
                </button>
              ) : null}

              {/* Feedback-Nachricht (Erfolg, Duplikat vom Server, echter Fehler) */}
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
