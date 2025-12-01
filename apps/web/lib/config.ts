export const config = {
  CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UPLOAD_PRESET:
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
} as const;

