import { AppHeader } from './app-header';
import { GlobalSearch } from '../features/global-search';
import { UserProfile } from '../features/user-profile';
import { NotificationBell } from '../features/notification-bell';
import type { ChatUser } from '@repo/shared';

interface FloatingHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: ChatUser;
  notificationCount?: number;
}

export const FloatingHeader = ({
  searchQuery,
  onSearchChange,
  currentUser,
  notificationCount = 3,
}: FloatingHeaderProps) => {
  return (
    <div className="absolute top-4 px-20 w-full  z-10 flex items-center gap-4">

      {/* Search Bar - takes up remaining space */}
      <div className="flex-1 max-w-64">
        <GlobalSearch 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>
      
      {/* Right side items */}
      <div className="flex items-center gap-2 ml-auto">
        <UserProfile user={currentUser} />
        <NotificationBell count={notificationCount} />
      </div>
    </div>
  );
};