import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import LoadingButton from '../components/LoadingButton';
import { useAuth } from '../context/AuthContext';

export default function SuccessPage() {
  const { displayName, user, logout } = useAuth();
  const navigate = useNavigate();
  const who = displayName || user?.email || user?.phone;

  const handleLogout = async () => { await logout(); navigate('/', { replace: true }); };

  return (
    <AuthLayout>
      <div className="center">
        <div className="check" aria-hidden="true">
          <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" /><path d="M16 27l7 7 14-15" /></svg>
        </div>
        <div className="card-head" style={{ marginTop: 0 }}>
          <h1>You're in!</h1>
          <p>Welcome to Paisa. Let's make your money work smarter.</p>
          {who && <p style={{ marginTop: 12, color: 'var(--color-text)', fontWeight: 600 }}>{displayName ? `Hi, ${displayName}` : `Signed in as ${who}`}</p>}
        </div>
        <div className="challenge">
          <h2><Target size={18} /> Your challenge</h2>
          <div className="big">₹10,000 / 30 days</div>
          <p>Plan every rupee for the next 30 days and see how much you can save.</p>
        </div>
        <div className="stack">
          <LoadingButton onClick={() => navigate('/dashboard')}>Go to Dashboard</LoadingButton>
          <LoadingButton variant="secondary" onClick={handleLogout}>Log out</LoadingButton>
        </div>
      </div>
    </AuthLayout>
  );
}
