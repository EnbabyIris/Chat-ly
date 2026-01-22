'use client';

import { useState, useCallback } from 'react';
import { Search, User } from 'lucide-react';
import { useUsers } from '@/lib/api/queries';
import type { ChatUser, UserListItem } from '../../lib/shared';
import { motion } from 'framer-motion';

interface SearchUsersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ChatUser;
  onUserSelect: (user: UserListItem) => void;
}

export const SearchUsersDialog = ({
  isOpen,
  onClose,
  currentUser,
  onUserSelect,
}: SearchUsersDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersData, isLoading } = useUsers(
    { search: undefined, limit: 50 },
    { enabled: isOpen }
  );

  // Filter users based on search query
  const availableUsers = usersData?.users
    ?.filter(u => u.id !== currentUser._id)
    ?.filter(u => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(query) ||
             u.email.toLowerCase().includes(query);
    }) || [];

  const handleUserClick = (user: UserListItem) => {
    onUserSelect(user);
    onClose();
    setSearchQuery('');
  };

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{zIndex: 99999}}
      className="fixed inset-0 flex items-start justify-center pt-20 bg-black/20 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 , scale: 0.95 }}
        animate={{ opacity: 1, y: 0 , scale: 1 }}
        exit={{ opacity: 0, y: -10 , scale: 0.97 }}
        transition={{
          duration: 0.15,
          ease: "easeOut",
        }}
        className="w-full max-w-2xl mx-4 bg-white rounded-2xl p-2"
      >
      <div className="w-full p-2 bg-stone-100  rounded-xl border border-gray-200">
        {/* Search Input */}
          <div className="relative bg-white rounded-lg mb-2 border border-gray-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 text-neutral-400 pr-4 py-2 ring-0 rounded-full outline-none focus:outline-none focus:ring-0 active:outline-none"
              autoFocus
            />
          </div>

        {/* Results */}
        <div className="max-h-96 rounded-lg overflow-hidden  bg-white overflow-y-auto scrollbar-none border border-gray-200">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : availableUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No users found' : 'Start typing to search'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  {user.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
    </div>
  );
}