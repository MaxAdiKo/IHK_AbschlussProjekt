import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './CostPage.css';

export default function CostPage({ navigate, employeeId }) {
  const [totalCost, setTotalCost]         = useState('Loading...');
  const [barChartData, setBarChartData]   = useState([]);
  const [lineChartData, setLineChartData] = useState({ main: [], comparison: [] });
  const [licenses, setLicenses]           = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cost, barData, lineData, raw] = await Promise.all([
          LicenseDataService.getTotalCostFormatted(employeeId),
          LicenseDataService.getMonthlyCosts(employeeId),
          LicenseDataService.getLineChartData(employeeId),
          LicenseDataService._fetchFromServiceNow(employeeId)
        ]);
        setTotalCost(cost);
        setBarChartData(barData);
        setLineChartData(lineData);
        setLicenses(raw);
      } catch (err) {
        setTotalCost('Error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeId]);

  /* ─── SVG Bar Chart ──────────────────────────────────────── */
  const SVGBarChart = ({ data }) => {
    if (!data || data.length === 0)
      return <p className="chart-empty">No data available</p>;

    const W = 320, H = 140, padX = 10, padY = 14;
    const maxVal    = Math.max(...data.map(d => d.value)) || 1;
    const barW      = 38;
    const totalBars = data.length;
    const spacing   = (W - padX * 2 - barW * totalBars) / (totalBars - 1 || 1);

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H + 28}`} className="svg-chart">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const y = padY + (1 - f) * (H - padY * 2);
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={W - padX} y2={y}
                    stroke="#f1f5f9" strokeWidth="1" />
              <text x={padX - 2} y={y + 4} fontSize="9" fill="#cbd5e1" textAnchor="end">
                ${Math.round(maxVal * f)}
              </text>
            </g>
          );
        })}

        {data.map((item, i) => {
          const bh = (item.value / maxVal) * (H - padY * 2);
          const x  = padX + i * (barW + spacing);
          const y  = H - padY - bh;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh}
                    rx="5" ry="5" fill="url(#barGrad)" opacity="0.9" />
              <text x={x + barW / 2} y={y - 5}
                    textAnchor="middle" fontSize="10" fill="#64748b">
                ${item.value.toLocaleString()}
              </text>
              <text x={x + barW / 2} y={H + 16}
                    textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
                {item.month}
              </text>
              <title>{item.month}: ${item.value.toLocaleString()}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  /* ─── SVG Line Chart ─────────────────────────────────────── */
  const SVGLineChart = ({ data }) => {
    if (!data || !data.main || data.main.length === 0)
      return <p className="chart-empty">No data available</p>;

    const hasComp = data.comparison && data.comparison.length > 0;
    const W = 320, H = 130, padX = 24, padY = 14;
    const allVals = [...data.main, ...(hasComp ? data.comparison : [])].filter(v => v != null);
    const maxVal  = Math.max(...allVals) || 1;
    const minVal  = 0;
    const range   = maxVal || 1;
    const n       = data.main.length;

    const toX = i => padX + (i / (n - 1)) * (W - padX * 2);
    const toY = v => padY + (1 - (v - minVal) / range) * (H - padY * 2);

    const mainPts = data.main.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
    const compPts = hasComp
      ? data.comparison.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
      : '';

    const areaPts = [
      `${toX(0)},${H - padY}`,
      ...data.main.map((v, i) => `${toX(i)},${toY(v)}`),
      `${toX(n - 1)},${H - padY}`
    ].join(' ');

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H + 28}`} className="svg-chart">
        <defs>
          <linearGradient id="lgGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#667eea" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#667eea" stopOpacity="0"    />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map(i => {
          const y = padY + i * (H - padY * 2) / 3;
          return <line key={i} x1={padX} y1={y} x2={W - padX} y2={y}
                       stroke="#f1f5f9" strokeWidth="1" />;
        })}

        {[0, 0.5, 1].map((f, i) => {
          const val = minVal + f * range;
          const y   = toY(val);
          return (
            <text key={i} x={padX - 4} y={y + 4}
                  fontSize="9" fill="#cbd5e1" textAnchor="end">
              ${val.toFixed(0)}
            </text>
          );
        })}

        <polygon points={areaPts} fill="url(#areaGrad)" />

        {hasComp && (
          <polyline points={compPts} fill="none"
                    stroke="#d1d5db" strokeWidth="2"
                    strokeDasharray="5,4" strokeLinejoin="round" />
        )}

        <polyline points={mainPts} fill="none"
                  stroke="url(#lgGrad)" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />

        {data.main.map((v, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(v)} r="5"
                    fill="white" stroke="#667eea" strokeWidth="2.5" />
            <title>${v.toFixed(2)}</title>
          </g>
        ))}

        <line x1={padX}     y1={H + 16} x2={padX + 18} y2={H + 16}
              stroke="url(#lgGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <text x={padX + 23} y={H + 20} fontSize="11" fill="#64748b">Current Cost</text>

        {hasComp && (
          <>
            <line x1={160} y1={H + 16} x2={178} y2={H + 16}
                  stroke="#d1d5db" strokeWidth="2" strokeDasharray="4,3" />
            <text x={183} y={H + 20} fontSize="11" fill="#64748b">Previous Period</text>
          </>
        )}
      </svg>
    );
  };

  /* ─── Cost Breakdown ─────────────────────────────────────── */
  const topLicenses = [...licenses]
    .filter(l => l.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 6);

  const totalNum = licenses.reduce((s, l) => s + l.cost, 0);
  const COLORS   = ['#667eea','#764ba2','#f093fb','#4facfe','#43e97b','#f6d365'];

  return (
    <div className="cost-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('')}>
          ← Back to License Center
        </button>
        <h1>Cost</h1>
      </div>

      <div className="cost-grid">
        <div className="top-row">

          {/* Bar Chart */}
          <div className="cost-card">
            <div className="card-header">
              <h3>Monthly Expenses</h3>
              <div className="card-value-row">
                <span className="card-value">{totalCost}</span>
              </div>
            </div>
            <div className="chart-container">
              {loading
                ? <div className="chart-skeleton" />
                : <SVGBarChart data={barChartData} />
              }
            </div>
          </div>

          {/* Line Chart */}
          <div className="cost-card">
            <div className="card-header">
              <h3>Period Comparison</h3>
              <div className="card-value-row">
                <span className="card-value">{totalCost}</span>
              </div>
            </div>
            <div className="chart-container">
              {loading
                ? <div className="chart-skeleton" />
                : <SVGLineChart data={lineChartData} />
              }
            </div>
          </div>
        </div>

        {/* Bottom: Breakdown */}
        <div className="bottom-row">
          <div className="cost-card breakdown-card">
            <div className="card-header">
              <h3>Cost Breakdown by Software</h3>
              <span className="breakdown-subtitle">Top licenses by cost</span>
            </div>

            {loading ? (
              <div className="breakdown-skeleton">
                {[1,2,3,4].map(i => <div key={i} className="skeleton-row" />)}
              </div>
            ) : topLicenses.length === 0 ? (
              <div className="placeholder-content">
                <div className="placeholder-icon">📊</div>
                <h3>No cost data available</h3>
                <p>Cost data will appear once licenses are loaded.</p>
              </div>
            ) : (
              <div className="breakdown-list">
                {topLicenses.map((lic, i) => {
                  const pct = totalNum > 0 ? (lic.cost / totalNum) * 100 : 0;
                  return (
                    <div key={i} className="breakdown-item">
                      <div className="breakdown-dot"
                           style={{ background: COLORS[i % COLORS.length] }} />
                      <div className="breakdown-info">
                        <span className="breakdown-name">
                          {lic.name || lic.id || 'Unknown'}
                        </span>
                        <div className="breakdown-bar-track">
                          <div className="breakdown-bar-fill"
                               style={{
                                 width: `${pct}%`,
                                 background: COLORS[i % COLORS.length]
                               }} />
                        </div>
                      </div>
                      <div className="breakdown-numbers">
                        <span className="breakdown-cost">${lic.cost.toFixed(2)}</span>
                        <span className="breakdown-pct">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}