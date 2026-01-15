'use client';

import { useState, useEffect, useRef, useCallback, useMemo, useTransition } from 'react';
import { motion } from 'framer-motion';
import { useAuthPage } from '@/hooks/use-auth-page';
import { useCursorPosition } from '@/hooks/use-cursor-position';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { Input } from '@/components/ui/input';
import { GoButton } from '@/components/ui/go-button';
import { UserListItem } from '@/components/chat/user-list-item';
import { ChatLoading } from '@/components/ui/chat-loading';
import { TIMING } from '@/lib/constants/timing';
import { SIZES } from '@/lib/constants/sizes';
import { cn } from '@/lib/utils';

interface MockUser {
  _id: string;
  name: string;
  email: string;
  pic: string;
}

const mockUsers: MockUser[] = [
  {
    _id: 'demo-user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    pic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
  {
    _id: 'demo-user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    pic: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
  },
];

interface Step1State {
  searchText: string;
  status: 'idle' | 'loading' | 'showing';
  userIndex: number;
}

export const Step1ChatDemo = () => {
  const [state, setState] = useState<Step1State>({
    searchText: '',
    status: 'idle',
    userIndex: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthPage = useAuthPage();
  const { cursorPosition, positionCursorAtElement, positionCursorAtCenter } =
    useCursorPosition();
  const { spring } = useAnimationConfig();
  const [isPending, startTransition] = useTransition();

  const positionCursorAtInput = useCallback(() => {
    positionCursorAtElement(inputRef.current, containerRef.current, -20);
  }, [positionCursorAtElement]);

  const moveCursorToButton = useCallback(() => {
    positionCursorAtCenter(buttonRef.current, containerRef.current);
  }, [positionCursorAtCenter]);

  const clearSearchText = useCallback((callback: () => void) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    let callbackCalled = false;
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.searchText.length > 0) {
          return { ...prev, searchText: prev.searchText.slice(0, -1) };
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (callback && !callbackCalled) {
            callbackCalled = true;
            callback();
          }
          return prev;
        }
      });
    }, 50);
  }, []);

  const typeText = useCallback((textToType: string, callback: () => void) => {
    let currentIndex = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (currentIndex < textToType.length) {
        setState((prev) => ({
          ...prev,
          searchText: textToType.slice(0, currentIndex + 1),
        }));
        currentIndex++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (callback) callback();
      }
    }, TIMING.cursorUpdate);
  }, []);

  const startAnimationSequence = useCallback((userIndex: number) => {
    const currentUser = mockUsers[userIndex];
    if (!currentUser) return;
    const textToType = currentUser.name;

    positionCursorAtInput();

    typeText(textToType, () => {
      timeoutRef.current = setTimeout(() => {
        moveCursorToButton();

        timeoutRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, status: 'loading' }));

          timeoutRef.current = setTimeout(() => {
            setState((prev) => ({
              ...prev,
              status: 'showing',
              userIndex,
            }));

            timeoutRef.current = setTimeout(() => {
              setState((prev) => ({ ...prev, status: 'idle' }));
              positionCursorAtInput();

              clearSearchText(() => {
                const nextIndex = (userIndex + 1) % mockUsers.length;

                timeoutRef.current = setTimeout(() => {
                  startAnimationSequence(nextIndex);
                }, TIMING.animationStart);
              });
            }, TIMING.chatCycle);
          }, 1000);
        }, TIMING.sendDelay);
      }, TIMING.animationStart);
    });
  }, [positionCursorAtInput, moveCursorToButton, typeText, clearSearchText]);

  const currentUser = useMemo(
    () => (state.status === 'showing' ? mockUsers[state.userIndex] : null),
    [state.status, state.userIndex]
  );

  const containerClassName = useMemo(
    () => cn('flex flex-col gap-2 h-full relative', isAuthPage ? 'px-0' : 'px-8'),
    [isAuthPage]
  );

  useEffect(() => {
    positionCursorAtInput();

    timeoutRef.current = setTimeout(() => {
      startAnimationSequence(0);
    }, TIMING.animationStart);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [positionCursorAtInput, startAnimationSequence]);

  const handleEmptyFunction = useCallback(() => {}, []);

  return (
    <div ref={containerRef} className={containerClassName}>
      <div className="flex gap-2 pb-2 shrink-0">
        <Input
          ref={inputRef}
          placeholder="Search by name or email"
          className="bg-white border-neutral-300 placeholder:text-neutral-400 text-neutral-500"
          value={state.searchText}
          readOnly
        />
        <div ref={buttonRef} className="flex items-center justify-center">
          <GoButton onClick={handleEmptyFunction} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {state.status === 'loading' ? (
          <ChatLoading />
        ) : currentUser ? (
          <div className="space-y-2">
            <UserListItem user={currentUser} handleFunction={handleEmptyFunction} />
          </div>
        ) : null}
      </div>

      <motion.div
        className="absolute pointer-events-none z-50"
        initial={false}
        animate={cursorPosition as { top: number; left: number }}
        transition={spring}
      >
        <img
          src="/assets/svg/cursor.svg"
          alt="cursor"
          width={SIZES.cursor.width}
          height={SIZES.cursor.height}
          className={SIZES.cursor.className}
        />
      </motion.div>
    </div>
  );
};

