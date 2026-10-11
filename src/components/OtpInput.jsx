import { useRef, useEffect } from 'react';

export default function OtpInput({ value, onChange, length = 6, disabled, invalid }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const set = (i, d) => {
    const next = digits.slice(); next[i] = d; onChange(next.join(''));
  };
  const handleChange = (i, e) => {
    const d = e.target.value.replace(/\D/g, '').slice(-1);
    if (!d) return;
    set(i, d);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) set(i, '');
      else if (i > 0) { set(i - 1, ''); refs.current[i - 1]?.focus(); }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="otp-row" role="group" aria-label={`${length}-digit verification code`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`otp-box ${d ? 'filled' : ''} ${invalid ? 'invalid' : ''}`}
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of ${length}`}
          value={d} disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
