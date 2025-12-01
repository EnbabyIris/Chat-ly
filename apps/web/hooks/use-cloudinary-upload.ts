'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/api/cloudinary';

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const upload = async (file: File | null): Promise<string | null> => {
    if (!file) {
      toast.warning('Please Select an Image!');
      return null;
    }

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      toast.warning('Please Select a Valid Image (JPEG or PNG)!');
      return null;
    }

    setIsUploading(true);
    setImageUrl(null);

    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      setIsUploading(false);
      return url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      toast.error('Image Upload Failed', {
        description:
          error instanceof Error ? error.message : 'Please try again later',
      });
      setIsUploading(false);
      return null;
    }
  };

  const reset = () => {
    setImageUrl(null);
    setIsUploading(false);
  };

  return {
    uploadImage: upload,
    isUploading,
    imageUrl,
    reset,
  };
};

