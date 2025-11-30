export const NAVBAR_CONFIG = {
  height: 'h-16',
  logoSize: {
    width: 40,
    height: 40,
    className: 'h-10 w-10',
  },
  brandName: 'Chat-ly',
  brandNameClasses: 'text-2xl font-bold text-neutral-500',
  button: {
    text: 'Get Started',
    classes: 'text-neutral-500 z-20 py-0.5 rounded-md font-saira font-medium flex items-center gap-1',
  },
  icon: {
    size: 'w-4 h-4',
    stroke: '#737373',
  },
  padding: {
    horizontal: 'px-10',
    desktop: 'xl:px-32',
  },
} as const;

