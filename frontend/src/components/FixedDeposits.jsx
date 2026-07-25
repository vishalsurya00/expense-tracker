import React, { useEffect } from 'react';

// Helper function to calculate duration between two dates
export function calculateDuration(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return '-';
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return '-';
  }

  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let months = end.getUTCMonth() - start.getUTCMonth();
  let days = end.getUTCDate() - start.getUTCDate();

  if (days < 0) {
    months -= 1;
    // Last day of previous month
    const prevMonthLastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0)).getUTCDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);

  return parts.join(', ');
}

// Helper to calculate simple interest estimate
export function calculateSuggestedTotal(amount, rate, startDateStr, endDateStr) {
  const numAmount = Number(amount);
  const numRate = Number(rate);
  if (isNaN(numAmount) || numAmount <= 0 || isNaN(numRate) || numRate < 0 || !startDateStr || !endDateStr) {
    return null;
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return null;
  }

  const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const years = diffInDays / 365.25;
  const interest = (numAmount * numRate * years) / 100;
  return (numAmount + interest).toFixed(2);
}

function FixedDeposits({
  fdEntries = [],
  fdFormData,
  setFdFormData,
  handleFDSubmit,
  handleMarkCredited,
  handleFDDelete,
  CustomDatePicker,
  formatDateDisplay,
  formatCurrency
}) {
  const activeEntries = fdEntries.filter((e) => e.status === 'Active');
  const creditedEntries = fdEntries.filter((e) => e.status === 'Credited');

  const totalActiveDeposited = activeEntries.reduce((acc, curr) => acc + (curr.depositedAmount || 0), 0);
  const totalActiveMaturity = activeEntries.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCreditedAmount = creditedEntries.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const currentDuration = calculateDuration(fdFormData.depositedDate, fdFormData.closingDate);
  const suggestedTotal = calculateSuggestedTotal(
    fdFormData.depositedAmount,
    fdFormData.interestRate,
    fdFormData.depositedDate,
    fdFormData.closingDate
  );

  // Auto-suggest total amount when dependent fields change, if totalAmount is empty or matches auto-estimate
  useEffect(() => {
    if (suggestedTotal !== null && !fdFormData.isTotalAmountManuallyEdited) {
      setFdFormData((prev) => ({
        ...prev,
        totalAmount: suggestedTotal
      }));
    }
  }, [fdFormData.depositedAmount, fdFormData.interestRate, fdFormData.depositedDate, fdFormData.closingDate, suggestedTotal]);

  const handleTotalAmountChange = (e) => {
    const val = e.target.value;
    setFdFormData((prev) => ({
      ...prev,
      totalAmount: val,
      isTotalAmountManuallyEdited: true
    }));
  };

  const handleApplySuggestedTotal = () => {
    if (suggestedTotal !== null) {
      setFdFormData((prev) => ({
        ...prev,
        totalAmount: suggestedTotal,
        isTotalAmountManuallyEdited: false
      }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Add Fixed Deposit Form Panel */}
      <section className="form-panel">
        <h2 className="panel-title">🏦 Add Fixed Deposit (FD)</h2>
        <form onSubmit={handleFDSubmit} className="entry-form">
          <div className="form-group">
            <label className="form-label" htmlFor="fdDetails">Details (Bank / Label)</label>
            <input
              type="text"
              id="fdDetails"
              name="details"
              className="form-input"
              placeholder="e.g. HDFC Bank, SBI 1-Year FD"
              value={fdFormData.details}
              onChange={(e) => setFdFormData((prev) => ({ ...prev, details: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="depositedAmount">Deposited Amount (₹)</label>
            <input
              type="number"
              step="any"
              min="0.01"
              id="depositedAmount"
              name="depositedAmount"
              className="form-input"
              placeholder="e.g. 50000"
              value={fdFormData.depositedAmount}
              onChange={(e) => setFdFormData((prev) => ({ ...prev, depositedAmount: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="depositedDate">Deposited Date</label>
            <CustomDatePicker
              id="depositedDate"
              className="form-input-date-container"
              value={fdFormData.depositedDate}
              onChange={(val) => setFdFormData((prev) => ({ ...prev, depositedDate: val }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="closingDate">Closing Date (Maturity)</label>
            <CustomDatePicker
              id="closingDate"
              className="form-input-date-container"
              value={fdFormData.closingDate}
              onChange={(val) => setFdFormData((prev) => ({ ...prev, closingDate: val }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="interestRate">Interest Rate (% p.a.)</label>
            <input
              type="number"
              step="any"
              min="0"
              id="interestRate"
              name="interestRate"
              className="form-input"
              placeholder="e.g. 7.25"
              value={fdFormData.interestRate}
              onChange={(e) => setFdFormData((prev) => ({ ...prev, interestRate: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="totalAmount">
              Total Amount / Maturity Value (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              id="totalAmount"
              name="totalAmount"
              className="form-input"
              placeholder="e.g. 53625"
              value={fdFormData.totalAmount}
              onChange={handleTotalAmountChange}
              required
            />
          </div>

          {/* Derived Duration & Suggested Amount Banner */}
          <div
            style={{
              gridColumn: '1 / -1',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div>
              <span>Calculated Duration: </span>
              <strong style={{ color: '#a5b4fc', fontSize: '0.95rem' }}>{currentDuration}</strong>
            </div>

            {suggestedTotal !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>Suggested Simple Interest Maturity: </span>
                <strong style={{ color: 'var(--success)', fontSize: '0.95rem' }}>
                  {formatCurrency(suggestedTotal)}
                </strong>
                <button
                  type="button"
                  onClick={handleApplySuggestedTotal}
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#f8fafc',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Use Estimate
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>
            Add Fixed Deposit
          </button>
        </form>
      </section>

      {/* Fixed Deposits Table Panel */}
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
          <h2 className="panel-title" style={{ margin: 0, fontSize: '1.25rem' }}>Fixed Deposits</h2>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>
              Active Principal:{' '}
              <strong style={{ color: '#818cf8' }}>{formatCurrency(totalActiveDeposited)}</strong>
            </span>
            <span>
              Active Maturity:{' '}
              <strong style={{ color: '#f59e0b' }}>{formatCurrency(totalActiveMaturity)}</strong>
            </span>
            <span>
              Total Credited:{' '}
              <strong style={{ color: 'var(--success)' }}>{formatCurrency(totalCreditedAmount)}</strong>
            </span>
          </div>
        </div>

        {fdEntries.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.5 }}>🏦</div>
            <p>No fixed deposits recorded yet. Use the form above to add an entry.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Details</th>
                  <th>Deposited Amount</th>
                  <th>Deposited Date</th>
                  <th>Closing Date</th>
                  <th>Interest Rate</th>
                  <th>Duration</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Active Fixed Deposits (Highlighted / Active) */}
                {activeEntries.map((entry) => (
                  <tr key={entry._id} className="fd-row-active">
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.details}</td>
                    <td style={{ fontWeight: 600, color: '#818cf8' }}>{formatCurrency(entry.depositedAmount)}</td>
                    <td>{formatDateDisplay(entry.depositedDate)}</td>
                    <td>{formatDateDisplay(entry.closingDate)}</td>
                    <td style={{ fontWeight: 500 }}>{entry.interestRate}% p.a.</td>
                    <td style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>
                      {calculateDuration(entry.depositedDate, entry.closingDate)}
                    </td>
                    <td style={{ fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(entry.totalAmount)}</td>
                    <td>
                      <span className="badge-status status-active">Active</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button className="btn-credit" onClick={() => handleMarkCredited(entry._id)}>
                          Mark as Credited
                        </button>
                        <button className="btn-delete" onClick={() => handleFDDelete(entry._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Credited Fixed Deposits (Greyed out / Muted) */}
                {creditedEntries.map((entry) => (
                  <tr key={entry._id} className="fd-row-credited">
                    <td style={{ fontWeight: 500 }}>{entry.details}</td>
                    <td style={{ fontWeight: 500 }}>{formatCurrency(entry.depositedAmount)}</td>
                    <td>{formatDateDisplay(entry.depositedDate)}</td>
                    <td>{formatDateDisplay(entry.closingDate)}</td>
                    <td>{entry.interestRate}% p.a.</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {calculateDuration(entry.depositedDate, entry.closingDate)}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(entry.totalAmount)}</td>
                    <td>
                      <span className="badge-status status-credited">Credited</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-delete" onClick={() => handleFDDelete(entry._id)}>
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

export default FixedDeposits;
