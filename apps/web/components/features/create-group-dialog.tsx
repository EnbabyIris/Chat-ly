'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { X, Users, Search, Plus, User, Camera, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUsers } from '@/lib/api/queries';
import { useCreateGroupChat } from '@/lib/api/queries';
import { useAuth } from '@/contexts/auth-context';
import { CreateGroupChatDTO, UserListItem } from '@repo/shared/types';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (chat: any) => void;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<UserListItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createGroupMutation = useCreateGroupChat();

  // Fetch users for participant selection
  const { data: usersData, isLoading: isLoadingUsers } = useUsers(
    { search: searchQuery || undefined, limit: 50 },
    { enabled: isOpen && currentStep === 2 && (!searchQuery || searchQuery.length >= 2) }
  );

  // Filter out current user from available users
  const availableUsers = useMemo(() => {
    const users = usersData?.users || [];
    return users.filter(u => u.id !== user?.id);
  }, [usersData?.users, user?.id]);

  // Handle participant selection
  const handleParticipantToggle = useCallback((participant: UserListItem) => {
    setSelectedParticipants(prev => {
      const isSelected = prev.some(p => p.id === participant.id);
      const newSelection = isSelected
        ? prev.filter(p => p.id !== participant.id)
        : [...prev, participant];
      return newSelection;
    });
  }, []);

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      // Validate step 1
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) {
        newErrors.name = 'Group name is required';
      }
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        setCurrentStep(2);
      }
    }
  }, [currentStep, formData.name]);

  const handleBack = useCallback(() => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setErrors({});
    }
  }, [currentStep]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validate step 2
    const newErrors: Record<string, string> = {};
    if (selectedParticipants.length === 0) {
      newErrors.participants = 'At least one participant is required';
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const groupData: CreateGroupChatDTO = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        avatar: formData.avatar?.trim() || undefined,
        participantIds: selectedParticipants.map(p => p.id),
      };

      const result = await createGroupMutation.mutateAsync(groupData);

      if (result.success && result.chat) {
        onSuccess?.(result.chat);
        handleClose();
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  }, [formData, selectedParticipants, createGroupMutation, onSuccess]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setFormData({ name: '', description: '', avatar: '' });
    setSelectedParticipants([]);
    setSearchQuery('');
    setErrors({});
    onClose();
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{zIndex: 99999}}
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
            
            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep >= 1 ? "bg-black/40 text-white" : "bg-gray-200 text-gray-600"
              )}>
                {currentStep > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <div className={cn(
                "w-8 h-1 rounded-full",
                currentStep >= 2 ? "bg-black/40" : "bg-gray-200"
              )} />
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep >= 2 ? "bg-black/40 text-white" : "bg-gray-200 text-gray-600"
              )}>
                2
              </div>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Preview/Info */}
          <div className="w-1/3 bg-gray-50 p-6 border-r border-gray-200">
            {currentStep === 1 ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white border border-gray-200  rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Group Details</h3>
                  <p className="text-sm text-gray-600">
                    Give your group a name and description to help members understand its purpose.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Tips for a great group:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Choose a clear, descriptive name</li>
                      <li>• Add a brief description of the group's purpose</li>
                      <li>• You can always edit these details later</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group Preview Card */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{formData.name || 'Group Name'}</h3>
                      {formData.description && (
                        <p className="text-sm text-gray-600">{formData.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">Participants: {selectedParticipants.length + 1} total</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs">You (Admin)</span>
                    </div>
                    {selectedParticipants.slice(0, 3).map((participant) => (
                      <div key={participant.id} className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          {participant.avatar ? (
                            <img
                              src={participant.avatar}
                              alt={participant.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-600 font-medium">
                              {participant.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-xs">{participant.name}</span>
                      </div>
                    ))}
                    {selectedParticipants.length > 3 && (
                      <p className="text-xs text-gray-500 mt-1">
                        +{selectedParticipants.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Adding Participants</h4>
                  <p className="text-sm text-gray-600">
                    Search and select people to add to your group. You can add more members later.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Form */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
              {currentStep === 1 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Information</h3>
                  </div>

                  {/* Group Name */}
                  <div>
                    <Input
                      label="Group Name *"
                      placeholder="Enter group name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={cn(
                        "w-full",
                        errors.name && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Group Description */}
                  <div>
                    <label className="block text-gray-500 mb-1 text-sm font-medium font-inter">
                      Description (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What's this group about?"
                      className={cn(
                        "flex min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base transition-colors placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
                        errors.description && "border-red-500 focus-visible:ring-red-500"
                      )}
                      rows={4}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Participants</h3>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  {/* Selected Participants */}
                  {selectedParticipants.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Selected ({selectedParticipants.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedParticipants.map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-sm"
                          >
                            <User className="w-3 h-3" />
                            <span>{participant.name}</span>
                            <button
                              type="button"
                              onClick={() => handleParticipantToggle(participant)}
                              className="hover:bg-gray-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Users */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Available Users</h4>
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg scrollbar-none">
                      {isLoadingUsers ? (
                        <div className="p-4 text-center text-gray-500">Loading users...</div>
                      ) : availableUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {searchQuery ? 'No users found' : 'Start typing to search users'}
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {availableUsers.map((user) => {
                            const isSelected = selectedParticipants.some(p => p.id === user.id);
                            return (
                              <div
                                key={user.id}
                                className={cn(
                                  "flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors",
                                  isSelected && "bg-gray-50"
                                )}
                                onClick={() => handleParticipantToggle(user)}
                              >
                                <div className="flex items-center gap-3">
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
                                  <div>
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {user.isOnline && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  )}
                                  {isSelected ? (
                                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                                      <Check className="w-4 h-4 text-white" />
                                    </div>
                                  ) : (
                                    <Plus className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {errors.participants && (
                      <p className="mt-2 text-sm text-red-600">{errors.participants}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100">
              <div>
                {currentStep === 2 && (
                  <Button
                    type="button"
                    variant="white"
                    onClick={handleBack}
                    disabled={createGroupMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="white"
                  onClick={handleClose}
                  disabled={createGroupMutation.isPending}
                >
                  Cancel
                </Button>
                
                {currentStep === 1 ? (
                  <Button
                    type="button"
                    variant="black"
                    onClick={handleNext}
                    disabled={!formData.name.trim()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="black"
                    onClick={handleSubmit}
                    disabled={selectedParticipants.length === 0 || createGroupMutation.isPending}
                    loading={createGroupMutation.isPending}
                    loadingText="Creating Group..."
                  >
                    Create Group
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};