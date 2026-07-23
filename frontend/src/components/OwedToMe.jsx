import React from 'react';

function OwedToMe({
  owedEntries,
  owedFormData,
  setOwedFormData,
  handleOwedSubmit,
  handleMarkSettled,
  handleOwedDelete,
  CustomDatePicker,
  formatDateDisplay,
  formatCurrency
}) {
  const pendingEntries = owedEntries.filter((e) => e.status === 'Pending');
  const settledEntries = owedEntries.filter((e) => e.status === 'Settled');

  const totalPendingAmount = pendingEntries.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalSettledAmount = settledEntries.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Add Owed Entry Form Panel */}
      <section className="form-panel">
        <h2 className="panel-title">🤝 Record Money Owed to You</h2>
        <form onSubmit={handleOwedSubmit} className="entry-form">
          <div className="form-group">
            <label className="form-label" htmlFor="owedDate">Date</label>
            <CustomDatePicker
              id="owedDate"
              className="form-input-date-container"
              value={owedFormData.date}
              onChange={(val) => setOwedFormData((prev) => ({ ...prev, date: val }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="friendName">Friend's Name</label>
            <input
              type="text"
              id="friendName"
              name="friendName"
              className="form-input"
              placeholder="e.g. Ravi, Priya"
              value={owedFormData.friendName}
              onChange={(e) => setOwedFormData((prev) => ({ ...prev, friendName: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="owedAmount">Amount (₹)</label>
            <input
              type="number"
              step="any"
              min="0.01"
              id="owedAmount"
              name="amount"
              className="form-input"
              placeholder="e.g. 200"
              value={owedFormData.amount}
              onChange={(e) => setOwedFormData((prev) => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="owedNote">Note (Optional)</label>
            <input
              type="text"
              id="owedNote"
              name="note"
              className="form-input"
              placeholder="e.g. Movie tickets, Dinner split"
              value={owedFormData.note}
              onChange={(e) => setOwedFormData((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add Owed Entry
          </button>
        </form>
      </section>

      {/* Owed Table Panel */}
      <section className="table-panel">
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <h2 className="panel-title" style={{ margin: 0, fontSize: '1.25rem' }}>Owed Entries</h2>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>
              Total Pending:{' '}
              <strong style={{ color: '#f59e0b' }}>{formatCurrency(totalPendingAmount)}</strong>
            </span>
            <span>
              Total Settled:{' '}
              <strong style={{ color: 'var(--success)' }}>{formatCurrency(totalSettledAmount)}</strong>
            </span>
          </div>
        </div>

        {owedEntries.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.5 }}>🤝</div>
            <p>No owed entries recorded yet. Use the form above to add an entry.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Friend's Name</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Pending Entries (Highlighted / Active) */}
                {pendingEntries.map((entry) => (
                  <tr key={entry._id} className="owed-row-pending">
                    <td>{formatDateDisplay(entry.date)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.friendName}</td>
                    <td style={{ fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(entry.amount)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{entry.note || '-'}</td>
                    <td>
                      <span className="badge-status status-pending">Pending</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button className="btn-settle" onClick={() => handleMarkSettled(entry._id)}>
                          Mark as Settled
                        </button>
                        <button className="btn-delete" onClick={() => handleOwedDelete(entry._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Settled Entries (Greyed out / Muted) */}
                {settledEntries.map((entry) => (
                  <tr key={entry._id} className="owed-row-settled">
                    <td>{formatDateDisplay(entry.date)}</td>
                    <td style={{ fontWeight: 500 }}>{entry.friendName}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(entry.amount)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{entry.note || '-'}</td>
                    <td>
                      <span className="badge-status status-settled">Settled</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-delete" onClick={() => handleOwedDelete(entry._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default OwedToMe;
