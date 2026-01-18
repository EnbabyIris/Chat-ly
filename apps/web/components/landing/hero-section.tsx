'use client';

import Image from 'next/image';
import { MainButton } from '@/components/landing/main-button';
import { GithubBadge } from '@/components/ui/github-badge';
import { HERO_SECTION_CONFIG } from '@/lib/constants/hero-section';
import heroSectionImage from '@/assets/herosection.png';

export const HeroSection = () => {
  const {
    section,
    heading,
    buttonContainer,
    imageContainer,
    imageWrapper,
    mask,
    image,
  } = HERO_SECTION_CONFIG;

  return (
    <section
      className={`${section.base} ${section.padding.mobile} ${section.padding.desktop}`}
    >
      <GithubBadge />

      <h2
        className={`${heading.base} ${heading.margin.mobile} ${heading.margin.desktop}`}
      >
        better way to talk
        <br />
        <span className={heading.highlight.classes}>
          {heading.highlight.text}
        </span>{' '}
        way to connect
      </h2>

      <div
        className={`${buttonContainer.base} ${buttonContainer.margin.mobile} ${buttonContainer.margin.desktop} ${buttonContainer.padding.mobile} ${buttonContainer.padding.desktop}`}
      >
        <MainButton className="h-fit">Try Chat-ly</MainButton>
      </div>

      <div
        className={`${imageContainer.base} ${imageContainer.margin.mobile} ${imageContainer.margin.desktop} ${imageContainer.padding.mobile} ${imageContainer.padding.desktop}`}
      >
        <div className={imageWrapper.base}>
          <div className={`${mask.base} ${mask.mobile} ${mask.desktop}`} />
          <div className={imageWrapper.border}>
            <Image
              src={heroSectionImage}
              alt={image.alt}
              width={1200}
              height={800}
              className={image.base}
              priority
              unoptimized
            />
          </div>
        </div>
      </div>
    </section>
  );
};

