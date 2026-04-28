import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Zap, Swords, Target, X, Loader2, Trophy, Users, ArrowLeft, Send, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc, updateDoc, serverTimestamp, getDocs, limit, arrayUnion, increment } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useGamerStats } from '../hooks/useGamerStats';

// --- GAME LOGIC SUB-COMPONENTS ---

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

  // 1. Join or Create Session
  useEffect(() => {
    if (!currentUser || !gameId) return;

    const findSession = async () => {
      setSearching(true);
      try {
        // Try to find a waiting session for this game
        const q = query(
          collection(db, 'gameSessions'),
          where('type', '==', gameId),
          where('status', '==', 'waiting'),
          limit(1)
        );

        const snapshot = await getDocs(q);
        const waitingSession = snapshot.docs[0];

        if (waitingSession) {
          // Join existing
          const sessionRef = doc(db, 'gameSessions', waitingSession.id);
          setSessionId(waitingSession.id);
          await updateDoc(sessionRef, {
            players: arrayUnion({
              id: currentUser.uid,
              name: currentUser.nickname || currentUser.displayName || 'Player',
              photoURL: currentUser.photoURL || '',
              score: 0
            })
          });

          // Check if full (simple logic: 2 players for duels, 4 for quiz)
          const data = waitingSession.data();
          const maxPlayers = (gameId === 'quiz' || gameId === 'guess') ? 4 : 2;
          if (data.players.length + 1 >= maxPlayers) {
            await updateDoc(sessionRef, { status: 'starting' });
          }
        } else {
          // Create new
          const newSession = {
            type: gameId,
            hostId: currentUser.uid,
            status: 'waiting',
            players: [{
              id: currentUser.uid,
              name: currentUser.nickname || currentUser.displayName || 'Player',
              photoURL: currentUser.photoURL || '',
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
          setSessionId(docRef.id);
        }
      } catch (error) {
        console.error('Matchmaking error:', error);
      } finally {
        setSearching(false);
      }
    };

    findSession();
  }, [gameId, currentUser]);

  // 2. Subscribe to current session
  useEffect(() => {
    if (!sessionId) return;

    return onSnapshot(doc(db, 'gameSessions', sessionId), (snapshot) => {
      if (snapshot.exists()) {
        setSession({ id: snapshot.id, ...snapshot.data() } as GameSession);
        setLoading(false);
      }
    });
  }, [sessionId]);

  const leaveSession = async () => {
    if (session && currentUser) {
      // In a real app we would remove player or delete doc if empty
      navigate('/arcade');
    }
  };

  // 3. Start game after countdown if host
  useEffect(() => {
    if (session?.status === 'starting' && session.hostId === currentUser?.uid) {
      const timer = setTimeout(async () => {
        await updateDoc(doc(db, 'gameSessions', session.id), { status: 'playing' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session?.status, session?.hostId, currentUser?.uid]);

  if (loading || searching) {
    return (
      <div className="min-h-screen gaming-grid flex flex-col items-center justify-center p-6">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-24 h-24 bg-vibe-neon-blue/20 rounded-3xl flex items-center justify-center mb-6"
        >
          <Loader2 className="w-10 h-10 text-vibe-neon-blue animate-spin" />
        </motion.div>
        <h2 className="text-xl font-black neon-text-blue uppercase tracking-tighter">Buscando Oponentes...</h2>
        <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest mt-2">{gameId === 'quiz' ? 'Conectando à Arena Quiz' : 'Aquecendo os motores'}</p>
        <button onClick={() => navigate('/arcade')} className="mt-10 text-vibe-muted hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest">Cancelar Busca</button>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen gaming-grid flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {session.status === 'waiting' || session.status === 'starting' ? (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-lg space-y-8"
          >
            <div className="text-center">
              <h1 className="text-2xl font-black neon-text-blue uppercase italic tracking-tighter">Sala de Espera</h1>
              <p className="text-vibe-muted font-bold text-[10px] uppercase tracking-widest mt-1">Aguardando jogadores ({session.players.length}/{(gameId === 'quiz' || gameId === 'guess') ? 4 : 2})</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {session.players.map(player => (
                <motion.div 
                  key={player.id}
                  layoutId={player.id}
                  className="vibe-card p-4 flex items-center space-x-4 border-vibe-neon-blue/20 bg-vibe-neon-blue/5"
                >
                  <img src={player.photoURL} className="w-12 h-12 rounded-xl border border-vibe-neon-blue" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">{player.name}</p>
                    <p className="text-[9px] font-bold text-vibe-neon-blue uppercase tracking-tighter">Pronto</p>
                  </div>
                </motion.div>
              ))}
              {[...Array(((gameId === 'quiz' || gameId === 'guess') ? 4 : 2) - session.players.length)].map((_, i) => (
                <div key={i} className="vibe-card p-4 flex items-center space-x-4 border-dashed border-vibe-border opacity-30">
                  <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2 w-16 bg-white/10 rounded animate-pulse" />
                    <div className="h-1.5 w-10 bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {session.status === 'starting' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center bg-vibe-neon-blue text-vibe-bg py-4 rounded-2xl font-black uppercase tracking-widest text-sm"
              >
                O jogo vai começar em instantes!
              </motion.div>
            )}

            <button 
              onClick={leaveSession}
              className="w-full py-4 bg-white/5 rounded-2xl text-vibe-muted hover:text-white transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2"
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
      return <div>Jogo não encontrado</div>;
  }
}

// --- ACTUAL GAMES ---

function QuizGame({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const questions = [
    { q: "Qual o nome do protagonista de Halo?", a: "Master Chief", options: ["Arbiter", "Master Chief", "Noble Six", "Sgt. Johnson"] },
    { q: "Em que ano foi lançado o primeiro PlayStation?", a: "1994", options: ["1992", "1994", "1995", "1996"] },
    { q: "Qual o jogo mais vendido de todos os tempos?", a: "Minecraft", options: ["Tetris", "GTA V", "Minecraft", "Super Mario Bros"] }
  ];

  const currentQ = questions[session.data.currentQuestion || 0];

  const handleAnswer = async (option: string) => {
    if (session.status !== 'playing') return;
    
    let newScore = 0;
    if (option === currentQ.a) {
      newScore = 10;
    }

    const updatedPlayers = session.players.map(p => 
      p.id === currentUser.uid ? { ...p, score: p.score + newScore } : p
    );

    const sessionRef = doc(db, 'gameSessions', session.id);
    await updateDoc(sessionRef, {
      players: updatedPlayers,
      'data.currentQuestion': increment(1)
    });

    if ((session.data.currentQuestion || 0) + 1 >= questions.length) {
      await updateDoc(sessionRef, { status: 'finished' });
    }
  };

  if (session.status === 'finished') return <GameResult session={session} currentUser={currentUser} />;

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-2">
         <h2 className="text-xs font-black text-vibe-neon-blue uppercase tracking-widest">Pergunta {(session.data.currentQuestion || 0) + 1}/{questions.length}</h2>
         <p className="text-2xl font-black text-white">{currentQ.q}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {currentQ.options.map(opt => (
          <button 
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="vibe-card p-6 text-left hover:bg-white/5 active:scale-95 transition-all text-sm font-black uppercase tracking-tight"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReflexGame({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const [canShoot, setCanShoot] = useState(false);
  const [message, setMessage] = useState('Prepare-se...');
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (session.status === 'playing' && !session.data.startTime) {
      const delay = Math.random() * 3000 + 2000;
      setTimeout(async () => {
        setCanShoot(true);
        setMessage('ATIRE AGORA!');
        setStartTime(Date.now());
      }, delay);
    }
  }, [session.status]);

  const handleShoot = async () => {
    if (!canShoot) {
      // Early shot penalty
      return;
    }

    const reactionTime = Date.now() - startTime;
    const sessionRef = doc(db, 'gameSessions', session.id);
    
    await updateDoc(sessionRef, {
      status: 'finished',
      winnerId: currentUser.uid,
      'data.reactionTime': reactionTime
    });
  };

  if (session.status === 'finished') return <GameResult session={session} currentUser={currentUser} />;

  return (
    <div className="flex flex-col items-center space-y-12">
       <div className="text-center">
          <h2 className="text-4xl font-black uppercase italic italic-glow-pink tracking-tighter animate-pulse">{message}</h2>
          <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest mt-4">O primeiro a clicar vence!</p>
       </div>
       
       <button 
         onClick={handleShoot}
         className={cn(
           "w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-90",
           canShoot ? "bg-vibe-neon-pink shadow-[0_0_50px_rgba(255,0,255,0.8)] text-white" : "bg-white/5 text-vibe-muted border border-white/10"
         )}
       >
         <Target className={cn("w-16 h-16", canShoot && "animate-ping")} />
       </button>
    </div>
  );
}

function RPSGame({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const choices = [
    { name: 'pedra', icon: <div className="text-3xl">✊</div> },
    { name: 'papel', icon: <div className="text-3xl">✋</div> },
    { name: 'tesoura', icon: <div className="text-3xl">✌️</div> }
  ];

  const handleChoice = async (choice: string) => {
    const sessionRef = doc(db, 'gameSessions', session.id);
    const myChoiceKey = `data.choice_${currentUser.uid}`;
    
    await updateDoc(sessionRef, {
      [myChoiceKey]: choice
    });

    // Check if both played
    const otherPlayer = session.players.find(p => p.id !== currentUser.uid);
    if (session.data[`choice_${otherPlayer?.id}`]) {
      // Calculate winner
      const c1 = choice;
      const c2 = session.data[`choice_${otherPlayer?.id}`];
      let winnerId = 'draw';

      if ((c1 === 'pedra' && c2 === 'tesoura') || (c1 === 'papel' && c2 === 'pedra') || (c1 === 'tesoura' && c2 === 'papel')) {
        winnerId = currentUser.uid;
      } else if (c1 === c2) {
        winnerId = 'draw';
      } else {
        winnerId = otherPlayer?.id || 'draw';
      }

      await updateDoc(sessionRef, {
        status: 'finished',
        winnerId
      });
    }
  };

  if (session.status === 'finished') return <GameResult session={session} currentUser={currentUser} />;

  return (
    <div className="w-full max-w-sm space-y-12">
      <div className="text-center">
         <h2 className="text-2xl font-black uppercase tracking-tighter">Escolha seu movimento</h2>
         <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest mt-2">Duelo em tempo real</p>
      </div>

      <div className="flex justify-center space-x-6">
        {choices.map(c => (
          <button 
            key={c.name}
            onClick={() => handleChoice(c.name)}
            disabled={!!session.data[`choice_${currentUser.uid}`]}
            className={cn(
              "w-24 h-24 rounded-2xl flex items-center justify-center transition-all active:scale-95",
              session.data[`choice_${currentUser.uid}`] === c.name 
                ? "bg-vibe-neon-purple text-white shadow-glow" 
                : "bg-white/5 text-white grayscale hover:grayscale-0 hover:bg-white/10"
            )}
          >
            {c.icon}
          </button>
        ))}
      </div>
      {session.data[`choice_${currentUser.uid}`] && (
        <p className="text-center text-vibe-neon-purple font-black uppercase text-[10px] tracking-widest animate-pulse">Aguardando oponente...</p>
      )}
    </div>
  );
}

function GuessGame({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const games = [
    { title: "Minecraft", img: "https://picsum.photos/seed/mc/400/400?blur=10" },
    { title: "Fortnite", img: "https://picsum.photos/seed/fn/400/400?blur=10" },
    { title: "Elden Ring", img: "https://picsum.photos/seed/er/400/400?blur=10" }
  ];

  const currentLevel = session.data.round || 1;
  const game = games[currentLevel - 1];
  const [guess, setGuess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.toLowerCase() === game.title.toLowerCase()) {
      const sessionRef = doc(db, 'gameSessions', session.id);
      if (currentLevel < games.length) {
        await updateDoc(sessionRef, {
          'data.round': increment(1),
          players: session.players.map(p => p.id === currentUser.uid ? { ...p, score: p.score + 10 } : p)
        });
        setGuess('');
      } else {
        await updateDoc(sessionRef, {
          status: 'finished',
          winnerId: currentUser.uid
        });
      }
    }
  };

  if (session.status === 'finished') return <GameResult session={session} currentUser={currentUser} />;

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
         <h2 className="text-2xl font-black uppercase tracking-tighter">Adivinhe o Jogo</h2>
         <p className="text-vibe-muted font-bold text-xs uppercase tracking-widest mt-2 font-mono">Pixel Level {currentLevel}</p>
      </div>

      <div className="vibe-card p-2 rounded-[32px] overflow-hidden border-2 border-vibe-neon-blue/20">
         <img src={game.img} className="w-full aspect-square object-cover" />
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Nome do jogo..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:neon-border transition-all uppercase tracking-widest"
        />
        <button className="absolute right-2 top-2 bottom-2 px-4 bg-vibe-gradient rounded-xl text-white">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function GameResult({ session, currentUser }: { session: GameSession, currentUser: any }) {
  const navigate = useNavigate();
  const { awardXP, awardCoins } = useGamerStats();
  const [awarded, setAwarded] = useState(false);
  
  const isWinner = session.winnerId === currentUser.uid || 
    (session.type === 'quiz' && session.players.sort((a,b) => b.score - a.score)[0]?.id === currentUser.uid);

  useEffect(() => {
    if (!awarded) {
      const rewards = {
        quiz: 50,
        reflex: 75,
        rps: 30,
        guess: 40
      };
      
      const xp = rewards[session.type as keyof typeof rewards] || 20;
      const bonus = isWinner ? xp : Math.floor(xp / 2);
      
      awardXP(bonus);
      awardCoins(isWinner ? 20 : 5);
      setAwarded(true);
    }
  }, [session.type, isWinner]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md vibe-card p-10 text-center space-y-8 bg-vibe-bg border-vibe-neon-blue"
    >
       <div className="space-y-4">
          <div className="inline-flex p-6 rounded-full bg-vibe-gradient shadow-glow">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black italic-glow-blue uppercase italic tracking-tighter">
            {isWinner ? 'VITÓRIA' : session.winnerId === 'draw' ? 'EMPATE' : 'DERROTA'}
          </h2>
       </div>

       <div className="space-y-3">
          {session.players.sort((a,b) => b.score - a.score).map((p, i) => (
            <div key={p.id} className={cn(
              "flex items-center justify-between p-4 rounded-2xl border",
              p.id === currentUser.uid ? "bg-vibe-neon-blue/20 border-vibe-neon-blue" : "bg-white/5 border-white/10"
            )}>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-black text-vibe-muted">#{i+1}</span>
                <img src={p.photoURL} className="w-8 h-8 rounded-lg" />
                <span className="text-sm font-black text-white">{p.name}</span>
              </div>
              <span className="text-sm font-black text-vibe-neon-blue">{p.score} pts</span>
            </div>
          ))}
       </div>

       <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/arcade')}
            className="w-full py-4 bg-white/5 rounded-2xl text-vibe-muted font-black uppercase text-[10px] tracking-widest"
          >
            Sair
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-vibe-gradient text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-vibe-neon-blue/20"
          >
            Jogar Novamente
          </button>
       </div>
    </motion.div>
  );
}
