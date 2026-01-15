'use client';

import { useState } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import type { ChatUser } from '@repo/shared';

interface UserProfileProps {
  user: ChatUser;
}

export const UserProfile = ({ user }: UserProfileProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-1 hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-full flex items-center justify-center">
          {user.pic ? (
            <img 
              src={user.pic} 
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-neutral-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-neutral-800">
          {user.name}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  // TODO: Implement profile settings
                  alert('Profile settings coming soon!');
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <User className="h-4 w-4" />
                Profile Settings
              </button>
              
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  // TODO: Implement app settings
                  alert('App settings coming soon!');
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              
              <hr className="my-1" />
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};