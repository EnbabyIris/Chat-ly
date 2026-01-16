/**
 * Group Store Hooks
 *
 * Simple hooks for managing group chat state.
 * Handles group creation dialog and basic state management.
 */

import { useState, useCallback } from 'react';
import type { GroupChat } from '@repo/shared/types';

// Simple hook for group dialog state
export const useGroupDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    open,
    close,
  };
};

// Simple hook for group management state
export const useGroupManagement = () => {
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);

  return {
    selectedGroup,
    setSelectedGroup,
  };
};