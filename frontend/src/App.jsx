import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle
} from 'docx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CATEGORIES = [
  'Food',
  'Travel',
  'Bills',
  'Shopping',
  'Education',
  'Health',
  'Salary',
  'Other'
];

const COLORS = {
  Food: '#6366F1',      // Indigo
  Travel: '#3B82F6',    // Blue
  Bills: '#A855F7',     // Purple
  Shopping: '#EC4899',  // Pink
  Education: '#14B8A6', // Teal
  Health: '#F43F5E',    // Rose
  Salary: '#10B981',    // Emerald
  Other: '#64748B'      // Slate
};

// Custom Date Picker component (DD / MM / YYYY)
function CustomDatePicker({ value, onChange, onBlur, id, className, autoFocus }) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const lastSentValue = useRef('');

  // Sync internal state with external YYYY-MM-DD value
  useEffect(() => {
    if (value === lastSentValue.current) {
      return;
    }
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parts[0] === '0000' ? '' : parts[0];
        const m = parts[1] === '00' ? '' : parts[1];
        const d = parts[2] === '00' ? '' : parts[2];
        
        setYear(y || '');
        setMonth(m || '');
        setDay(d || '');
        lastSentValue.current = value;
        return;
      }
    }
    setYear('');
    setMonth('');
    setDay('');
    lastSentValue.current = '';
  }, [value]);

  // Combine fields and call parent onChange
  const updateParent = (d, m, y) => {
    let combined = '';
    if (d || m || y) {
      const formattedY = y.padEnd(4, '0').slice(0, 4);
      const formattedM = m.padStart(2, '0').slice(0, 2);
      const formattedD = d.padStart(2, '0').slice(0, 2);
      combined = `${formattedY}-${formattedM}-${formattedD}`;
    }
    lastSentValue.current = combined;
    onChange(combined);
  };

  const validateAndFormat = (d, m, y) => {
    let cleanDay = d;
    let cleanMonth = m;
    let cleanYear = y;

    if (d) {
      const numericDay = parseInt(d, 10);
      if (isNaN(numericDay) || numericDay < 1) cleanDay = '01';
      else if (numericDay > 31) cleanDay = '31';
      else cleanDay = String(numericDay).padStart(2, '0');
    }
    if (m) {
      const numericMonth = parseInt(m, 10);
      if (isNaN(numericMonth) || numericMonth < 1) cleanMonth = '01';
      else if (numericMonth > 12) cleanMonth = '12';
      else cleanMonth = String(numericMonth).padStart(2, '0');
    }
    if (y) {
      const numericYear = parseInt(y, 10);
      if (isNaN(numericYear) || numericYear < 1900) cleanYear = '1900';
      else if (numericYear > 2100) cleanYear = '2100';
      else cleanYear = String(numericYear);
    }

    return { cleanDay, cleanMonth, cleanYear };
  };

  // Check if focus has left the custom date picker container entirely
  const handleContainerBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      const { cleanDay, cleanMonth, cleanYear } = validateAndFormat(day, month, year);
      
      setDay(cleanDay);
      setMonth(cleanMonth);
      setYear(cleanYear);

      let combined = '';
      if (cleanDay || cleanMonth || cleanYear) {
        combined = `${cleanYear.padEnd(4, '0')}-${cleanMonth.padStart(2, '0')}-${cleanDay.padStart(2, '0')}`;
      }
      
      lastSentValue.current = combined;
      onBlur?.(combined);
    }
  };

  const handleDayChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Digits only
    if (val.length <= 2) {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 31) {
        return;
      }
      setDay(val);
      updateParent(val, month, year);
      if (val.length === 2) {
        monthRef.current?.focus();
      }
    }
  };

  const handleMonthChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 2) {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 12) {
        return;
      }
      setMonth(val);
      updateParent(day, val, year);
      if (val.length === 2) {
        yearRef.current?.focus();
      }
    }
  };

  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 4) {
      setYear(val);
      updateParent(day, month, val);
    }
  };

  const handleKeyDown = (field, e) => {
    if (e.key === 'Backspace') {
      if (field === 'month' && !month) {
        dayRef.current?.focus();
      } else if (field === 'year' && !year) {
        monthRef.current?.focus();
      }
    } else if (e.key === 'Enter') {
      const { cleanDay, cleanMonth, cleanYear } = validateAndFormat(day, month, year);
      setDay(cleanDay);
      setMonth(cleanMonth);
      setYear(cleanYear);
      
      let combined = '';
      if (cleanDay || cleanMonth || cleanYear) {
        combined = `${cleanYear.padEnd(4, '0')}-${cleanMonth.padStart(2, '0')}-${cleanDay.padStart(2, '0')}`;
      }
      
      lastSentValue.current = combined;
      onChange(combined);
      onBlur?.(combined);
    } else if (e.key === 'Escape') {
      onBlur?.(value);
    } else if (field === 'year') {
      const isDigit = /^[0-9]$/.test(e.key);
      const isSelectionActive = e.target.selectionStart !== e.target.selectionEnd;
      if (year.length >= 4 && isDigit && !isSelectionActive) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className={`custom-date-picker ${className || ''}`} id={id} onBlur={handleContainerBlur}>
      <input
        ref={dayRef}
        type="text"
        placeholder="DD"
        value={day}
        onChange={handleDayChange}
        onKeyDown={(e) => handleKeyDown('day', e)}
        className="date-input-field day-input"
        maxLength={2}
        autoFocus={autoFocus}
      />
      <span className="date-separator">/</span>
      <input
        ref={monthRef}
        type="text"
        placeholder="MM"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={(e) => handleKeyDown('month', e)}
        className="date-input-field month-input"
        maxLength={2}
      />
      <span className="date-separator">/</span>
      <input
        ref={yearRef}
        type="text"
        placeholder="YYYY"
        value={year}
        onChange={handleYearChange}
        onKeyDown={(e) => handleKeyDown('year', e)}
        className="date-input-field year-input"
        maxLength={4}
      />
    </div>
  );
}

function App() {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    details: '',
    category: 'Other',
    debited: '',
    credited: ''
  });
  const [activeTab, setActiveTab] = useState('ledger');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [insightMonth, setInsightMonth] = useState(new Date().getMonth());
  const [insightYear, setInsightYear] = useState(new Date().getFullYear());
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Collapsible Grouping State
  const [expandedYears, setExpandedYears] = useState({ [new Date().getFullYear()]: true });
  const [expandedMonths, setExpandedMonths] = useState({});

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
    if (!formData.date || formData.date.startsWith('0000') || formData.date.includes('-00') || !formData.details) {
      alert('Please enter a valid complete date (DD / MM / YYYY) and details.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          details: formData.details,
          category: formData.category || 'Other',
          debited: formData.debited ? Number(formData.debited) : 0,
          credited: formData.credited ? Number(formData.credited) : 0
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create entry.');
      }

      setFormData({ date: '', details: '', category: 'Other', debited: '', credited: '' });
      fetchEntries();
    } catch (err) {
      alert(err.message);
    }
  };

  // Activate edit mode for a cell
  const handleCellClick = (entry, field, value) => {
    let val = value;
    if (field === 'date' && value) {
      val = new Date(value).toISOString().split('T')[0];
    }
    setEditingCell({ id: entry._id, field });
    setEditValue(val !== undefined && val !== null ? val : '');
  };

  // Save changes and trigger balance recalculation
  const handleSaveCell = async (id, field, value) => {
    const entry = entries.find((e) => e._id === id);
    if (!entry) return;

    // Validation
    if (field === 'details' && !String(value).trim()) {
      alert('Details cannot be empty.');
      setEditingCell(null);
      return;
    }
    if (field === 'date' && (!value || value.startsWith('0000') || value.includes('-00'))) {
      alert('Please enter a valid complete date (DD / MM / YYYY).');
      setEditingCell(null);
      return;
    }

    const updatedBody = {
      date: field === 'date' ? value : entry.date,
      details: field === 'details' ? value : entry.details,
      category: field === 'category' ? value : entry.category,
      debited: field === 'debited' ? Number(value || 0) : entry.debited,
      credited: field === 'credited' ? Number(value || 0) : entry.credited
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
      handleSaveCell(id, field, editValue);
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

  // Format currency
  const formatCurrency = (val) => {
    const formattedNum = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0);
    return `₹${formattedNum}`;
  };

  // Format date display
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

  // Toggle year collapse/expansion and its nested months
  const toggleYear = (y, groupedEntries) => {
    const isYearExpanded = !!expandedYears[y];
    setExpandedYears((prev) => ({ ...prev, [y]: !isYearExpanded }));

    // Collapses/expands all its months
    const monthsInYear = Object.keys(groupedEntries[y] || {});
    setExpandedMonths((prev) => {
      const updated = { ...prev };
      monthsInYear.forEach((mIdx) => {
        updated[`${y}-${mIdx}`] = !isYearExpanded;
      });
      return updated;
    });
  };

  // Toggle single month expansion
  const toggleMonth = (y, m) => {
    const key = `${y}-${m}`;
    setExpandedMonths((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Global totals (overall ledger)
  const totalBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;
  const totalCredited = entries.reduce((acc, curr) => acc + (curr.credited || 0), 0);
  const totalDebited = entries.reduce((acc, curr) => acc + (curr.debited || 0), 0);

  // Dynamic years list for selector
  const uniqueYears = Array.from(new Set(entries.map(e => new Date(e.date).getUTCFullYear())));
  if (!uniqueYears.includes(new Date().getFullYear())) {
    uniqueYears.push(new Date().getFullYear());
  }
  uniqueYears.sort((a, b) => b - a);

  // Monthly stats logic (based on selectedMonth and selectedYear)
  const monthlyEntries = entries.filter((entry) => {
    const d = new Date(entry.date);
    return d.getUTCFullYear() === Number(selectedYear) && d.getUTCMonth() === Number(selectedMonth);
  });

  const monthlyCredited = monthlyEntries.reduce((acc, curr) => acc + (curr.credited || 0), 0);
  const monthlyDebited = monthlyEntries.reduce((acc, curr) => acc + (curr.debited || 0), 0);
  const monthlyBalance = monthlyCredited - monthlyDebited;

  // Yearly totals logic (for selectedYear)
  const yearlyEntries = entries.filter((entry) => {
    const d = new Date(entry.date);
    return d.getUTCFullYear() === Number(selectedYear);
  });

  const yearlyCredited = yearlyEntries.reduce((acc, curr) => acc + (curr.credited || 0), 0);
  const yearlyDebited = yearlyEntries.reduce((acc, curr) => acc + (curr.debited || 0), 0);
  const yearlyBalance = yearlyCredited - yearlyDebited;

  // Yearly data array (12 months list for selectedYear)
  const yearlyData = MONTHS.map((monthName, index) => {
    const monthEntries = entries.filter((entry) => {
      const d = new Date(entry.date);
      return d.getUTCFullYear() === Number(selectedYear) && d.getUTCMonth() === index;
    });

    const credited = monthEntries.reduce((acc, curr) => acc + (curr.credited || 0), 0);
    const debited = monthEntries.reduce((acc, curr) => acc + (curr.debited || 0), 0);
    const balance = credited - debited;

    return {
      monthName,
      credited,
      debited,
      balance
    };
  });

  // --- Filtering Logic (AND logic) ---
  const filteredEntries = entries.filter((entry) => {
    // Details search (case-insensitive, partial match)
    if (searchQuery.trim()) {
      const match = entry.details && entry.details.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }

    // Date range filter
    const isStartDateValid = startDate && !startDate.startsWith('0000') && !startDate.includes('-00');
    const isEndDateValid = endDate && !endDate.startsWith('0000') && !endDate.includes('-00');

    if (isStartDateValid) {
      const dStr = new Date(entry.date).toISOString().split('T')[0];
      if (dStr < startDate) return false;
    }
    if (isEndDateValid) {
      const dStr = new Date(entry.date).toISOString().split('T')[0];
      if (dStr > endDate) return false;
    }

    // Category filter
    if (filterCategory !== 'All') {
      if (entry.category !== filterCategory) return false;
    }

    return true;
  });

  const isStartDateActive = startDate && !startDate.startsWith('0000') && !startDate.includes('-00');
  const isEndDateActive = endDate && !endDate.startsWith('0000') && !endDate.includes('-00');
  const isFilterActive = !!searchQuery.trim() || !!isStartDateActive || !!isEndDateActive || filterCategory !== 'All';

  // --- Grouping Logic for Collapsible View ---
  const groupedEntries = {}; // y -> m -> entries list
  filteredEntries.forEach((entry) => {
    const d = new Date(entry.date);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    if (!groupedEntries[y]) groupedEntries[y] = {};
    if (!groupedEntries[y][m]) groupedEntries[y][m] = [];
    groupedEntries[y][m].push(entry);
  });

  const sortedYears = Object.keys(groupedEntries).map(Number).sort((a, b) => b - a);

  // --- Category Insights Calculations (Monthly) ---
  const insightEntries = entries.filter((entry) => {
    const d = new Date(entry.date);
    return d.getUTCFullYear() === Number(insightYear) && d.getUTCMonth() === Number(insightMonth);
  });

  const categorySpendsMap = {};
  insightEntries.forEach((entry) => {
    if (entry.debited > 0) {
      const cat = entry.category || 'Other';
      categorySpendsMap[cat] = (categorySpendsMap[cat] || 0) + entry.debited;
    }
  });

  const totalInsightDebited = Object.values(categorySpendsMap).reduce((sum, val) => sum + val, 0);

  // Only include categories with non-zero debited totals and sort highest to lowest spend
  const chartData = Object.keys(categorySpendsMap)
    .map((cat) => {
      const amount = categorySpendsMap[cat];
      const percentage = totalInsightDebited > 0 ? ((amount / totalInsightDebited) * 100).toFixed(1) : '0';
      return {
        name: cat,
        value: amount,
        percentage
      };
    })
    .sort((a, b) => b.value - a.value);

  // Table Render Helper
  const renderTable = (entriesList) => (
    <table className="ledger-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Details</th>
          <th>Category</th>
          <th>Debited</th>
          <th>Credited</th>
          <th>Balance</th>
          <th style={{ textAlign: 'center' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {entriesList.map((entry) => (
          <tr key={entry._id}>
            {/* Date */}
            <td className="editable-cell" onClick={() => handleCellClick(entry, 'date', entry.date)}>
              {editingCell && editingCell.id === entry._id && editingCell.field === 'date' ? (
                <CustomDatePicker
                  className="cell-edit-input"
                  value={editValue}
                  onChange={setEditValue}
                  onBlur={(val) => handleSaveCell(entry._id, 'date', val)}
                  autoFocus
                />
              ) : (
                formatDateDisplay(entry.date)
              )}
            </td>

            {/* Details */}
            <td className="editable-cell" onClick={() => handleCellClick(entry, 'details', entry.details)}>
              {editingCell && editingCell.id === entry._id && editingCell.field === 'details' ? (
                <input
                  type="text"
                  className="cell-edit-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveCell(entry._id, 'details', editValue)}
                  onKeyDown={(e) => handleKeyDown(e, entry._id, 'details')}
                  autoFocus
                />
              ) : (
                entry.details
              )}
            </td>

            {/* Category */}
            <td className="editable-cell" onClick={() => handleCellClick(entry, 'category', entry.category)}>
              {editingCell && editingCell.id === entry._id && editingCell.field === 'category' ? (
                <select
                  className="cell-edit-input"
                  style={{ appearance: 'auto' }}
                  value={editValue}
                  onChange={(e) => {
                    setEditValue(e.target.value);
                    handleSaveCell(entry._id, 'category', e.target.value);
                  }}
                  onBlur={() => handleSaveCell(entry._id, 'category', editValue)}
                  autoFocus
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                entry.category || 'Other'
              )}
            </td>

            {/* Debited */}
            <td className="editable-cell text-debit" onClick={() => handleCellClick(entry, 'debited', entry.debited)}>
              {editingCell && editingCell.id === entry._id && editingCell.field === 'debited' ? (
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="cell-edit-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveCell(entry._id, 'debited', editValue)}
                  onKeyDown={(e) => handleKeyDown(e, entry._id, 'debited')}
                  autoFocus
                />
              ) : (
                entry.debited > 0 ? formatCurrency(entry.debited) : '-'
              )}
            </td>

            {/* Credited */}
            <td className="editable-cell text-credit" onClick={() => handleCellClick(entry, 'credited', entry.credited)}>
              {editingCell && editingCell.id === entry._id && editingCell.field === 'credited' ? (
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="cell-edit-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveCell(entry._id, 'credited', editValue)}
                  onKeyDown={(e) => handleKeyDown(e, entry._id, 'credited')}
                  autoFocus
                />
              ) : (
                entry.credited > 0 ? formatCurrency(entry.credited) : '-'
              )}
            </td>

            {/* Balance */}
            <td className={entry.balance >= 0 ? 'text-balance-positive' : 'text-balance-negative'}>
              {formatCurrency(entry.balance)}
            </td>

            {/* Delete */}
            <td style={{ textAlign: 'center' }}>
              <button className="btn-delete" onClick={() => handleDelete(entry._id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const exportToPDF = () => {
    const doc = new jsPDF();

    const formatCurrencyPDF = (val) => {
      const formattedNum = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val || 0);
      return `Rs. ${formattedNum}`;
    };

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Expense Ledger Report', 14, 20);

    // Meta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const todayStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    doc.text(`Exported On: ${todayStr}`, 14, 28);

    let filterMeta = 'Filters: None';
    const filterParts = [];
    if (searchQuery.trim()) filterParts.push(`Search: "${searchQuery}"`);
    if (isStartDateActive) filterParts.push(`From: ${startDate}`);
    if (isEndDateActive) filterParts.push(`To: ${endDate}`);
    if (filterCategory !== 'All') filterParts.push(`Category: ${filterCategory}`);
    if (filterParts.length > 0) filterMeta = `Filters: ${filterParts.join(' | ')}`;
    doc.text(filterMeta, 14, 34);

    // Format headers and data
    const headers = [['Date', 'Details', 'Category', 'Debited', 'Credited', 'Balance']];
    const data = filteredEntries.map((entry) => {
      let dateStr = '';
      if (entry.date) {
        const d = new Date(entry.date);
        const dayVal = String(d.getUTCDate()).padStart(2, '0');
        const monthVal = String(d.getUTCMonth() + 1).padStart(2, '0');
        const yearVal = d.getUTCFullYear();
        dateStr = `${dayVal}-${monthVal}-${yearVal}`;
      }
      return [
        dateStr,
        entry.details || '',
        entry.category || 'Other',
        entry.debited > 0 ? formatCurrencyPDF(entry.debited) : '-',
        entry.credited > 0 ? formatCurrencyPDF(entry.credited) : '-',
        formatCurrencyPDF(entry.balance)
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: headers,
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // Indigo-600
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 26 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    const exportCredited = filteredEntries.reduce((sum, e) => sum + (e.credited || 0), 0);
    const exportDebited = filteredEntries.reduce((sum, e) => sum + (e.debited || 0), 0);
    const exportNet = exportCredited - exportDebited;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);

    doc.text(`Total Credited: ${formatCurrencyPDF(exportCredited)}`, 14, finalY);
    doc.text(`Total Debited: ${formatCurrencyPDF(exportDebited)}`, 14, finalY + 7);
    doc.text(`Net Balance: ${formatCurrencyPDF(exportNet)}`, 14, finalY + 14);

    const fileDateStr = new Date().toISOString().split('T')[0];
    doc.save(`expense-ledger-${fileDateStr}.pdf`);
  };

  const exportToWord = async () => {
    const todayStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    let filterMeta = 'Filters: None';
    const filterParts = [];
    if (searchQuery.trim()) filterParts.push(`Search: "${searchQuery}"`);
    if (isStartDateActive) filterParts.push(`From: ${startDate}`);
    if (isEndDateActive) filterParts.push(`To: ${endDate}`);
    if (filterCategory !== 'All') filterParts.push(`Category: ${filterCategory}`);
    if (filterParts.length > 0) filterMeta = `Filters: ${filterParts.join(' | ')}`;

    const tableHeaderRow = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true, color: 'ffffff' })] })], shading: { fill: '4f46e5' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Details', bold: true, color: 'ffffff' })] })], shading: { fill: '4f46e5' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Category', bold: true, color: 'ffffff' })] })], shading: { fill: '4f46e5' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Debited', bold: true, color: 'ffffff' })] })], shading: { fill: '4f46e5' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Credited', bold: true, color: 'ffffff' })] })], shading: { fill: '4f46e5' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Balance', bold: true, color: 'ffffff' })] })], shading: { fill: '4f46e5' } }),
      ]
    });

    const dataRows = filteredEntries.map((entry) => {
      let dateStr = '';
      if (entry.date) {
        const d = new Date(entry.date);
        const dayVal = String(d.getUTCDate()).padStart(2, '0');
        const monthVal = String(d.getUTCMonth() + 1).padStart(2, '0');
        const yearVal = d.getUTCFullYear();
        dateStr = `${dayVal}-${monthVal}-${yearVal}`;
      }

      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: dateStr })] }),
          new TableCell({ children: [new Paragraph({ text: entry.details || '' })] }),
          new TableCell({ children: [new Paragraph({ text: entry.category || 'Other' })] }),
          new TableCell({ children: [new Paragraph({ text: entry.debited > 0 ? formatCurrency(entry.debited) : '-', alignment: AlignmentType.RIGHT })] }),
          new TableCell({ children: [new Paragraph({ text: entry.credited > 0 ? formatCurrency(entry.credited) : '-', alignment: AlignmentType.RIGHT })] }),
          new TableCell({ children: [new Paragraph({ text: formatCurrency(entry.balance), alignment: AlignmentType.RIGHT })] })
        ]
      });
    });

    const docTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [tableHeaderRow, ...dataRows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'e2e8f0' },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'e2e8f0' }
      }
    });

    const exportCredited = filteredEntries.reduce((sum, e) => sum + (e.credited || 0), 0);
    const exportDebited = filteredEntries.reduce((sum, e) => sum + (e.debited || 0), 0);
    const exportNet = exportCredited - exportDebited;

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Expense Ledger Report', bold: true, size: 32, color: '1e293b' })],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({
              children: [new TextRun({ text: `Exported On: ${todayStr}`, color: '64748b', size: 20 })],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({
              children: [new TextRun({ text: filterMeta, color: '64748b', size: 18 })],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: '' }),
            docTable,
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [new TextRun({ text: 'Report Summary', bold: true, size: 24, color: '1e293b' })]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Total Credited (Income): ', bold: true, color: '10b981' }),
                new TextRun({ text: formatCurrency(exportCredited) })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Total Debited (Expenses): ', bold: true, color: 'ef4444' }),
                new TextRun({ text: formatCurrency(exportDebited) })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Net Balance: ', bold: true, color: exportNet >= 0 ? '10b981' : 'ef4444' }),
                new TextRun({ text: formatCurrency(exportNet), bold: true })
              ]
            })
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileDateStr = new Date().toISOString().split('T')[0];
    a.download = `expense-ledger-${fileDateStr}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Zen-Ledger</h1>
        <p className="app-subtitle">A premium personal finance ledger & expense tracker</p>
      </header>

      {/* Tab Switcher */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          Ledger View
        </button>
        <button
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          Category Insights
        </button>
      </div>

      {activeTab === 'ledger' ? (
        <>
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
                <CustomDatePicker
                  id="date"
                  className="form-input-date-container"
                  value={formData.date}
                  onChange={(val) => setFormData((prev) => ({ ...prev, date: val }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="details">Details</label>
                <input
                  type="text"
                  id="details"
                  name="details"
                  className="form-input"
                  placeholder="e.g. Groceries, Salary"
                  value={formData.details}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  className="form-input"
                  style={{ appearance: 'auto', paddingRight: '2rem' }}
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="debited">Debited</label>
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
                <label className="form-label" htmlFor="credited">Credited</label>
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

          {/* Search & Filter Section */}
          <section className="form-panel" style={{ padding: '1.5rem', position: 'relative', zIndex: 10 }}>
            <h2 className="panel-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Search & Filter Transactions</h2>
            <div className="filter-bar">
              <div className="form-group" style={{ flex: 2, minWidth: '220px' }}>
                <label className="form-label">Search Details</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">From Date</label>
                <CustomDatePicker
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">To Date</label>
                <CustomDatePicker
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  style={{ appearance: 'auto', paddingRight: '2rem' }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '150px', alignSelf: 'flex-end', position: 'relative' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0 0.75rem' }}
                >
                  📥 Export
                </button>
                {showExportMenu && (
                  <div className="export-dropdown-menu">
                    <button type="button" className="dropdown-item" onClick={() => { exportToPDF(); setShowExportMenu(false); }}>
                      Export as PDF
                    </button>
                    <button type="button" className="dropdown-item" onClick={() => { exportToWord(); setShowExportMenu(false); }}>
                      Export as Word (.docx)
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  setSearchQuery('');
                  setStartDate('');
                  setEndDate('');
                  setFilterCategory('All');
                }}
                style={{ alignSelf: 'flex-end', height: '42px', padding: '0 1rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
              >
                Clear
              </button>
            </div>
          </section>

          {/* Error messages */}
          {error && (
            <div style={{ color: 'var(--danger)', padding: '1rem', background: 'var(--danger-glow)', borderRadius: '10px', border: '1px solid var(--danger)' }}>
              {error}
            </div>
          )}

          {/* Ledger Table / Collapsible tree Section */}
          {loading && entries.length === 0 ? (
            <section className="table-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading financial ledger...
            </section>
          ) : filteredEntries.length === 0 ? (
            <section className="table-panel">
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No matching transactions found.</p>
              </div>
            </section>
          ) : isFilterActive ? (
            /* ACTIVE FILTERS: Flat table layout */
            <div className="table-panel">
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="panel-title" style={{ margin: 0, fontSize: '1.1rem' }}>Filtered Results ({filteredEntries.length})</h2>
              </div>
              <div className="table-responsive">
                {renderTable(filteredEntries)}
              </div>
            </div>
          ) : (
            /* INACTIVE FILTERS: Collapsible Year -> Month grouping */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sortedYears.map((year) => {
                const isYearExpanded = !!expandedYears[year];
                const yearMonths = Object.keys(groupedEntries[year]).map(Number).sort((a, b) => b - a);

                return (
                  <div key={year} className="year-section">
                    <div className="year-header" onClick={() => toggleYear(year, groupedEntries)}>
                      <span className="year-title">{year}</span>
                      <span className="year-toggle-icon" style={{ transform: isYearExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>
                        ▶
                      </span>
                    </div>

                    {isYearExpanded && (
                      <div className="year-body">
                        {yearMonths.map((mIdx) => {
                          const isMonthExpanded = !!expandedMonths[`${year}-${mIdx}`];
                          const monthEntries = groupedEntries[year][mIdx];

                          const mCredited = monthEntries.reduce((sum, e) => sum + (e.credited || 0), 0);
                          const mDebited = monthEntries.reduce((sum, e) => sum + (e.debited || 0), 0);
                          const mBalance = mCredited - mDebited;

                          return (
                            <div key={mIdx} className="month-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div className="month-row" onClick={() => toggleMonth(year, mIdx)}>
                                <span className="month-name">{MONTHS[mIdx]}</span>
                                <div className="month-summary-metrics">
                                  <div className="month-metric text-credit">
                                    <span>Income:</span>
                                    <span>{mCredited > 0 ? formatCurrency(mCredited) : '-'}</span>
                                  </div>
                                  <div className="month-metric text-debit">
                                    <span>Expenses:</span>
                                    <span>{mDebited > 0 ? formatCurrency(mDebited) : '-'}</span>
                                  </div>
                                  <div className={`month-metric ${mBalance >= 0 ? 'text-balance-positive' : 'text-balance-negative'}`}>
                                    <span>Net:</span>
                                    <span>{formatCurrency(mBalance)}</span>
                                  </div>
                                </div>
                              </div>

                              {isMonthExpanded && (
                                <div className="month-body table-panel">
                                  <div className="table-responsive">
                                    {renderTable(monthEntries)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : activeTab === 'summary' ? (
        /* Summary Tab view */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Controls selector Bar */}
          <section className="form-panel" style={{ padding: '1.25rem 2rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label" htmlFor="select-month">Select Month</label>
                <select
                  id="select-month"
                  className="form-input"
                  style={{ appearance: 'auto', paddingRight: '2rem' }}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label" htmlFor="select-year">Select Year</label>
                <select
                  id="select-year"
                  className="form-input"
                  style={{ appearance: 'auto', paddingRight: '2rem' }}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Monthly stats for selected month */}
          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Monthly Income ({MONTHS[selectedMonth]})</span>
              <span className="stat-value credit">
                {formatCurrency(monthlyCredited)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Monthly Expenses ({MONTHS[selectedMonth]})</span>
              <span className="stat-value debit">
                {formatCurrency(monthlyDebited)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Net Monthly Balance</span>
              <span className={`stat-value ${monthlyBalance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
                {formatCurrency(monthlyBalance)}
              </span>
            </div>
          </section>

          {/* Yearly summary stats cards for the entire selected year */}
          <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
            <h2 className="panel-title" style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>This Year ({selectedYear})</h2>
            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Yearly Income</span>
                <span className="stat-value credit">
                  {formatCurrency(yearlyCredited)}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Yearly Expenses</span>
                <span className="stat-value debit">
                  {formatCurrency(yearlyDebited)}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Net Yearly Balance</span>
                <span className={`stat-value ${yearlyBalance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
                  {formatCurrency(yearlyBalance)}
                </span>
              </div>
            </section>
          </div>

          {/* Yearly summary table */}
          <section className="table-panel">
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="panel-title" style={{ margin: 0 }}>Yearly View — {selectedYear}</h2>
            </div>
            <div className="table-responsive">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Credited (Income)</th>
                    <th>Total Debited (Expenses)</th>
                    <th>Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((data, idx) => (
                    <tr key={idx} style={{ opacity: (data.credited > 0 || data.debited > 0) ? 1 : 0.65 }}>
                      <td style={{ fontWeight: 600 }}>{data.monthName}</td>
                      <td className="text-credit">{data.credited > 0 ? formatCurrency(data.credited) : '-'}</td>
                      <td className="text-debit">{data.debited > 0 ? formatCurrency(data.debited) : '-'}</td>
                      <td className={data.balance >= 0 ? 'text-balance-positive' : 'text-balance-negative'}>
                        {formatCurrency(data.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        /* Category Insights Tab view */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Controls Selector Bar */}
          <section className="form-panel" style={{ padding: '1.25rem 2rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label" htmlFor="insight-month">Select Month</label>
                <select
                  id="insight-month"
                  className="form-input"
                  style={{ appearance: 'auto', paddingRight: '2rem' }}
                  value={insightMonth}
                  onChange={(e) => setInsightMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label" htmlFor="insight-year">Select Year</label>
                <select
                  id="insight-year"
                  className="form-input"
                  style={{ appearance: 'auto', paddingRight: '2rem' }}
                  value={insightYear}
                  onChange={(e) => setInsightYear(Number(e.target.value))}
                >
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Chart Display Panel */}
          {chartData.length === 0 ? (
            <section className="table-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', opacity: 0.5 }}>📊</div>
              <p>No expenses found for {MONTHS[insightMonth]} {insightYear}. Add some expenses to view the category breakdown.</p>
            </section>
          ) : (
            <>
              {/* Split Layout: Donut Chart + Custom Legend */}
              <section className="form-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
                {/* Donut Chart */}
                <div style={{ width: '280px', height: '280px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.Other} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontFamily: 'var(--font-family)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center metrics overlay */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Total Spend</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{formatCurrency(totalInsightDebited)}</div>
                  </div>
                </div>

                {/* Custom Legend details */}
                <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.6rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.6rem' }}>
                    Expenses Breakdown
                  </h3>
                  {chartData.map((entry, index) => {
                    const color = COLORS[entry.name] || COLORS.Other;
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}44` }}></div>
                          <span style={{ fontWeight: 500 }}>{entry.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(entry.value)}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', width: '45px', textAlign: 'right' }}>{entry.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Sorted Category Table */}
              <section className="table-panel">
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                  <h2 className="panel-title" style={{ margin: 0, fontSize: '1.20rem' }}>Category Spend Ranking</h2>
                </div>
                <div className="table-responsive">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Total Debited (Expenses)</th>
                        <th>Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((data, idx) => (
                        <tr key={idx}>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[data.name] || COLORS.Other, boxShadow: `0 0 6px ${COLORS[data.name] || COLORS.Other}44` }}></div>
                            {data.name}
                          </td>
                          <td className="text-debit" style={{ fontWeight: 600 }}>{formatCurrency(data.value)}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{data.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
