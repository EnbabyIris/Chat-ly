'use client';

import { Skeleton } from './skeleton';

export const ChatLoading = () => {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="rounded-lg h-[45px]" />
      ))}
    </div>
  );
};

