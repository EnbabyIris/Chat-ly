import { Users } from 'lucide-react';
import { UserListItem } from '@/components/chat/user-list-item';
import { useOnlineStatus } from '@/hooks/use-online-status';
import type { UserListItem as UserType, User } from '@repo/shared';

interface UserListProps {
  users: UserType[];
  onUserSelect: (user: UserType) => void;
}

export const UserList = ({ users, onUserSelect }: UserListProps) => {
  const { onlineUsers } = useOnlineStatus();
  if (users.length === 0) {
    return (
      <div className="text-center text-neutral-500 mt-12">
        <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
        <p className="text-sm">No users found</p>
        <p className="text-xs text-neutral-400 mt-1">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user : UserType) => (
        <UserListItem
          key={user.id}
          user={user as User}
          handleFunction={() => onUserSelect(user)}
          isOnline={onlineUsers.has(user.id)}
        />
      ))}
    </div>
  );
};