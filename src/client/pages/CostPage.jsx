import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './CostPage.css';

export default function CostPage({ navigate, employeeId }) {
  const [totalCost, setTotalCost] = useState('Loading...');
  const [costGrowth, setCostGrowth] = useState('...');
  const [barChartData, setBarChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState({ main: [], comparison: [] });

  useEffect(() => {
    async function load() {
      try {
        const [cost, growth, barData, lineData] = await Promise.all([
          LicenseDataService.getTotalCostFormatted(employeeId),
          LicenseDataService.getCostGrowth(employeeId),
          LicenseDataService.getMonthlyCosts(employeeId),
          LicenseDataService.getLineChartData(employeeId)
        ]);
        setTotalCost(cost);
        setCostGrowth(growth);
        setBarChartData(barData);
        setLineChartData(lineData);
      } catch (err) {
        setTotalCost('Error');
        setCostGrowth('Error');
      }
    }
    load();
  }, [employeeId]);

  const handleBackHome = () => navigate('');

  const BarChart = ({ title, value, indicator, data }) => (
    <div className="cost-card">
      <div className="card-header">
        <h3>{title}</h3>
        <div className="card-value-row">
          <span className="card-value">{value}</span>
          <span className="growth-indicator positive">{indicator}</span>
        </div>
      </div>
      <div className="chart-container">
        <div className="bar-chart">
          {data.map((item, index) => (
            <div key={index} className="bar-group">
              <div
                className="bar"
                style={{ height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                title={`${item.month}: $${item.value.toLocaleString()}`}
              />
              <span className="bar-label">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const LineChart = ({ title, value, indicator, data }) => (
    <div className="cost-card">
      <div className="card-header">
        <h3>{title}</h3>
        <div className="card-value-row">
          <span className="card-value">{value}</span>
          <span className="growth-indicator positive">{indicator}</span>
        </div>
      </div>
      <div className="chart-container">
        <div className="line-chart">
          <svg width="100%" height="150" viewBox="0 0 300 150">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map(i => (
              <line key={i} x1="0" y1={30 * i + 10} x2="300" y2={30 * i + 10} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            {data.main.length > 0 && (
              <polyline
                points={data.main.map((point, i) => `${i * 60 + 30},${150 - point}`).join(' ')}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {data.comparison.length > 0 && (
              <polyline
                points={data.comparison.map((point, i) => `${i * 60 + 30},${150 - point}`).join(' ')}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
            {data.main.map((point, i) => (
              <circle key={i} cx={i * 60 + 30} cy={150 - point} r="4" fill="#667eea" />
            ))}
          </svg>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color main"></div>
              <span>Current Period</span>
            </div>
            <div className="legend-item">
              <div className="legend-color comparison"></div>
              <span>Previous Period</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cost-page">
      <div className="page-header">
        <button className="back-btn" onClick={handleBackHome}>← Back to License Center</button>
        <h1>Cost</h1>
      </div>

      <div className="cost-grid">
        <div className="top-row">
          <BarChart
            title="Total Expenses"
            value={totalCost}
            indicator={costGrowth}
            data={barChartData}
          />
          <LineChart
            title="Total Expenses"
            value={totalCost}
            indicator="+20%"
            data={lineChartData}
          />
        </div>

        <div className="bottom-row">
          <div className="empty-container">
            <div className="placeholder-content">
              <div className="placeholder-icon">📊</div>
              <h3>Future Analytics</h3>
              <p>This space is reserved for additional cost analytics and insights.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}