import { useState, useMemo } from 'react';
import { Search, Filter, Trash2, Edit3, Calendar, CreditCard, Inbox, Plus } from 'lucide-react';
import { CATEGORIES, formatINR } from '../services/expenseService';
import CategoryIcon from './CategoryIcon';

export default function ExpenseHistory({
  expenses,
  onEdit,
  onDelete,
  onStartAdd,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  // Filtered expense list
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStartStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    return expenses.filter((item) => {
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesLabel = item.label?.toLowerCase().includes(term);
        const matchesCat = item.category?.toLowerCase().includes(term);
        if (!matchesLabel && !matchesCat) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Date filter
      if (dateFilter === 'Today' && item.date !== todayStr) return false;
      if (dateFilter === 'Week' && (!item.date || item.date < sevenDaysAgo)) return false;
      if (dateFilter === 'Month' && (!item.date || item.date < monthStartStr)) return false;

      return true;
    });
  }, [expenses, searchTerm, selectedCategory, dateFilter]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  return (
    <div className="history-card">
      <div className="history-header">
        <div>
          <h2>Expense History</h2>
          <p className="history-subtitle">
            Showing {filteredExpenses.length} of {expenses.length} records
          </p>
        </div>
        <div className="filter-total-pill">
          <span>Filter Total:</span>
          <strong>{formatINR(filteredTotal)}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="history-controls">
        <div className="search-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-selects-row">
          <div className="filter-chip-wrap">
            <Filter size={14} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-chip-wrap">
            <Calendar size={14} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date range"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Week">Last 7 Days</option>
              <option value="Month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="expenses-scroll-container">
        {filteredExpenses.length === 0 ? (
          <div className="empty-history-state">
            <Inbox size={38} className="empty-icon" />
            <p className="empty-title">
              {expenses.length === 0
                ? 'No expenses recorded yet'
                : 'No expenses match your filters'}
            </p>
            <p className="empty-desc">
              {expenses.length === 0
                ? 'Add your daily spending above to build your 30-day savings habit.'
                : 'Try clearing your search or category filter to see more expenses.'}
            </p>
            {expenses.length === 0 && onStartAdd && (
              <button
                type="button"
                className="btn auto add-first-btn"
                onClick={onStartAdd}
              >
                <Plus size={16} /> Add First Expense
              </button>
            )}
          </div>
        ) : (
          <ul className="expense-items-list" role="list">
            {filteredExpenses.map((item) => {
              const catObj = CATEGORIES.find((c) => c.id === item.category) || {
                color: '#E98DB5',
                label: item.category,
              };

              return (
                <li key={item.id} className="expense-list-item">
                  <div className="expense-item-left">
                    <span
                      className="cat-icon-badge"
                      style={{
                        backgroundColor: `${catObj.color}20`,
                        color: catObj.color,
                        borderColor: `${catObj.color}40`,
                      }}
                    >
                      <CategoryIcon category={item.category} size={18} color={catObj.color} />
                    </span>
                    <div className="expense-meta-info">
                      <span className="expense-name">{item.label}</span>
                      <div className="expense-tags-row">
                        <span className="tag-category" style={{ color: catObj.color }}>
                          {catObj.label || item.category}
                        </span>
                        {item.paymentMethod && (
                          <span className="tag-payment">
                            <CreditCard size={11} style={{ verticalAlign: '-1px', marginRight: 3 }} />
                            {item.paymentMethod}
                          </span>
                        )}
                        <span className="tag-date">
                          {item.date} {item.time && `• ${item.time}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="expense-item-right">
                    <strong className="expense-amount">{formatINR(item.amount)}</strong>
                    <div className="item-actions">
                      <button
                        type="button"
                        className="action-icon-btn edit"
                        title="Edit expense"
                        onClick={() => onEdit(item)}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="action-icon-btn delete"
                        title="Delete expense"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
