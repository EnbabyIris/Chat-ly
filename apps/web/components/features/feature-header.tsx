'use client';

interface FeatureHeaderProps {
  title: string;
  description: string;
}

export const FeatureHeader = ({ title, description }: FeatureHeaderProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-0.5 pr-4">
        <h1 className="text-sm font-saira font-medium text-neutral-500 flex gap-1">
          {title}
        </h1>
        <h3 className="text-xs font-medium text-neutral-400">{description}</h3>
      </div>
    </div>
  );
};

