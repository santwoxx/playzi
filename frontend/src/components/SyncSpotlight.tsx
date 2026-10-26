import { Link } from 'react-router-dom';
import { PlayCircle, Plus, Tv } from 'lucide-react';
import { SYNC_REACTIONS } from './SyncReactions';

// Feed shortcut to Playzi Sync: watch YouTube together while chatting in the room
export default function SyncSpotlight() {
  return (
    <section className="mx-4 my-3 relative overflow-hidden rounded-[28px] border border-[#FF2E93]/30 bg-gradient-to-br from-[#2a0a3d] via-[#140726] to-[#06070a] p-5 shadow-[0_0_40px_rgba(255,46,147,0.15)]">
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FF2E93]/20 blur-3xl rounded-full pointer-events-none" />

      <div className="relative flex items-start gap-4">
        <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#FF2E93] to-vibe-neon-purple flex items-center justify-center shadow-lg">
          <Tv className="w-7 h-7 text-white" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-white tracking-tight">Playzi Sync</h2>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Ao vivo
            </span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Assista vídeos do YouTube junto com a galera, no mesmo segundo, enquanto conversa no chat da sala.
          </p>
          <p className="text-sm tracking-widest" aria-hidden="true">{SYNC_REACTIONS.join(' ')}</p>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2 mt-4">
        <Link
          to="/watch/youtube?criar=1"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FF2E93] text-white text-xs font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Criar sala
        </Link>
        <Link
          to="/watch"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/15 active:scale-[0.98] transition-all"
        >
          <PlayCircle className="w-4 h-4" />
          Ver salas
        </Link>
      </div>
    </section>
  );
}
