export const GITHUB_BADGE_CONFIG = {
  container: {
    base: 'p-2 relative border w-fit mx-auto',
    scale: {
      mobile: 'scale-75',
      desktop: 'md:scale-100',
    },
  },
  cornerIcon: {
    size: 'w-4 h-4',
  },
  badge: {
    base: 'bg-gray-200 rounded-full p-1 flex items-center font-serif cursor-default shadow-[inset_0px_1px_2px_rgba(0,0,0,0.2)]',
    text: {
      label: "We're Proudly",
      classes: 'text-sm font-inter px-2 absolute text-neutral-600',
    },
  },
  githubButton: {
    base: 'px-2 flex gap-2 p-1 bg-white rounded-full relative z-10 items-center justify-center shadow-[0px_1px_2px_rgba(0,0,0,0.2)] transition-all duration-300',
    iconSize: 'text-2xl',
    iconColor: 'text-[#171515]',
    text: {
      content: 'open source',
      classes: 'text-xs text-neutral-600 font-inter uppercase font-semibold',
    },
    hover: {
      margin: 'ml-[110px]',
    },
    default: {
      margin: 'ml-0',
    },
  },
  cornerPositions: [
    { position: '-translate-x-1/2 -translate-y-1/2 top-0 left-0' },
    { position: 'translate-x-1/2 -translate-y-1/2 top-0 right-0' },
    { position: '-translate-x-1/2 translate-y-1/2 bottom-0 left-0' },
    { position: 'translate-x-1/2 translate-y-1/2 bottom-0 right-0' },
  ] as const,
} as const;

