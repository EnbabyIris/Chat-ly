'use client';

import { useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { PlusIcon } from '@/assets/svg/plus-icon';
import { GITHUB_BADGE_CONFIG } from '@/lib/constants/github-badge';

export const GithubBadge = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { 
    container, 
    cornerIcon, 
    badge, 
    githubButton, 
    cornerPositions 
  } = GITHUB_BADGE_CONFIG;

  return (
    <div className={`${container.base} ${container.scale.mobile} ${container.scale.desktop}`}>
      {cornerPositions.map((corner, index) => (
        <PlusIcon
          key={index}
          className={`absolute ${corner.position} ${cornerIcon.size}`}
        />
      ))}

      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={badge.base}
      >
        <span className={badge.text.classes}>{badge.text.label}</span>
        <div
          className={`${githubButton.base} ${
            isHovered ? githubButton.hover.margin : githubButton.default.margin
          }`}
        >
          <FaGithub className={`${githubButton.iconSize} ${githubButton.iconColor}`} />
          <span className={githubButton.text.classes}>
            {githubButton.text.content}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

