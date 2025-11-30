'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FeatureHeader } from './feature-header';

interface WordBoxProps {
  children: React.ReactNode;
  className?: string;
  translateX?: number;
}

const WordBox = React.forwardRef<HTMLSpanElement, WordBoxProps>(
  ({ children, className = '', translateX = 0 }, ref) => (
    <span
      ref={ref}
      className={`bg-black/10 text-neutral-500 rounded-lg overflow-hidden p-0.5 sm:p-1 flex items-center justify-center relative w-fit shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.3)] ${className}`}
      style={{ transform: `translateX(${translateX}px)` }}
    >
      <span className="bg-white px-2 z-10 flex items-center justify-center py-0.5 relative rounded-md font-medium font-saira text-[10px] md:text-xs text-neutral-500 shadow-[0_1px_2px_0_rgba(0,0,0,0.3)]">
        {children}
      </span>
    </span>
  )
);
WordBox.displayName = 'WordBox';

interface EnglishBoxProps {
  language: string;
}

const EnglishBox = React.forwardRef<HTMLSpanElement, EnglishBoxProps>(
  ({ language }, ref) => (
    <span
      ref={ref}
      style={{ boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.3)' }}
      className="bg-black/10 text-neutral-500 rounded-lg overflow-hidden p-0.5 sm:p-1 flex items-center justify-center relative"
    >
      <span
        style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)' }}
        className="bg-white px-2 z-10 flex items-center text-sm md:text-lg justify-center py-0.5 relative rounded-md font-medium font-saira"
      >
        {language ? language.charAt(0).toUpperCase() + language.slice(1) : 'English'}
      </span>
    </span>
  )
);
EnglishBox.displayName = 'EnglishBox';

interface Word {
  english: string;
  x?: number;
  delay?: number;
  translations: Record<string, string>;
}

interface RightWordsProps {
  words: Word[];
  wordRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>;
  language: string;
}

const RightWords = ({ words, wordRefs, language }: RightWordsProps) => (
  <div className="flex flex-col justify-center space-y-1.5 relative z-10">
    {words.map((word, index) => (
      <WordBox
        key={index}
        translateX={word.x ? -word.x : 0}
        ref={(el) => {
          if (wordRefs.current) {
            wordRefs.current[index] = el;
          }
        }}
      >
        {word.translations[language] || word.english}
      </WordBox>
    ))}
  </div>
);

interface ConnectionLine {
  path: string;
}

interface ConnectionLinesProps {
  leftLines: ConnectionLine[];
  rightLines: ConnectionLine[];
  words: Word[];
}

const ConnectionLines = ({ leftLines, rightLines, words }: ConnectionLinesProps) => (
  <svg className="absolute inset-0 pointer-events-none z-0" style={{ overflow: 'visible' }}>
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {[...leftLines, ...rightLines].map((_, index) => {
        const wordIndex = index < leftLines.length ? index : index - leftLines.length;
        const delay = words[wordIndex]?.delay || 0;
        return (
          <motion.linearGradient
            key={`gradient-${index}`}
            id={`gradient-${index}`}
            initial={{ x1: '0%', x2: '10%', y1: '0%', y2: '0%' }}
            animate={{
              x1: ['0%', '100%'],
              x2: ['10%', '110%'],
              y1: ['0%', '0%'],
              y2: ['0%', '0%'],
            }}
            transition={{
              duration: 3,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'loop',
              delay,
            }}
          >
            <stop stopColor="#10b981" stopOpacity="0" />
            <stop offset="30%" stopColor="#05df7230" stopOpacity="1" />
            <stop offset="50%" stopColor="#05df7260" stopOpacity="1" />
            <stop offset="70%" stopColor="#05df72" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </motion.linearGradient>
        );
      })}
    </defs>

    {leftLines.map((line, index) => (
      <path
        key={`left-${index}`}
        d={line.path}
        stroke="rgba(0, 0, 0, 0.2)"
        strokeWidth="1"
        fill="none"
      />
    ))}
    {rightLines.map((line, index) => (
      <path
        key={`right-${index}`}
        d={line.path}
        stroke="rgba(0, 0, 0, 0.2)"
        strokeWidth="1"
        fill="none"
      />
    ))}

    {leftLines.map((line, index) => (
      <motion.path
        key={`left-animated-${index}`}
        d={line.path}
        stroke={`url(#gradient-${index})`}
        strokeWidth="1"
        fill="none"
        strokeOpacity="1"
        filter="url(#glow)"
      />
    ))}
    {rightLines.map((line, index) => (
      <motion.path
        key={`right-animated-${index}`}
        d={line.path}
        stroke={`url(#gradient-${leftLines.length + index})`}
        strokeWidth="1"
        fill="none"
        strokeOpacity="1"
        filter="url(#glow)"
      />
    ))}
  </svg>
);

const languages = [
  'spanish',
  'french',
  'german',
  'italian',
  'portuguese',
  'japanese',
  'chinese',
  'arabic',
];

interface MultilingualBoxProps {
  className?: string;
}

export const MultilingualBox = ({ className = '' }: MultilingualBoxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const englishBoxRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rightWordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [leftLines, setLeftLines] = useState<ConnectionLine[]>([]);
  const [rightLines, setRightLines] = useState<ConnectionLine[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('spanish');

  const words: Word[] = [
    {
      english: 'Hello',
      x: 15,
      delay: 0.2,
      translations: {
        spanish: 'Hola',
        french: 'Bonjour',
        german: 'Hallo',
        italian: 'Ciao',
        portuguese: 'Olá',
        japanese: 'こんにちは',
        chinese: '你好',
        arabic: 'مرحبا',
      },
    },
    {
      english: 'Love',
      x: 3,
      delay: 0.8,
      translations: {
        spanish: 'Amor',
        french: 'Amour',
        german: 'Liebe',
        italian: 'Amore',
        portuguese: 'Amor',
        japanese: '愛',
        chinese: '爱',
        arabic: 'حب',
      },
    },
    {
      english: 'Peace',
      x: 22,
      delay: 0.4,
      translations: {
        spanish: 'Paz',
        french: 'Paix',
        german: 'Frieden',
        italian: 'Pace',
        portuguese: 'Paz',
        japanese: '平和',
        chinese: '和平',
        arabic: 'سلام',
      },
    },
    {
      english: 'Music',
      x: 7,
      delay: 1.1,
      translations: {
        spanish: 'Música',
        french: 'Musique',
        german: 'Musik',
        italian: 'Musica',
        portuguese: 'Música',
        japanese: '音楽',
        chinese: '音乐',
        arabic: 'موسيقى',
      },
    },
    {
      english: 'Dream',
      x: 18,
      delay: 0.6,
      translations: {
        spanish: 'Sueño',
        french: 'Rêve',
        german: 'Traum',
        italian: 'Sogno',
        portuguese: 'Sonho',
        japanese: '夢',
        chinese: '梦',
        arabic: 'حلم',
      },
    },
    {
      english: 'Hope',
      x: 11,
      delay: 0.9,
      translations: {
        spanish: 'Esperanza',
        french: 'Espoir',
        german: 'Hoffnung',
        italian: 'Speranza',
        portuguese: 'Esperança',
        japanese: '希望',
        chinese: '希望',
        arabic: 'أمل',
      },
    },
  ];

  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current || !englishBoxRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const englishRect = englishBoxRef.current.getBoundingClientRect();

      const newLeftLines = wordRefs.current
        .filter((ref) => ref !== null)
        .map((wordRef) => {
          if (!wordRef) return { path: '' };
          const wordRect = wordRef.getBoundingClientRect();

          const x1 = wordRect.right - containerRect.left;
          const y1 = wordRect.top + wordRect.height / 2 - containerRect.top;

          const x2 = englishRect.left - containerRect.left;
          const y2 = englishRect.top + englishRect.height / 2 - containerRect.top;

          const distance = x2 - x1;

          const controlX1 = x1 + distance * 0.3;
          const controlX2 = x1 + distance * 0.7;
          const controlY1 = y1;
          const controlY2 = y2;

          const path = `M ${x1} ${y1} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`;

          return { path };
        });

      setLeftLines(newLeftLines);

      const newRightLines = rightWordRefs.current
        .filter((ref) => ref !== null)
        .map((wordRef) => {
          if (!wordRef) return { path: '' };
          const wordRect = wordRef.getBoundingClientRect();

          const x1 = englishRect.right - containerRect.left;
          const y1 = englishRect.top + englishRect.height / 2 - containerRect.top;

          const x2 = wordRect.left - containerRect.left;
          const y2 = wordRect.top + wordRect.height / 2 - containerRect.top;

          const distance = x2 - x1;

          const controlX1 = x1 + distance * 0.3;
          const controlX2 = x1 + distance * 0.7;
          const controlY1 = y1;
          const controlY2 = y2;

          const path = `M ${x1} ${y1} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`;

          return { path };
        });

      setRightLines(newRightLines);
    };

    updateLines();
    window.addEventListener('resize', updateLines);

    const timeout = setTimeout(updateLines, 100);

    return () => {
      window.removeEventListener('resize', updateLines);
      clearTimeout(timeout);
    };
  }, [currentLanguage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLanguage((prev) => {
        const currentIndex = languages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % languages.length;
        return languages[nextIndex];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`bg-neutral-50 border border-neutral-300 relative rounded-lg col-span-1 md:col-span-2 px-2 sm:px-4 py-2 md:py-4 overflow-visible ${className}`}
    >
      <div className="mb-4">
        <FeatureHeader
          title="Multilingual"
          description="Translate messages in real-time over 10+ languages"
        />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col justify-center space-y-1.5">
          {words.map((word, index) => (
            <WordBox
              key={index}
              translateX={word.x || 0}
              ref={(el) => {
                if (wordRefs.current) {
                  wordRefs.current[index] = el;
                }
              }}
            >
              {word.english}
            </WordBox>
          ))}
        </div>

        <div className="flex items-center justify-center text-xs md:text-sm text-neutral-500 font-medium font-saira relative z-30">
          <EnglishBox ref={englishBoxRef} language={currentLanguage} />
        </div>

        <RightWords words={words} wordRefs={rightWordRefs} language={currentLanguage} />
      </div>

      <ConnectionLines leftLines={leftLines} rightLines={rightLines} words={words} />
    </div>
  );
};

