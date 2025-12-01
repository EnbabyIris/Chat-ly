'use client';

import { useState, useEffect, useRef, useCallback, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthPage } from '@/hooks/use-auth-page';
import { useCursorPosition } from '@/hooks/use-cursor-position';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { Send, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMING } from '@/lib/constants/timing';
import { SIZES } from '@/lib/constants/sizes';
import { SHADOWS } from '@/lib/constants/shadows';
import { BORDERS } from '@/lib/constants/borders';

interface DemoMessage {
  initial: string;
  aiSuggestion: string;
  final: string;
}

const demoMessages: DemoMessage[] = [
  {
    initial: 'Hey, how are',
    aiSuggestion: 'Hey, how are you doing today?',
    final: 'Hey, how are you doing today?',
  },
  {
    initial: 'Can you help',
    aiSuggestion: 'Can you help me with this task?',
    final: 'Can you help me with this task?',
  },
  {
    initial: 'What time is',
    aiSuggestion: 'What time is the meeting scheduled?',
    final: 'What time is the meeting scheduled?',
  },
];

interface Step3InputState {
  message: string;
  suggestion: string;
  displayText: string;
  isRemoving: boolean;
}

interface Step3AnimationState {
  step: number;
  sentMessage: string;
  isSending: boolean;
  demoIndex: number;
}

export const Step3ChatDemo = () => {
  const [inputState, setInputState] = useState<Step3InputState>({
    message: '',
    suggestion: '',
    displayText: '',
    isRemoving: false,
  });
  const [animationState, setAnimationState] = useState<Step3AnimationState>({
    step: 0,
    sentMessage: '',
    isSending: false,
    demoIndex: 0,
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const suggestionBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthPage = useAuthPage();
  const { cursorPosition, positionCursorAtElement, positionCursorAtCenter } =
    useCursorPosition();
  const { spring } = useAnimationConfig();
  const [isPending, startTransition] = useTransition();

  const positionCursorAtInput = useCallback(() => {
    positionCursorAtElement(inputRef.current, containerRef.current, -30);
  }, [positionCursorAtElement]);

  const moveCursorToSuggestion = useCallback(() => {
    positionCursorAtCenter(suggestionBarRef.current, containerRef.current);
  }, [positionCursorAtCenter]);

  const moveCursorToSendButton = useCallback(() => {
    positionCursorAtCenter(sendButtonRef.current, containerRef.current);
  }, [positionCursorAtCenter]);

  const typeText = useCallback((textToType: string, callback: () => void) => {
    let currentIndex = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (currentIndex < textToType.length) {
        setInputState((prev) => ({
          ...prev,
          message: textToType.slice(0, currentIndex + 1),
        }));
        currentIndex++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (callback) callback();
      }
    }, TIMING.typeText);
  }, []);

  const showAISuggestion = useCallback((suggestion: string, callback: () => void) => {
    let currentIndex = 0;
    setInputState((prev) => ({
      ...prev,
      suggestion: '',
      displayText: '',
      isRemoving: false,
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (currentIndex < suggestion.length) {
        const newText = suggestion.slice(0, currentIndex + 1);
        setInputState((prev) => ({
          ...prev,
          suggestion: newText,
          displayText: newText,
        }));
        currentIndex++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (callback) callback();
      }
    }, TIMING.aiSuggestion);
  }, []);

  const clearMessage = useCallback((callback: () => void) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    let callbackCalled = false;
    intervalRef.current = setInterval(() => {
      setInputState((prev) => {
        if (prev.message.length > 0) {
          return { ...prev, message: prev.message.slice(0, -1) };
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
    }, TIMING.clearMessage);
  }, []);

  const clearAISuggestion = useCallback((callback: () => void) => {
    setInputState((prev) => ({ ...prev, isRemoving: true }));
    const textLength = inputState.displayText.length;
    const timer = setTimeout(() => {
      setInputState((prev) => ({
        ...prev,
        displayText: '',
        suggestion: '',
        isRemoving: false,
      }));
      if (callback) callback();
    }, textLength * 10 + 100);

    return () => clearTimeout(timer);
  }, [inputState.displayText]);

  const startAnimationSequence = useCallback((demoIndex: number) => {
    const currentDemo = demoMessages[demoIndex];
    if (!currentDemo) return;

    setAnimationState((prev) => ({ ...prev, step: 1 }));
    positionCursorAtInput();

    timeoutRef.current = setTimeout(() => {
      setAnimationState((prev) => ({ ...prev, step: 2 }));
      typeText(currentDemo.initial, () => {
        timeoutRef.current = setTimeout(() => {
          setAnimationState((prev) => ({ ...prev, step: 3 }));
          showAISuggestion(currentDemo.aiSuggestion, () => {
            timeoutRef.current = setTimeout(() => {
              setAnimationState((prev) => ({ ...prev, step: 4 }));
              moveCursorToSuggestion();

              timeoutRef.current = setTimeout(() => {
                setAnimationState((prev) => ({ ...prev, step: 5 }));
                setInputState((prev) => ({ ...prev, message: currentDemo.final }));
                clearAISuggestion(() => {});

                timeoutRef.current = setTimeout(() => {
                  setAnimationState((prev) => ({ ...prev, step: 6 }));
                  moveCursorToSendButton();

                  timeoutRef.current = setTimeout(() => {
                    setAnimationState((prev) => ({
                      ...prev,
                      step: 7,
                      isSending: true,
                      sentMessage: currentDemo.final,
                    }));

                    timeoutRef.current = setTimeout(() => {
                      setInputState({
                        message: '',
                        suggestion: '',
                        displayText: '',
                        isRemoving: false,
                      });
                      setAnimationState((prev) => ({
                        ...prev,
                        isSending: false,
                      }));

                      timeoutRef.current = setTimeout(() => {
                        setAnimationState((prev) => ({
                          ...prev,
                          step: 8,
                          sentMessage: '',
                        }));
                        positionCursorAtInput();

                        const nextIndex = (demoIndex + 1) % demoMessages.length;
                        setAnimationState((prev) => ({ ...prev, demoIndex: nextIndex }));

                        timeoutRef.current = setTimeout(() => {
                          startAnimationSequence(nextIndex);
                        }, TIMING.sendDelay);
                      }, TIMING.messageDisplay);
                    }, TIMING.sendDelay);
                  }, TIMING.stepDelay);
                }, TIMING.stepDelay);
              }, TIMING.stepDelay);
            }, TIMING.suggestionDelay);
          });
        }, TIMING.animationStart);
      });
    }, TIMING.animationStart);
  }, [positionCursorAtInput, moveCursorToSuggestion, moveCursorToSendButton, typeText, showAISuggestion, clearAISuggestion]);

  const displayTextChars = useMemo(
    () => (inputState.displayText ? inputState.displayText.split('') : []),
    [inputState.displayText]
  );

  const containerClassName = useMemo(
    () => cn(
      'flex flex-col items-center mb-1 relative rounded-lg overflow-hidden bg-white',
      isAuthPage ? 'mx-0' : 'mx-6',
      BORDERS.default,
      'border'
    ),
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

  useEffect(() => {
    if (inputRef.current && inputState.message !== inputRef.current.value) {
      inputRef.current.value = inputState.message;
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
  }, [inputState.message]);

  return (
    <div ref={containerRef} className="flex flex-col px-2 py-1 relative">
      <AnimatePresence>
        {animationState.sentMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="mb-2 flex justify-end"
          >
            <div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2 shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-sm">{animationState.sentMessage}</span>
                <Check className="h-3 w-3 shrink-0" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ boxShadow: SHADOWS.card }} className={containerClassName}>
        <div className="w-full bg-white flex items-center gap-2 px-2">
          <textarea
            ref={inputRef}
            placeholder="Enter a message.."
            value={inputState.message}
            onChange={() => {}}
            readOnly
            className={cn(
              'flex-1 text-neutral-400 resize-none border-0 outline-none bg-transparent px-2 py-1 overflow-y-auto scrollbar-none flex items-center',
              `max-h-[${SIZES.input.maxHeight}px]`,
              'text-sm'
            )}
            style={{
              fontSize: `${SIZES.input.fontSize}px`,
              height: `${SIZES.input.minHeight}px`,
              lineHeight: SIZES.input.lineHeight,
              display: 'flex',
              alignItems: 'center',
            }}
          />
          <button
            ref={sendButtonRef}
            className={cn(
              SIZES.button.small.className,
              'flex items-center justify-center rounded-full transition-all duration-300 shrink-0 bg-black/80',
              `shadow-[${SHADOWS.button}]`
            )}
            aria-label="Send Message"
            disabled={!inputState.message.trim()}
          >
            {animationState.isSending ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </button>
        </div>

        <div
          className={cn(
            'relative py-1 w-full focus:outline-none outline-none bg-white shadow-sm border-t',
            BORDERS.default
          )}
        >
          <div className="relative flex items-center ml-2 rounded-md pr-4">
            <div
              ref={suggestionBarRef}
              style={{ boxShadow: SHADOWS.cardInset }}
              className="text-sm w-full px-2 pr-16 bg-neutral-100 rounded-md text-neutral-400 cursor-pointer min-h-[28px] flex items-center"
            >
              <AnimatePresence mode="popLayout">
                {inputState.displayText ? (
                  <motion.div
                    key="text"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="truncate whitespace-nowrap overflow-hidden"
                  >
                    {displayTextChars.map((char, index) => (
                      <motion.span
                        key={`${inputState.displayText}-${index}`}
                        initial={{ opacity: 1, y: 0, scale: 1 }}
                        animate={
                          inputState.isRemoving
                            ? { opacity: 0, y: -4, scale: 0.8 }
                            : { opacity: 1, y: 0, scale: 1 }
                        }
                        transition={{
                          delay: inputState.isRemoving ? index * 0.003 : 0,
                          duration: 0.2,
                          ease: 'easeInOut',
                        }}
                        style={{ display: 'inline-block' }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </motion.div>
                ) : (
                  <motion.span
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-neutral-400"
                  >
                    AI suggestion will appear here...
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div
              style={{ boxShadow: SHADOWS.buttonInset }}
              className={cn(
                'absolute bg-white rounded-sm h-fit px-1 right-5 top-1/2 -translate-y-1/2 text-xs flex items-center text-neutral-500 font-medium border',
                BORDERS.default
              )}
            >
              Tab
            </div>
          </div>
        </div>
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
