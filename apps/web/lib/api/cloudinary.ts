import { config } from '@/lib/config';

export const uploadImage = async (file: File): Promise<string> => {
  if (!file) {
    throw new Error('File is required');
  }

  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw new Error('File must be a JPEG or PNG image');
  }

  if (!config.CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not configured');
  }

  if (!config.CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('CLOUDINARY_UPLOAD_PRESET is not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', config.CLOUDINARY_CLOUD_NAME);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url.toString();
};

