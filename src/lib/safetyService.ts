import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini lazily to avoid top-level side effects or environment variable issues
let aiClient: any = null;

const getAI = () => {
  if (!aiClient) {
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Content safety features will be disabled.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

/**
 * AI-powered content safety system
 * Blocks NSFW and explicit content using Gemini-3-Flash
 */
export const SafetyService = {
  /**
   * Checks if a text message is sexually explicit or violates safety rules
   * returns true if safe, false if explicit
   */
  async checkTextSafety(text: string): Promise<boolean> {
    const ai = getAI();
    if (!ai) return true;

    try {
      if (!text.trim()) return true;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `SYSTEM: You are a strict content moderator for a gaming social network. 
        Your task is to identify and block any messages that are:
        1. Sexually explicit or suggestive.
        2. Extremely vulgar or offensive.
        3. Harassing or contain hate speech.
        4. "Muito explícitas" (Extreme explicit content).
        
        Analyze this message: "${text}"
        
        Respond ONLY in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSafe: { type: Type.BOOLEAN, description: "Whether the text is safe to post" },
              reason: { type: Type.STRING, description: "Short reason if unsafe (e.g., 'conteúdo sexual', 'vulgaridade')" }
            },
            required: ["isSafe"]
          }
        }
      });

      const result = JSON.parse(response.text || '{"isSafe": true}');
      return result.isSafe;
    } catch (error) {
      console.error("Safety check error:", error);
      return true;
    }
  },

  /**
   * Checks if an image is NSFW or explicit
   * returns true if safe, false if explicit
   */
  async checkImageSafety(base64Image: string, mimeType: string = "image/jpeg"): Promise<boolean> {
    const ai = getAI();
    if (!ai) return true;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1] || base64Image,
                mimeType: mimeType
              }
            },
            {
              text: `SYSTEM: You are a strict visual content moderator. 
              Is this image sexually explicit, pornographic, or contains extreme nudity (+18/muito explícita)? 
              Analyze carefully for hidden sexual themes or suggestive poses.
              Respond ONLY in JSON format.`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSafe: { type: Type.BOOLEAN, description: "Whether the image is safe for a general community" },
              reason: { type: Type.STRING, description: "Short reason if unsafe" }
            },
            required: ["isSafe"]
          }
        }
      });

      const result = JSON.parse(response.text || '{"isSafe": true}');
      return result.isSafe;
    } catch (error) {
      console.error("Image safety check error:", error);
      return true; 
    }
  }
};
