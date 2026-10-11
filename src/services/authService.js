/**
 * Auth service — the ONLY file that talks to an auth provider.
 * To switch providers (Firebase, Clerk, your own API...), re-implement the
 * exported functions below and keep their signatures.
 *
 * Modes:
 *  - "supabase": real email OTP + real SMS OTP via Supabase Auth.
 *  - "mock":     DEV ONLY (VITE_ENABLE_MOCK_AUTH=true). Sends nothing; the UI
 *                clearly labels it and shows the locally generated code.
 *  - "none":     nothing configured; the UI shows a setup message.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

export const authMode = isSupabaseConfigured ? 'supabase' : MOCK_ENABLED ? 'mock' : 'none';
export const isConfigured = authMode !== 'none';
export const isMock = authMode === 'mock';

// Supabase enforces a strict 60-second cooldown between OTP requests for the same recipient.
export const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS = 5; // per 10-minute window
const SEND_WINDOW_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

export class AuthError extends Error {
  constructor(code, message, retryAfter = null) {
    super(message);
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/* ---------- validation helpers ---------- */
export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
export const cleanPhone = (v) => String(v || '').replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
export const isValidIndianPhone = (v) => /^[6-9]\d{9}$/.test(cleanPhone(v));
export const toE164 = (v) => `+91${cleanPhone(v)}`;

export const maskIdentifier = (method, value) => {
  if (!value) return '';
  if (method === 'email') {
    const [u, d] = value.split('@');
    if (!d) return value;
    return `${u.slice(0, 2)}${'•'.repeat(Math.max(u.length - 2, 2))}@${d}`;
  }
  return `+91 ${'•'.repeat(6)}${value.slice(-4)}`;
};

/* ---------- client-side throttling (coordinated with Supabase limits) ---------- */
const load = (k, d) => {
  try {
    return JSON.parse(sessionStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
const save = (k, v) => {
  try {
    sessionStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

/**
 * Returns remaining cooldown in seconds (or 0 if no active cooldown).
 */
export function getSendCooldown(identifier = '') {
  try {
    const rawUntil = sessionStorage.getItem('paisa_cooldown_until');
    if (rawUntil) {
      const remaining = Math.ceil((Number(rawUntil) - Date.now()) / 1000);
      if (remaining > 0) return remaining;
    }

    const sends = load('paisa_sends', []).filter((t) => Date.now() - t < SEND_WINDOW_MS);
    const last = sends[sends.length - 1];
    if (last) {
      const remaining = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - last)) / 1000);
      if (remaining > 0) return remaining;
    }
    return 0;
  } catch {
    return 0;
  }
}

function checkSendLimit(identifier) {
  const cd = getSendCooldown(identifier);
  if (cd > 0) {
    throw new AuthError(
      'rate_limited',
      `Please wait ${cd}s before requesting another verification code.`,
      cd
    );
  }

  const sends = load('paisa_sends', []).filter((t) => Date.now() - t < SEND_WINDOW_MS);
  if (sends.length >= MAX_SENDS) {
    throw new AuthError(
      'rate_limited',
      'Too many codes requested. Please wait 10 minutes before trying again.',
      600
    );
  }
}

function recordSendSuccess(identifier) {
  const now = Date.now();
  const sends = load('paisa_sends', []).filter((t) => now - t < SEND_WINDOW_MS);
  save('paisa_sends', [...sends, now]);
  sessionStorage.setItem('paisa_cooldown_until', String(now + RESEND_COOLDOWN_SECONDS * 1000));
}

function recordRateLimitCooldown(seconds = 60) {
  const until = Date.now() + seconds * 1000;
  sessionStorage.setItem('paisa_cooldown_until', String(until));
}

function checkVerifyLimit() {
  const s = load('paisa_verify', { n: 0, until: 0 });
  if (Date.now() < s.until) {
    const remaining = Math.ceil((s.until - Date.now()) / 1000);
    throw new AuthError(
      'rate_limited',
      `Too many incorrect attempts. Please wait ${remaining}s before trying again.`,
      remaining
    );
  }
  return s;
}

const recordFailure = () => {
  const s = load('paisa_verify', { n: 0, until: 0 });
  const n = s.n + 1;
  save('paisa_verify', n >= MAX_VERIFY_ATTEMPTS ? { n: 0, until: Date.now() + LOCKOUT_MS } : { n, until: 0 });
};

/* ---------- mock mode (dev only) ---------- */
const mockListeners = new Set();
const mockSession = () => load('paisa_mock_session', null);
const emit = () => mockListeners.forEach((cb) => cb(mockSession()));

/* ---------- normalise provider errors ---------- */
function mapError(error, fallback) {
  if (error instanceof AuthError) return error;
  const msg = (error?.message || '').toLowerCase();
  const code = (error?.code || '').toLowerCase();
  const status = error?.status;

  // Handle Supabase 429 Rate Limits with precision
  if (
    status === 429 ||
    msg.includes('rate limit') ||
    msg.includes('too many') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('over_request_rate_limit')
  ) {
    // 1. Supabase hourly project email limit exceeded (free tier built-in SMTP: ~3-4 emails/hour)
    if (
      code === 'over_email_send_rate_limit' ||
      msg.includes('over_email_send_rate_limit') ||
      (msg.includes('email') && msg.includes('rate limit'))
    ) {
      recordRateLimitCooldown(300); // 5-minute client cooldown
      return new AuthError(
        'rate_limited',
        'Supabase email limit reached (default free project allows ~3–4 emails/hr). Please wait for the hourly window to reset, or configure custom SMTP in Supabase (Project Settings → Auth → SMTP Settings) for unlimited delivery.',
        300
      );
    }

    // 2. Per-recipient 60-second cooldown ("For security purposes, you can only request this once every 60 seconds")
    const match = msg.match(/(\d+)\s*(?:seconds?|sec|s\b)/i);
    const waitSecs = match ? parseInt(match[1], 10) : 60;
    recordRateLimitCooldown(waitSecs);

    return new AuthError(
      'rate_limited',
      `Security cooldown active: Please wait ${waitSecs} seconds before requesting another code.`,
      waitSecs
    );
  }

  if (msg.includes('fetch') || msg.includes('network') || error?.name === 'AuthRetryableFetchError') {
    return new AuthError('network', 'Network connection issue. Check your internet connection and try again.');
  }
  if (msg.includes('expired')) {
    return new AuthError('expired', 'This verification code has expired. Please request a new one.');
  }
  if (msg.includes('invalid') || msg.includes('token') || msg.includes('otp')) {
    return new AuthError('invalid', 'That code is incorrect. Double-check the 6 digits and try again.');
  }
  if (msg.includes('signups not allowed') || msg.includes('signup disabled')) {
    return new AuthError(
      'provider',
      'Signups are currently disabled in your Supabase project settings (Authentication -> Providers -> Email -> Allow new users).'
    );
  }
  if (msg.includes('sms') || msg.includes('provider') || msg.includes('twilio')) {
    return new AuthError('provider', 'We could not send the SMS code. Phone provider may not be configured.');
  }

  return new AuthError('unknown', error?.message || fallback);
}

/* ---------- public API ---------- */

/** Sends a real OTP (or a labeled mock one). Returns { identifier, mockCode? } */
export async function sendOtp({ method, email, phone, name }) {
  if (!isConfigured) {
    throw new AuthError(
      'not_configured',
      "Authentication isn't configured. Add your Supabase keys to .env and restart Vite to send real OTPs."
    );
  }

  const identifier = method === 'email' ? email.trim().toLowerCase() : toE164(phone);
  checkSendLimit(identifier);

  if (isMock) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    save('paisa_mock_otp', {
      identifier,
      code,
      name: name?.trim() || '',
      expires: Date.now() + 5 * 60 * 1000,
    });
    recordSendSuccess(identifier);
    return { identifier, mockCode: code };
  }

  if (!supabase) {
    throw new AuthError(
      'not_configured',
      'Supabase client is not available. Please verify your .env file and restart Vite.'
    );
  }

  try {
    const data = name?.trim() ? { full_name: name.trim() } : undefined;

    if (method === 'email') {
      const { error } = await supabase.auth.signInWithOtp({
        email: identifier,
        options: {
          shouldCreateUser: true,
          data,
        },
      });
      if (error) throw error;
      recordSendSuccess(identifier);
      return { identifier };
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        phone: identifier,
        options: {
          shouldCreateUser: true,
          data,
          channel: 'sms',
        },
      });
      if (error) throw error;
      recordSendSuccess(identifier);
      return { identifier };
    }
  } catch (e) {
    throw mapError(e, 'Could not send the verification code.');
  }
}

/** Verifies the code. Resolves with the session; throws AuthError otherwise. */
export async function verifyOtp({ method, identifier, token }) {
  checkVerifyLimit();

  const cleanToken = String(token || '').trim();

  if (isMock) {
    const rec = load('paisa_mock_otp', null);
    if (!rec || rec.identifier !== identifier) {
      throw new AuthError('expired', 'No code requested. Request a new one.');
    }
    if (Date.now() > rec.expires) {
      throw new AuthError('expired', 'This code has expired. Request a new one.');
    }
    if (rec.code !== cleanToken) {
      recordFailure();
      throw new AuthError('invalid', 'That code is incorrect. Check it and try again.');
    }
    const session = {
      user: {
        id: 'mock-user',
        email: method === 'email' ? identifier : null,
        phone: method === 'phone' ? identifier : null,
        user_metadata: { full_name: rec.name },
      },
    };
    save('paisa_mock_session', session);
    sessionStorage.removeItem('paisa_mock_otp');
    emit();
    return session;
  }

  if (!supabase) {
    throw new AuthError(
      'not_configured',
      'Supabase client is not available. Please verify your .env file and restart Vite.'
    );
  }

  try {
    if (method === 'email') {
      let { data, error } = await supabase.auth.verifyOtp({
        email: identifier,
        token: cleanToken,
        type: 'email',
      });

      // Fallback for Supabase configurations that issue signup tokens on first sign-in
      if (
        error &&
        (error.message?.toLowerCase().includes('token') ||
          error.message?.toLowerCase().includes('otp') ||
          error.status === 400 ||
          error.status === 403)
      ) {
        const signupFallback = await supabase.auth.verifyOtp({
          email: identifier,
          token: cleanToken,
          type: 'signup',
        });
        if (!signupFallback.error && signupFallback.data?.session) {
          data = signupFallback.data;
          error = null;
        }
      }

      if (error) throw error;

      // Ensure session object is obtained
      let session = data?.session;
      if (!session) {
        const { data: freshSession } = await supabase.auth.getSession();
        session = freshSession?.session || null;
      }

      if (!session) {
        throw new AuthError(
          'unknown',
          'Verification succeeded but no active session was returned. Please try logging in again.'
        );
      }

      return session;
    } else {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: identifier,
        token: cleanToken,
        type: 'sms',
      });
      if (error) throw error;
      return data.session;
    }
  } catch (e) {
    const err = mapError(e, 'Verification failed.');
    if (['invalid', 'expired', 'unknown'].includes(err.code)) {
      recordFailure();
    }
    throw err;
  }
}

export async function getSession() {
  if (isMock) return mockSession();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  } catch (err) {
    console.warn('Unable to get session:', err);
    return null;
  }
}

export function onAuthChange(cb) {
  if (isMock) {
    mockListeners.add(cb);
    return () => mockListeners.delete(cb);
  }
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session));
  return () => data?.subscription?.unsubscribe();
}

export async function signOut() {
  if (isMock) {
    sessionStorage.removeItem('paisa_mock_session');
    emit();
    return;
  }
  if (supabase) {
    await supabase.auth.signOut();
  }
}
