import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Logo from '../components/Logo';
import BudgetSummary from '../components/BudgetSummary';
import ExpenseHistory from '../components/ExpenseHistory';
import ExpensePieChart from '../components/ExpensePieChart';
import AddExpenseForm from '../components/AddExpenseForm';
import { useAuth } from '../context/AuthContext';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getBudget,
  setBudget,
} from '../services/expenseService';

export default function DashboardPage() {
  const { user, displayName, logout } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState(() => getExpenses(user?.id));
  const [budgetData, setBudgetData] = useState(() => getBudget(user?.id));
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const formSectionRef = useRef(null);

  // Re-sync if user ID updates
  useEffect(() => {
    setExpenses(getExpenses(user?.id));
    setBudgetData(getBudget(user?.id));
  }, [user?.id]);

  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses]);

  const handleAddExpense = (expData) => {
    addExpense(user?.id, expData);
    setExpenses(getExpenses(user?.id));
    setShowAddForm(false);
  };

  const handleUpdateExpense = (id, updates) => {
    updateExpense(user?.id, id, updates);
    setExpenses(getExpenses(user?.id));
    setEditingItem(null);
  };

  const handleDeleteExpense = (id) => {
    deleteExpense(user?.id, id);
    setExpenses(getExpenses(user?.id));
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
  };

  const handleStartEdit = (item) => {
    setEditingItem(item);
    setShowAddForm(true);
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleUpdateBudget = (newBudget) => {
    const updated = setBudget(user?.id, { ...budgetData, budget: newBudget });
    if (updated) setBudgetData(updated);
  };

  return (
    <AuthLayout wide>
      {/* Top Navbar */}
      <div className="dash-top">
        <Logo />
        <div className="dash-actions">
          <button
            type="button"
            className="btn auto add-btn-header"
            onClick={() => {
              if (editingItem) setEditingItem(null);
              setShowAddForm((prev) => !prev);
            }}
          >
            <Plus size={16} />
            <span>{showAddForm ? 'Close Form' : 'Add Expense'}</span>
            {showAddForm ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            type="button"
            className="btn secondary auto"
            onClick={async () => {
              await logout();
              navigate('/', { replace: true });
            }}
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Greeting & Header */}
      <div className="card-head dashboard-header-text">
        <h1>{displayName ? `${displayName}'s Expense Tracker` : 'Expense Tracking Dashboard'}</h1>
        <p>
          Day 1 of {budgetData.days}. Every rupee you track today is one you save tomorrow.
        </p>
      </div>

      {/* Summary Cards */}
      <BudgetSummary
        budget={budgetData.budget}
        days={budgetData.days}
        totalSpent={totalSpent}
        onUpdateBudget={handleUpdateBudget}
      />

      {/* Add / Edit Form Drawer */}
      <div ref={formSectionRef} className={`form-drawer ${showAddForm ? 'open' : ''}`}>
        {showAddForm && (
          <AddExpenseForm
            onAdd={handleAddExpense}
            onUpdate={handleUpdateExpense}
            editingItem={editingItem}
            onCancelEdit={handleCancelEdit}
          />
        )}
      </div>

      {/* Two Column Layout: Left (Expense History) & Right (Pie Chart) */}
      <div className="dashboard-two-col">
        {/* Left Side: Expense History */}
        <section className="dashboard-col left-col" aria-label="Expense History Section">
          <ExpenseHistory
            expenses={expenses}
            onEdit={handleStartEdit}
            onDelete={handleDeleteExpense}
            onStartAdd={() => setShowAddForm(true)}
          />
        </section>

        {/* Right Side: Expense Pie Chart */}
        <section className="dashboard-col right-col" aria-label="Category Distribution Section">
          <ExpensePieChart expenses={expenses} />
        </section>
      </div>
    </AuthLayout>
  );
}
