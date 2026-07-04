export default function MembersTable({ members, loading }) {
  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading members...</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="empty-state">
        <p>No members found. Import a member sheet to get started.</p>
      </div>
    );
  }

  // Helper to format the tier for display
  const formatTier = (tier) => {
    if (!tier) return "—";
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Helper to get status badge class
  const getStatusBadge = (status) => {
    if (status === "active") return "status delivered";
    if (status === "inactive") return "status pending";
    return "status pending";
  };

  // Helper to format status display
  const formatStatus = (status) => {
    if (status === "active") return "Active";
    if (status === "inactive") return "Inactive";
    return status || "—";
  };

  return (
    <div className="table-wrapper">
      <table className="members-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Tier</th>
            <th>Phone</th>
            <th>Joined</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td className="member-name">
                <strong>{member.name || "—"}</strong>
              </td>
              <td>
                <span className={`tier-badge ${member.tier || "bronze"}`}>
                  {formatTier(member.tier)}
                </span>
              </td>
              <td>{member.phone || "—"}</td>
              <td>{formatDate(member.join_date)}</td>
              <td>
                <span className={getStatusBadge(member.membership_status)}>
                  {formatStatus(member.membership_status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}