import React, { useState, useEffect } from 'react';
import api from '../api';
import './StatsDashboard.css';

const CATEGORY_COLORS = {
  Vegetables: '#22c55e',
  Fruits:     '#f97316',
  Grains:     '#eab308',
  Dairy:      '#3b82f6',
  Other:      '#8b5cf6',
};

export default function StatsDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/stats/farmer');
      setStats(data);
    } catch {
      setError('Failed to load statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="stats-loading"><div className="spinner-lg"/>Loading your stats…</div>;
  if (error)   return <div className="stats-error">{error}</div>;
  if (!stats)  return null;

  const maxMonthlyRev = Math.max(...stats.monthlyData.map(m => m.revenue), 1);
  const maxMonthlyBook = Math.max(...stats.monthlyData.map(m => m.bookings), 1);

  const categoryEntries = Object.entries(stats.revByCategory);
  const totalCatRev = categoryEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="stats-page">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-icon">💰</div>
          <div className="kpi-value">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="kpi-label">Total Revenue</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon">📦</div>
          <div className="kpi-value">{stats.confirmedOrders}</div>
          <div className="kpi-label">Confirmed Orders</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon">⏳</div>
          <div className="kpi-value">{stats.pendingOrders}</div>
          <div className="kpi-label">Pending Orders</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon">🌿</div>
          <div className="kpi-value">{stats.totalProducts}</div>
          <div className="kpi-label">Listed Products</div>
        </div>
      </div>

      <div className="stats-charts-row">
        {/* Monthly Revenue Chart */}
        <div className="chart-card card">
          <h3 className="chart-title">📈 Monthly Revenue (₹)</h3>
          <div className="bar-chart">
            {stats.monthlyData.map((m, i) => (
              <div className="bar-group" key={i}>
                <div className="bar-label-top">
                  {m.revenue > 0 ? `₹${m.revenue >= 1000 ? (m.revenue/1000).toFixed(1)+'k' : m.revenue}` : ''}
                </div>
                <div className="bar-col">
                  <div
                    className="bar-fill revenue"
                    style={{ height: `${Math.max((m.revenue / maxMonthlyRev) * 140, m.revenue > 0 ? 8 : 0)}px` }}
                  />
                </div>
                <div className="bar-month">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Bookings Chart */}
        <div className="chart-card card">
          <h3 className="chart-title">📊 Monthly Bookings</h3>
          <div className="bar-chart">
            {stats.monthlyData.map((m, i) => (
              <div className="bar-group" key={i}>
                <div className="bar-label-top">{m.bookings > 0 ? m.bookings : ''}</div>
                <div className="bar-col">
                  <div
                    className="bar-fill bookings"
                    style={{ height: `${Math.max((m.bookings / maxMonthlyBook) * 140, m.bookings > 0 ? 8 : 0)}px` }}
                  />
                </div>
                <div className="bar-month">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-bottom-row">
        {/* Revenue by Category */}
        {categoryEntries.length > 0 && (
          <div className="chart-card card">
            <h3 className="chart-title">🏷️ Revenue by Category</h3>
            <div className="category-bars">
              {categoryEntries
                .sort((a, b) => b[1] - a[1])
                .map(([cat, rev]) => (
                  <div className="cat-row" key={cat}>
                    <div className="cat-label">
                      <span className="cat-dot" style={{ background: CATEGORY_COLORS[cat] || '#888' }} />
                      {cat}
                    </div>
                    <div className="cat-bar-wrap">
                      <div
                        className="cat-bar-fill"
                        style={{
                          width: `${(rev / totalCatRev) * 100}%`,
                          background: CATEGORY_COLORS[cat] || '#888',
                        }}
                      />
                    </div>
                    <div className="cat-rev">₹{rev.toLocaleString()}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Top Products */}
        {stats.topProducts.length > 0 && (
          <div className="chart-card card">
            <h3 className="chart-title">🏆 Top Products</h3>
            <div className="top-products-list">
              {stats.topProducts.map((p, i) => (
                <div className="top-prod-row" key={p.name}>
                  <span className="top-prod-rank">#{i + 1}</span>
                  <span className="top-prod-name">{p.name}</span>
                  <span className="top-prod-count">{p.count} order{p.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      {stats.recentBookings.length > 0 && (
        <div className="card recent-section">
          <h3 className="chart-title">🕐 Recent Activity</h3>
          <table className="recent-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Buyer</th>
                <th>Qty</th>
                <th>Est. Revenue</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((b, i) => (
                <tr key={i}>
                  <td>{b.product || '—'}</td>
                  <td>{b.buyer}</td>
                  <td>{b.quantity}</td>
                  <td className="rev-cell">₹{b.revenue}</td>
                  <td>
                    <span className={`status-pill ${b.status}`}>
                      {b.status === 'confirmed' ? '✅ Confirmed' : b.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                    </span>
                  </td>
                  <td>{new Date(b.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats.totalBookings === 0 && (
        <div className="empty-state" style={{marginTop: 24}}>
          <div className="icon">📊</div>
          <p>No booking data yet.<br/>Statistics will appear once customers start booking!</p>
        </div>
      )}
    </div>
  );
}
