import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    details: '',
    debited: '',
    credited: ''
  });
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch entries from backend
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/entries`);
      if (!res.ok) throw new Error('Failed to fetch entries from the server.');
      const data = await res.json();
      setEntries(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Make sure the server is running and MongoDB is connected.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add new entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.details) {
      alert('Date and details are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          details: formData.details,
          debited: formData.debited ? Number(formData.debited) : 0,
          credited: formData.credited ? Number(formData.credited) : 0
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create entry.');
      }

      setFormData({ date: '', details: '', debited: '', credited: '' });
      fetchEntries();
    } catch (err) {
      alert(err.message);
    }
  };

  // Activate edit mode for a cell
  const handleCellClick = (entry, field, value) => {
    let val = value;
    // Format date field for standard input element
    if (field === 'date' && value) {
      val = new Date(value).toISOString().split('T')[0];
    }
    setEditingCell({ id: entry._id, field });
    setEditValue(val !== undefined && val !== null ? val : '');
  };

  // Save changes and trigger balance recalculation
  const handleSaveCell = async (id, field) => {
    if (!editingCell) return;
    const entry = entries.find((e) => e._id === id);
    if (!entry) return;

    // Validation
    if (field === 'details' && !editValue.trim()) {
      alert('Details cannot be empty.');
      setEditingCell(null);
      return;
    }
    if (field === 'date' && !editValue) {
      alert('Date cannot be empty.');
      setEditingCell(null);
      return;
    }

    const updatedBody = {
      date: field === 'date' ? editValue : entry.date,
      details: field === 'details' ? editValue : entry.details,
      debited: field === 'debited' ? Number(editValue || 0) : entry.debited,
      credited: field === 'credited' ? Number(editValue || 0) : entry.credited
    };

    try {
      const res = await fetch(`${API_BASE}/api/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBody)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update entry.');
      }

      setEditingCell(null);
      fetchEntries();
    } catch (err) {
      alert(err.message);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e, id, field) => {
    if (e.key === 'Enter') {
      handleSaveCell(id, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Delete entry
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/entries/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete entry.');
      }

      fetchEntries();
    } catch (err) {
      alert(err.message);
    }
  };

  // Helper values
  const totalBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;
  const totalCredited = entries.reduce((acc, curr) => acc + (curr.credited || 0), 0);
  const totalDebited = entries.reduce((acc, curr) => acc + (curr.debited || 0), 0);

  const formatCurrency = (val) => {
    const formattedNum = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0);
    return `₹${formattedNum}`;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Antigravity Ledger</h1>
        <p className="app-subtitle">A premium personal finance ledger & expense tracker</p>
      </header>

      {/* Stats Cards Dashboard */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Net Balance</span>
          <span className={`stat-value ${totalBalance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
            {formatCurrency(totalBalance)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Credited</span>
          <span className="stat-value credit">
            {formatCurrency(totalCredited)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Debited</span>
          <span className="stat-value debit">
            {formatCurrency(totalDebited)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Transactions</span>
          <span className="stat-value">
            {entries.length}
          </span>
        </div>
      </section>

      {/* Form Section */}
      <section className="form-panel">
        <h2 className="panel-title">Add New Transaction</h2>
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-group">
            <label className="form-label" htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              className="form-input"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="details">Details</label>
            <input
              type="text"
              id="details"
              name="details"
              className="form-input"
              placeholder="e.g. Groceries, Salary, Utilities"
              value={formData.details}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="debited">Debited (Expense)</label>
            <input
              type="number"
              step="any"
              min="0"
              id="debited"
              name="debited"
              className="form-input"
              placeholder="0.00"
              value={formData.debited}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="credited">Credited (Income)</label>
            <input
              type="number"
              step="any"
              min="0"
              id="credited"
              name="credited"
              className="form-input"
              placeholder="0.00"
              value={formData.credited}
              onChange={handleInputChange}
            />
          </div>
          <button type="submit" className="btn btn-primary">Add Entry</button>
        </form>
      </section>

      {/* Error messages */}
      {error && (
        <div style={{ color: 'var(--danger)', padding: '1rem', background: 'var(--danger-glow)', borderRadius: '10px', border: '1px solid var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Ledger Table Section */}
      <section className="table-panel">
        <div className="table-responsive">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Details</th>
                <th>Debited</th>
                <th>Credited</th>
                <th>Balance</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && entries.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading financial ledger...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <p>No transactions registered yet. Add one above to begin tracking.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id}>
                    {/* Date Column */}
                    <td className="editable-cell" onClick={() => handleCellClick(entry, 'date', entry.date)}>
                      {editingCell && editingCell.id === entry._id && editingCell.field === 'date' ? (
                        <input
                          type="date"
                          className="cell-edit-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(entry._id, 'date')}
                          onKeyDown={(e) => handleKeyDown(e, entry._id, 'date')}
                          autoFocus
                        />
                      ) : (
                        formatDateDisplay(entry.date)
                      )}
                    </td>

                    {/* Details Column */}
                    <td className="editable-cell" onClick={() => handleCellClick(entry, 'details', entry.details)}>
                      {editingCell && editingCell.id === entry._id && editingCell.field === 'details' ? (
                        <input
                          type="text"
                          className="cell-edit-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(entry._id, 'details')}
                          onKeyDown={(e) => handleKeyDown(e, entry._id, 'details')}
                          autoFocus
                        />
                      ) : (
                        entry.details
                      )}
                    </td>

                    {/* Debited Column */}
                    <td className="editable-cell text-debit" onClick={() => handleCellClick(entry, 'debited', entry.debited)}>
                      {editingCell && editingCell.id === entry._id && editingCell.field === 'debited' ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className="cell-edit-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(entry._id, 'debited')}
                          onKeyDown={(e) => handleKeyDown(e, entry._id, 'debited')}
                          autoFocus
                        />
                      ) : (
                        entry.debited > 0 ? formatCurrency(entry.debited) : '-'
                      )}
                    </td>

                    {/* Credited Column */}
                    <td className="editable-cell text-credit" onClick={() => handleCellClick(entry, 'credited', entry.credited)}>
                      {editingCell && editingCell.id === entry._id && editingCell.field === 'credited' ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className="cell-edit-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(entry._id, 'credited')}
                          onKeyDown={(e) => handleKeyDown(e, entry._id, 'credited')}
                          autoFocus
                        />
                      ) : (
                        entry.credited > 0 ? formatCurrency(entry.credited) : '-'
                      )}
                    </td>

                    {/* Balance Column (Calculated, read-only) */}
                    <td className={entry.balance >= 0 ? 'text-balance-positive' : 'text-balance-negative'}>
                      {formatCurrency(entry.balance)}
                    </td>

                    {/* Actions Column */}
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-delete" onClick={() => handleDelete(entry._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default App;
