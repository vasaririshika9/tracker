import { useState, useEffect } from 'react';
import { Plus, Check, X, Calendar, CreditCard, Tag } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS } from '../services/expenseService';
import CategoryIcon from './CategoryIcon';

export default function AddExpenseForm({ onAdd, onUpdate, editingItem, onCancelEdit }) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (editingItem) {
      setLabel(editingItem.label || '');
      setAmount(String(editingItem.amount || ''));
      setCategory(editingItem.category || 'Food');
      setPaymentMethod(editingItem.paymentMethod || 'UPI');
      setDate(editingItem.date || new Date().toISOString().split('T')[0]);
      setErr('');
    } else {
      setLabel('');
      setAmount('');
      setCategory('Food');
      setPaymentMethod('UPI');
      setDate(new Date().toISOString().split('T')[0]);
      setErr('');
    }
  }, [editingItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanLabel = label.trim();
    const numAmount = Number(amount);

    if (!cleanLabel) {
      setErr('Please name your expense (e.g., Groceries, Metro, Coffee).');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setErr('Enter a valid amount above ₹0.');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem.id, {
        label: cleanLabel,
        amount: numAmount,
        category,
        paymentMethod,
        date,
      });
      onCancelEdit();
    } else {
      onAdd({
        label: cleanLabel,
        amount: numAmount,
        category,
        paymentMethod,
        date,
      });
      setLabel('');
      setAmount('');
      setErr('');
    }
  };

  return (
    <form className="expense-form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-head-row">
        <h3>{editingItem ? 'Edit Expense' : 'Quick Add Expense'}</h3>
        {editingItem && (
          <button type="button" className="close-edit-btn" onClick={onCancelEdit}>
            <X size={16} /> Cancel
          </button>
        )}
      </div>

      {err && (
        <div className="alert error form-alert" role="alert">
          {err}
        </div>
      )}

      <div className="form-inputs-grid">
        {/* Name / Description */}
        <div className="field-group">
          <label htmlFor="exp-label">Description</label>
          <div className="input-wrap">
            <input
              id="exp-label"
              placeholder="e.g. Swiggy, Metro, Books"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (err) setErr('');
              }}
              autoFocus={!editingItem}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="field-group">
          <label htmlFor="exp-amount">Amount</label>
          <div className="input-wrap">
            <span className="prefix">₹</span>
            <input
              id="exp-amount"
              type="number"
              min="1"
              placeholder="250"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (err) setErr('');
              }}
            />
          </div>
        </div>

        {/* Category */}
        <div className="field-group">
          <label htmlFor="exp-category">
            <Tag size={13} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            Category
          </label>
          <div className="select-wrap">
            <select
              id="exp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Method */}
        <div className="field-group">
          <label htmlFor="exp-method">
            <CreditCard size={13} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            Payment
          </label>
          <div className="select-wrap">
            <select
              id="exp-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div className="field-group">
          <label htmlFor="exp-date">
            <Calendar size={13} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            Date
          </label>
          <div className="input-wrap">
            <input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-action-row">
        <button type="submit" className="btn auto add-exp-btn">
          {editingItem ? (
            <>
              <Check size={16} /> Update Expense
            </>
          ) : (
            <>
              <Plus size={16} /> Add Expense
            </>
          )}
        </button>
      </div>
    </form>
  );
}
