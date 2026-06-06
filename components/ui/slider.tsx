import React from 'react';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function Slider({ value, min, max, step = 1, onChange, className = '', ...props }: SliderProps) {
  return (
    <div className={`slider-container ${className}`} style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: 'hsl(var(--primary-violet))',
          height: '6px',
          borderRadius: '999px',
          background: 'hsla(var(--border-glass))',
          cursor: 'pointer',
          outline: 'none',
        }}
        {...props}
      />
    </div>
  );
}
