import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { employeeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmployeeFormModal from '../components/EmployeeFormModal';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];

export default function EmployeesPage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState({ current: 0, total: 0, size: 10 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [modal, setModal] = useState({ open: false, employee: null }); // null = create
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchEmployees = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      let res;
      if (search.trim()) {
        res = await employeeApi.search(search.trim(), { page: pageNum, size: page.size });
      } else {
        res = await employeeApi.getAll({ page: pageNum, size: page.size, sortBy: 'id', direction: 'asc' });
      }
      const data = res.data;
      let content = data.content || [];

      // Client-side filter by status + dept (server doesn't combine them in this version)
      if (statusFilter !== 'ALL') content = content.filter(e => e.status === statusFilter);
      if (deptFilter !== 'ALL')   content = content.filter(e => e.department === deptFilter);

      setEmployees(content);
      setPage(p => ({ ...p, current: pageNum, total: data.totalPages || 0 }));
    } catch (e) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, deptFilter, page.size]);

  useEffect(() => { fetchEmployees(0); }, [search, statusFilter, deptFilter]);

  useEffect(() => {
    employeeApi.getDepts().then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    try {
      await employeeApi.delete(id);
      toast.success('Employee deleted');
      setDeleteConfirm(null);
      fetchEmployees(page.current);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const handleSaved = () => {
    setModal({ open: false, employee: null });
    fetchEmployees(page.current);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Employees</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage your workforce
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal({ open: true, employee: null })}>
            <Plus size={16} />Add Employee
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="form-control"
            placeholder="Search by name, email, department..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(p => ({ ...p, current: 0 })); }}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
        >
          <option value="ALL">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner" />
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Phone</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Joined</th>
                  {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      {search ? `No results for "${search}"` : 'No employees found.'}
                    </td>
                  </tr>
                ) : employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem',
                        background: 'rgba(99,102,241,0.1)', color: 'var(--accent-light)',
                        border: '1px solid rgba(99,102,241,0.2)',
                      }}>
                        {emp.department}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{emp.position}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{emp.phone}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      ${Number(emp.salary).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge badge-${emp.status?.toLowerCase()}`}>
                        {emp.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-icon btn-secondary"
                            title="Edit"
                            onClick={() => setModal({ open: true, employee: emp })}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-icon btn-danger"
                            title="Delete"
                            onClick={() => setDeleteConfirm(emp)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {page.total > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-glass)' }}>
            <div className="pagination">
              <button className="page-btn" disabled={page.current === 0}
                onClick={() => fetchEmployees(page.current - 1)}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: page.total }, (_, i) => (
                <button key={i} className={`page-btn ${i === page.current ? 'active' : ''}`}
                  onClick={() => fetchEmployees(i)}>
                  {i + 1}
                </button>
              ))}
              <button className="page-btn" disabled={page.current === page.total - 1}
                onClick={() => fetchEmployees(page.current + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Form Modal */}
      {modal.open && (
        <EmployeeFormModal
          employee={modal.employee}
          onClose={() => setModal({ open: false, employee: null })}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>
                  {deleteConfirm.firstName} {deleteConfirm.lastName}
                </strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>
                <Trash2 size={14} />Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
