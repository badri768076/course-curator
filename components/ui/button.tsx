import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const getVariantClass = () => {
      switch (variant) {
        case 'secondary':
          return 'btn-secondary';
        case 'ghost':
          return 'btn-ghost';
        case 'primary':
        default:
          return 'btn-primary';
      }
    };

    const getSizeStyle = () => {
      switch (size) {
        case 'sm':
          return { padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px' };
        case 'lg':
          return { padding: '1rem 2rem', fontSize: '1.05rem', borderRadius: '14px' };
        case 'md':
        default:
          return {}; // defaults handled by global CSS class '.btn'
      }
    };

    return (
      <button
        ref={ref}
        className={`btn ${getVariantClass()} ${className}`}
        style={getSizeStyle()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
