// Media is still stored inline (base64) in Firestore documents, which are capped at 1 MiB,
// so images are re-encoded before upload and videos are size-checked.

export const MAX_INLINE_MEDIA_BYTES = 700 * 1024;

export function readFileAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Re-encodes an image as a JPEG data URL whose longest side is at most `maxSize` px
export function compressImage(source: Blob | string, maxSize: number, quality = 0.8): Promise<string | null> {
  return new Promise((resolve) => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const release = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
    };

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        release();
        resolve(null);
        return;
      }
      // JPEG has no transparency: paint a background so transparent PNGs don't turn black
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      release();
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      release();
      resolve(null);
    };
    img.src = url;
  });
}
