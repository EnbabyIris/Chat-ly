import type { StatusWithUser } from '@repo/shared/types';

interface StatusBarProps {
  statusesByUser: Record<string, { userName: string; avatar: string | null; statuses: StatusWithUser[] }>;
  currentUserId: string;
  onUserClick: (userId: string) => void;
}

export const StatusBar = ({ statusesByUser, currentUserId, onUserClick }: StatusBarProps) => {
  const userIds = Object.keys(statusesByUser);

  // Sort: current user first, then others
  const sortedUserIds = userIds.sort((a, b) => {
    if (a === currentUserId) return -1;
    if (b === currentUserId) return 1;
    return 0;
  });

  return (
    <div className="px-4 py-3 border-b border-neutral-200 overflow-x-auto scrollbar-none bg-white">
      <div className="flex gap-4">
        {sortedUserIds.map((userId) => {
          const userGroup = statusesByUser[userId];
          if (!userGroup) return null;
          const { userName, avatar } = userGroup;
          const isCurrentUser = userId === currentUserId;

          return (
            <button
              key={userId}
              onClick={() => onUserClick(userId)}
              className="flex flex-col items-center gap-1.5 min-w-14 group"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full ring-2 ring-neutral-800 ring-offset-2 overflow-hidden bg-neutral-100 flex items-center justify-center border border-neutral-200">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={userName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-sm font-medium text-neutral-600">${userName.charAt(0).toUpperCase()}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-sm font-medium text-neutral-600">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-light text-neutral-500 truncate max-w-14 group-hover:text-neutral-800 transition-colors">
                {isCurrentUser ? 'You' : userName.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
