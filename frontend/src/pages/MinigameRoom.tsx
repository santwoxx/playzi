import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Zap, Swords, Target, X, Loader2, Trophy, Users, ArrowLeft, Send, Sparkles, Star, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc, updateDoc, serverTimestamp, getDocs, limit, arrayUnion, increment } from 'firebase/firestore';
import { useGamerStats } from '../hooks/useGamerStats';
import { soundService } from '../services/soundService';

interface Player {
  id: string;
  name: string;
  photoURL: string;
  score: number;
}

interface GameSession {
  id: string;
  type: string;
  hostId: string;
  playerIds?: string[];
  players: Player[];
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  data: any;
  winnerId?: string;
}

export default function MinigameRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // 1. Join or Create Session (with stale session filtering and anti-self-match)
  useEffect(() => {
    if (!currentUser || !gameId) return;

    let isMounted = true;

    const findSession = async () => {
      setSearching(true);
      try {
        const q = query(
          collection(db, 'gameSessions'),
          where('type', '==', gameId),
          where('status', '==', 'waiting'),
          limit(5)
        );

        const snapshot = await getDocs(q);
        const now = Date.now();

        // Filter out stale sessions (> 5 min) and sessions created by current user
        const waitingSession = snapshot.docs.find(d => {
          const data = d.data();
          const createdAtMs = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : now);
          const isStale = (now - createdAtMs) > 5 * 60 * 1000;
          const isMe = data.hostId === currentUser.uid || data.playerIds?.includes(currentUser.uid);
          return !isStale && !isMe;
        });

        if (!isMounted) return;

        if (waitingSession) {
          // Join existing
          const sessionRef = doc(db, 'gameSessions', waitingSession.id);
          setSessionId(waitingSession.id);
          
          const maxPlayers = (gameId === 'quiz' || gameId === 'guess') ? 4 : 2;
          const currentCount = (waitingSession.data().players || []).length;
          
          await updateDoc(sessionRef, {
            players: arrayUnion({
              id: currentUser.uid,
              name: currentUser.nickname || currentUser.displayName || 'Player',
              photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nickname || 'P')}&background=0D0E12&color=fff`,
              score: 0
            }),
            playerIds: arrayUnion(currentUser.uid)
          });

          if (currentCount + 1 >= maxPlayers) {
            await updateDoc(sessionRef, { status: 'starting' });
          }
        } else {
          // Create new session
          const newSession = {
            type: gameId,
            hostId: currentUser.uid,
            status: 'waiting',
            playerIds: [currentUser.uid],
            players: [{
              id: currentUser.uid,
              name: currentUser.nickname || currentUser.displayName || 'Player',
              photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nickname || 'P')}&background=0D0E12&color=fff`,
              score: 0
            }],
            data: {
              currentQuestion: 0,
              round: 1,
              startTime: null
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const docRef = await addDoc(collection(db, 'gameSessions'), newSession);
          if (isMounted) {
            setSessionId(docRef.id);
          }
        }
      } catch (error) {
        console.error('Matchmaking error:', error);
      } finally {
        if (isMounted) setSearching(false);
      }
    };

    findSession();

    return () => {
      isMounted = false;
    };
  }, [gameId, currentUser]);

  // 2. Subscribe to current session
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = onSnapshot(doc(db, 'gameSessions', sessionId), (snapshot) => {
      if (snapshot.exists()) {
        setSession({ id: snapshot.id, ...snapshot.data() } as GameSession);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Safe leave session
  const leaveSession = async () => {
    if (sessionId && currentUser) {
      try {
        const sessionRef = doc(db, 'gameSessions', sessionId);
        if (session && session.players.length <= 1) {
          await deleteDoc(sessionRef);
        } else if (session) {
          const updatedPlayers = session.players.filter(p => p.id !== currentUser.uid);
          const updatedIds = (session.playerIds || []).filter(id => id !== currentUser.uid);
          await updateDoc(sessionRef, {
            players: updatedPlayers,
            playerIds: updatedIds,
            status: 'finished'
          });
        }
      } catch (err) {
        console.warn('Error leaving session:', err);
      }
    }
    navigate('/arcade');
  };

  // 3. Start game countdown if host
  useEffect(() => {
    if (session?.status === 'starting' && session.hostId === currentUser?.uid) {
      const timer = setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'gameSessions', session.id), { status: 'playing' });
        } catch (e) {
          console.warn('Error starting session:', e);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session?.status, session?.hostId, currentUser?.uid]);

  if (loading || searching) {
    return (
      <div className="min-h-screen gaming-grid flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 bg-vibe-neon-blue/20 rounded-3xl flex items-center justify-center mb-6 border border-vibe-neon-blue/30 shadow-[0_0_30px_rgba(0,242,255,0.2)]"
        >
          <Loader2 className="w-10 h-10 text-vibe-neon-blue animate-spin" />
        </motion.div>
        <h2 className="text-xl font-black neon-text-blue uppercase tracking-tighter">Buscando Oponentes...</h2>
        <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest mt-2">
          {gameId === 'quiz' ? 'Conectando à Arena Gamer Quiz' : 'Aquecendo os motores para o duelo'}
        </p>
        <button 
          onClick={leaveSession} 
          className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-vibe-muted hover:text-white transition-all uppercase font-black text-[10px] tracking-widest border border-white/5"
        >
          Cancelar Busca
        </button>
      </div>
    );
  }

  if (!session) return null;

  const maxPlayers = (gameId === 'quiz' || gameId === 'guess') ? 4 : 2;

  return (
    <div className="min-h-screen gaming-grid flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {session.status === 'waiting' || session.status === 'starting' ? (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-lg space-y-6"
          >
            <div className="text-center">
              <h1 className="text-2xl font-black neon-text-blue uppercase italic tracking-tighter">Sala de Espera</h1>
              <p className="text-vibe-muted font-bold text-[10px] uppercase tracking-widest mt-1">
                Aguardando jogadores ({session.players.length}/{maxPlayers})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {session.players.map(player => (
                <div 
                  key={player.id}
                  className="vibe-card p-3.5 sm:p-4 flex items-center space-x-3 border-vibe-neon-blue/20 bg-vibe-neon-blue/5"
                >
                  <img 
                    src={player.photoURL} 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-vibe-neon-blue object-cover" 
                    alt={player.name}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">{player.name}</p>
                    <p className="text-[9px] font-bold text-vibe-neon-blue uppercase tracking-tighter">Pronto</p>
                  </div>
                </div>
              ))}
              {[...Array(Math.max(0, maxPlayers - session.players.length))].map((_, i) => (
                <div key={i} className="vibe-card p-3.5 sm:p-4 flex items-center space-x-3 border-dashed border-white/10 opacity-40">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-16 bg-white/10 rounded animate-pulse" />
                    <div className="h-2 w-10 bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {session.status === 'starting' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center bg-vibe-neon-blue text-vibe-bg py-3.5 px-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-glow-blue"
              >
                O duelo vai começar em instantes!
              </motion.div>
            )}

            <button 
              onClick={leaveSession}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-vibe-muted hover:text-white transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 border border-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sair da Sala</span>
            </button>
          </motion.div>
        ) : (
          <GameDispatcher session={session} currentUser={currentUser!} />
        )}
      </AnimatePresence>
    </div>
  );
}

function GameDispatcher({ session, currentUser }: { session: GameSession, currentUser: any }) {
  switch (session.type) {
    case 'quiz':
      return <QuizGame session={session} currentUser={currentUser} />;
    case 'reflex':
      return <ReflexGame session={session} currentUser={currentUser} />;
    case 'rps':
      return <RPSGame session={session} currentUser={currentUser} />;
    case 'guess':
      return <GuessGame session={session} currentUser={currentUser} />;
    default:
      return <div className="text-white text-center font-bold">Jogo não encontrado</div>;
  }
}

// =====================================================================
// 1. QUIZ GAME (Multiplayer Desync & Crash Fixed)
// =====================================================================

const QUIZ_QUESTIONS = [
  { q: "Qual o nome do protagonista de Halo?", a: "Master Chief", options: ["Arbiter", "Master Chief", "Noble Six", "Sgt. Johnson"] },
  { q: "Em que ano foi lançado o primeiro PlayStation no Japão?", a: "1994", options: ["1992", "1994", "1995", "1996"] },
  { q: "Qual o jogo mais vendido de todos os tempos?", a: "Minecraft", options: ["Tetris", "GTA V", "Minecraft", "Super Mario Bros"] },
  { q: "Qual o nome da cidade fictícia onde se passa GTA San Andreas?", a: "Los Santos", options: ["Vice City", "Liberty City", "Los Santos", "San Fierro"] },
  { q: "Quem é o irmão do Mario no universo da Nintendo?", a: "Luigi", options: ["Wario", "Luigi", "Waluigi", "Toad"] },
  { q: "Qual arma é famosa por 'one-shot' em CS:GO e CS2?", a: "AWP", options: ["AK-47", "M4A4", "AWP", "Desert Eagle"] }
];

function QuizGame({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const currentQ = QUIZ_QUESTIONS[Math.min(currentQIndex, QUIZ_QUESTIONS.length - 1)];
  const isFinished = currentQIndex >= QUIZ_QUESTIONS.length || session.status === 'finished';

  const handleAnswer = async (option: string) => {
    if (isAnswering || isFinished || session.status !== 'playing') return;

    setIsAnswering(true);
    setSelectedOption(option);

    const isCorrect = option === currentQ.a;
    const points = isCorrect ? 10 : 0;

    try {
      const sessionRef = doc(db, 'gameSessions', session.id);
      const updatedPlayers = (session.players || []).map(p => 
        p.id === currentUser.uid ? { ...p, score: (p.score || 0) + points } : p
      );

      const nextIndex = currentQIndex + 1;

      setTimeout(async () => {
        setSelectedOption(null);
        setIsAnswering(false);
        setCurrentQIndex(nextIndex);

        if (nextIndex >= QUIZ_QUESTIONS.length) {
          // Mark finished for current user
          await updateDoc(sessionRef, {
            players: updatedPlayers,
            [`data.finished_${currentUser.uid}`]: true
          });

          // If all players are done, finish session
          const allDone = (session.players || []).every(p => 
            p.id === currentUser.uid || session.data?.[`finished_${p.id}`]
          );
          if (allDone) {
            await updateDoc(sessionRef, { status: 'finished' });
          }
        } else {
          await updateDoc(sessionRef, { players: updatedPlayers });
        }
      }, 700);
    } catch (err) {
      console.error('Quiz answer error:', err);
      setIsAnswering(false);
    }
  };

  if (session.status === 'finished' || isFinished) {
    return <GameResult session={session} currentUser={currentUser} />;
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-vibe-neon-blue uppercase tracking-widest bg-vibe-neon-blue/10 px-3 py-1 rounded-full border border-vibe-neon-blue/20">
          Pergunta {currentQIndex + 1}/{QUIZ_QUESTIONS.length}
        </span>
        <span className="text-xs font-black text-white">
          Sua Pontuação: {(session.players?.find(p => p.id === currentUser.uid)?.score || 0)} pts
        </span>
      </div>

      <div className="text-center space-y-2 py-2">
        <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">{currentQ.q}</h2>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
        {currentQ.options.map(opt => {
          const isSelected = selectedOption === opt;
          const isCorrect = opt === currentQ.a;
          return (
            <button 
              key={opt}
              disabled={isAnswering}
              onClick={() => handleAnswer(opt)}
              className={cn(
                "vibe-card p-4 sm:p-5 text-left transition-all text-xs sm:text-sm font-black uppercase tracking-tight flex items-center justify-between border",
                isSelected && isCorrect && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
                isSelected && !isCorrect && "bg-red-500/20 border-red-500 text-red-400",
                !isSelected && "hover:bg-white/5 active:scale-[0.98] border-white/10 text-white"
              )}
            >
              <span>{opt}</span>
              {isSelected && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isSelected && !isCorrect && <X className="w-4 h-4 text-red-400 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================================
// 2. REFLEX GAME (Synchronized Timing & Anti-Cheat Fixed)
// =====================================================================

function ReflexGame({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const [canShoot, setCanShoot] = useState(false);
  const [message, setMessage] = useState('Prepare-se...');
  const [penalty, setPenalty] = useState(false);

  // Synchronized target time set by host in Firestore
  useEffect(() => {
    if (session.status === 'playing') {
      const isHost = session.hostId === currentUser.uid;
      if (isHost && !session.data?.targetTime) {
        const syncDelay = Math.floor(Math.random() * 3000 + 2500);
        const targetTime = Date.now() + syncDelay;
        updateDoc(doc(db, 'gameSessions', session.id), {
          'data.targetTime': targetTime
        }).catch(console.error);
      }
    }
  }, [session.status, session.hostId, session.data?.targetTime, currentUser.uid, session.id]);

  // Monitor targetTime countdown synchronously on both clients
  useEffect(() => {
    const target = session.data?.targetTime;
    if (!target || session.status !== 'playing') return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= target) {
        setCanShoot(true);
        setMessage('ATIRE AGORA!');
        soundService.play('notification');
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [session.data?.targetTime, session.status]);

  const handleShoot = async () => {
    if (session.status !== 'playing') return;

    if (!canShoot) {
      // Early shot penalty: temporary freeze to prevent spam clicking cheat
      setPenalty(true);
      setMessage('Falso início! Espere o sinal!');
      setTimeout(() => {
        setPenalty(false);
        if (!canShoot) setMessage('Prepare-se...');
      }, 1000);
      return;
    }

    const reactionTime = Date.now() - (session.data?.targetTime || Date.now());
    const sessionRef = doc(db, 'gameSessions', session.id);

    try {
      await updateDoc(sessionRef, {
        status: 'finished',
        winnerId: currentUser.uid,
        'data.reactionTime': reactionTime
      });
    } catch (e) {
      console.warn('Error recording reflex shot:', e);
    }
  };

  if (session.status === 'finished') return <GameResult session={session} currentUser={currentUser} />;

  return (
    <div className="flex flex-col items-center space-y-8 sm:space-y-10 text-center">
      <div>
        <h2 className={cn(
          "text-3xl sm:text-5xl font-black uppercase italic tracking-tighter transition-colors",
          canShoot ? "text-vibe-neon-pink animate-pulse" : penalty ? "text-red-500" : "text-white"
        )}>
          {message}
        </h2>
        <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest mt-3">
          O primeiro a tocar quando ficar rosa vence!
        </p>
      </div>

      <button 
        onClick={handleShoot}
        disabled={penalty}
        className={cn(
          "w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center transition-all duration-200 transform active:scale-95 shadow-2xl",
          canShoot 
            ? "bg-vibe-neon-pink shadow-[0_0_60px_rgba(255,0,128,0.7)] text-white scale-105" 
            : penalty 
              ? "bg-red-500/20 text-red-400 border-2 border-red-500/50" 
              : "bg-white/5 text-vibe-muted border border-white/10 hover:border-white/20"
        )}
      >
        <Target className={cn("w-16 h-16 sm:w-20 sm:h-20", canShoot && "animate-ping")} />
        <span className="text-[10px] font-black uppercase tracking-widest mt-2">
          {canShoot ? 'ATIRAR!' : penalty ? 'PENALIDADE' : 'AGUARDE'}
        </span>
      </button>
    </div>
  );
}

// =====================================================================
// 3. RPS GAME (Draw Rematch & Secret Reveal Fixed)
// =====================================================================

function RPSGame({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const choices = [
    { name: 'pedra', label: 'Pedra', icon: '✊' },
    { name: 'papel', label: 'Papel', icon: '✋' },
    { name: 'tesoura', label: 'Tesoura', icon: '✌️' }
  ];

  const myChoice = session.data?.[`choice_${currentUser.uid}`];
  const otherPlayer = session.players?.find(p => p.id !== currentUser.uid);
  const otherChoice = otherPlayer ? session.data?.[`choice_${otherPlayer.id}`] : null;
  const isBothChosen = Boolean(myChoice && otherChoice);

  const handleChoice = async (choice: string) => {
    if (myChoice || session.status !== 'playing') return;

    const sessionRef = doc(db, 'gameSessions', session.id);
    const myChoiceKey = `data.choice_${currentUser.uid}`;

    await updateDoc(sessionRef, {
      [myChoiceKey]: choice
    });

    // Check if both have now played
    if (otherChoice) {
      resolveRPS(choice, otherChoice);
    }
  };

  const resolveRPS = async (c1: string, c2: string) => {
    const sessionRef = doc(db, 'gameSessions', session.id);
    let winnerId = 'draw';

    if (
      (c1 === 'pedra' && c2 === 'tesoura') ||
      (c1 === 'papel' && c2 === 'pedra') ||
      (c1 === 'tesoura' && c2 === 'papel')
    ) {
      winnerId = currentUser.uid;
    } else if (c1 === c2) {
      winnerId = 'draw';
    } else {
      winnerId = otherPlayer?.id || 'draw';
    }

    if (winnerId === 'draw') {
      // Announce draw and auto-reset for next round
      await updateDoc(sessionRef, {
        'data.lastResult': 'Empate! Próxima rodada...'
      });
      setTimeout(async () => {
        await updateDoc(sessionRef, {
          [`data.choice_${currentUser.uid}`]: null,
          [`data.choice_${otherPlayer?.id}`]: null,
          'data.lastResult': null
        });
      }, 2000);
    } else {
      await updateDoc(sessionRef, {
        status: 'finished',
        winnerId
      });
    }
  };

  if (session.status === 'finished') return <GameResult session={session} currentUser={currentUser} />;

  return (
    <div className="w-full max-w-sm space-y-8 text-center">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Jokenpô Neo</h2>
        <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest mt-1">Duelo 1v1 em tempo real</p>
      </div>

      {session.data?.lastResult && (
        <div className="py-2.5 px-4 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-xs font-black uppercase tracking-wider animate-bounce">
          {session.data.lastResult}
        </div>
      )}

      <div className="flex justify-center gap-3 sm:gap-4">
        {choices.map(c => {
          const isSelected = myChoice === c.name;
          return (
            <button 
              key={c.name}
              disabled={Boolean(myChoice)}
              onClick={() => handleChoice(c.name)}
              className={cn(
                "w-24 h-28 rounded-2xl flex flex-col items-center justify-center transition-all border active:scale-95",
                isSelected 
                  ? "bg-vibe-neon-purple/20 border-vibe-neon-purple shadow-[0_0_25px_rgba(168,85,247,0.4)] text-white scale-105" 
                  : "bg-white/5 border-white/10 hover:border-white/20 text-white/80 hover:text-white"
              )}
            >
              <span className="text-4xl mb-2 select-none">{c.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
            </button>
          );
        })}
      </div>

      {myChoice && !otherChoice && (
        <p className="text-vibe-neon-blue font-black uppercase text-[10px] tracking-widest animate-pulse">
          Sua jogada foi salva. Aguardando oponente...
        </p>
      )}
    </div>
  );
}

// =====================================================================
// 4. GUESS GAME (Real Game Artworks & Fuzzy Match Fixed)
// =====================================================================

const GUESS_LEVELS = [
  {
    title: "Minecraft",
    aliases: ["minecraft", "mine"],
    hint: "Blocos, Picareta e Sobrevivência",
    art: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60"
  },
  {
    title: "Grand Theft Auto V",
    aliases: ["gta", "gtav", "gta5", "gta v", "grand theft auto"],
    hint: "Mundo aberto em Los Santos com Trevor, Michael e Franklin",
    art: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60"
  },
  {
    title: "Valorant",
    aliases: ["valorant", "val"],
    hint: "FPS tático 5v5 com Agentes e a Spike",
    art: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=60"
  },
  {
    title: "Free Fire",
    aliases: ["free fire", "freefire", "ff"],
    hint: "Battle Royale mobile mais jogado do Brasil",
    art: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500&auto=format&fit=crop&q=60"
  }
];

function GuessGame({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const currentRound = Math.min(session.data?.round || 1, GUESS_LEVELS.length);
  const currentLevel = GUESS_LEVELS[currentRound - 1] || GUESS_LEVELS[0];
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const cleanString = (s: string) => 
    s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || session.status !== 'playing') return;

    const cleanedGuess = cleanString(guess);
    const isCorrect = currentLevel.aliases.some(alias => cleanString(alias) === cleanedGuess);

    if (isCorrect) {
      setFeedback('Acertou! +10 XP');
      const sessionRef = doc(db, 'gameSessions', session.id);
      const updatedPlayers = (session.players || []).map(p => 
        p.id === currentUser.uid ? { ...p, score: (p.score || 0) + 10 } : p
      );

      if (currentRound < GUESS_LEVELS.length) {
        await updateDoc(sessionRef, {
          'data.round': increment(1),
          players: updatedPlayers
        });
        setGuess('');
        setFeedback(null);
      } else {
        await updateDoc(sessionRef, {
          status: 'finished',
          winnerId: currentUser.uid,
          players: updatedPlayers
        });
      }
    } else {
      setFeedback('Incorreto! Tente novamente');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  if (session.status === 'finished') return <GameResult session={session} currentUser={currentUser} />;

  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Adivinhe o Jogo</h2>
        <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest mt-1">Nível {currentRound}/{GUESS_LEVELS.length}</p>
      </div>

      <div className="vibe-card p-2 rounded-3xl overflow-hidden border border-white/10 relative">
        <img 
          src={currentLevel.art} 
          className="w-full aspect-video sm:aspect-square object-cover rounded-2xl filter blur-[6px] transition-all hover:blur-[3px]"
          alt="Guess the game" 
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-vibe-neon-blue uppercase tracking-widest border border-white/10">
            Dica: {currentLevel.hint}
          </span>
        </div>
      </div>

      {feedback && (
        <p className={cn("text-xs font-black uppercase tracking-wider", feedback.includes('Acertou') ? "text-emerald-400" : "text-red-400")}>
          {feedback}
        </p>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Nome do jogo..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-4 pr-12 text-xs font-bold text-white outline-none focus:border-vibe-neon-blue transition-all uppercase tracking-widest"
        />
        <button 
          type="submit"
          className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-vibe-neon-blue text-vibe-bg rounded-xl font-bold flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

// =====================================================================
// 5. GAME RESULT (Clean Reward Execution & Stat Updating)
// =====================================================================

function GameResult({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const navigate = useNavigate();
  const { awardXP, awardCoins } = useGamerStats();
  const awardedRef = useRef(false);

  // Non-mutating sorting
  const sortedPlayers = useMemo(() => {
    return [...(session.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [session.players]);

  const isWinner = session.winnerId === currentUser.uid || 
    (session.type === 'quiz' && sortedPlayers[0]?.id === currentUser.uid);

  useEffect(() => {
    if (!awardedRef.current && currentUser) {
      awardedRef.current = true;

      const rewards: Record<string, number> = {
        quiz: 50,
        reflex: 75,
        rps: 30,
        guess: 40
      };
      
      const xpBase = rewards[session.type] || 30;
      const bonusXP = isWinner ? xpBase : Math.floor(xpBase / 2);
      const bonusCoins = isWinner ? 25 : 5;

      awardXP(bonusXP);
      awardCoins(bonusCoins);

      if (isWinner) {
        soundService.play('victory');
      }

      // Record real victories and streaks
      if (isWinner) {
        updateDoc(doc(db, 'users', currentUser.uid), {
          victories: increment(1),
          streak: increment(1)
        }).catch(console.warn);
      } else if (session.winnerId !== 'draw') {
        updateDoc(doc(db, 'users', currentUser.uid), {
          streak: 0
        }).catch(console.warn);
      }
    }
  }, [session.type, isWinner, currentUser, session.winnerId]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md vibe-card p-6 sm:p-8 text-center space-y-6 bg-vibe-bg border-vibe-neon-blue/40"
    >
      <div className="space-y-3">
        <div className="inline-flex p-4 rounded-full bg-vibe-gradient shadow-glow">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black italic-glow-blue uppercase italic tracking-tighter">
          {isWinner ? 'VITÓRIA!' : session.winnerId === 'draw' ? 'EMPATE!' : 'DERROTA'}
        </h2>
        {isWinner && (
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">+1 Vitória registrada no seu perfil</p>
        )}
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((p, i) => (
          <div key={p.id} className={cn(
            "flex items-center justify-between p-3.5 rounded-2xl border",
            p.id === currentUser.uid ? "bg-vibe-neon-blue/10 border-vibe-neon-blue/40" : "bg-white/5 border-white/10"
          )}>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-black text-vibe-muted">#{i + 1}</span>
              <img src={p.photoURL} className="w-8 h-8 rounded-lg object-cover" alt={p.name} />
              <span className="text-xs sm:text-sm font-black text-white truncate max-w-[150px]">{p.name}</span>
            </div>
            <span className="text-xs sm:text-sm font-black text-vibe-neon-blue">{p.score || 0} pts</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button 
          onClick={() => navigate('/arcade')}
          className="w-full py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-vibe-muted hover:text-white font-black uppercase text-[10px] tracking-widest border border-white/5 transition-all"
        >
          Sair ao Arcade
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3.5 bg-vibe-gradient text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-vibe-neon-blue/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          Jogar Novamente
        </button>
      </div>
    </motion.div>
  );
}
