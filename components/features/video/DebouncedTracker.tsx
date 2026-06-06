import React from 'react';

interface DebouncedTrackerProps {
  currentTime: number;
  duration: number;
}

export function DebouncedTracker({ currentTime, duration }: DebouncedTrackerProps) {
  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%', marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
        <span>Watch Progress</span>
        <span>{Math.round(percentage)}% Completed</span>
      </div>
      <div style={{ width: '100%', height: '6px', backgroundColor: 'hsla(var(--border-glass))', borderRadius: '999px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, hsl(var(--primary-violet)), hsl(var(--primary-cyan)))',
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
export default DebouncedTracker;
