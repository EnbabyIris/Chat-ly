import { Users } from 'lucide-react';
import { UserListItem } from '@/components/chat/user-list-item';
import { useOnlineStatus } from '@/hooks/use-online-status';
import type { UserListItem as UserType, User } from '../../lib/shared';

interface UserListProps {
  users: UserType[];
  onUserSelect: (user: UserType) => void;
}

export const UserList = ({ users, onUserSelect }: UserListProps) => {
  const { onlineUsers } = useOnlineStatus();

  // Filter to show only online users
  const onlineUsersList = users.filter(user => onlineUsers.has(user.id));

  if (onlineUsersList.length === 0) {
    return (
      <div className="text-center text-neutral-500 mt-12 px-4">
        <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
        <p className="text-sm font-medium">No online users right now</p>
        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
          Search for other users to find and chat with someone
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {onlineUsersList.map((user : UserType) => (
        <UserListItem
          key={user.id}
          user={{
            _id: user.id,
            name: user.name,
            email: user.email,
            pic: user.avatar || undefined
          }}
          handleFunction={() => onUserSelect(user)}
          isOnline={true}
        />
      ))}
    </div>
  );
};