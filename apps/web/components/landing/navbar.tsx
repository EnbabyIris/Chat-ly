'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/assets/svg/arrow-right-icon';
import { NAVBAR_CONFIG } from '@/lib/constants/navbar';

export const Navbar = () => {
  const { 
    height,
    logoSize,
    brandName,
    brandNameClasses,
    button,
    icon,
    padding,
  } = NAVBAR_CONFIG;

  return (
    <nav 
      className={`${height} flex items-center justify-between ${padding.horizontal} ${padding.desktop} absolute top-0 left-0 right-0`}
      aria-label="Main navigation"
    >
      <Link 
        href="/" 
        className="flex items-center gap-2"
        aria-label={`${brandName} home`}
      >
        <Image
          src="/logo.png"
          alt={`${brandName} logo`}
          width={logoSize.width}
          height={logoSize.height}
          className={logoSize.className}
          priority
        />
        <h1 className={brandNameClasses}>{brandName}</h1>
      </Link>
      
      <Link 
        href="/auth"
        className={`${button.classes} hover:opacity-80 transition-opacity`}
        aria-label="Get started with Chat-ly"
      >
        {button.text}
        <ArrowRightIcon 
          className={icon.size} 
          stroke={icon.stroke} 
          aria-hidden="true"
        />
      </Link>
    </nav>
  );
};

