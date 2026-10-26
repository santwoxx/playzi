import { apiService } from '../services/apiService';
import { compressImage } from './image';

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
      // A small copy keeps the moderation request light and cheap
      const image = await compressImage(imageDataUrl, 768, 0.8);
      if (!image) return true;
      const result = await apiService.moderateImage(image.split(',')[1], 'image/jpeg');
      return result.isSafe !== false;
    } catch (error) {
      console.error("Image safety check error:", error);
      return true;
    }
  }
};
