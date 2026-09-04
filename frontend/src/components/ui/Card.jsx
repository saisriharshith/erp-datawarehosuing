import React from 'react';

export function Card({
  className = '',
  children,
  title = null,
  subtitle = null,
  badge = null,
  headerAction = null,
  style = {},
  bodyStyle = {},
  ...rest
}) {
  return (
    <div
      className={`card ${className}`}
      style={{
        backgroundColor: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        ...style
      }}
      {...rest}
    >
      {(title || headerAction) && (
        <div
          className="card-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  color: 'var(--text-primary, #0f172a)'
                }}
              >
                {title}
              </h3>
              {badge && <span>{badge}</span>}
            </div>
            {subtitle && (
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted, #64748b)'
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="card-body" style={{ padding: '20px', ...bodyStyle }}>
        {children}
      </div>
    </div>
  );
}

export default Card;