import { useState } from 'react';
import { Wallet, TrendingUp, PiggyBank, PieChart as PieIcon, AlertTriangle, Edit2, Check, X } from 'lucide-react';
import { formatINR } from '../services/expenseService';

export default function BudgetSummary({ budget, days, totalSpent, onUpdateBudget }) {
  const [editing, setEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(budget);

  const safeBudget = Math.max(Number(budget) || 0, 0);
  const remaining = safeBudget - totalSpent;
  const isOverBudget = safeBudget > 0 && totalSpent > safeBudget;

  const percentUsed = safeBudget > 0
    ? Math.min(Math.round((totalSpent / safeBudget) * 100), 999)
    : 0;

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const parsed = Number(newBudget);
    if (parsed > 0) {
      onUpdateBudget(parsed);
      setEditing(false);
    }
  };

  return (
    <div className="budget-summary-wrapper">
      {isOverBudget && (
        <div className="alert error budget-alert" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Budget Exceeded!</strong> You have spent {formatINR(totalSpent - safeBudget)} more than your planned budget of {formatINR(safeBudget)}.
          </div>
        </div>
      )}

      <div className="stats-grid">
        {/* Total Budget Card */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-icon-wrap" style={{ background: '#FFF0F5', color: '#E98DB5' }}>
              <Wallet size={18} />
            </span>
            <span className="summary-label">Total Budget</span>
            {!editing && (
              <button
                type="button"
                className="edit-budget-btn"
                title="Edit budget"
                onClick={() => {
                  setNewBudget(budget);
                  setEditing(true);
                }}
              >
                <Edit2 size={13} />
              </button>
            )}
          </div>
          {editing ? (
            <form onSubmit={handleSaveBudget} className="budget-edit-form">
              <div className="budget-input-wrap">
                <span className="prefix-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="budget-inline-input"
                />
              </div>
              <button type="submit" className="save-btn-mini" title="Save"><Check size={14} /></button>
              <button type="button" className="cancel-btn-mini" title="Cancel" onClick={() => setEditing(false)}><X size={14} /></button>
            </form>
          ) : (
            <strong className="summary-value">{formatINR(safeBudget)}</strong>
          )}
          <span className="summary-subtext">{days} days planning goal</span>
        </div>

        {/* Total Spent Card */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-icon-wrap" style={{ background: '#FDECEF', color: '#C8415F' }}>
              <TrendingUp size={18} />
            </span>
            <span className="summary-label">Total Spent</span>
          </div>
          <strong className="summary-value" style={{ color: isOverBudget ? 'var(--color-error)' : 'inherit' }}>
            {formatINR(totalSpent)}
          </strong>
          <span className="summary-subtext">Across all categories</span>
        </div>

        {/* Remaining Balance Card */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span
              className="summary-icon-wrap"
              style={{
                background: remaining >= 0 ? '#E8F6EF' : '#FDECEF',
                color: remaining >= 0 ? '#3A9D70' : '#C8415F',
              }}
            >
              <PiggyBank size={18} />
            </span>
            <span className="summary-label">Remaining Balance</span>
          </div>
          <strong
            className="summary-value"
            style={{ color: remaining < 0 ? 'var(--color-error)' : '#2E855D' }}
          >
            {remaining < 0 ? `-${formatINR(Math.abs(remaining))}` : formatINR(remaining)}
          </strong>
          <span className="summary-subtext">
            {remaining >= 0 ? 'Available to spend' : 'Over budget'}
          </span>
        </div>

        {/* Budget Used % Card */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-icon-wrap" style={{ background: '#FFF5F8', color: '#9D65C9' }}>
              <PieIcon size={18} />
            </span>
            <span className="summary-label">Budget Used</span>
          </div>
          <div className="summary-val-row">
            <strong className="summary-value">{percentUsed}%</strong>
            <span className={`status-pill ${isOverBudget ? 'danger' : percentUsed > 80 ? 'warn' : 'good'}`}>
              {isOverBudget ? 'Exceeded' : percentUsed > 80 ? 'Near limit' : 'On track'}
            </span>
          </div>
          <div className="progress-bar-sm" role="progressbar" aria-valuenow={percentUsed} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`progress-fill ${isOverBudget ? 'danger' : ''}`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
