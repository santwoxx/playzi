import { apiService } from '../services/apiService';

// Shrinks the image before upload so the moderation request stays small and cheap
function downscaleImage(dataUrl: string, maxSize = 768): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1] || null);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * AI-powered content safety system.
 * The check runs on the backend (/api/moderation/*), where the Gemini key lives.
 * As before, content goes through if the check fails: this is a UX guard, not the final barrier.
 */
export const SafetyService = {
  /**
   * Checks if a text message is sexually explicit or violates safety rules
   * returns true if safe, false if explicit
   */
  async checkTextSafety(text: string): Promise<boolean> {
    if (!text.trim()) return true;

    try {
      const result = await apiService.moderateText(text);
      return result.isSafe !== false;
    } catch (error) {
      console.error("Safety check error:", error);
      return true;
    }
  },

  /**
   * Checks if an image is NSFW or explicit
   * returns true if safe, false if explicit
   */
  async checkImageSafety(imageDataUrl: string): Promise<boolean> {
    if (!imageDataUrl.startsWith('data:image/')) return true;

    try {
      const image = await downscaleImage(imageDataUrl);
      if (!image) return true;
      const result = await apiService.moderateImage(image, 'image/jpeg');
      return result.isSafe !== false;
    } catch (error) {
      console.error("Image safety check error:", error);
      return true;
    }
  }
};
