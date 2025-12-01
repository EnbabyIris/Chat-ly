import { useState, useCallback } from 'react';
import { MotionValue } from 'framer-motion';

export interface CursorPosition {
  top: number;
  left: number;
}

export const useCursorPosition = () => {
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    top: 0,
    left: 0,
  });

  const positionCursorAtElement = useCallback(
    (
      element: HTMLElement | null,
      container: HTMLElement | null,
      offsetX = -30,
      offsetY = -14
    ) => {
      if (!element || !container) return;

      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setCursorPosition({
        top: elementRect.top - containerRect.top + elementRect.height / 2 + offsetY,
        left: elementRect.right - containerRect.left + offsetX,
      });
    },
    []
  );

  const positionCursorAtCenter = useCallback(
    (
      element: HTMLElement | null,
      container: HTMLElement | null,
      offsetY = -14
    ) => {
      if (!element || !container) return;

      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setCursorPosition({
        top: elementRect.top - containerRect.top + elementRect.height / 2 + offsetY,
        left: elementRect.left - containerRect.left + elementRect.width / 2 + offsetY,
      });
    },
    []
  );

  return {
    cursorPosition,
    setCursorPosition,
    positionCursorAtElement,
    positionCursorAtCenter,
  };
};

