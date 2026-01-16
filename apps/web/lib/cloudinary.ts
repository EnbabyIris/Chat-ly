export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  publicId?: string;
  // Note: quality and format parameters are not allowed in unsigned uploads
  // quality?: string | number; // Removed - not allowed in unsigned uploads
  // format?: string; // Removed - not allowed in unsigned uploads
}

/**
 * Upload image directly to Cloudinary from browser
 * Uses unsigned upload with preset for security
 */
export async function uploadImageToCloudinary(
  file: File | string,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const timestamp = new Date().toISOString();
  const processId = Math.random().toString(36).substring(2, 15);

  console.log(`[Cloudinary-${processId}] 🚀 Starting Cloudinary upload process at ${timestamp}`);
  console.log(`[Cloudinary-${processId}] 📝 Input:`, {
    fileType: typeof file,
    isFile: file instanceof File,
    fileName: file instanceof File ? file.name : 'URL/string',
    fileSize: file instanceof File ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'N/A',
    options
  });

  // Check environment configuration
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  console.log(`[Cloudinary-${processId}] 🔧 Configuration check:`, {
    hasCloudName: !!cloudName,
    hasUploadPreset: !!uploadPreset,
    cloudName: cloudName ? `${cloudName.substring(0, 8)}...` : null,
    uploadPreset: uploadPreset ? `${uploadPreset.substring(0, 8)}...` : null
  });

  if (!cloudName || !uploadPreset) {
    const error = new Error('Cloudinary configuration missing. Please check environment variables.');
    console.error(`[Cloudinary-${processId}] ❌ Configuration error:`, error.message);
    throw error;
  }

  // Validate file type if it's a File object
  if (file instanceof File) {
    console.log(`[Cloudinary-${processId}] 🔍 Validating file:`, {
      type: file.type,
      size: file.size,
      name: file.name,
      lastModified: new Date(file.lastModified).toISOString()
    });

    if (!file.type.startsWith('image/')) {
      const error = new Error('Only image files are supported for Cloudinary upload');
      console.error(`[Cloudinary-${processId}] ❌ File type validation failed:`, {
        actualType: file.type,
        error: error.message
      });
      throw error;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const error = new Error('File size must be less than 5MB');
      console.error(`[Cloudinary-${processId}] ❌ File size validation failed:`, {
        actualSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        maxSize: '5MB',
        error: error.message
      });
      throw error;
    }

    console.log(`[Cloudinary-${processId}] ✅ File validation passed`);
  } else {
    console.log(`[Cloudinary-${processId}] 📄 Using URL/string input:`, file);
  }

  // Prepare FormData
  console.log(`[Cloudinary-${processId}] 📦 Preparing FormData...`);
  const formData = new FormData();

  // Required parameters
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  // Optional parameters
  if (options.folder) {
    formData.append('folder', options.folder);
    console.log(`[Cloudinary-${processId}] 📁 Added folder:`, options.folder);
  }

  if (options.publicId) {
    formData.append('public_id', options.publicId);
    console.log(`[Cloudinary-${processId}] 🆔 Added public_id:`, options.publicId);
  }

  // Note: quality and format parameters are not allowed in unsigned uploads
  // They would cause 400 Bad Request errors

  // Cloudinary upload URL
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  console.log(`[Cloudinary-${processId}] 🌐 Upload URL:`, uploadUrl);

  // Log FormData contents (for debugging) - Note: quality/format not included (not allowed in unsigned uploads)
  const formDataEntries: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key === 'file') {
      formDataEntries[key] = file instanceof File ? `File: ${file.name} (${file.size} bytes)` : 'URL/string';
    } else {
      formDataEntries[key] = value as string;
    }
  }
  console.log(`[Cloudinary-${processId}] 📋 FormData contents (unsigned upload compatible):`, formDataEntries);

  try {
    console.log(`[Cloudinary-${processId}] 📤 Sending upload request...`);

    const startTime = Date.now();
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    const requestDuration = Date.now() - startTime;

    console.log(`[Cloudinary-${processId}] 📥 Response received in ${requestDuration}ms:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: response.headers ? Object.fromEntries(response.headers.entries()) : {}
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorResponse = await response.text();
        errorDetails = errorResponse;
        console.error(`[Cloudinary-${processId}] ❌ Response error body:`, errorResponse);
      } catch (e) {
        console.error(`[Cloudinary-${processId}] ❌ Could not read error response body:`, e);
      }

      const error = new Error(`Upload failed: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
      console.error(`[Cloudinary-${processId}] ❌ Upload failed with HTTP error:`, {
        status: response.status,
        statusText: response.statusText,
        errorDetails,
        fullError: error.message
      });
      throw error;
    }

    console.log(`[Cloudinary-${processId}] 📄 Parsing response JSON...`);
    const result: CloudinaryUploadResult = await response.json();

    console.log(`[Cloudinary-${processId}] ✅ Upload successful!`, {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      dimensions: `${result.width}x${result.height}`,
      size: `${(result.bytes / 1024).toFixed(2)}KB`,
      createdAt: result.created_at,
      totalDuration: Date.now() - new Date(timestamp).getTime()
    });

    return result;
  } catch (error) {
    console.error(`[Cloudinary-${processId}] 💥 Cloudinary upload failed:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      processId
    });
    throw error;
  }
}

/**
 * Check if URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  return url.includes(`res.cloudinary.com/${cloudName}`);
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;

  const urlParts = url.split('/');
  const uploadIndex = urlParts.findIndex(part => part === 'upload');

  if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1) return null;

  // Get everything after upload/ and before any transformation parameters
  const afterUpload = urlParts.slice(uploadIndex + 1);

  // Find where the actual public ID starts (after any transformation parameters)
  let publicIdStart = 0;
  for (let i = 0; i < afterUpload.length; i++) {
    const part = afterUpload[i];
    if (!part) continue;

    // If it contains commas or starts with common transformation prefixes, skip
    if (part.includes(',') ||
        part.startsWith('v') ||
        part.startsWith('q_') ||
        part.startsWith('w_') ||
        part.startsWith('h_') ||
        part.startsWith('c_') ||
        part.startsWith('f_')) {
      continue;
    }
    publicIdStart = i;
    break;
  }

  const slicedParts = afterUpload.slice(publicIdStart);
  if (slicedParts.length === 0) return null;

  const publicIdWithExtension = slicedParts.join('/');
  const publicId = publicIdWithExtension.split('.')[0];
  return publicId || null;
}

/**
 * React hook for Cloudinary uploads using Next Cloudinary
 */
export function useCloudinaryUpload() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const isConfigured = !!(cloudName && uploadPreset);

  console.log(`[useCloudinaryUpload] 🔧 Hook initialized:`, {
    isConfigured,
    hasCloudName: !!cloudName,
    hasUploadPreset: !!uploadPreset,
    timestamp: new Date().toISOString()
  });

  const uploadImage = async (
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> => {
    const hookProcessId = Math.random().toString(36).substring(2, 15);
    const startTime = Date.now();

    console.log(`[useCloudinaryUpload-${hookProcessId}] 🎯 Starting hook upload process:`, {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
      providedOptions: options,
      isConfigured
    });

    if (!isConfigured) {
      const error = new Error('Cloudinary not configured. Please check environment variables.');
      console.error(`[useCloudinaryUpload-${hookProcessId}] ❌ Configuration check failed:`, error.message);
      throw error;
    }

    // Merge with default options (quality and format not allowed in unsigned uploads)
    const finalOptions = {
      folder: 'chat-uploads',
      // Note: quality and format parameters not allowed in unsigned uploads
      ...options,
    };

    console.log(`[useCloudinaryUpload-${hookProcessId}] ⚙️ Final upload options:`, finalOptions);

    try {
      const result = await uploadImageToCloudinary(file, finalOptions);

      const totalDuration = Date.now() - startTime;
      console.log(`[useCloudinaryUpload-${hookProcessId}] 🎉 Hook upload completed successfully:`, {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        totalDuration: `${totalDuration}ms`
      });

      return result;
    } catch (error) {
      console.error(`[useCloudinaryUpload-${hookProcessId}] 💥 Hook upload failed:`, {
        error: error instanceof Error ? error.message : error,
        totalDuration: `${Date.now() - startTime}ms`,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });
      throw error;
    }
  };

  return {
    uploadImage,
    isConfigured,
  };
}

// Note: CldImage and CldUploadWidget should be imported directly from 'next-cloudinary'
// where they are used to avoid type conflicts with JSX namespace issues