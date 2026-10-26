import { User } from "../types";
import { apiService } from "./apiService";

type InsightKind = 'icebreaker' | 'compatibility' | 'recommendation';

// Gemini runs on the backend (/api/ai/insight), which loads both profiles itself.
// Here we only ask for the text and fall back to a default line if it fails.
async function requestInsight(kind: InsightKind, target: User, fallback: string): Promise<string> {
  try {
    const { text } = await apiService.getAIInsight(kind, target.uid, target.currentIntent);
    return text || fallback;
  } catch (error) {
    console.error(`AI ${kind} error:`, error);
    return fallback;
  }
}

export const AIService = {
  /**
   * Generates a personalized icebreaker based on two users' profiles.
   */
  generateIcebreaker: (_user1: User, user2: User): Promise<string> =>
    requestInsight('icebreaker', user2, "Opa! Vi que demos match, bora conversar?"),

  /**
   * Generates a compatibility report explaining why two users matched.
   */
  generateCompatibilityReport: (_user1: User, user2: User): Promise<string> =>
    requestInsight('compatibility', user2, "Vocês combinam muito no estilo de jogo e horários!"),

  /**
   * Suggests a person and provides reasoning. (Used for UI insights)
   */
  getRecommendationReason: (_user: User, target: User): Promise<string> =>
    requestInsight('recommendation', target, "Ótima opção para seu time.")
};
