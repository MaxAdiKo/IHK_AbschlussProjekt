import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './Overview.css';

const TODAY = new Date();

function calcOverallEffectiveness(licenses) {
  const valid = licenses.filter(l => {
    if (!l.date || l.date.trim() === '') return false;
    const d = new Date(l.date);
    return !isNaN(d.getTime());
  });
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, l) => {
    const diffDays = (TODAY - new Date(l.date)) / (1000 * 60 * 60 * 24);
    return acc + (1 - Math.min(diffDays / 365, 1));
  }, 0);
  return sum / valid.length;
}

export default function Overview({ navigate, employeeId }) {
  const [totalCost, setTotalCost] = useState('Loading...');
  const [licenseCount, setLicenseCount] = useState('...');
  const [costGrowth, setCostGrowth] = useState('...');
  const [effectiveness, setEffectiveness] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [cost, count, growth, licenses] = await Promise.all([
          LicenseDataService.getTotalCostFormatted(employeeId),
          LicenseDataService.getLicenseCount(employeeId),
          LicenseDataService.getCostGrowth(employeeId),
          LicenseDataService.getAllLicenses(employeeId)
        ]);
        setTotalCost(cost);
        setLicenseCount(count);
        setCostGrowth(growth);
        setEffectiveness(calcOverallEffectiveness(licenses));
      } catch (err) {
        setTotalCost('Error');
        setLicenseCount('Error');
        setCostGrowth('Error');
      }
    }
    load();
  }, [employeeId]);

  const BarChart = ({ data }) => (
    <div className="mini-chart">
      {data.map((value, index) => (
        <div key={index} className="chart-bar" style={{ height: `${value}%` }} />
      ))}
    </div>
  );

  const DonutChart = () => {
    const size = 160;
    const strokeWidth = 28;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const usedDash = circumference * effectiveness;
    const unusedDash = circumference * (1 - effectiveness);
    const pct = Math.round(effectiveness * 100);

    return (
      <div className="donut-chart">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="gradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B3FCB" />
              <stop offset="100%" stopColor="#C9CCF7" />
            </linearGradient>
          </defs>
          <circle cx={center} cy={center} r={radius}
            fill="none" stroke="#E8E8F0" strokeWidth={strokeWidth} />
          <circle cx={center} cy={center} r={radius}
            fill="none" stroke="url(#gradientFull)" strokeWidth={strokeWidth}
            strokeDasharray={`${usedDash} ${unusedDash}`}
            strokeLinecap="butt"
            transform={`rotate(-90 ${center} ${center})`} />
        </svg>
        <div className="chart-center">
          <span className="chart-percentage">{pct}%</span>
        </div>
      </div>
    );
  };

  const handleCostCardClick = () => navigate('license-center/cost');
  const handleLicensesCardClick = () => navigate('license-center/licenses');
  const handleEffectivenessClick = () => navigate('license-center/effectiveness');

  return (
    <section className="overview">
      <div className="overview-left">
        <div className="overview-card clickable-card" onClick={handleCostCardClick}>
          <div className="card-content">
            <div className="card-info">
              <h3 className="card-label">Cost</h3>
              <div className="card-value">{totalCost}</div>
              <div className="card-subtext">November 2025</div>
            </div>
            <BarChart data={[60, 80, 45, 90, 75]} />
          </div>
        </div>

        <div className="overview-card clickable-card" onClick={handleLicensesCardClick}>
          <div className="card-content">
            <div className="card-info">
              <h3 className="card-label">Total Licenses</h3>
              <div className="card-value">{licenseCount}</div>
              <div className="card-subtext">September 2025</div>
            </div>
            <BarChart data={[40, 70, 55, 85, 60]} />
          </div>
        </div>
      </div>

      <div className="overview-right">
        <div className="overview-card large-card clickable-card" onClick={handleEffectivenessClick}>
          <DonutChart />
          <div className="cost-effectiveness">
            <h3>Cost effectiveness</h3>
          </div>
        </div>
      </div>
    </section>
  );
}