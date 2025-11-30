'use client';

import { PixelBlast } from './pixel-blast';
import { FeatureHeader } from './feature-header';

interface VideoPreviewProps {
  translateX: string;
  translateY: string;
  translateZ: string;
  rotateY: string;
  rotateX: string;
  scale: number;
}

const VideoPreview = ({
  translateX,
  translateY,
  translateZ,
  rotateY,
  rotateX,
  scale,
}: VideoPreviewProps) => {
  return (
    <div
      className="h-48 w-64 absolute bottom-6 group left-1/2 bg-white rounded-lg overflow-hidden border border-neutral-200 shadow-md transition-transform duration-300 ease-out transform-3d"
      style={{
        transform: `translateX(${translateX}) translateY(${translateY}) translateZ(${translateZ}) rotateY(${rotateY}) rotateX(${rotateX}) scale(${scale})`,
      }}
    >
      <div className="h-6 border-b border-neutral-200 flex bg-gray-100 items-center px-3 justify-center">
        <div className="size-3 rounded bg-neutral-400 flex items-center justify-center">
          <div className="size-full scale-50 rounded-full bg-neutral-200" />
        </div>
      </div>

      <div className="absolute inset-4 mt-5 mx-auto bg-gray-100 rounded-sm border border-neutral-200">
        <PixelBlast
          variant="circle"
          pixelSize={6}
          color="#d0d0d0"
          patternScale={3}
          patternDensity={2}
          pixelSizeJitter={0.5}
          speed={0.6}
          edgeFade={0.25}
          transparent
        />
      </div>
      <div className="absolute bottom-2 left-20 right-20 h-4 mx-auto bg-white border border-neutral-200 shadow-sm rounded flex items-center justify-center gap-2 px-2">
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="4"
            y="2"
            width="4"
            height="6"
            rx="2"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path d="M6 9V11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M3 6H9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>

        <div className="w-px h-2 bg-neutral-300" />

        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="6" cy="6" r="5" fill="#EF4444" stroke="#EF4444" strokeWidth="0.5" />
          <path
            d="M4 4L8 8M8 4L4 8"
            stroke="white"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        <div className="w-px h-2 bg-neutral-300" />

        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2"
            y="4"
            width="8"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M8 4L10 2H11V10H10L8 8"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <circle cx="6" cy="7" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </div>
    </div>
  );
};

interface VideoCallBoxProps {
  className?: string;
}

export const VideoCallBox = ({ className = '' }: VideoCallBoxProps) => {
  return (
    <div
      className={`bg-neutral-50 border relative border-neutral-300 gap-6 rounded-lg px-4 py-4 ${className}`}
      style={{ perspective: '1000px' }}
    >
      <FeatureHeader title="Video Call" description="Face-to-face conversations anywhere" />

      <>
        <VideoPreview
          translateX="-24%"
          translateY="10%"
          translateZ="-10px"
          rotateY="-45deg"
          rotateX="10deg"
          scale={0.7}
        />
        <VideoPreview
          translateX="-80%"
          translateY="-10%"
          translateZ="-10px"
          rotateY="40deg"
          rotateX="10deg"
          scale={0.55}
        />
      </>
    </div>
  );
};

