import useMembers from "../hooks/useMembers";
import MembersTable from "../components/members/MembersTable";

export default function Members() {
  const { members, loading } = useMembers();

  // Count active members
  const activeCount = members.filter(m => m.membership_status === 'active').length;
  const totalCount = members.length;

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Members</h1>
          <p>Manage Mugutha FC membership</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary">+ Add Member</button>
        </div>
      </header>

      <div className="panel">
        <div className="panel-head">
          <h3>All Members</h3>
          <span className="member-count">
            {activeCount} active · {totalCount} total
          </span>
        </div>
        <MembersTable members={members} loading={loading} />
      </div>
    </div>
  );
}