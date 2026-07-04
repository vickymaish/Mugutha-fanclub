export default function FixturesTable({ fixtures, loading, onSendAlert }) {
  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading fixtures...</p>
      </div>
    );
  }

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="empty-state">
        <p>No fixtures scheduled. Add your first match!</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "—";
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      upcoming: "status delivered",
      live: "status read",
      completed: "status pending",
      cancelled: "status pending",
    };
    return map[status] || "status pending";
  };

  const formatStatus = (status) => {
    const map = {
      upcoming: "Upcoming",
      live: "Live 🔴",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return map[status] || status || "—";
  };

  const canSendAlert = (status) => status === 'upcoming';

  return (
    <div className="table-wrapper">
      <table className="fixtures-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Match</th>
            <th>Venue</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fixtures.map((fixture) => (
            <tr key={fixture.id}>
              <td>{formatDate(fixture.date)}</td>
              <td className="match-name">
                <strong>{fixture.home_team}</strong>
                <span className="vs">vs</span>
                <strong>{fixture.away_team}</strong>
              </td>
              <td>{fixture.venue || "—"}</td>
              <td>{formatTime(fixture.time)}</td>
              <td>
                <span className={getStatusBadge(fixture.status)}>
                  {formatStatus(fixture.status)}
                </span>
              </td>
              <td>
                {canSendAlert(fixture.status) ? (
                  <button
                    className="btn-alert"
                    onClick={() => onSendAlert(fixture)}
                    title="Send WhatsApp alert to all members"
                  >
                    📢 Send Alert
                  </button>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}