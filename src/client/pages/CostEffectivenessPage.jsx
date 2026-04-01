import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './CostEffectivenessPage.css';

const TODAY = new Date();

function calcEffectiveness(license) {
  if (!license.date || license.date.trim() === '') return null;
  const lastUsed = new Date(license.date);
  if (isNaN(lastUsed.getTime())) return null;
  const diffDays = (TODAY - lastUsed) / (1000 * 60 * 60 * 24);
  const unusedRatio = Math.min(diffDays / 365, 1);
  const cost = typeof license.cost === 'string'
    ? parseFloat(license.cost.replace(/[^0-9.]/g, ''))
    : license.cost;
  const unusedCost = cost * unusedRatio;
  const effectiveness = 1 - unusedRatio;
  return { unusedRatio, unusedCost, effectiveness };
}

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

function DonutChart({ effectiveness }) {
  const size = 220;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const usedDash = circumference * effectiveness;
  const unusedDash = circumference * (1 - effectiveness);
  const pct = Math.round(effectiveness * 100);

  return (
    <div className="ce-donut-wrapper">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ceGradUsed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B3FCB" />
            <stop offset="100%" stopColor="#C9CCF7" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={radius}
          fill="none" stroke="#E8E8F0" strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={radius}
          fill="none" stroke="url(#ceGradUsed)" strokeWidth={strokeWidth}
          strokeDasharray={`${usedDash} ${unusedDash}`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${center} ${center})`} />
      </svg>
      <div className="ce-donut-center">
        <span className="ce-pct">{pct}%</span>
      </div>
    </div>
  );
}

export default function CostEffectivenessPage({ navigate, employeeId }) {
  const [licenses, setLicenses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const displayedLicenses = sortKey ? sortLicenses(licenses, sortKey, sortDir) : licenses;
  const thStyle = { cursor: 'pointer', userSelect: 'none' };

  useEffect(() => {
    async function load() {
      const data = await LicenseDataService.getAllLicenses(employeeId);
      setLicenses(data);
      setLoading(false);
    }
    load();
  }, [employeeId]);

  // Für einzelne Lizenz: null zurückgeben wenn kein Datum
  const selectedEffectiveness = selected ? calcEffectiveness(selected) : null;

  // Für alle Lizenzen: nur die mit gültigem Datum einbeziehen
  const validLicenses = licenses.filter(l => calcEffectiveness(l) !== null);
  const overallEffectiveness = validLicenses.length === 0 ? 0 :
    validLicenses.reduce((sum, l) => sum + calcEffectiveness(l).effectiveness, 0) / validLicenses.length;

  // Was der Chart anzeigt
  const displayEffectiveness = selected
    ? (selectedEffectiveness ? selectedEffectiveness.effectiveness : 0)
    : overallEffectiveness;

  const displayPct = Math.round(displayEffectiveness * 100);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="ce-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('')}>← Back to License Center</button>
        <h1>Cost effectiveness</h1>
      </div>

      <div className="ce-layout">
        <div className="ce-top">
          <div className="ce-donut-card">
            <DonutChart effectiveness={displayEffectiveness} />
            <div className="ce-donut-label">Cost effectiveness</div>
          </div>

          <div className="ce-stats-card">
            <div className="ce-stat-label">effectiveness</div>
            <div className="ce-stat-row">
              <span className="ce-stat-value">{displayPct}%</span>
              <span className="ce-badge">+ 5%</span>
            </div>
            <div className="ce-chart-placeholder">
              <svg width="100%" height="160" viewBox="0 0 400 160">
                {[0, 40, 80, 120, 160].map((y, i) => (
                  <line key={i} x1="0" y1={y} x2="400" y2={y}
                    stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                ))}
                <polyline points="0,140 80,120 160,100 240,60 320,40 400,10"
                  fill="none" stroke="#3B3FCB" strokeWidth="2.5" strokeLinecap="round" />
                <polyline points="0,150 80,130 160,115 240,80 320,65 400,35"
                  fill="none" stroke="#C9CCF7" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 4" />
                {['Sep 5', 'Sep 10', 'Sep 15', 'Sep 20', 'Sep 25'].map((l, i) => (
                  <text key={i} x={i * 80 + 40} y={155} textAnchor="middle"
                    fontSize="11" fill="#94a3b8">{l}</text>
                ))}
              </svg>
            </div>
          </div>
        </div>

        <div className="ce-table-card">
          <table className="ce-table">
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
              {displayedLicenses.map((license, i) => {
                const eff = calcEffectiveness(license);
                return (
                  <tr
                    key={i}
                    className={`ce-row ${selected?.id === license.id ? 'ce-row-selected' : ''} ${!eff ? 'ce-row-no-date' : ''}`}
                    onClick={() => eff ? setSelected(selected?.id === license.id ? null : license) : null}
                  >
                    <td className="ce-id">{license.id}</td>
                    <td className="ce-name">{license.name}</td>
                    <td className="ce-date" style={{ textAlign: 'center' }}>{license.date || '—'}</td>
                    <td>
                      {license.status && (
                        <span className={`status-badge ${license.status.toLowerCase()}`}>
                          {license.status}
                        </span>
                      )}
                    </td>
                    <td className="ce-cost">{license.cost}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}