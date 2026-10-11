/**
 * Expense Service — Handles expense storage and budget management.
 * Persists expenses per user in localStorage, isolated by user ID.
 */

const DEFAULT_BUDGET = 10000;
const DEFAULT_DAYS = 30;

export const CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', icon: 'Utensils', color: '#E98DB5' },
  { id: 'Transport', label: 'Transport', icon: 'Car', color: '#9D65C9' },
  { id: 'Shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#FF75A0' },
  { id: 'Entertainment', label: 'Entertainment', icon: 'Film', color: '#FA82C1' },
  { id: 'Education', label: 'Education', icon: 'GraduationCap', color: '#4E9F3D' },
  { id: 'Bills', label: 'Bills & Utilities', icon: 'Receipt', color: '#3B82F6' },
  { id: 'Health', label: 'Health & Fitness', icon: 'HeartPulse', color: '#F43F5E' },
  { id: 'Other', label: 'Other', icon: 'MoreHorizontal', color: '#887680' },
];

export const PAYMENT_METHODS = ['UPI', 'Card', 'Cash', 'Net Banking'];

const getStorageKey = (userId) => `paisa_expenses_${userId || 'guest'}`;
const getBudgetKey = (userId) => `paisa_budget_${userId || 'guest'}`;

export function getExpenses(userId) {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Error reading expenses from storage:', err);
    return [];
  }
}

export function saveExpenses(userId, expenses) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(expenses));
    return true;
  } catch (err) {
    console.error('Error saving expenses to storage:', err);
    return false;
  }
}

export function addExpense(userId, { label, amount, category = 'Food', paymentMethod = 'UPI', date }) {
  const current = getExpenses(userId);
  const now = new Date();
  const validAmount = Math.max(0, Number(amount) || 0);
  const validCategory = CATEGORIES.some((c) => c.id === category) ? category : 'Other';
  const validMethod = PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'UPI';

  const newExpense = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    label: String(label || 'Untitled').trim(),
    amount: validAmount,
    category: validCategory,
    paymentMethod: validMethod,
    date: date || now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    createdAt: now.getTime(),
  };
  const updated = [newExpense, ...current];
  saveExpenses(userId, updated);
  return newExpense;
}

export function updateExpense(userId, id, updates) {
  const current = getExpenses(userId);
  const updated = current.map((item) => {
    if (item.id === id) {
      const nextAmount = updates.amount !== undefined ? Math.max(0, Number(updates.amount) || 0) : item.amount;
      const nextCategory = updates.category !== undefined && CATEGORIES.some((c) => c.id === updates.category)
        ? updates.category
        : item.category;
      const nextMethod = updates.paymentMethod !== undefined && PAYMENT_METHODS.includes(updates.paymentMethod)
        ? updates.paymentMethod
        : item.paymentMethod;

      return {
        ...item,
        ...updates,
        amount: nextAmount,
        category: nextCategory,
        paymentMethod: nextMethod,
        label: (updates.label !== undefined ? String(updates.label) : item.label).trim(),
      };
    }
    return item;
  });
  saveExpenses(userId, updated);
  return updated;
}

export function deleteExpense(userId, id) {
  const current = getExpenses(userId);
  const updated = current.filter((item) => item.id !== id);
  saveExpenses(userId, updated);
  return updated;
}

export function getBudget(userId) {
  try {
    const raw = localStorage.getItem(getBudgetKey(userId));
    if (!raw) return { budget: DEFAULT_BUDGET, days: DEFAULT_DAYS };
    const parsed = JSON.parse(raw);
    return {
      budget: Math.max(0, Number(parsed.budget) || DEFAULT_BUDGET),
      days: Math.max(1, Number(parsed.days) || DEFAULT_DAYS),
    };
  } catch {
    return { budget: DEFAULT_BUDGET, days: DEFAULT_DAYS };
  }
}

export function setBudget(userId, budgetData) {
  try {
    const safeData = {
      budget: Math.max(0, Number(budgetData?.budget) || DEFAULT_BUDGET),
      days: Math.max(1, Number(budgetData?.days) || DEFAULT_DAYS),
    };
    localStorage.setItem(getBudgetKey(userId), JSON.stringify(safeData));
    return safeData;
  } catch (err) {
    console.error('Error saving budget to storage:', err);
    return null;
  }
}

export const formatINR = (num) => {
  const val = Number(num) || 0;
  return `₹${val.toLocaleString('en-IN')}`;
};
