import React, { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    } else if (newTheme === 'dark') {
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-secondary, #f1f5f9)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '24px',
        padding: '2px',
        gap: '2px'
      }}
      role="radiogroup"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => toggleTheme('light')}
        aria-checked={theme === 'light'}
        role="radio"
        style={{
          background: theme === 'light' ? '#4f46e5' : 'transparent',
          color: theme === 'light' ? '#ffffff' : 'var(--text-muted, #64748b)',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.15s ease'
        }}
        title="Light Mode"
      >
        <i className="bi bi-sun-fill"></i>
        <span className="d-none d-sm-inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => toggleTheme('dark')}
        aria-checked={theme === 'dark'}
        role="radio"
        style={{
          background: theme === 'dark' ? '#4f46e5' : 'transparent',
          color: theme === 'dark' ? '#ffffff' : 'var(--text-muted, #64748b)',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.15s ease'
        }}
        title="Dark Mode"
      >
        <i className="bi bi-moon-stars-fill"></i>
        <span className="d-none d-sm-inline">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => toggleTheme('system')}
        aria-checked={theme === 'system'}
        role="radio"
        style={{
          background: theme === 'system' ? '#4f46e5' : 'transparent',
          color: theme === 'system' ? '#ffffff' : 'var(--text-muted, #64748b)',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.15s ease'
        }}
        title="System Preference"
      >
        <i className="bi bi-display"></i>
      </button>
    </div>
  );
}

export default ThemeToggle;