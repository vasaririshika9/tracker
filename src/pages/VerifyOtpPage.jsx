import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, ArrowLeft } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Logo from '../components/Logo';
import OtpInput from '../components/OtpInput';
import LoadingButton from '../components/LoadingButton';
import { sendOtp, verifyOtp, maskIdentifier, RESEND_COOLDOWN_SECONDS } from '../services/authService';

const readPending = () => { try { return JSON.parse(sessionStorage.getItem('paisa_pending')); } catch { return null; } };

export default function VerifyOtpPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const pending = state?.identifier ? state : readPending();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null); // { code, message }
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState('');
  const [mockCode, setMockCode] = useState(state?.mockCode);
  const [seconds, setSeconds] = useState(() => {
    const elapsed = Math.floor((Date.now() - (pending?.sentAt || Date.now())) / 1000);
    return Math.max(RESEND_COOLDOWN_SECONDS - elapsed, 0);
  });

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (!pending?.identifier) return <Navigate to="/" replace />;
  const { method, identifier, name } = pending;

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) { setError({ code: 'incomplete', message: 'Enter all 6 digits of your code.' }); return; }
    setError(null); setInfo(''); setVerifying(true);
    try {
      await verifyOtp({ method, identifier, token: otp });
      sessionStorage.removeItem('paisa_pending');
      navigate('/success', { replace: true });
    } catch (err) {
      setError({ code: err.code, message: err.message });
      if (err.code === 'invalid') setOtp('');
    } finally { setVerifying(false); }
  };

  const handleResend = async () => {
    if (resending || seconds > 0) return;
    setError(null); setInfo(''); setResending(true);
    try {
      const res = await sendOtp({ method, email: identifier, phone: identifier.replace('+91', ''), name });
      setMockCode(res.mockCode); setOtp(''); setSeconds(RESEND_COOLDOWN_SECONDS);
      sessionStorage.setItem('paisa_pending', JSON.stringify({ ...pending, sentAt: Date.now() }));
      setInfo('A new code is on its way.');
    } catch (err) {
      setError({ code: err.code, message: err.message });
      if (err.retryAfter && Number(err.retryAfter) > 0) {
        setSeconds(Number(err.retryAfter));
      }
    } finally { setResending(false); }
  };

  const changeDetails = () => { sessionStorage.removeItem('paisa_pending'); navigate('/'); };

  return (
    <AuthLayout mockCode={mockCode}>
      <Logo />
      <div className="card-head">
        <h1>Verify it's you</h1>
        <p>Enter the 6-digit code sent to <span className="sent-to">{maskIdentifier(method, identifier)}</span> by {method === 'email' ? 'email' : 'SMS'}.</p>
      </div>

      <form onSubmit={handleVerify} noValidate>
        <OtpInput value={otp} onChange={setOtp} disabled={verifying} invalid={!!error && error.code !== 'network' && error.code !== 'rate_limited'} />
        <div aria-live="polite">
          {error && (
            <div className="alert error" role="alert">
              <CircleAlert size={18} />
              <div>
                {error.message}
                {error.code === 'network' && <> <button type="button" className="link-btn" onClick={handleVerify}>Retry</button></>}
                {error.code === 'expired' && <> <button type="button" className="link-btn" onClick={handleResend} disabled={seconds > 0}>Get a new code</button></>}
              </div>
            </div>
          )}
          {info && !error && <div className="alert success" role="status">{info}</div>}
        </div>
        <LoadingButton type="submit" loading={verifying}>{verifying ? 'Verifying…' : 'Verify & Continue'}</LoadingButton>
      </form>

      <div className="row-between">
        <span>Didn't get it?</span>
        {seconds > 0
          ? <span>Resend in 0:{String(seconds).padStart(2, '0')}</span>
          : <button className="link-btn" onClick={handleResend} disabled={resending}>{resending ? 'Sending…' : 'Resend OTP'}</button>}
      </div>
      <button className="link-btn" onClick={changeDetails}><ArrowLeft size={14} style={{ verticalAlign: '-2px' }} /> Change email or phone number</button>
    </AuthLayout>
  );
}
