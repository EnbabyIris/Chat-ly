'use client';

import { memo } from 'react';
import Image from 'next/image';

interface User {
  _id: string;
  name: string;
  email: string;
  pic?: string;
}

interface UserListItemProps {
  user: User;
  handleFunction: () => void;
}

export const UserListItem = memo(({ user, handleFunction }: UserListItemProps) => {
  return (
    <div
      onClick={handleFunction}
      className="cursor-pointer border border-neutral-200 group bg-neutral-100 hover:bg-white transition-all duration-100 px-3 py-2 rounded-lg relative font-light z-30 shadow-[0_2px_3px_0_rgba(0,0,0,0.15)]"
    >
      <div className="flex items-center gap-2">
        {user.pic && (
          <div className="flex items-center shrink-0">
            <Image
              src={user.pic}
              alt={user.name}
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
            {user.name}
          </p>
          <p className="text-xs text-neutral-400">
            <b>Email : </b>
            {user.email}
          </p>
        </div>
      </div>
    </div>
  );
});

UserListItem.displayName = 'UserListItem';

