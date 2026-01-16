import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users } from 'lucide-react';
import { UserProfile } from '../features/user-profile';
import { NotificationBell } from '../features/notification-bell';
import { SearchUsersDialog } from '../features/search-users-dialog';
import type { ChatUser, UserListItem } from '../../../lib/shared';

interface FloatingHeaderProps {
  currentUser: ChatUser;
  onCreateGroup: () => void;
  onUserSelect?: (user: UserListItem) => void;
}

export const FloatingHeader = ({
  currentUser,
  onCreateGroup,
  onUserSelect,
}: FloatingHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="absolute top-4 px-20 w-full z-10 flex items-center gap-3">
      {/* Small Icons */}
      <div className="flex items-center gap-2 ">
        <motion.button
          onClick={() => setIsSearchOpen(true)}
          className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center  overflow-hidden"
          title="Search"
          whileHover="hover"
          initial="initial"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <motion.span
            className=" text-sm font-medium whitespace-nowrap"
            variants={{
              initial: { marginLeft : 0, width: 0, opacity: 0 },
              hover: { marginLeft : 8,  width: "auto", opacity: 1 }
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            Search
          </motion.span>
        </motion.button>

        <motion.button
          onClick={onCreateGroup}
          className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center  overflow-hidden"
          title="Create Group"
          whileHover="hover"
          initial="initial"
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          <motion.span
            className=" text-sm font-medium whitespace-nowrap"
            variants={{
              initial: { marginLeft : 0, width: 0, opacity: 0 },
              hover: { marginLeft : 8,  width: "auto", opacity: 1 }
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            Create Group
          </motion.span>
        </motion.button>
      </div>

      {/* Right side items */}
      <div className="flex items-center  ml-auto">
        <UserProfile user={currentUser} />
        <NotificationBell />
      </div>

      {/* Search Dialog */}
      <SearchUsersDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentUser={currentUser}
        onUserSelect={(user) => onUserSelect?.(user)}
      />
    </div>
  );
};