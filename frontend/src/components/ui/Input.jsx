import React, { useState } from 'react';

export function Input({
  type = 'text',
  label = '',
  placeholder = '',
  value = '',
  onChange,
  required = false,
  disabled = false,
  error = null,
  helperText = null,
  icon = null,
  leftIcon = null,
  className = '',
  id,
  name,
  autoComplete,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || name || `input-${Math.random().toString(36).substring(2, 9)}`;
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const leadingIcon = icon || leftIcon;

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: '1.125rem', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary, #0f172a)',
            marginBottom: '0.375rem',
            letterSpacing: '-0.01em'
          }}
        >
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leadingIcon && (
          <span
            style={{
              position: 'absolute',
              left: '14px',
              color: isFocused ? '#6366f1' : 'var(--text-muted, #94a3b8)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1rem',
              transition: 'color 150ms ease'
            }}
          >
            {leadingIcon}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={currentType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: '100%',
            padding: '11px 14px',
            paddingLeft: leadingIcon ? '40px' : '14px',
            paddingRight: isPassword ? '42px' : '14px',
            fontSize: '0.925rem',
            fontFamily: 'inherit',
            color: 'var(--text-primary, #0f172a)',
            backgroundColor: 'var(--surface-input, #ffffff)',
            border: `1.5px solid ${error ? '#ef4444' : isFocused ? '#6366f1' : 'var(--border-color, #cbd5e1)'}`,
            borderRadius: '10px',
            outline: 'none',
            boxShadow: error 
              ? '0 0 0 3px rgba(239, 68, 68, 0.15)' 
              : isFocused 
              ? '0 0 0 3px rgba(99, 102, 241, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05)' 
              : '0 1px 2px rgba(0, 0, 0, 0.03)',
            transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
            boxSizing: 'border-box'
          }}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              color: showPassword ? '#6366f1' : 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1rem',
              transition: 'color 150ms ease, background-color 150ms ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <i className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
          </button>
        )}
      </div>

      {error && (
        <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#ef4444', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="bi bi-exclamation-circle-fill"></i> {error}
        </p>
      )}

      {helperText && !error && (
        <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
          {helperText}
        </p>
      )}
    </div>
  );
}

export default Input;