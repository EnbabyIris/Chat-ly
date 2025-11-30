export const BACKGROUND_LINES_CONFIG = {
  stroke: '#00000080',
  iconSize: 'w-4 h-4',
  zIndex: 'z-10',
  lineColor: 'bg-gray-300',
  lineWidth: 'h-px',
  verticalLineWidth: 'w-px',
  topOffset: 'top-16',
  bottomOffset: 'bottom-16',
  leftOffset: {
    mobile: 'left-3',
    tablet: 'md:left-8',
    desktop: 'xl:left-16',
  },
  rightOffset: {
    mobile: 'right-3',
    tablet: 'md:right-8',
    desktop: 'xl:right-16',
  },
} as const;

