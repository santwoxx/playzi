import { useCallback, useEffect, useRef, useState } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';
import { rtdb } from '../lib/firebase';

// Live reactions for Playzi Sync rooms: an emoji tapped by anyone floats over the video for everyone.
// Each user has a single slot (rooms/{roomId}/reactions/{uid}) that gets overwritten, so the data never grows.

export const SYNC_REACTIONS = ['❤️', '😂', '🔥', '😮', '👏', '😢'];

export interface FloatingReaction {
  id: string;
  emoji: string;
  left: number; // % from the left edge of the video
}

const MAX_FLOATING = 24;
const FLOAT_DURATION_MS = 2600;
const SEND_COOLDOWN_MS = 350;

export function useSyncReactions(roomId: string | undefined, uid: string | undefined) {
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!roomId) return;

    // The first snapshot only records each slot: reactions sent before joining must not replay
    let previous: Record<string, number> | null = null;

    const stop = onValue(ref(rtdb, `rooms/${roomId}/reactions`), (snapshot) => {
      const slots = (snapshot.val() || {}) as Record<string, { emoji?: string; ts?: number }>;

      if (previous) {
        for (const [slotUid, slot] of Object.entries(slots)) {
          if (!slot?.emoji || !slot.ts || slot.ts === previous[slotUid]) continue;
          const reaction: FloatingReaction = {
            id: `${slotUid}-${slot.ts}`,
            emoji: slot.emoji,
            left: 8 + Math.random() * 80
          };
          setFloating(prev => [...prev.slice(-(MAX_FLOATING - 1)), reaction]);
          setTimeout(() => setFloating(prev => prev.filter(r => r.id !== reaction.id)), FLOAT_DURATION_MS);
        }
      }

      previous = Object.fromEntries(Object.entries(slots).map(([slotUid, slot]) => [slotUid, slot?.ts || 0]));
    });

    return () => stop();
  }, [roomId]);

  const sendReaction = useCallback((emoji: string) => {
    if (!roomId || !uid) return;
    const now = Date.now();
    if (now - lastSentRef.current < SEND_COOLDOWN_MS) return;
    lastSentRef.current = now;
    set(ref(rtdb, `rooms/${roomId}/reactions/${uid}`), { emoji, ts: now })
      .catch(error => console.error('Erro ao enviar reação:', error));
  }, [roomId, uid]);

  return { floating, sendReaction };
}

// Goes inside the (relative) video container
export function SyncReactionsOverlay({ reactions }: { reactions: FloatingReaction[] }) {
  return (
    <div className="absolute inset-0 z-[25] pointer-events-none overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {reactions.map(reaction => (
          <motion.span
            key={reaction.id}
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: -170, opacity: [0, 1, 1, 0], scale: [0.6, 1.35, 1.1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: FLOAT_DURATION_MS / 1000, ease: 'easeOut' }}
            className="absolute bottom-3 text-3xl select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
            style={{ left: `${reaction.left}%` }}
          >
            {reaction.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function SyncReactionBar({ onReact, onInvite, invited }: {
  onReact: (emoji: string) => void;
  onInvite?: () => void;
  invited?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-white/5 bg-[#0a0515]">
      <div className="flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar" role="group" aria-label="Reagir ao vídeo">
        {SYNC_REACTIONS.map(emoji => (
          <motion.button
            key={emoji}
            type="button"
            whileTap={{ scale: 1.4 }}
            onClick={() => onReact(emoji)}
            className="w-8 h-8 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 text-base flex items-center justify-center transition-colors"
            aria-label={`Reagir com ${emoji}`}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
      {onInvite && (
        <button
          type="button"
          onClick={onInvite}
          className="shrink-0 px-3 py-2 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/30 text-[#FF2E93] text-[10px] font-black uppercase tracking-widest hover:bg-[#FF2E93]/25 transition-colors"
        >
          {invited ? 'Link copiado!' : 'Convidar'}
        </button>
      )}
    </div>
  );
}
