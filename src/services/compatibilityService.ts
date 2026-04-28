import { User } from '../types';

/**
 * Service to calculate compatibility between two users.
 * Weights:
 * - Play Style: 30%
 * - Behavior: 25%
 * - Frequency: 15%
 * - Favorite Games: 20% (Shared games)
 * - Interests: 10% (Shared interests)
 */
export const CompatibilityService = {
  calculateScore: (user1: User | null, user2: User): number => {
    if (!user1) return 0;
    if (user1.uid === user2.uid) return 100;

    let score = 0;

    // 1. Play Style (30 points max)
    if (user1.playStyle && user2.playStyle) {
      if (user1.playStyle === user2.playStyle) {
        score += 30;
      } else if (
        (user1.playStyle === 'competitive' && user2.playStyle === 'duo') ||
        (user1.playStyle === 'casual' && user2.playStyle === 'squad')
      ) {
        score += 15;
      }
    } else {
      score += 15; // Neutral match if not set
    }

    // 2. Behavior (25 points max)
    if (user1.behavior && user2.behavior) {
      if (user1.behavior === user2.behavior) {
        score += 25;
      } else {
        // Pairs that work well together
        const goodPairs = [
          ['leader', 'chill'],
          ['tryhard', 'leader'],
          ['chill', 'funny']
        ];
        const isGoodPair = goodPairs.some(pair => 
          (pair[0] === user1.behavior && pair[1] === user2.behavior) ||
          (pair[1] === user1.behavior && pair[0] === user2.behavior)
        );
        if (isGoodPair) score += 15;
      }
    } else {
      score += 12;
    }

    // 3. Frequency (15 points max)
    if (user1.frequency && user2.frequency) {
      if (user1.frequency === user2.frequency) {
        score += 15;
      } else if (
        (user1.frequency === 'daily' && user2.frequency === 'weekends') ||
        (user1.frequency === 'weekends' && user2.frequency === 'casual')
      ) {
        score += 7;
      }
    } else {
      score += 7;
    }

    // 4. Favorite Games (20 points max)
    if (user1.favoriteGames && user2.favoriteGames) {
      const commonGames = user1.favoriteGames.filter(g => user2.favoriteGames?.includes(g));
      if (commonGames.length > 0) {
        score += Math.min(20, commonGames.length * 7);
      }
    }

    // 5. Interests (10 points max)
    if (user1.interests && user2.interests) {
      const commonInterests = user1.interests.filter(i => user2.interests?.includes(i));
      if (commonInterests.length > 0) {
        score += Math.min(10, commonInterests.length * 4);
      }
    }

    // Ensure range 0-100
    return Math.min(100, Math.max(0, Math.round(score)));
  },

  getMatchColor: (score: number): string => {
    if (score >= 90) return 'text-vibe-neon-blue';
    if (score >= 70) return 'text-vibe-neon-purple';
    if (score >= 40) return 'text-vibe-neon-pink';
    return 'text-vibe-muted';
  },

  getMatchLabel: (score: number): string => {
    if (score >= 90) return 'Perfect Match';
    if (score >= 75) return 'Super Compatível';
    if (score >= 50) return 'Bom Match';
    return 'Compatibilidade Baixa';
  }
};
