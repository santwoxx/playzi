import CryptoJS from 'crypto-js';

/**
 * Encrypts a message using AES with a shared key.
 * In a real E2EE system, this key would be derived from participants' keys.
 */
export const encryptMessage = (text: string, key: string): string => {
  if (!key) return text;
  return CryptoJS.AES.encrypt(text, key).toString();
};

/**
 * Decrypts a message using AES with a shared key.
 */
export const decryptMessage = (cipherText: string, key: string): string => {
  if (!key) return cipherText;
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) throw new Error("Decryption failed");
    return originalText;
  } catch (e) {
    console.error("Decryption error:", e);
    return "🔒 [Mensagem Criptografada]";
  }
};

/**
 * Generates a random session key for a chat.
 */
export const generateSessionKey = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString();
};
