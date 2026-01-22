'use client';

import { useState, useCallback } from 'react';
import { LogOut, Settings, User, X, Camera, Upload, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';
import { useUpdateProfile } from '@/lib/api/queries';
import { updateProfileSchema } from '@/lib/shared/validations/user';
import type { ChatUser, UpdateProfileDTO } from '../../lib/shared';
import { CreateStatusDialog } from './create-status-dialog';

interface UserProfileProps {
  user: ChatUser;
}

export const UserProfile = ({ user }: UserProfileProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    avatar: user.pic || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { logout } = useAuth();
  const updateProfileMutation = useUpdateProfile();

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setIsProfileDialogOpen(true);
    // Reset form data to current user data
    setFormData({
      name: user.name || '',
      avatar: user.pic || '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const result = updateProfileSchema.safeParse({ body: formData });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path.length > 1 && error.path[0] === 'body') {
          newErrors[error.path[1] as string] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    const updateData: UpdateProfileDTO = {
      name: formData.name || undefined,
      avatar: formData.avatar || null,
    };

    try {
      await updateProfileMutation.mutateAsync(updateData);
      setIsProfileDialogOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Error handling will be shown by the mutation
    }
  };

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsProfileDialogOpen(false);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just create a data URL. In a real app, you'd upload to a server
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-1 hover:bg-gray-50 transition-colors"
      >
          <div className="w-7 h-7 bg-linear-to-br from-neutral-200 to-neutral-300 rounded-full flex items-center justify-center">
          {user.pic ? (
            <img 
              src={user.pic} 
              alt={user.name}
                className="w-6 h-6 rounded-full object-cover"
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
              className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
            <div className="p-1">
              <button
                  onClick={handleProfileClick}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <User className="h-4 w-4" />
                Profile Settings
              </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsStatusDialogOpen(true);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Plus className="h-4 w-4" />
                  Create Status
                </button>
              
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  // TODO: Implement app settings
                  alert('App settings coming soon!');
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              
              <hr className="my-1" />
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>

      {/* Profile Dialog */}
      {isProfileDialogOpen && (
        <div
          style={{ zIndex: 99999 }}
          className="fixed inset-0 flex items-start justify-center pt-20 bg-black/20 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{
              duration: 0.15,
              ease: "easeOut",
            }}
            className="w-full max-w-md mx-4 bg-white rounded-2xl p-2"
          >
            <div className="w-full p-2 bg-stone-100 rounded-xl border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setIsProfileDialogOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-3">
                  <div className="w-20 h-20 bg-linear-to-br from-neutral-200 to-neutral-300 rounded-full flex items-center justify-center overflow-hidden">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Profile"
                        className="w-20 h-20 object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-medium text-neutral-600">
                        {formData.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">Click the camera to change photo</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter your name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Avatar URL Field (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {errors.avatar && (
                    <p className="text-sm text-red-600 mt-1">{errors.avatar}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsProfileDialogOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 rounded-lg transition-colors"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Error Message */}
              {updateProfileMutation.isError && (
                <p className="text-sm text-red-600 mt-3 text-center">
                  Failed to update profile. Please try again.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Creation Dialog */}
      <CreateStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
      />
    </>
  );
};