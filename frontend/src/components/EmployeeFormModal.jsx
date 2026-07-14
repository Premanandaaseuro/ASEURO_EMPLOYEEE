import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Save, UserPlus } from 'lucide-react';
import { employeeApi } from '../services/api';

const DEPARTMENTS = ['Engineering', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales', 'Legal', 'Design', 'Product'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  department: '', position: '', salary: '', joiningDate: '',
  status: 'ACTIVE',
};

export default function EmployeeFormModal({ employee, onClose, onSaved }) {
  const isEdit = !!employee;
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.firstName || '',
        lastName:  employee.lastName  || '',
        email:     employee.email     || '',
        phone:     employee.phone     || '',
        department:employee.department|| '',
        position:  employee.position  || '',
        salary:    employee.salary?.toString() || '',
        joiningDate: employee.joiningDate || '',
        status:    employee.status    || 'ACTIVE',
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.email.trim())     e.email     = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim())     e.phone     = 'Required';
    if (!form.department)       e.department= 'Required';
    if (!form.position.trim())  e.position  = 'Required';
    if (!form.salary)           e.salary    = 'Required';
    else if (isNaN(Number(form.salary)) || Number(form.salary) <= 0) e.salary = 'Must be positive number';
    if (!form.joiningDate)      e.joiningDate = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const payload = { ...form, salary: Number(form.salary) };
    try {
      if (isEdit) {
        await employeeApi.update(employee.id, payload);
        toast.success('Employee updated successfully');
      } else {
        await employeeApi.create(payload);
        toast.success('Employee created successfully');
      }
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.fieldErrors
        ? Object.values(err.response.data.fieldErrors || {}).join(', ')
        : 'Operation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus size={17} color="#fff" />
            </div>
            <div>
              <h3>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {isEdit ? `ID: #${employee.id}` : 'Fill in the employee details below'}
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Row 1 */}
            <div className="grid grid-2" style={{ gap: '14px' }}>
              <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} />
              <Field label="Last Name"  name="lastName"  value={form.lastName}  onChange={handleChange} error={errors.lastName} />
            </div>

            {/* Row 2 */}
            <div className="grid grid-2" style={{ gap: '14px' }}>
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
              <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+1-555-0100" />
            </div>

            {/* Row 3 */}
            <div className="grid grid-2" style={{ gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select name="department" value={form.department} onChange={handleChange} className="form-control">
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{errors.department}</span>}
              </div>
              <Field label="Position / Title" name="position" value={form.position} onChange={handleChange} error={errors.position} placeholder="e.g. Senior Engineer" />
            </div>

            {/* Row 4 */}
            <div className="grid grid-2" style={{ gap: '14px' }}>
              <Field label="Salary (USD)" name="salary" type="number" min="0" step="1000" value={form.salary} onChange={handleChange} error={errors.salary} placeholder="75000" />
              <Field label="Joining Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} error={errors.joiningDate} />
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <label key={s} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                    padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                    border: `1px solid ${form.status === s ? 'var(--accent)' : 'var(--border-glass)'}`,
                    background: form.status === s ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: form.status === s ? 'var(--accent-light)' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="status" value={s} checked={form.status === s}
                      onChange={handleChange} style={{ display: 'none' }} />
                    {s.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />Saving...</>
                : <><Save size={15} />{isEdit ? 'Update' : 'Create'} Employee</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', placeholder, min, step }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-control"
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} min={min} step={step}
        style={error ? { borderColor: 'var(--danger)' } : {}}
      />
      {error && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{error}</span>}
    </div>
  );
}
