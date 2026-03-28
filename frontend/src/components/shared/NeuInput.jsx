'use client';

import { forwardRef } from 'react';

export const NeuInput = forwardRef(function NeuInput(
  { className = '', multiline = false, rows = 3, placeholder, value, onChange, onKeyDown, disabled, style, ...rest },
  ref
) {
  const baseStyle = {
    width: '100%',
    padding: '14px 18px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '15px',
    color: 'var(--ink)',
    resize: 'none',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : undefined,
    ...style,
  };

  if (multiline) {
    return (
      <textarea ref={ref} rows={rows} className={"neu-input " + className} style={baseStyle}
        placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} disabled={disabled} {...rest} />
    );
  }
  return (
    <input ref={ref} type="text" className={"neu-input " + className} style={baseStyle}
      placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} disabled={disabled} {...rest} />
  );
});
