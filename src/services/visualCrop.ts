/** Non-destructive Cloudinary crop URLs. Always crop from the immutable original. */
export interface PixelCrop { x: number; y: number; width: number; height: number }
export function originalCloudinaryUrl(url: string): string {
  if (!url.startsWith('https://res.cloudinary.com/') || !url.includes('/image/upload/')) return '';
  return url.replace(/\/image\/upload\/c_crop,x_\d+,y_\d+,w_\d+,h_\d+\//, '/image/upload/');
}
export function cloudinaryCropUrl(original: string, crop: PixelCrop): string {
  const url = originalCloudinaryUrl(original);
  if (!url) throw new Error('Visual cropping requires an image uploaded to Cloudinary.');
  const x = Math.max(0, Math.round(crop.x));
  const y = Math.max(0, Math.round(crop.y));
  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));
  return url.replace('/image/upload/', `/image/upload/c_crop,x_${x},y_${y},w_${width},h_${height}/`);
}

/** Image scaled to cover a viewport, then moved by drag offsets.
 * Outputs pixel crop coordinates used by the server-side Cloudinary crop.
 */
export function computeVisualCrop(
  naturalWidth: number, naturalHeight: number, viewWidth: number, viewHeight: number,
  zoom: number, offsetX: number, offsetY: number,
): PixelCrop {
  const w = Math.max(1, naturalWidth);
  const h = Math.max(1, naturalHeight);
  const vw = Math.max(1, viewWidth);
  const vh = Math.max(1, viewHeight);
  const scale = Math.max(vw / w, vh / h) * Math.max(1, Math.min(4, zoom));
  const imageWidth = w * scale;
  const imageHeight = h * scale;
  const maxX = Math.max(0, (imageWidth - vw) / 2);
  const maxY = Math.max(0, (imageHeight - vh) / 2);
  const dx = Math.max(-maxX, Math.min(maxX, offsetX));
  const dy = Math.max(-maxY, Math.min(maxY, offsetY));
  const cropWidth = Math.min(w, vw / scale);
  const cropHeight = Math.min(h, vh / scale);
  return {
    x: Math.max(0, Math.min(w - cropWidth, (imageWidth - vw) / (2 * scale) - dx / scale)),
    y: Math.max(0, Math.min(h - cropHeight, (imageHeight - vh) / (2 * scale) - dy / scale)),
    width: cropWidth,
    height: cropHeight,
  };
}
