/**
 * Security utilities for the Vibe social app.
 * Provides sanitization and validation helpers to prevent XSS and malformed data entries.
 */

export const securityUtils = {
  /**
   * Sanitizes a string by removing potential HTML/Script tags.
   * While React automatically escapes data, we sanitize inputs to keep the database clean
   * and prevent issues with third-party tools or direct rendering if ever needed.
   */
  sanitizeText: (text: string): string => {
    if (!text) return '';
    // Basic removal of HTML tags
    return text
      .replace(/<[^>]*>?/gm, '')
      .trim();
  },

  /**
   * Validates if a nickname is safe and follows gaming community standards.
   */
  isValidNickname: (nickname: string): boolean => {
    const safePattern = /^[a-zA-Z0-9_ -]{3,20}$/;
    return safePattern.test(nickname);
  }
};
