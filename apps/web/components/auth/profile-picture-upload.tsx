'use client';

import { useState, useRef } from 'react';
import { Camera, X, Loader2, Shuffle } from 'lucide-react';
import Image from 'next/image';
import { useCloudinaryUpload } from '@/lib/cloudinary';

interface ProfilePictureUploadProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
  disabled?: boolean;
}

export function ProfilePictureUpload({
  value,
  onChange,
  error,
  disabled = false
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isConfigured } = useCloudinaryUpload();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadImage(file, {
        folder: 'profile-pictures',
      });
      onChange(result.secure_url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateRandom = async () => {
    setIsUploading(true);
    try {
      // Generate random avatar using DiceBear API
      const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd93d,ff8a65,ff6b9d,87ceeb,98d8c8,f7dc6f,bb8fce&size=128`;

      // Upload to Cloudinary for consistent storage
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      const file = new File([blob], `avatar-${randomId}.svg`, { type: 'image/svg+xml' });

      const result = await uploadImage(file, {
        folder: 'profile-pictures',
        publicId: `random-avatar-${randomId}`,
      });

      onChange(result.secure_url);
    } catch (error) {
      console.error('Failed to generate random avatar:', error);
      // Fallback: generate a simple colored circle avatar
      const colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#87CEEB'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const fallbackUrl = `data:image/svg+xml;base64,${btoa(`<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg"><circle cx="64" cy="64" r="64" fill="${randomColor}"/><circle cx="64" cy="40" r="20" fill="white"/><path d="M64 70 Q50 85 40 95 Q64 80 88 95 Q78 85 64 70" fill="white"/></svg>`)}`;
      onChange(fallbackUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && isConfigured) {
      fileInputRef.current?.click();
    }
  };

  if (!isConfigured) {
    return null; // Don't show upload component if Cloudinary is not configured
  }

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Avatar Circle */}
        <div
          onClick={handleClick}
          className={`
            relative w-10 h-10 rounded-full border-2 border-dashed
            flex items-center justify-center cursor-pointer
            transition-all duration-200 overflow-hidden
            ${error
              ? 'border-red-300 bg-red-50'
              : value
                ? 'border-stone-300 bg-stone-50'
                : 'border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100'
            }
            ${disabled || isUploading ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          {value ? (
            // Show uploaded image
            <Image
              src={value}
              alt="Profile picture"
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            // Show camera icon for upload
            <Camera className="w-6 h-6 text-stone-400" />
          )}

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {/* Generate random avatar button */}
          {!value && !disabled && !isUploading && (
            <button
              type="button"
              onClick={handleGenerateRandom}
              className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
              title="Generate random avatar"
            >
              <Shuffle className="w-3 h-3" />
            </button>
          )}

          {/* Remove button */}
          {value && !disabled && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
              title="Remove profile picture"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}