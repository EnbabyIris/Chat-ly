'use client';

import { memo } from 'react';
import Image from 'next/image';
import type { User } from '@repo/shared';

interface UserListItemProps {
  user: User | { _id: string; name: string; email: string; pic?: string };
  handleFunction: () => void;
  isOnline?: boolean;
  lastSeen?: Date;
}

export const UserListItem = memo(({ user, handleFunction, isOnline = false, lastSeen }: UserListItemProps) => {
  const userPic = 'pic' in user ? user.pic : ('avatar' in user ? user.avatar : null);
  const userName = user.name;
  const userEmail = 'email' in user ? user.email : '';

  // Format last seen time
  const getLastSeenText = () => {
    if (!lastSeen) return 'Last seen recently';

    const now = new Date();
    const diffMs = now.getTime() - new Date(lastSeen).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `Last seen ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `Last seen ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return 'Last seen a while ago';
  };

  return (
    <div
      onClick={handleFunction}
      className="cursor-pointer border border-neutral-200 group bg-neutral-100 hover:bg-white transition-all duration-100 px-3 py-2 rounded-lg relative font-light z-30 shadow-[0_2px_3px_0_rgba(0,0,0,0.15)]"
    >
      <div className="flex items-center gap-2">
        {userPic && (
          <div className="flex items-center shrink-0">
            <Image
              src={userPic}
              alt={userName}
              width={40}
              height={40}
              className="rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3)] object-cover border border-white w-10 h-10"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png';
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium group-hover:text-neutral-600 text-neutral-500">
            {userName}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <p className="text-xs text-neutral-400">
              {isOnline ? 'Online' : getLastSeenText()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

UserListItem.displayName = 'UserListItem';
