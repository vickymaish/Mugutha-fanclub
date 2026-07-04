import React, { useState, useEffect } from 'react';
import useMembers from '../hooks/useMembers';
import useFixtures from '../hooks/useFixtures';

export default function Analytics() {
  const { members, loading: membersLoading } = useMembers();
  const { fixtures, loading: fixturesLoading } = useFixtures();
  const [broadcasts, setBroadcasts] = useState([]);
  const [broadcastsLoading, setBroadcastsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch broadcast stats
  useEffect(() => {
    fetch('/api/broadcasts')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setBroadcasts(Array.isArray(data) ? data : []);
        setBroadcastsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching broadcasts:', err);
        setError('Could not load broadcast data. Please check your connection.');
        setBroadcastsLoading(false);
      });
  }, []);

  // ── ALL DATA DERIVATIONS (defined outside any conditional) ──
  const totalMembers = members.length || 0;
  const goldCount = members.filter(m => m.tier === 'gold').length;
  const silverCount = members.filter(m => m.tier === 'silver').length;
  const bronzeCount = members.filter(m => m.tier === 'bronze').length;
  const activeCount = members.filter(m => m.membership_status === 'active').length;
  const inactiveCount = members.filter(m => m.membership_status === 'inactive').length;

  const totalFixtures = fixtures.length || 0;
  const upcomingFixtures = fixtures.filter(f => f.status === 'upcoming').length;
  const completedFixtures = fixtures.filter(f => f.status === 'completed').length;

  const totalBroadcasts = broadcasts.length || 0;
  const deliveredCount = broadcasts.filter(b => b.status === 'delivered' || b.status === 'Delivered').length;
  const readCount = broadcasts.filter(b => b.status === 'read' || b.status === 'Read').length;

  const deliveryRate = totalBroadcasts > 0 ? Math.round((deliveredCount / totalBroadcasts) * 100) : 0;
  const readRate = totalBroadcasts > 0 ? Math.round((readCount / totalBroadcasts) * 100) : 0;

  const matchAlerts = broadcasts.filter(b => b.title === 'Match alert').length;
  const merchDrops = broadcasts.filter(b => b.title === 'Merch drop').length;
  const otherBroadcasts = totalBroadcasts - matchAlerts - merchDrops;

  const goldBroadcasts = broadcasts.filter(b => b.tier === 'gold').length;
  const silverBroadcasts = broadcasts.filter(b => b.tier === 'silver').length;
  const allBroadcasts = broadcasts.filter(b => b.tier === 'all' || !b.tier).length;

  const tierData = [
    { label: 'Gold', count: goldCount, color: 'gold', percentage: totalMembers > 0 ? Math.round((goldCount / totalMembers) * 100) : 0 },
    { label: 'Silver', count: silverCount, color: 'silver', percentage: totalMembers > 0 ? Math.round((silverCount / totalMembers) * 100) : 0 },
    { label: 'Bronze', count: bronzeCount, color: 'bronze', percentage: totalMembers > 0 ? Math.round((bronzeCount / totalMembers) * 100) : 0 },
  ];

  const statusData = [
    { label: 'Active', count: activeCount, color: 'green' },
    { label: 'Inactive', count: inactiveCount, color: 'red' },
  ];

  const loading = membersLoading || fixturesLoading || broadcastsLoading;

  // ── RENDER ──
  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>📊 Analytics</h1>
          <p>Real-time club performance insights</p>
        </div>
        <div className="page-actions">
          <span className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">
          <p>Loading analytics data...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>⚠️ {error}</p>
        </div>
      ) : (
        <>
          {/* ── Overview Cards ── */}
          <section className="analytics-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{totalMembers}</div>
                <div className="stat-label">Total Members</div>
                <div className="stat-change positive">+{activeCount} active</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚽</div>
              <div className="stat-content">
                <div className="stat-value">{totalFixtures}</div>
                <div className="stat-label">Total Fixtures</div>
                <div className="stat-change positive">+{upcomingFixtures} upcoming</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📢</div>
              <div className="stat-content">
                <div className="stat-value">{totalBroadcasts}</div>
                <div className="stat-label">Broadcasts Sent</div>
                <div className="stat-change positive">{deliveryRate}% delivered</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👀</div>
              <div className="stat-content">
                <div className="stat-value">{readRate}%</div>
                <div className="stat-label">Read Rate</div>
                <div className="stat-change positive">{readCount} members read</div>
              </div>
            </div>
          </section>

          {/* ── Member Distribution ── */}
          <section className="analytics-row">
            <div className="analytics-panel">
              <div className="panel-head">
                <h3>👥 Member Distribution</h3>
                <span>{totalMembers} total</span>
              </div>
              <div className="chart-container">
                {tierData.map((tier) => (
                  <div className="chart-bar" key={tier.label}>
                    <div className="chart-label">
                      <span className={`tier-dot ${tier.color}`}></span>
                      {tier.label}
                      <span className="chart-count">{tier.count}</span>
                    </div>
                    <div className="chart-track">
                      <div
                        className={`chart-fill ${tier.color}`}
                        style={{ width: `${tier.percentage}%` }}
                      ></div>
                    </div>
                    <span className="chart-percentage">{tier.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-panel">
              <div className="panel-head">
                <h3>📊 Member Status</h3>
                <span>{activeCount} active</span>
              </div>
              <div className="status-grid">
                {statusData.map((status) => (
                  <div className="status-card" key={status.label}>
                    <div className={`status-dot ${status.color}`}></div>
                    <div>
                      <div className="status-number">{status.count}</div>
                      <div className="status-label">{status.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Fixture Summary ── */}
          <section className="analytics-row">
            <div className="analytics-panel">
              <div className="panel-head">
                <h3>⚽ Fixture Summary</h3>
                <span>{totalFixtures} total</span>
              </div>
              <div className="fixture-stats">
                <div className="fixture-stat">
                  <span className="fixture-number">{upcomingFixtures}</span>
                  <span className="fixture-label">Upcoming</span>
                </div>
                <div className="fixture-stat">
                  <span className="fixture-number">0</span>
                  <span className="fixture-label">Wins</span>
                </div>
                <div className="fixture-stat">
                  <span className="fixture-number">0</span>
                  <span className="fixture-label">Draws</span>
                </div>
                <div className="fixture-stat">
                  <span className="fixture-number">0</span>
                  <span className="fixture-label">Losses</span>
                </div>
              </div>
            </div>

            <div className="analytics-panel">
              <div className="panel-head">
                <h3>📢 Broadcast Breakdown</h3>
                <span>{totalBroadcasts} total</span>
              </div>
              <div className="chart-container">
                <div className="chart-bar">
                  <div className="chart-label">
                    ⚽ Match Alerts
                    <span className="chart-count">{matchAlerts}</span>
                  </div>
                  <div className="chart-track">
                    <div 
                      className="chart-fill blue" 
                      style={{ width: `${totalBroadcasts > 0 ? Math.round((matchAlerts / totalBroadcasts) * 100) : 0}%` }}
                    ></div>
                  </div>
                  <span className="chart-percentage">
                    {totalBroadcasts > 0 ? Math.round((matchAlerts / totalBroadcasts) * 100) : 0}%
                  </span>
                </div>
                <div className="chart-bar">
                  <div className="chart-label">
                    🛍️ Merch Drops
                    <span className="chart-count">{merchDrops}</span>
                  </div>
                  <div className="chart-track">
                    <div 
                      className="chart-fill gold" 
                      style={{ width: `${totalBroadcasts > 0 ? Math.round((merchDrops / totalBroadcasts) * 100) : 0}%` }}
                    ></div>
                  </div>
                  <span className="chart-percentage">
                    {totalBroadcasts > 0 ? Math.round((merchDrops / totalBroadcasts) * 100) : 0}%
                  </span>
                </div>
                <div className="chart-bar">
                  <div className="chart-label">
                    📬 Others
                    <span className="chart-count">{otherBroadcasts}</span>
                  </div>
                  <div className="chart-track">
                    <div 
                      className="chart-fill gray" 
                      style={{ width: `${totalBroadcasts > 0 ? Math.round((otherBroadcasts / totalBroadcasts) * 100) : 0}%` }}
                    ></div>
                  </div>
                  <span className="chart-percentage">
                    {totalBroadcasts > 0 ? Math.round((otherBroadcasts / totalBroadcasts) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Broadcasts by Tier ── */}
          <section className="analytics-panel">
            <div className="panel-head">
              <h3>🎯 Broadcasts by Tier</h3>
              <span>{totalBroadcasts} total</span>
            </div>
            <div className="chart-container">
              <div className="chart-bar">
                <div className="chart-label">
                  <span className="tier-dot gold"></span> Gold
                  <span className="chart-count">{goldBroadcasts}</span>
                </div>
                <div className="chart-track">
                  <div 
                    className="chart-fill gold" 
                    style={{ width: `${totalBroadcasts > 0 ? Math.round((goldBroadcasts / totalBroadcasts) * 100) : 0}%` }}
                  ></div>
                </div>
                <span className="chart-percentage">
                  {totalBroadcasts > 0 ? Math.round((goldBroadcasts / totalBroadcasts) * 100) : 0}%
                </span>
              </div>
              <div className="chart-bar">
                <div className="chart-label">
                  <span className="tier-dot silver"></span> Silver
                  <span className="chart-count">{silverBroadcasts}</span>
                </div>
                <div className="chart-track">
                  <div 
                    className="chart-fill silver" 
                    style={{ width: `${totalBroadcasts > 0 ? Math.round((silverBroadcasts / totalBroadcasts) * 100) : 0}%` }}
                  ></div>
                </div>
                <span className="chart-percentage">
                  {totalBroadcasts > 0 ? Math.round((silverBroadcasts / totalBroadcasts) * 100) : 0}%
                </span>
              </div>
              <div className="chart-bar">
                <div className="chart-label">
                  👥 All Members
                  <span className="chart-count">{allBroadcasts}</span>
                </div>
                <div className="chart-track">
                  <div 
                    className="chart-fill green" 
                    style={{ width: `${totalBroadcasts > 0 ? Math.round((allBroadcasts / totalBroadcasts) * 100) : 0}%` }}
                  ></div>
                </div>
                <span className="chart-percentage">
                  {totalBroadcasts > 0 ? Math.round((allBroadcasts / totalBroadcasts) * 100) : 0}%
                </span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}