import React, { useState } from 'react';

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  icon = null,
  className = '',
  style = {},
  ...rest
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isHovered && !disabled && !loading ? '#4338ca' : '#4f46e5',
          color: '#ffffff',
          border: '1px solid #4338ca',
          boxShadow: isHovered && !disabled && !loading 
            ? '0 6px 16px -2px rgba(79, 70, 229, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' 
            : '0 2px 4px -1px rgba(79, 70, 229, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
        };
      case 'secondary':
        return {
          backgroundColor: isHovered && !disabled && !loading ? 'var(--bg-tertiary, #e2e8f0)' : 'var(--bg-secondary, #f1f5f9)',
          color: 'var(--text-primary, #1e293b)',
          border: '1px solid var(--border-color, #cbd5e1)',
          boxShadow: isHovered && !disabled && !loading ? '0 4px 10px rgba(0, 0, 0, 0.08)' : '0 1px 2px rgba(0, 0, 0, 0.04)'
        };
      case 'outline':
        return {
          backgroundColor: isHovered && !disabled && !loading ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
          color: '#4f46e5',
          border: '1.5px solid #4f46e5',
          boxShadow: isHovered && !disabled && !loading ? '0 0 12px rgba(79, 70, 229, 0.2)' : 'none'
        };
      case 'danger':
        return {
          backgroundColor: isHovered && !disabled && !loading ? '#dc2626' : '#ef4444',
          color: '#ffffff',
          border: '1px solid #dc2626',
          boxShadow: isHovered && !disabled && !loading ? '0 6px 16px -2px rgba(239, 68, 68, 0.4)' : '0 2px 4px rgba(239, 68, 68, 0.3)'
        };
      case 'ghost':
        return {
          backgroundColor: isHovered && !disabled && !loading ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
          color: isHovered ? '#4f46e5' : 'var(--text-secondary, #64748b)',
          border: '1px solid transparent'
        };
      case 'success':
        return {
          backgroundColor: isHovered && !disabled && !loading ? '#059669' : '#10b981',
          color: '#ffffff',
          border: '1px solid #059669',
          boxShadow: isHovered && !disabled && !loading ? '0 6px 16px -2px rgba(16, 185, 129, 0.4)' : '0 2px 4px rgba(16, 185, 129, 0.3)'
        };
      default:
        return {
          backgroundColor: '#4f46e5',
          color: '#ffffff',
          border: '1px solid #4f46e5'
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { padding: '6px 14px', fontSize: '0.8125rem', borderRadius: '8px' };
      case 'lg':
        return { padding: '13px 26px', fontSize: '1rem', borderRadius: '12px' };
      case 'md':
      default:
        return { padding: '10px 20px', fontSize: '0.875rem', borderRadius: '10px' };
    }
  };

  const transformStyle = () => {
    if (disabled || loading) return 'none';
    if (isActive) return 'scale(0.97)';
    if (isHovered) return 'translateY(-2px)';
    return 'translateY(0)';
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsActive(false); }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      className={`btn magnetic-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: '600',
        fontFamily: 'inherit',
        letterSpacing: '-0.01em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transform: transformStyle(),
        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        textDecoration: 'none',
        userSelect: 'none',
        outline: 'none',
        willChange: 'transform, box-shadow',
        ...getVariantStyle(),
        ...getSizeStyle(),
        ...style
      }}
      {...rest}
    >
      {loading && (
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
          style={{ width: '1em', height: '1em', borderWidth: '2px' }}
        ></span>
      )}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

export default Button;