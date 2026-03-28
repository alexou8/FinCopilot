'use client';

import { forwardRef } from 'react';

const sizes = {
  sm: { padding: '8px 14px', fontSize: '13px' },
  md: { padding: '11px 20px', fontSize: '14px' },
  lg: { padding: '14px 28px', fontSize: '16px' },
};

export const NeuButton = forwardRef(function NeuButton(
  { children, variant = 'default', size = 'md', className = '', disabled, onClick, type = 'button', style, ...rest },
  ref
) {
  const isPrimary = variant === 'primary';
  const sizeStyle = sizes[size] || sizes.md;
  return (
    <button
      ref={ref} type={type} disabled={disabled} onClick={onClick}
      className={(isPrimary ? 'neu-btn-primary' : 'neu-btn') + ' ' + className}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 600, borderRadius: '12px',
        color: isPrimary ? '#fff' : variant === 'danger' ? 'var(--danger)' : 'var(--ink)',
        opacity: disabled ? 0.45 : 1,
        ...sizeStyle,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
});
