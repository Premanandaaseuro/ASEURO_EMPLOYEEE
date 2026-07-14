import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Clock, Building2, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { employeeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STAT_CONFIGS = [
  { key: 'totalEmployees',  label: 'Total Employees', icon: Users,      color: '#6366f1' },
  { key: 'activeEmployees', label: 'Active',          icon: UserCheck,  color: '#10b981' },
  { key: 'onLeaveEmployees',label: 'On Leave',        icon: Clock,      color: '#f59e0b' },
  { key: 'departments',     label: 'Departments',     icon: Building2,  color: '#3b82f6' },
];

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="stat-label">{label}</span>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div className="stat-value" style={{
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        {value ?? '—'}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, empRes] = await Promise.all([
          employeeApi.getStats(),
          employeeApi.getAll({ page: 0, size: 5, sortBy: 'createdAt', direction: 'desc' }),
        ]);
        setStats(statsRes.data);
        setRecentEmployees(empRes.data.content || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '56px', height: '56px' }} />
      </div>
    );
  }

  const avgSalaryFormatted = stats?.averageSalary
    ? `$${Number(stats.averageSalary).toLocaleString()}`
    : '$0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Overview of your workforce at a glance
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => navigate('/employees')}>
            <Plus size={16} />Add Employee
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-4" style={{ gap: '16px' }}>
        {STAT_CONFIGS.map(({ key, label, icon, color }) => (
          <StatCard
            key={key}
            label={label}
            value={stats?.[key]}
            icon={icon}
            color={color}
            sub={key === 'totalEmployees' ? `${stats?.newThisMonth || 0} new this month` : undefined}
          />
        ))}
      </div>

      {/* Second row */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Average Salary */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <TrendingUp size={20} color="var(--accent)" />
            <h3>Average Salary</h3>
          </div>
          <div style={{
            fontSize: '3rem', fontWeight: 800,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {avgSalaryFormatted}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
            Across all {stats?.totalEmployees || 0} employees
          </p>
        </div>

        {/* Headcount breakdown */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Users size={20} color="var(--accent)" />
            <h3>Headcount Breakdown</h3>
          </div>
          {[
            { label: 'Active',     count: stats?.activeEmployees,    color: '#10b981' },
            { label: 'On Leave',   count: stats?.onLeaveEmployees,   color: '#f59e0b' },
            { label: 'Inactive',   count: stats?.inactiveEmployees,  color: '#94a3b8' },
          ].map(({ label, count, color }) => {
            const pct = stats?.totalEmployees ? Math.round((count / stats.totalEmployees) * 100) : 0;
            return (
              <div key={label} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${pct}%`, background: color,
                    transition: 'width 1s ease', minWidth: count > 0 ? '6px' : '0',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Employees */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3>Recent Employees</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employees')}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              {recentEmployees.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No employees yet</td></tr>
              ) : recentEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{emp.firstName} {emp.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{emp.department}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{emp.position}</td>
                  <td>
                    <span className={`badge badge-${emp.status?.toLowerCase()}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>${Number(emp.salary).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
