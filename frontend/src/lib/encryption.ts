import CryptoJS from 'crypto-js';

/**
 * Decrypts messages sent while the old "encryption" toggle existed.
 * That feature used a key stored in the app, so it never was end-to-end encryption;
 * new messages are sent as plain text and this only keeps old messages readable.
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
