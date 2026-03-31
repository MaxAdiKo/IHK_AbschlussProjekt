import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './LicensesTable.css';

export default function LicensesTable({ navigate, employeeId }) {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await LicenseDataService.getHomepageLicenses(employeeId, 2);
        setLicenses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeId]);

  const handleSeeAll = () => {
    navigate('license-center/licenses');
  };

  if (loading) return <p>Loading licenses...</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <section className="licenses-section">
      <div className="section-header">
        <h2 className="section-title">Licenses</h2>
        <button className="see-all-btn" onClick={handleSeeAll}>
          SEE ALL
        </button>
      </div>
      
      <div className="table-container">
        <table className="licenses-table">
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
            {licenses.map((license, index) => (
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
    </section>
  );
}