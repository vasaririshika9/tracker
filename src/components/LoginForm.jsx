import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, User, CircleAlert, ShieldCheck } from 'lucide-react';
import LoadingButton from './LoadingButton';
import { isValidEmail, isValidIndianPhone, cleanPhone } from '../services/authService';

function Error({ id, children }) {
  return children ? <p className="field-error" id={id} role="alert"><CircleAlert size={14} />{children}</p> : null;
}

export default function LoginForm({ onSubmit, loading, serverError, cooldown = 0 }) {
  const [method, setMethod] = useState('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);

  const emailErr = !email.trim() ? 'Enter your email address.' : !isValidEmail(email) ? 'Enter a valid email, like you@example.com.' : '';
  const phoneErr = !phone.trim() ? 'Enter your mobile number.' : !isValidIndianPhone(phone) ? 'Enter a 10-digit Indian mobile number starting with 6–9.' : '';
  // Both contact fields are shown; the selected method must be valid, the other only if filled.
  const showEmailErr = touched && (method === 'email' ? emailErr : email && !isValidEmail(email) ? emailErr : '');
  const showPhoneErr = touched && (method === 'phone' ? phoneErr : phone && !isValidIndianPhone(phone) ? phoneErr : '');

  const submit = (e) => {
    e.preventDefault();
    if (loading || cooldown > 0) return; // Prevent duplicate submissions or submitting while on cooldown
    setTouched(true);
    if ((method === 'email' && emailErr) || (method === 'phone' && phoneErr)) return;
    if (method === 'email' && phone && phoneErr) return;
    if (method === 'phone' && email && emailErr) return;
    onSubmit({ method, name, email, phone });
  };

  return (
    <form onSubmit={submit} noValidate>
      {serverError && <div className="alert error" role="alert"><CircleAlert size={18} />{serverError}</div>}

      <div className="field">
        <label htmlFor="name">Full name <span className="optional">(optional)</span></label>
        <div className="input-wrap"><User size={18} />
          <input id="name" autoComplete="name" placeholder="Aarav Sharma" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="email">Email address</label>
        <div className={`input-wrap ${showEmailErr ? 'invalid' : ''}`}><Mail size={18} />
          <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!showEmailErr} aria-describedby="email-err" />
        </div>
        <Error id="email-err">{showEmailErr}</Error>
      </div>

      <div className="field">
        <label htmlFor="phone">Phone number <span className="optional">{method === 'email' ? '(optional)' : ''}</span></label>
        <div className={`input-wrap ${showPhoneErr ? 'invalid' : ''}`}>
          <span className="prefix" aria-label="India country code">🇮🇳 +91</span>
          <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" maxLength={14}
            value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
            aria-invalid={!!showPhoneErr} aria-describedby="phone-err" />
        </div>
        <Error id="phone-err">{showPhoneErr}</Error>
      </div>

      <div className="field">
        <span className="label" id="method-label">Send my OTP by</span>
        <div className="segmented" role="radiogroup" aria-labelledby="method-label">
          <button type="button" role="radio" aria-checked={method === 'email'} onClick={() => setMethod('email')}><Mail size={16} />Email</button>
          <button type="button" role="radio" aria-checked={method === 'phone'} onClick={() => setMethod('phone')}><Phone size={16} />SMS</button>
        </div>
        <p className="hint">
          {cooldown > 0
            ? `Security cooldown active. Please wait ${cooldown}s before requesting a new code.`
            : method === 'email'
            ? `We'll email a 6-digit code to ${email.trim() || 'your email address'}.`
            : `We'll text a 6-digit code to +91 ${cleanPhone(phone) || 'your number'}.`}
        </p>
      </div>

      <LoadingButton
        type="submit"
        loading={loading}
        disabled={cooldown > 0}
      >
        {loading ? 'Sending OTP…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
      </LoadingButton>

      <p className="legal">By continuing you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
      <p className="security"><ShieldCheck size={16} />Your sign-in is protected with one-time codes. We never ask for your bank password or PIN.</p>
    </form>
  );
}
