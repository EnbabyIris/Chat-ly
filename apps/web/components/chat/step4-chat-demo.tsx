'use client';

import { useState, useEffect, useRef, useCallback, useMemo, useTransition } from 'react';
import { motion } from 'framer-motion';
import { useAuthPage } from '@/hooks/use-auth-page';
import { useCursorPosition } from '@/hooks/use-cursor-position';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { cn } from '@/lib/utils';
import { SIZES } from '@/lib/constants/sizes';
import { TIMING } from '@/lib/constants/timing';

interface Message {
  id: number;
  text: string;
  original: string;
  translated: string;
  isCurrentUser: boolean;
  maxWidth: string;
}

interface TranslationStep {
  messageIndex: number;
  targetLang: string;
  delay: number;
  isRevert?: boolean;
}

const initialMessages: Message[] = [
  {
    id: 0,
    text: 'Hello, how are you?',
    original: 'Hello, how are you?',
    translated: 'Bonjour, comment allez-vous?',
    isCurrentUser: true,
    maxWidth: '70%',
  },
  {
    id: 1,
    text: 'こんにちは、元気ですか？',
    original: 'こんにちは、元気ですか？',
    translated: 'Hola, ¿cómo estás?',
    isCurrentUser: false,
    maxWidth: '65%',
  },
  {
    id: 2,
    text: 'Guten Tag, wie geht es dir?',
    original: 'Guten Tag, wie geht es dir?',
    translated: 'Good day, how are you?',
    isCurrentUser: true,
    maxWidth: '75%',
  },
];

const translationSequence: TranslationStep[] = [
  { messageIndex: 0, targetLang: 'French', delay: 2500 },
  { messageIndex: 1, targetLang: 'Spanish', delay: 2500 },
  { messageIndex: 2, targetLang: 'English', delay: 2500 },
  { messageIndex: 0, targetLang: 'English', delay: 2500, isRevert: true },
];

interface Step4State {
  messages: Message[];
  translatingIndex: number | null;
}

export const Step4ChatDemo = () => {
  const [state, setState] = useState<Step4State>({
    messages: initialMessages,
    translatingIndex: null,
  });
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const messagesRef = useRef<Message[]>(initialMessages);

  const isAuthPage = useAuthPage();
  const { cursorPosition, positionCursorAtElement } = useCursorPosition();
  const { spring } = useAnimationConfig();
  const [isPending, startTransition] = useTransition();

  const updateCursorPosition = useCallback((messageIndex: number, isCurrentUser: boolean) => {
    const messageEl = messageRefs.current[messageIndex];
    if (messageEl && containerRef.current) {
      positionCursorAtElement(
        messageEl,
        containerRef.current,
        isCurrentUser ? -20 : 20
      );
    }
  }, [positionCursorAtElement]);

  const translateMessage = useCallback((messageIndex: number, isRevert = false) => {
    setState((prev) => ({ ...prev, translatingIndex: messageIndex }));

    const timeoutId = setTimeout(() => {
      setState((prev) => {
        const updated = [...prev.messages];
        updated[messageIndex] = {
          ...updated[messageIndex],
          text: isRevert
            ? updated[messageIndex].original
            : updated[messageIndex].translated,
        };
        messagesRef.current = updated;
        return { ...prev, messages: updated, translatingIndex: null };
      });
    }, 1000);

    timeoutRefs.current.push(timeoutId);
  }, []);

  useEffect(() => {
    let stepIndex = 0;

    const executeStep = () => {
      if (stepIndex >= translationSequence.length) {
        stepIndex = 0;
        setState((prev) => {
          const updated = prev.messages.map((msg) => ({
            ...msg,
            text: msg.original,
          }));
          messagesRef.current = updated;
          return { ...prev, messages: updated };
        });
        const resetTimeout = setTimeout(() => {
          executeStep();
        }, 1000);
        timeoutRefs.current.push(resetTimeout);
        return;
      }

      const step = translationSequence[stepIndex];
      const isCurrentUser =
        messagesRef.current[step.messageIndex]?.isCurrentUser ?? false;

      setTimeout(() => {
        updateCursorPosition(step.messageIndex, isCurrentUser);
      }, TIMING.cursorUpdate);

      const timeout1 = setTimeout(() => {
        translateMessage(step.messageIndex, step.isRevert);

        const timeout2 = setTimeout(() => {
          stepIndex++;
          executeStep();
        }, step.delay);

        timeoutRefs.current.push(timeout2);
      }, 1000);

      timeoutRefs.current.push(timeout1);
    };

    const initialTimeout = setTimeout(() => {
      executeStep();
    }, TIMING.animationStart);

    timeoutRefs.current.push(initialTimeout);

    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, [updateCursorPosition, translateMessage]);

  const containerClassName = useMemo(
    () => cn('p-4 flex flex-col h-full relative', isAuthPage ? 'px-0' : 'px-8'),
    [isAuthPage]
  );

  return (
    <div ref={containerRef} className={containerClassName}>
      <div className="flex-1 flex flex-col justify-end gap-3 pb-4">
        {state.messages.map((msg, idx) => {
          const messageClassName = cn(
            'rounded-2xl border border-neutral-200 bg-white shadow-md',
            idx === 0
              ? 'px-4 py-2.5'
              : idx === 1
                ? 'px-5 py-2'
                : 'px-4 py-2',
            msg.isCurrentUser ? 'ml-auto text-neutral-500' : 'ml-0 text-black'
          );

          return (
            <div
              key={msg.id}
              ref={(el) => {
                messageRefs.current[idx] = el;
              }}
              style={{ maxWidth: msg.maxWidth || '75%' }}
              className={messageClassName}
            >
              <motion.span
                key={msg.text}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={idx === 1 ? 'text-sm' : 'text-base'}
              >
                {state.translatingIndex === idx ? 'translating...' : msg.text}
              </motion.span>
            </div>
          );
        })}
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

