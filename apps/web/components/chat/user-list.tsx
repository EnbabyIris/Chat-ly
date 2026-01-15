import { Users } from 'lucide-react';
import { UserListItem } from '@/components/chat/user-list-item';
import type { UserListItem as UserType } from '@repo/shared';

interface UserListProps {
  users: UserType[];
  onUserSelect: (user: UserType) => void;
}

export const UserList = ({ users, onUserSelect }: UserListProps) => {
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
      {users.map((user) => (
        <UserListItem
          key={user.id}
          user={user}
          handleFunction={() => onUserSelect(user)}
        />
      ))}
    </div>
  );
};