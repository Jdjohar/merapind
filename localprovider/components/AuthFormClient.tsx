// components/AuthFormClient.tsx
'use client';
import React, { useState } from 'react';

export type FieldDef = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autocomplete?: string;
  default?: string;
};

type Props = {
  fields: FieldDef[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
};

export default function AuthFormClient({ fields, submitLabel, onSubmit }: Props) {
  const initial = Object.fromEntries(fields.map(f => [f.name, f.default ?? '']));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.name] || '').trim();
      if (f.required && !v) e[f.name] = `${f.label} is required`;
      if (f.name === 'email' && v) {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        if (!ok) e.email = 'Enter a valid email';
      }
      if (f.name === 'password' && v) {
        if (v.length < 8) e.password = 'Password must be at least 8 characters';
      }
      if (f.name === 'confirmPassword' && v) {
        if (v !== values['password']) e.confirmPassword = 'Passwords do not match';
      }
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length) return;
    setBusy(true);
    try {
      await onSubmit(values);
    } catch (err: any) {
      setServerError(err?.message || 'Server error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      {serverError && <div className="error server">{serverError}</div>}
      {fields.map((f) => (
        <label key={f.name} className="field">
          <span className="label">{f.label}{f.required ? ' *' : ''}</span>
          <input
            name={f.name}
            type={f.type ?? 'text'}
            placeholder={f.placeholder ?? ''}
            value={values[f.name]}
            onChange={(ev) => setValues({ ...values, [f.name]: ev.target.value })}
            autoComplete={f.autocomplete ?? 'off'}
            aria-invalid={!!errors[f.name]}
          />
          {errors[f.name] && <div role="alert" className="error">{errors[f.name]}</div>}
        </label>
      ))}
      <button type="submit" className="submit" disabled={busy}>
        {busy ? 'Please wait…' : submitLabel}
      </button>

      <style jsx>{`
        .auth-form { max-width:520px; margin:0 auto; display:flex; flex-direction:column; gap:12px; }
        .field { display:flex; flex-direction:column; }
        .label { font-weight:600; margin-bottom:6px; }
        input { padding:10px 12px; border:1px solid #ccc; border-radius:8px; font-size:14px; }
        .submit { padding:10px 14px; border-radius:8px; border:0; cursor:pointer; font-weight:700; background:#0b5fff; color:white; }
        .error { color:#9b1c1c; font-size:13px; margin-top:6px; }
        .error.server { background:#ffecec; padding:8px; border-radius:6px; }
      `}</style>
    </form>
  );
}
