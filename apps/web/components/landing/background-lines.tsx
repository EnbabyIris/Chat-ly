'use client';

import { PlusIcon } from '@/assets/svg/plus-icon';
import { BACKGROUND_LINES_CONFIG } from '@/lib/constants/background-lines';

export const BackgroundLines = () => {
  const { 
    stroke,
    iconSize,
    zIndex,
    topOffset, 
    bottomOffset, 
    lineColor, 
    lineWidth, 
    verticalLineWidth,
    leftOffset,
    rightOffset,
  } = BACKGROUND_LINES_CONFIG;

  const cornerBaseClasses = `absolute ${zIndex} ${iconSize}`;
  const horizontalLineClasses = `absolute ${lineWidth} w-full ${lineColor}`;
  const verticalLineClasses = `absolute top-0 h-full ${verticalLineWidth} ${lineColor}`;
  const leftClasses = `${leftOffset.mobile} ${leftOffset.tablet} ${leftOffset.desktop}`;
  const rightClasses = `${rightOffset.mobile} ${rightOffset.tablet} ${rightOffset.desktop}`;

  return (
    <div className="absolute inset-0">
      <div className={`${cornerBaseClasses} ${topOffset} ${leftClasses} -translate-x-1/2 -translate-y-1/2`}>
        <PlusIcon className={iconSize} stroke={stroke} />
      </div>
      
      <div className={`${cornerBaseClasses} ${bottomOffset} ${leftClasses} -translate-x-1/2 translate-y-1/2`}>
        <PlusIcon className={iconSize} stroke={stroke} />
      </div>
      
      <div className={`${cornerBaseClasses} ${topOffset} ${rightClasses} translate-x-1/2 -translate-y-1/2`}>
        <PlusIcon className={iconSize} stroke={stroke} />
      </div>
      
      <div className={`${cornerBaseClasses} ${bottomOffset} ${rightClasses} translate-x-1/2 translate-y-1/2`}>
        <PlusIcon className={iconSize} stroke={stroke} />
      </div>
      
      <div className={`${horizontalLineClasses} ${topOffset}`} />
      <div className={`${horizontalLineClasses} ${bottomOffset}`} />
      
      <div className={`${verticalLineClasses} ${leftClasses}`} />
      <div className={`${verticalLineClasses} ${rightClasses}`} />
    </div>
  );
};

