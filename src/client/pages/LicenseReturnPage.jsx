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
  const [returnedIds, setReturnedIds]         = useState(new Set()); // Cancel/Return requested
  const [extendedIds, setExtendedIds]         = useState(new Set()); // Extension requested
  const [confirming, setConfirming]           = useState(false);     // Extend/Cancel-Abfrage sichtbar?

  useEffect(() => {
    async function load() {
      try {
        const [data, existingReturns, existingExtensions] = await Promise.all([
          LicenseDataService.getLicensesForReturn(employeeId),
          LicenseDataService.getExistingReturnRequests(employeeId),
          LicenseDataService.getExistingExtensionRequests(employeeId)
        ]);
        setLicenses(data);
        setReturnedIds(existingReturns);
        setExtendedIds(existingExtensions);
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
    setConfirming(false);
  };

  // ── Cancel: bisheriges Return-Ticket erstellen (identisch wie vorher) ─────
  const handleCancel = async () => {
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
          message: `Cancellation submitted successfully. Ticket: ${result.incident}`
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
      setConfirming(false);
    }
  };

  // ── Extend: Extension-Ticket erstellen (gleiches Muster wie Return) ───────
  const handleExtend = async () => {
    if (!selectedLicense) return;

    // Client-seitige Duplikatsperre
    if (extendedIds.has(selectedLicense.id)) {
      setResult({ type: 'warning', message: 'An extension request for this license already exists.' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const token    = window.g_ck || '';
      const response = await fetch('/api/1917927/license_return/extend', {
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
      const data = await response.json();
      const res  = data.result ?? data;

      console.log('Status:', response.status, 'Result:', res);

      if (response.status === 409) {
        // Server: Duplikat erkannt
        setExtendedIds(prev => new Set(prev).add(selectedLicense.id));
        const nr = res.incident ? ` (${res.incident})` : '';
        setResult({
          type: 'warning',
          message: `An extension request for this license already exists${nr}.`
        });

      } else if (response.status === 201 && res.success) {
        // Erfolgreich erstellt
        setExtendedIds(prev => new Set(prev).add(selectedLicense.id));
        setResult({
          type: 'success',
          message: `Extension request submitted successfully. Ticket: ${res.incident}`
        });

      } else if (response.status === 500 || res.error) {
        setResult({
          type: 'error',
          message: `Failed to create ticket: ${res.error || 'Unknown server error'}`
        });

      } else {
        setResult({
          type: 'error',
          message: `Unexpected response (${response.status}). Please try again.`
        });
      }

    } catch (err) {
      setResult({ type: 'error', message: `Request failed: ${err.message}` });
    } finally {
      setSubmitting(false);
      setConfirming(false);
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
                  const isReturned = returnedIds.has(license.id);
                  const isExtended = extendedIds.has(license.id);
                  return (
                    <tr
                      key={index}
                      className={`table-row ${selectedLicense?.id === license.id ? 'selected' : ''}`}
                      onClick={() => handleLicenseClick(license)}
                      style={{ opacity: isReturned ? 0.5 : 1 }}
                    >
                      <td className="license-id">{license.id}</td>
                      <td className="license-name">
                        {license.name}
                        {isReturned && (
                          <span style={{
                            marginLeft: 8, fontSize: 11, color: '#854d0e',
                            background: '#fef9c3', padding: '2px 7px', borderRadius: 10,
                            fontWeight: 500
                          }}>
                            cancellation requested
                          </span>
                        )}
                        {isExtended && (
                          <span style={{
                            marginLeft: 8, fontSize: 11, color: '#166534',
                            background: '#dcfce7', padding: '2px 7px', borderRadius: 10,
                            fontWeight: 500
                          }}>
                            extension requested
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
                        {(isReturned || isExtended)
                          ? <span style={{ fontSize: 16 }} title="Request already submitted">⏳</span>
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
                // Cancel bereits requested → kein Button, nur orange Info-Box
                <div style={{
                  marginTop: 16, padding: '12px 14px', borderRadius: 8,
                  backgroundColor: '#fef9c3', color: '#854d0e', fontSize: 13
                }}>
                  ⏳ A cancellation request for this license has already been submitted.
                  An incident is open and being processed.
                </div>
              ) : extendedIds.has(selectedLicense.id) && result?.type !== 'success' ? (
                // Extension bereits requested → grüne Info-Box
                <div style={{
                  marginTop: 16, padding: '12px 14px', borderRadius: 8,
                  backgroundColor: '#dcfce7', color: '#166534', fontSize: 13
                }}>
                  ⏳ An extension request for this license has already been submitted.
                  An incident is open and being processed.
                </div>
              ) : !returnedIds.has(selectedLicense.id) && !extendedIds.has(selectedLicense.id) ? (
                !confirming ? (
                  // Schritt 1: Return-Button → öffnet die Extend/Cancel-Abfrage
                  <button
                    className="return-btn"
                    onClick={() => { setConfirming(true); setResult(null); }}
                    disabled={submitting}
                  >
                    Modify License
                  </button>
                ) : (
                  // Schritt 2: User antwortet → Extend oder Cancel
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                      Do you want to extend or cancel this license?
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={handleExtend}
                        disabled={submitting}
                        style={{
                          flex: 1, padding: '10px 14px', border: 'none', borderRadius: 8,
                          background: '#16a34a', color: 'white', fontSize: 14, fontWeight: 600,
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          opacity: submitting ? 0.6 : 1
                        }}
                      >
                        {submitting ? 'Creating ticket...' : 'Extend License'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={submitting}
                        style={{
                          flex: 1, padding: '10px 14px', border: 'none', borderRadius: 8,
                          background: '#dc2626', color: 'white', fontSize: 14, fontWeight: 600,
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          opacity: submitting ? 0.6 : 1
                        }}
                      >
                        {submitting ? 'Creating ticket...' : 'Cancel License'}
                      </button>
                    </div>
                  </div>
                )
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