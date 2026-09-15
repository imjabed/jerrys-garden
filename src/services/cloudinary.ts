/**
 * Cloudinary client service for Jerry's Garden.
 * Sends image upload requests to the secure full-stack backend endpoint /api/upload-image
 * which interfaces with Cloudinary using configured server-side environment variables.
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
}

/**
 * Uploads an image File or Base64 data URL directly to Cloudinary via the server proxy.
 */
export async function uploadImageToCloudinary(
  fileOrBase64: File | string,
  folder: string = 'jerrys_garden_bouquets'
): Promise<CloudinaryUploadResult> {
  let base64Image: string;

  if (typeof fileOrBase64 === 'string') {
    base64Image = fileOrBase64;
  } else {
    base64Image = await readFileAsDataUrl(fileOrBase64);
  }

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Image,
      folder,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.url) {
    throw new Error(data.error || 'Cloudinary upload did not return a valid URL.');
  }

  return {
    url: data.url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}

/**
 * Helper to convert browser File to data URL
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Checks if an image URL is hosted on Cloudinary
 */
export function isCloudinaryUrl(url: string): boolean {
  return typeof url === 'string' && (url.includes('res.cloudinary.com') || url.includes('cloudinary'));
}
