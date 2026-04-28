import { db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const XP_LEVEL_BASE = 100;
const XP_LEVEL_MULTIPLIER = 1.2;

export const RANK_TITLES: ('Novato' | 'Pro Player' | 'Elite' | 'Legend' | 'Mythic')[] = [
  'Novato', 'Pro Player', 'Elite', 'Legend', 'Mythic'
];

export function useGamerStats() {
  const { currentUser, refreshUser } = useAuth();

  const getXPForLevel = (level: number) => {
    return Math.floor(XP_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, level - 1));
  };

  const getRankForLevel = (level: number) => {
    if (level < 5) return 'Novato';
    if (level < 15) return 'Pro Player';
    if (level < 30) return 'Elite';
    if (level < 50) return 'Legend';
    return 'Mythic';
  };

  const awardXP = async (amount: number) => {
    if (!currentUser) return;

    let newXp = currentUser.xp + amount;
    let newLevel = currentUser.level;
    let nextLevelXp = getXPForLevel(newLevel);

    while (newXp >= nextLevelXp) {
      newXp -= nextLevelXp;
      newLevel++;
      nextLevelXp = getXPForLevel(newLevel);
      // Award level up bonus
      await awardCoins(newLevel * 100);
    }

    const rankTitle = getRankForLevel(newLevel);

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      xp: newXp,
      level: newLevel,
      rankTitle: rankTitle
    });

    await refreshUser();
  };

  const awardCoins = async (amount: number) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      coins: increment(amount)
    });
    await refreshUser();
  };

  const awardGems = async (amount: number) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      gems: increment(amount)
    });
    await refreshUser();
  };

  return { awardXP, awardCoins, awardGems, getXPForLevel };
}
