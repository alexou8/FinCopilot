'use client';

export function NeuCard({ children, className = '', raised = true, onClick, updated = false, style, ...rest }) {
  return (
    <div
      onClick={onClick}
      className={(raised ? 'neu-raised-sm' : 'neu-inset-sm') + ' ' + (updated ? 'profile-updated' : '') + ' ' + className}
      style={{
        padding: '16px',
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : undefined,
        ...(onClick ? { transform: 'scale(1)' } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
