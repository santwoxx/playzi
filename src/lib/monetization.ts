import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

const INITIAL_CHAT_SLOTS = 10;
const SLOTS_PER_AD = 5;

/**
 * Hook or logic to manage message limits and ad rewards
 */
export const AdMonetizationService = {
  /**
   * Checks if the user can send a message and updates the count
   * @deprecated Used for message volume, currently returns true for better performance
   */
  async checkAndSpendMessage(userId: string): Promise<{ permitted: boolean; remaining: number }> {
    return { permitted: true, remaining: 999 };
  },

  /**
   * Checks if the user can initiate a new chat with a specific person
   */
  async checkCanInitiateChat(userId: string, targetUid: string): Promise<{ permitted: boolean; currentCount: number; maxSlots: number }> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return { permitted: true, currentCount: 0, maxSlots: INITIAL_CHAT_SLOTS };

    const userData = userDoc.data() as User;
    const contactedUids = userData.contactedUids || [];
    const chatSlots = userData.chatSlots || INITIAL_CHAT_SLOTS;

    // Already in the list? Permitted.
    if (contactedUids.includes(targetUid)) {
      return { permitted: true, currentCount: contactedUids.length, maxSlots: chatSlots };
    }

    // Limit reached?
    if (contactedUids.length >= chatSlots) {
      return { permitted: false, currentCount: contactedUids.length, maxSlots: chatSlots };
    }

    // Add to list
    await updateDoc(doc(db, 'users', userId), {
      contactedUids: arrayUnion(targetUid)
    });

    return { permitted: true, currentCount: contactedUids.length + 1, maxSlots: chatSlots };
  },

  /**
   * Rewards user with more chat slots (+5) after watching an ad
   */
  async rewardUserWithSlots(userId: string): Promise<number> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const currentSlots = (userDoc.data() as User)?.chatSlots || INITIAL_CHAT_SLOTS;
    const newSlots = currentSlots + SLOTS_PER_AD;

    await updateDoc(doc(db, 'users', userId), {
      chatSlots: newSlots
    });

    return newSlots;
  },

  /**
   * Triggers the Ad display
   */
  showRewardedAd(onComplete: () => void) {
    // Simulated Ad experience
    console.log("🎮 Playsi Arcade: Iniciando anúncio neural...");
    setTimeout(() => {
      onComplete();
      console.log("💎 Playsi Arcade: Anúncio concluído! Canal de comunicação descriptografado.");
    }, 3000);
  }
};
