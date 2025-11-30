'use client';

import { RealTimeMessagingBox } from '@/components/features/real-time-messaging-box';
import { AudioCallBox } from '@/components/features/audio-call-box';
import { VideoCallBox } from '@/components/features/video-call-box';
import { StoriesBox } from '@/components/features/stories-box';
import { LiveLocationBox } from '@/components/features/live-location-box';
import { MessageTypeBox } from '@/components/features/message-type-box';
import { MultilingualBox } from '@/components/features/multilingual-box';

export const FeaturesSection = () => {
  return (
    <section className="w-full flex items-center justify-center">
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto md:h-[1200px] lg:h-[600px] w-full"
        style={{ gridAutoRows: '1fr' }}
      >
        <RealTimeMessagingBox />
        <AudioCallBox />
        <VideoCallBox />
        <StoriesBox />

        <LiveLocationBox />
        <MessageTypeBox />
        <MultilingualBox />
      </div>
    </section>
  );
};

