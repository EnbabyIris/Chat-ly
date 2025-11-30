import type { SVGProps } from 'react';

interface ArrowRightIconProps extends SVGProps<SVGSVGElement> {
  stroke?: string;
  strokeWidth?: string | number;
}

export const ArrowRightIcon = ({ 
  className = '', 
  stroke = '#737373', 
  strokeWidth = '2',
  ...props 
}: ArrowRightIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

