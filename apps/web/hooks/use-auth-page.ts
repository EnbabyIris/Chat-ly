import { usePathname } from 'next/navigation';

export const useAuthPage = (): boolean => {
  const pathname = usePathname();
  return pathname?.includes('/auth') ?? false;
};

