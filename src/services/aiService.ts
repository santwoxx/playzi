import { GoogleGenAI, Type } from "@google/genai";
import { User } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export const AIService = {
  /**
   * Generates a personalized icebreaker based on two users' profiles.
   */
  generateIcebreaker: async (user1: User, user2: User): Promise<string> => {
    try {
      const prompt = `
        User 1 (Me):
        Nickname: ${user1.nickname}
        Bio: ${user1.bio}
        Games: ${user1.favoriteGames?.join(', ')}
        Interests: ${user1.interests?.join(', ')}
        Play Style: ${user1.playStyle}
        
        User 2 (Match):
        Nickname: ${user2.nickname}
        Bio: ${user2.bio}
        Games: ${user2.favoriteGames?.join(', ')}
        Interests: ${user2.interests?.join(', ')}
        Play Style: ${user2.playStyle}
        Intent: ${user2.currentIntent}

        Generate a short, friendly, and engaging "icebreaker" message (max 100 characters) in Portuguese that User 1 can send to User 2. 
        Focus on shared games, common interests, or matching play styles. Use a casual and gamer-friendly tone.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      return response.text || "Bora jogar algo?";
    } catch (error) {
      console.error("AI Icebreaker Error:", error);
      return "Opa! Vi que demos match, bora conversar?";
    }
  },

  /**
   * Generates a compatibility report explaining why two users matched.
   */
  generateCompatibilityReport: async (user1: User, user2: User): Promise<string> => {
    try {
      const prompt = `
        Compare these two players and justify their compatibility in 2 short sentences in Portuguese.
        Focus on:
        - Common games: ${user1.favoriteGames?.filter(g => user2.favoriteGames?.includes(g)).join(', ') || 'Nenhum'}
        - Styles: ${user1.playStyle} vs ${user2.playStyle}
        - Personalities (Bio): "${user1.bio}" vs "${user2.bio}"
        - Frequency: ${user1.frequency} vs ${user2.frequency}

        Return a friendly reasoning for their match percentage.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      return response.text || "Vocês têm gostos similares e estilos que se completam!";
    } catch (error) {
      console.error("AI Compatibility Error:", error);
      return "Vocês combinam muito no estilo de jogo e horários!";
    }
  },

  /**
   * Suggests a person and provides reasoning. (Used for UI insights)
   */
  getRecommendationReason: async (user: User, target: User): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Why would ${user.nickname} want to play with ${target.nickname}? Based on these bios: "${user.bio}" and "${target.bio}". Answer in 1 short Portuguese sentence starting with "Recomendado porque..."`,
      });
      return response.text || "Recomendado por afinidade de perfil.";
    } catch {
      return "Ótima opção para seu time.";
    }
  }
};
