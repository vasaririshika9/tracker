import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Logo from '../components/Logo';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';
import { sendOtp, isConfigured, getSendCooldown } from '../services/authService';

export default function LoginPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(() => getSendCooldown());

  // Live countdown timer for rate-limit cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      const remaining = getSendCooldown();
      setCooldown(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  if (!authLoading && session) return <Navigate to="/success" replace />;

  const handleSubmit = async (values) => {
    if (loading || cooldown > 0) return; // Prevent duplicate concurrent submissions
    setError('');
    setLoading(true);
    try {
      const { identifier, mockCode } = await sendOtp(values);
      const pending = { method: values.method, identifier, name: values.name.trim(), sentAt: Date.now() };
      sessionStorage.setItem('paisa_pending', JSON.stringify(pending)); // non-secret; survives refresh
      navigate('/verify', { state: { ...pending, mockCode } });
    } catch (e) {
      setError(e.message);
      if (e.retryAfter && Number(e.retryAfter) > 0) {
        setCooldown(Number(e.retryAfter));
      } else {
        const cd = getSendCooldown();
        if (cd > 0) setCooldown(cd);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Logo />
      <div className="card-head">
        <h1>Your money journey starts here.</h1>
        <p>Sign in to make every rupee count.</p>
      </div>
      {!isConfigured && (
        <div className="alert warn" role="status">
          <TriangleAlert size={18} />
          <div><strong>Authentication isn't configured.</strong> Add your Supabase keys to <code>.env</code> (see the README) to send real OTPs.</div>
        </div>
      )}
      <LoginForm
        onSubmit={handleSubmit}
        loading={loading}
        serverError={error}
        cooldown={cooldown}
      />
    </AuthLayout>
  );
}
