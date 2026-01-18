export const HERO_SECTION_CONFIG = {
  section: {
    base: 'w-full min-h-screen relative',
    padding: {
      mobile: 'py-8',
      desktop: 'md:py-16',
    },
  },
  heading: {
    base: 'text-4xl xl:text-5xl text-neutral-600 font-medium font-inter italic capitalize',
    margin: {
      mobile: 'mt-8',
      desktop: 'md:mt-16',
    },
    highlight: {
      text: 'smarter',
      classes: 'text-green-600 font-semibold font-saira',
    },
  },
  buttonContainer: {
    base: 'flex gap-2',
    margin: {
      mobile: 'mt-6',
      desktop: 'md:mt-12',
    },
    padding: {
      mobile: 'ml-0',
      desktop: 'xl:ml-4',
    },
  },
  imageContainer: {
    base: 'size-full relative',
    margin: {
      mobile: 'mt-8',
      desktop: 'md:mt-0',
    },
    padding: {
      mobile: 'pr-0 p-2',
      desktop: 'md:p-16 xl:p-24',
    },
  },
  imageWrapper: {
    base: 'size-full relative',
    border: 'border-8 border-neutral-200 rounded-xl overflow-hidden',
  },
  mask: {
    base: 'absolute bg-white inset-0',
    mobile: '[mask-image:linear-gradient(to_bottom,transparent,transparent,transparent,transparent,black)]',
    desktop: 'md:[mask-image:linear-gradient(to_bottom,transparent,transparent,black)]',
  },
  image: {
    base: 'w-full h-full object-cover origin-center rounded-lg opacity-100',
    src: '/herosection.png',
    alt: 'Chat-ly application preview',
  },
} as const;

