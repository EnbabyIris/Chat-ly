'use client';

import { useRef, useEffect, useState } from 'react';
import { Step1ChatDemo } from  './step1-chat-demo';
import { Step2ChatDemo } from './step2-chat-demo';
import { Step3ChatDemo } from './step3-chat-demo';
import { Step4ChatDemo } from './step4-chat-demo';

interface StepFeature {
  id: number;
  title: string;
  description: string;
  gradient: string;
  position: {
    top: string;
    left: string;
    width: string;
    height: string;
    transform: string;
  };
}

interface EmptyChatStateProps {
  isAuthPage?: boolean;
}

export const EmptyChatState = ({ isAuthPage = false }: EmptyChatStateProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<Array<{ d: string; type: string }>>([]);

  const stepFeatures: StepFeature[] = [
    {
      id: 1,
      title: 'Search & Connect',
      description: 'Find users by name or email to start conversations',
      gradient:
        'bg-[radial-gradient(circle,#3b82f6,#60a5fa,#93c5fd,#bfdbfe,transparent,transparent)]',
      position: {
        top: '2%',
        left: '0%',
        width: '42%',
        height: '36%',
        transform: 'scale(0.85)',
      },
    },
    {
      id: 2,
      title: 'Browse Chats',
      description: 'Navigate through your conversations and group chats',
      gradient:
        'bg-[radial-gradient(circle,#fb923c,#fdba74,#fed7aa,#ffedd5,transparent,transparent)]',
      position: {
        top: '4%',
        left: '50%',
        width: '50%',
        height: '40%',
        transform: 'scale(0.95)',
      },
    },
    {
      id: 4,
      title: 'Multilingual Translation',
      description: 'Translate messages instantly between different languages',
      gradient:
        'bg-[radial-gradient(circle,#a78bfa,#c4b5fd,#ddd6fe,#ede9fe,transparent,transparent)]',
      position: {
        top: '40%',
        left: '3%',
        width: '45%',
        height: '42%',
        transform: 'scale(0.93)',
      },
    },
    {
      id: 3,
      title: 'AI Message Assistant',
      description: 'Get smart suggestions to complete and improve your messages',
      gradient:
        'bg-[radial-gradient(circle,#34d399,#6ee7b7,#a7f3d0,#d1fae5,transparent,transparent)]',
      position: {
        top: '50%',
        left: '55%',
        width: '45%',
        height: '38%',
        transform: 'scale(0.95)',
      },
    },
  ];

  useEffect(() => {
    const calculateLines = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines: Array<{ d: string; type: string }> = [];

      const connections = [
        { start: 1, end: 2, type: 'horizontal' },
        { start: 4, end: 3, type: 'horizontal' },
        { start: 1, end: 4, type: 'vertical' },
        { start: 2, end: 3, type: 'vertical' },
      ];

      connections.forEach(({ start, end, type }) => {
        const startEl = boxRefs.current[start];
        const endEl = boxRefs.current[end];

        if (startEl && endEl) {
          const startRect = startEl.getBoundingClientRect();
          const endRect = endEl.getBoundingClientRect();

          if (type === 'horizontal') {
            const startX = startRect.right - containerRect.left;
            const startY = startRect.top + startRect.height / 2 - containerRect.top;
            const endX = endRect.left - containerRect.left;
            const endY = endRect.top + endRect.height / 2 - containerRect.top;

            const midX = (startX + endX) / 2;

            [-10, -6, -2, 2, 6, 10].forEach((offset, index) => {
              newLines.push({
                d: `M ${startX} ${startY + offset} L ${midX + -index * 4} ${startY + offset} L ${midX + -index * 4} ${endY + offset} L ${endX} ${endY + offset}`,
                type: 'horizontal',
              });
            });
          } else {
            const startX = startRect.left + startRect.width / 2 - containerRect.left;
            const startY = startRect.bottom - containerRect.top;
            const endX = endRect.left + endRect.width / 2 - containerRect.left;
            const endY = endRect.top - containerRect.top;

            const midY = (startY + endY) / 2;

            [-10, -6, -2, 2, 6, 10].forEach((offset, index) => {
              newLines.push({
                d: `M ${startX + offset} ${startY} L ${startX + offset} ${midY + -index * 4} L ${endX + offset} ${midY + -index * 4} L ${endX + offset} ${endY}`,
                type: 'vertical',
              });
            });
          }
        }
      });
      setLines(newLines);
    };

    calculateLines();
    window.addEventListener('resize', calculateLines);
    const timeout = setTimeout(calculateLines, 100);

    return () => {
      window.removeEventListener('resize', calculateLines);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full p-4">
      <svg className="absolute inset-0 pointer-events-none z-0 overflow-visible">
        {lines.map((line, i) => (
          <path
            key={i}
            d={line.d}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
            fill="none"
          />
        ))}
      </svg>
      {stepFeatures.map((step) => (
        <div
          key={step.id}
          ref={(el) => {
            boxRefs.current[step.id] = el;
          }}
          style={step.position}
          className="absolute p-3 border border-neutral-200 rounded-xl overflow-hidden"
        >
          <div
            className={`group h-full w-full rounded-lg p-3 flex flex-col gap-2 overflow-hidden ${
              isAuthPage
                ? 'bg-white shadow-md border border-neutral-200'
                : ''
            }`}
          >
            {!isAuthPage && (
              <div
                className={`w-full z-0 h-full scale-75 ease-out group-hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-80 translate-y-1/2 absolute bottom-0 left-1/2 ${step.gradient} blur-3xl`}
              ></div>
            )}
            <div className="mb-3 shrink-0 relative z-10">
              <p className="text-lg font-saira font-medium text-neutral-600">
                {step.title}
              </p>
              <p className="text-sm text-neutral-400">{step.description}</p>
            </div>
            <div className="relative z-10">
              {step.id === 1 && <Step1ChatDemo />}
              {step.id === 2 && <Step2ChatDemo />}
              {step.id === 3 && <Step3ChatDemo />}
              {step.id === 4 && <Step4ChatDemo />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

