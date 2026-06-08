import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rtdb } from '../lib/firebase';
import { 
  ref, 
  onValue, 
  set, 
  update, 
  push, 
  onDisconnect, 
  serverTimestamp, 
  get, 
  remove 
} from 'firebase/database';
import SEO from '../components/SEO';
import { 
  Tv, 
  Users, 
  MessageSquare, 
  Send, 
  Play, 
  Pause, 
  Volume2, 
  LogOut, 
  Plus, 
  Sparkles, 
  Share2, 
  Crown, 
  Video, 
  Check, 
  Lock, 
  Unlock, 
  Settings, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  Globe,
  Compass,
  Layout,
  ExternalLink,
  Flame,
  Gamepad2,
  Tv2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RoomUser {
  uid: string;
  displayName: string;
  photoURL: string;
  online: boolean;
  joinedAt: number;
}

interface ChatMessage {
  id: string;
  uid: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
}

interface BrowserState {
  currentUrl: string;
  host: string;
  hostName: string;
  hostAvatar: string;
  updatedAt: number;
  allowNavigationControl: boolean;
  history?: string[];
  historyIndex?: number;
}

interface BrowserSyncRoom {
  id: string;
  browser: BrowserState;
  users?: Record<string, RoomUser>;
  chat?: Record<string, ChatMessage>;
}

// Helper to extract YouTube video ID
function getYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const stripped = url.trim();
  
  // 1. YouTube Shorts check
  const shortsMatch = stripped.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }
  
  // 2. Standard and youtu.be links
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = stripped.match(regExp);
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  // 3. Fallback direct 11-char ID extraction via URL search params or paths
  try {
    const urlObj = new URL(stripped);
    if (urlObj.hostname.includes('youtube.com')) {
      const v = urlObj.searchParams.get('v');
      if (v && v.length === 11) return v;
    }
    if (urlObj.hostname.includes('youtu.be')) {
      const path = urlObj.pathname.substring(1);
      if (path.length === 11) return path;
    }
  } catch (e) {
    // ignore
  }
  
  if (stripped.length === 11 && !stripped.includes('/') && !stripped.includes('.')) {
    return stripped;
  }
  
  return null;
}

// Preset URLs to make navigating extremely fun
const BROWSER_PRESETS = [
  { name: 'Google', url: 'https://google.com', icon: Search, color: 'text-vibe-neon-blue' },
  { name: 'YouTube', url: 'https://youtube.com', icon: Video, color: 'text-vibe-neon-pink' },
  { name: 'Playzi Arcade', url: 'https://playzi.app.br/arcade', icon: Gamepad2, color: 'text-vibe-neon-purple' },
  { name: 'Playzi Explore', url: 'https://playzi.app.br/explore', icon: Compass, color: 'text-emerald-400' }
];

// YouTube simulation data
const MOCK_YOUTUBE_VIDEOS = [
  { id: 'QdBZY2fkU-0', title: 'GTA 6 - Official Trailer 1', author: 'Rockstar Games', views: '210M views', date: '5 months ago', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop' },
  { id: 'wIPtcoHInHk', title: 'A Minecraft Movie - Official Teaser', author: 'Warner Bros. Pictures', views: '38M views', date: '2 weeks ago', thumb: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop' },
  { id: 'ZHhqwBwm_Xw', title: 'League of Legends - Still Here Cinematic', author: 'League of Legends', views: '54M views', date: '3 months ago', thumb: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?q=80&w=600&auto=format&fit=crop' },
  { id: 'Om0KzVStSg8', title: 'Cyberpunk 2077 - Launch Trailer', author: 'CD PROJEKT RED', views: '45M views', date: '3 years ago', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop' },
  { id: '0vxOhd4hy_g', title: 'Free Fire - Animation 2026', author: 'Garena Free Fire', views: '12M views', date: '1 month ago', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop' }
];

// Google mock results index
const GOOGLE_RESULTS_MAP: Record<string, { title: string; snippet: string; url: string }[]> = {
  'playzi': [
    { title: 'Playzi - A Rede Social Gamer do Futuro', snippet: 'Acesse o feed de games, encontros, quizzes eletrizantes, arcade com minijogos multiplayer e assista vídeos em grupo no Playzi Sync!', url: 'https://playzi.app.br' },
    { title: 'Playzi Arcade - Jogue Agora de Graça', snippet: 'Experimente minigames diretamente pelo seu navegador Chrome ou Mobile. Desafie o squad agora.', url: 'https://playzi.app.br/arcade' },
    { title: 'Playzi Sync - Rave Watch Party', snippet: 'Assista seus canais preferidos e vídeos de forma sincronizada com suporte a chat realtime e presença de avatares.', url: 'https://playzi.app.br/watch' }
  ],
  'gta 6': [
    { title: 'Grand Theft Auto VI | Rockstar Games', snippet: 'O canal oficial do jogo mais aguardado de todos os tempos. Assista o trailer 1 e confira as novidades mais quentes de Vice City.', url: 'https://youtube.com/watch?v=QdBZY2fkU-0' },
    { title: 'GTA 6 Rumores e Lançamento 2026', snippet: 'Tudo o que sabemos sobre mapas, novos protagonistas, gráficos realistas e suporte para consoles de última geração.', url: 'https://google.com/search?q=gta+6+rumors' }
  ],
  'minecraft': [
    { title: 'A Minecraft Movie - Trailer Geral Oficial', snippet: 'Veja Jack Black e Jason Momoa em uma aventura inesquecível pelo mundo tridimensional dos blocos.', url: 'https://youtube.com/watch?v=wIPtcoHInHk' },
    { title: 'Minecraft Oficial | Compre e Baixe', snippet: 'Explore seu próprio mundo gerado proceduralmente, construa fortalezas magníficas e sobreviva à noite.', url: 'https://minecraft.net' }
  ],
  'dating': [
    { title: 'Playzi Encontros - O Tinder dos Gamers', snippet: 'Encontre o seu Player 2 através do nosso algoritmo inteligente de games favoritos, interesses em comum e fotos reais.', url: 'https://playzi.app.br/encontros' }
  ]
};

export default function BrowserSync() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Basic lists & state
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);

  // Active room data
  const [room, setRoom] = useState<BrowserSyncRoom | null>(null);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState<RoomUser[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Simulated browser values
  const [inputUrl, setInputUrl] = useState('');
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const isSyncingRef = useRef<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const userNick = currentUser?.nickname || currentUser?.displayName || 'Jogador';
  const userAvatar = currentUser?.photoURL || `https://ui-avatars.com/api/?name=${userNick}&background=random`;

  // --- PHASE 1: DISCOVER ACTIVE BROWSER ROOMS ---
  useEffect(() => {
    if (roomId) return;

    setLoadingRooms(true);
    const roomsRef = ref(rtdb, 'rooms');
    const unsub = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: any[] = [];
        const now = Date.now();

        Object.keys(data).forEach(key => {
          const rData = data[key];

          // only show those that have browser settings initialized
          if (rData.browser === undefined) return;

          const onlineCount = rData.users 
            ? Object.values(rData.users).filter((u: any) => u.online === true).length 
            : 0;

          const createdTime = rData.createdTime || rData.updatedAt || now;
          const ageSeconds = (now - createdTime) / 1000;

          if (onlineCount === 0 && ageSeconds > 30) {
            remove(ref(rtdb, `rooms/${key}`)).catch(err => {
              console.warn("Background cleaning empty room from Browser Sync:", key, err);
            });
          } else {
            list.push({
              id: key,
              ...rData
            });
          }
        });

        setActiveRooms(list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
      } else {
        setActiveRooms([]);
      }
      setLoadingRooms(false);
    }, (error) => {
      console.warn("RTDB BrowserSync rooms subscription failed:", error);
      setLoadingRooms(false);
    });

    return () => unsub();
  }, [roomId]);

  // --- PHASE 2: HANDLE ACTIVE ROOM OR ROOM PRESENCE ---
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const userPresenceRef = ref(rtdb, `rooms/${roomId}/users/${currentUser.uid}`);

    // Join and update online status
    const joinUser = () => {
      set(userPresenceRef, {
        uid: currentUser.uid,
        displayName: userNick,
        photoURL: userAvatar,
        online: true,
        joinedAt: serverTimestamp()
      });
      onDisconnect(userPresenceRef).update({ online: false });
    };

    joinUser();

    // Listen to database modifications
    const unsubRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomExists(true);
        const parsed: BrowserSyncRoom = {
          id: roomId,
          browser: {
            currentUrl: data.browser?.currentUrl || 'https://google.com',
            host: data.browser?.host || data.host || '',
            hostName: data.browser?.hostName || data.hostName || 'Anônimo',
            hostAvatar: data.browser?.hostAvatar || data.hostAvatar || '',
            updatedAt: data.browser?.updatedAt || Date.now(),
            allowNavigationControl: data.browser?.allowNavigationControl ?? false,
            history: data.browser?.history || ['https://google.com'],
            historyIndex: data.browser?.historyIndex ?? 0
          }
        };
        setRoom(parsed);

        // Normalize URL bar state to reflect synchronized DB URL
        setInputUrl(data.browser?.currentUrl || 'https://google.com');

        // Parse chat
        if (data.chat) {
          const msgs: ChatMessage[] = Object.keys(data.chat).map(key => ({
            id: key,
            ...data.chat[key]
          }));
          setChatMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
        } else {
          setChatMessages([]);
        }

        // Parse online users
        let usrs: RoomUser[] = [];
        if (data.users) {
          usrs = Object.keys(data.users)
            .map(key => ({ ...data.users[key] }))
            .filter(u => u.online === true);
          setParticipants(usrs);
        } else {
          setParticipants([]);
        }

        // Host promotion: if current host went offline/left, promote oldest remaining online user
        if (usrs.length > 0) {
          const currentHostId = data.browser?.host || data.host;
          const isHostOnline = usrs.some(u => u.uid === currentHostId);
          if (!isHostOnline) {
            // Sort by joinedAt ascending (oldest first)
            const sortedUsrs = [...usrs].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
            const oldestUser = sortedUsrs[0];
            if (currentUser && currentUser.uid === oldestUser.uid) {
              const updatedHostObj: any = {
                host: oldestUser.uid,
                hostName: oldestUser.displayName || 'Jogador',
                hostAvatar: oldestUser.photoURL || `https://ui-avatars.com/api/?name=${oldestUser.displayName || 'Jogador'}&background=random`
              };
              if (data.browser) {
                updatedHostObj.browser = {
                  ...data.browser,
                  host: oldestUser.uid,
                  hostName: oldestUser.displayName || 'Jogador',
                  hostAvatar: oldestUser.photoURL || `https://ui-avatars.com/api/?name=${oldestUser.displayName || 'Jogador'}&background=random`,
                  updatedAt: serverTimestamp()
                };
              }
              update(roomRef, updatedHostObj).then(async () => {
                const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
                await push(chatRef, {
                  uid: "system",
                  username: "Playzi Bot",
                  avatar: "https://ui-avatars.com/api/?name=PB&background=FF2E93&color=fff",
                  text: `👑 ${oldestUser.displayName || 'Jogador'} é o novo anfitrião do navegador!`,
                  timestamp: Date.now()
                });
              }).catch(err => {
                console.warn("Failed to elect host in BrowserSync:", err);
              });
            }
          }
        }

      } else {
        setRoomExists(false);
        setRoom(null);
      }
    }, (error) => {
      console.warn("RTDB BrowserSync room subscription failed:", error);
      setRoomExists(false);
    });

    return () => {
      unsubRoom();
      // On unmount/leave, explicitly mark offline and delete if last person
      update(userPresenceRef, { online: false }).then(async () => {
        const snap = await get(ref(rtdb, `rooms/${roomId}/users`));
        if (snap.exists()) {
          const uVals = snap.val();
          const remainOnline = Object.values(uVals).filter((u: any) => u.online === true).length;
          if (remainOnline === 0) {
            remove(ref(rtdb, `rooms/${roomId}`)).catch(() => {});
          }
        } else {
          remove(ref(rtdb, `rooms/${roomId}`)).catch(() => {});
        }
      }).catch(() => {});
    };
  }, [roomId, currentUser, userNick, userAvatar]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const isHost = room ? (room.browser.host === currentUser?.uid) : false;
  const canControl = isHost || (room?.browser.allowNavigationControl ?? false);

  // --- PHASE 3: EMULATION & STATE SYNC WRITERS ---
  const updateBrowserUrl = async (url: string, updateHistory: boolean = true) => {
    if (!roomId || !canControl) return;

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl) && cleanUrl.length > 0) {
      if (cleanUrl.includes('.') && !cleanUrl.includes(' ')) {
        cleanUrl = 'https://' + cleanUrl;
      } else {
        // Fallback to google search simulator
        cleanUrl = `https://google.com/search?q=${encodeURIComponent(cleanUrl)}`;
      }
    }

    try {
      let nextHistory = [...(room?.browser.history || ['https://google.com'])];
      let nextIndex = room?.browser.historyIndex ?? 0;

      if (updateHistory) {
        // Slice away any history forward of current index if navigating anew
        nextHistory = nextHistory.slice(0, nextIndex + 1);
        nextHistory.push(cleanUrl);
        nextIndex = nextHistory.length - 1;
      }

      await update(ref(rtdb, `rooms/${roomId}/browser`), {
        currentUrl: cleanUrl,
        updatedAt: serverTimestamp(),
        history: nextHistory,
        historyIndex: nextIndex
      });
      setInputUrl(cleanUrl);
    } catch (e) {
      console.error("Error setting URL:", e);
    }
  };

  const handleGoBack = async () => {
    const hist = room?.browser.history || [];
    const idx = room?.browser.historyIndex ?? 0;
    if (idx > 0 && canControl) {
      const prevUrl = hist[idx - 1];
      await update(ref(rtdb, `rooms/${roomId}/browser`), {
        currentUrl: prevUrl,
        historyIndex: idx - 1,
        updatedAt: serverTimestamp()
      });
    }
  };

  const handleGoForward = async () => {
    const hist = room?.browser.history || [];
    const idx = room?.browser.historyIndex ?? 0;
    if (idx < hist.length - 1 && canControl) {
      const nextUrl = hist[idx + 1];
      await update(ref(rtdb, `rooms/${roomId}/browser`), {
        currentUrl: nextUrl,
        historyIndex: idx + 1,
        updatedAt: serverTimestamp()
      });
    }
  };

  const handleRefresh = async () => {
    if (!canControl || !room) return;
    await update(ref(rtdb, `rooms/${roomId}/browser`), {
      updatedAt: serverTimestamp() // triggers onValue update
    });
  };

  // Switch presets helper
  const handleSelectPreset = (url: string) => {
    if (canControl) {
      updateBrowserUrl(url);
    }
  };

  // --- PHASE 4: SOCIAL ACTION HANDLERS ---
  const handleCreateBrowserRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || creating) return;

    setCreating(true);
    const newRoomId = Math.random().toString(36).substring(2, 9).toUpperCase();

    try {
      await set(ref(rtdb, `rooms/${newRoomId}`), {
        host: currentUser.uid,
        hostName: userNick,
        hostAvatar: userAvatar,
        videoUrl: 'https://www.youtube.com/watch?v=QdBZY2fkU-0',
        videoTitle: 'Playzi Sync Browser',
        playing: false,
        currentTime: 0,
        updatedAt: serverTimestamp(),
        allowControl: false,
        createdTime: serverTimestamp(),
        browser: {
          currentUrl: 'https://google.com',
          host: currentUser.uid,
          hostName: userNick,
          hostAvatar: userAvatar,
          updatedAt: serverTimestamp(),
          allowNavigationControl: false,
          history: ['https://google.com'],
          historyIndex: 0
        }
      });

      navigate(`/watch/browser/${newRoomId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || !roomId || !currentUser) return;

    const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
    const newMsgRef = push(chatRef);
    set(newMsgRef, {
      uid: currentUser.uid,
      username: userNick,
      avatar: userAvatar,
      text: msg,
      timestamp: Date.now()
    }).then(() => {
      setChatInput('');
    }).catch(e => console.error(e));
  };

  const toggleGuestControls = async () => {
    if (!roomId || !isHost) return;
    try {
      await update(ref(rtdb, `rooms/${roomId}/browser`), {
        allowNavigationControl: !(room?.browser.allowNavigationControl ?? false)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/watch/browser/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const deleteRoom = async () => {
    if (!roomId || !isHost) return;
    if (window.confirm("Deseja realmente encerrar os controles da navegação?")) {
      try {
        await remove(ref(rtdb, `rooms/${roomId}`));
        navigate('/watch');
      } catch (err) {
        console.error(err);
      }
    }
  };


  // --- PHASE 5: EMULATOR RENDER LOGICS ---
  // Returns appropriate component emulation based on active URL
  const renderBrowserContent = () => {
    const url = room?.browser.currentUrl || 'https://google.com';
    const parsedYtId = getYoutubeVideoId(url);

    // Dynamic Search Detection or Subroutes
    const queryMatch = url.match(/[?&]q=([^&]+)/);
    const searchQuery = queryMatch ? decodeURIComponent(queryMatch[1].replace(/\+/g, ' ')) : '';

    if (parsedYtId) {
      // 1. YouTube Synced Watch Interface inside simulated web browser
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4 relative">
          <div className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-glow-blue bg-black/80">
            <iframe 
              src={`https://www.youtube.com/embed/${parsedYtId}?enablejsapi=1&autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube Sync Iframe"
            />
          </div>
          <div className="mt-4 text-center max-w-xl space-y-2">
            <div className="inline-flex items-center space-x-2 bg-vibe-neon-pink/15 px-3 py-1 rounded-full border border-vibe-neon-pink/30 text-vibe-neon-pink text-[10px] font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-vibe-neon-pink animate-pulse" />
              <span>Transmissão Ativa no Browser</span>
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Sincronizado via Rave Playzi Link</h3>
            <p className="text-[11px] text-vibe-muted">Navegador em tempo real. Se o host mudar a URL ou pesquisar na barra, sincroniza para todos.</p>
          </div>
        </div>
      );
    }

    if (url.includes('youtube.com')) {
      // 2. YouTube Home / Search simulator layout
      const searchTerms = url.includes('/results') ? searchQuery : '';

      const listToShow = searchTerms
        ? MOCK_YOUTUBE_VIDEOS.filter(v => 
            v.title.toLowerCase().includes(searchTerms.toLowerCase()) || 
            v.author.toLowerCase().includes(searchTerms.toLowerCase())
          )
        : MOCK_YOUTUBE_VIDEOS;

      return (
        <div className="w-full h-full bg-[#0f0f0f] text-white flex flex-col overflow-y-auto no-scrollbar select-none">
          {/* YT Header Simulator */}
          <div className="p-4 bg-[#212121] flex items-center justify-between border-b border-white/5 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center font-black text-xs text-white">Y</div>
              <span className="font-black text-xs uppercase tracking-tighter text-white">You Tube</span>
            </div>
            {/* Search Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (canControl) {
                  updateBrowserUrl(`https://youtube.com/results?q=${encodeURIComponent(ytSearchQuery)}`);
                }
              }}
              className="flex items-center space-x-2 bg-[#121212] rounded-full px-3.5 py-1.5 border border-white/10 w-full max-w-xs sm:max-w-md mx-2 overflow-hidden"
            >
              <input 
                type="text" 
                placeholder="Pesquisar no YouTube..." 
                disabled={!canControl}
                value={ytSearchQuery}
                onChange={(e) => setYtSearchQuery(e.target.value)}
                className="bg-transparent text-[11px] text-white focus:outline-none flex-1 font-bold"
              />
              <button type="submit" className="p-0.5 text-vibe-muted hover:text-white">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="w-4" />
          </div>

          {/* YT Content Video Grid */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase font-black tracking-widest text-vibe-muted">
                {searchTerms ? `Resultados para "${searchTerms}"` : 'Vídeos Recomendados'}
              </h3>
            </div>

            {listToShow.length === 0 ? (
              <div className="text-center py-10 space-y-1.5">
                <p className="text-vibe-muted text-xs font-bold uppercase tracking-widest">Nenhum vídeo encontrado</p>
                <button 
                  onClick={() => updateBrowserUrl('https://youtube.com')}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-vibe-neon-blue font-black uppercase tracking-widest"
                >
                  Voltar ao início do YT
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {listToShow.map(vid => (
                  <div 
                    key={vid.id}
                    onClick={() => {
                      if (canControl) {
                        updateBrowserUrl(`https://youtube.com/watch?v=${vid.id}`);
                      }
                    }}
                    className={cn(
                      "group bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300 border border-white/5",
                      canControl ? "hover:border-vibe-neon-blue/40" : "cursor-not-allowed opacity-90"
                    )}
                  >
                    <div className="aspect-video w-full bg-cover bg-center relative" style={{ backgroundImage: `url(${vid.thumb})` }}>
                      <div className="absolute right-2 bottom-2 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest">
                        REALTIME
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <h4 className="text-[11px] font-black uppercase text-white tracking-wide truncate group-hover:text-vibe-neon-blue transition-colors">
                        {vid.title}
                      </h4>
                      <p className="text-[9px] text-vibe-muted font-bold">{vid.author}</p>
                      <p className="text-[8px] text-vibe-muted font-black uppercase flex items-center space-x-1.5 mt-1">
                        <span>{vid.views}</span>
                        <span>•</span>
                        <span>{vid.date}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (url.includes('google.com')) {
      // 3. Google.com Emulator - Search and Results
      const isSearchPage = url.includes('/search');

      if (isSearchPage) {
        // Query results generator
        const queryClean = searchQuery.toLowerCase().trim();
        const results = GOOGLE_RESULTS_MAP[queryClean] || [
          { 
            title: `Resultados em Realtime sobre "${searchQuery}"`, 
            snippet: `Pesquisa simulada do Playzi Sync. Assista trailers de ${searchQuery}, trailers do YouTube ou jogue no Arcade com a galera de modo sincronizado.`, 
            url: `https://youtube.com/results?q=${encodeURIComponent(searchQuery)}` 
          },
          { 
            title: `Fóruns da comunidade de ${searchQuery} no Playzi`, 
            snippet: `Entre agora nos canais públicos de debate gamer do Playzi chat. Crie tópicos, ganhe diamantes, junte-se aos squads de Free Fire, Roblox, e Minecraft.`, 
            url: `https://playzi.app.br/communities` 
          }
        ];

        return (
          <div className="w-full h-full bg-[#202124] text-[#e8eaed] flex flex-col overflow-y-auto no-scrollbar select-none">
            {/* Google Search Header emulator */}
            <div className="p-4 bg-[#303134] border-b border-white/5 flex items-center justify-between shrink-0">
              <div 
                onClick={() => canControl && updateBrowserUrl('https://google.com')}
                className="flex items-center space-x-1 cursor-pointer"
              >
                <span className="text-[#4285F4] font-black text-base uppercase">G</span>
                <span className="text-[#EA4335] font-black text-base uppercase">o</span>
                <span className="text-[#FBBC05] font-black text-base uppercase">o</span>
                <span className="text-[#4285F4] font-black text-base uppercase">g</span>
                <span className="text-[#34A853] font-black text-base uppercase">l</span>
                <span className="text-[#EA4335] font-black text-base uppercase">e</span>
              </div>

              {/* Realtime Search Google bar emulator */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canControl) {
                    updateBrowserUrl(`https://google.com/search?q=${encodeURIComponent(googleSearchQuery)}`);
                  }
                }}
                className="flex items-center space-x-2 bg-[#202124] border border-white/10 rounded-full px-4 py-1.5 w-full max-w-sm sm:max-w-md mx-4 overflow-hidden"
              >
                <input 
                  type="text" 
                  disabled={!canControl}
                  value={googleSearchQuery}
                  onChange={(e) => setGoogleSearchQuery(e.target.value)}
                  placeholder="Pesquise o próximo vídeo, comunidade ou assunto..." 
                  className="bg-transparent text-[11px] text-white focus:outline-none flex-1 font-bold"
                />
                <button type="submit" className="text-vibe-muted hover:text-white">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="w-4" />
            </div>

            {/* Results output mapping */}
            <div className="p-6 max-w-2xl space-y-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9aa0a6]">Pesquisa segura Playzi Sync</p>

              {results.map((r, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] text-[#9aa0a6] block truncate">{r.url}</span>
                  <h4 
                    onClick={() => {
                      if (canControl) {
                        updateBrowserUrl(r.url);
                      }
                    }}
                    className={cn(
                      "text-xs font-black uppercase tracking-wide text-[#8ab4f8] hover:underline cursor-pointer block",
                      canControl ? "" : "cursor-not-allowed opacity-90"
                    )}
                  >
                    {r.title}
                  </h4>
                  <p className="text-[11px] text-[#bdc1c6] leading-relaxed">{r.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Classic Google Search front page emulator
      return (
        <div className="w-full h-full bg-[#202124] text-[#e8eaed] flex flex-col items-center justify-center p-6 select-none relative">
          <div className="text-center space-y-6 w-full max-w-md">
            {/* Beautiful Large Google logo with branding */}
            <div className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
            </div>

            {/* Simulated Search bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (canControl) {
                  updateBrowserUrl(`https://google.com/search?q=${encodeURIComponent(googleSearchQuery)}`);
                }
              }}
              className="flex items-center space-x-3 bg-[#303134] hover:bg-[#3c4043] focus-within:bg-[#303134] border border-transparent focus-within:border-[#8ab4f8] px-4 py-3 rounded-full transition-all shadow-md overflow-hidden"
            >
              <Search className="w-4 h-4 text-[#9aa0a6]" />
              <input 
                type="text" 
                disabled={!canControl}
                value={googleSearchQuery}
                onChange={(e) => setGoogleSearchQuery(e.target.value)}
                placeholder="Pesquise por 'GTA 6', 'Minecraft', 'Dating', etc..." 
                className="bg-transparent text-xs text-white placeholder-[#9aa0a6] focus:outline-none flex-1 font-bold"
              />
            </form>

            <div className="flex justify-center space-x-2 text-[10px] font-black uppercase tracking-widest text-[#9aa0a6] pt-2">
              <span>Navegador Sandbox Playzi</span>
            </div>
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] italic text-[#9aa0a6]">
            "Web não funciona com todos os vídeos externos. Se um vídeo puder ser reproduzido, aparecerá uma mensagem."
          </div>
        </div>
      );
    }

    // 4. Default safe iframe browser loader with error check interface fallback
    return (
      <div className="w-full h-full bg-black/90 flex flex-col">
        <iframe 
          key={room?.browser.updatedAt} // forces re-render if host clicks refresh
          src={url}
          className="w-full flex-1 border-none bg-white"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title="Safe Inline Iframe"
        />
        <div className="p-2 bg-black/80 border-t border-white/5 flex items-center justify-between text-[10px] px-4 font-black text-vibe-muted shrink-0">
          <span className="flex items-center uppercase tracking-wider">
            <Lock className="w-3 h-3 mr-1 text-emerald-400" /> Web-Sandbox Ativo
          </span>
          <span className="uppercase font-bold text-[9px] tracking-tight">{url}</span>
        </div>
      </div>
    );
  };


  // --- VIEW LAYOUT 1: PORTAL / DASHBOARD (List and Create) ---
  if (!roomId) {
    return (
      <div className="pt-6 pb-nav min-h-screen px-4 sm:px-6 relative gaming-grid select-none">
        <SEO 
          title="Playzi Browser Sync - Navegue em Grupo na Internet" 
          description="Navegue na web de forma sincronizada em grupo perfeito. Veja vídeos, pesquise no Google e junte o squad."
          keywords="watch party sync, rave web browser, navegar juntos internet, playzi browser"
        />

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 relative">
            <div className="absolute inset-0 bg-vibe-neon-purple/10 blur-3xl rounded-full w-72 h-72 mx-auto pointer-events-none" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center space-x-3 bg-vibe-neon-purple/10 border border-vibe-neon-purple/30 px-4 py-2 rounded-full text-vibe-neon-purple text-[11px] font-black uppercase tracking-widest"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Co-browsing Engine On-line</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Playzi <span className="neon-text-purple">Browser Sync</span>
            </h1>
            <p className="text-vibe-muted text-xs uppercase tracking-widest font-black max-w-md mx-auto">
              Navegue em conjunto pela internet com seus amigos. Host comanda, squad comemora.
            </p>
          </div>

          {/* Setup session layout card */}
          <div className="vibe-card bg-black/40 border-white/5 p-8 rounded-3xl relative overflow-hidden text-center max-w-lg mx-auto space-y-6">
            <div className="w-14 h-14 rounded-full bg-vibe-neon-purple/15 border border-vibe-neon-purple/30 text-vibe-neon-purple flex items-center justify-center mx-auto shadow-glow-purple">
              <Globe className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#00f2ff]">Nova Sessão Web Co-Browse</h2>
              <p className="text-[11px] text-vibe-muted uppercase tracking-wider font-bold">Inicie um navegador sincronizado em tempo real na rede.</p>
            </div>

            <button 
              onClick={handleCreateBrowserRoom}
              disabled={creating}
              className="w-full bg-vibe-neon-purple hover:bg-vibe-neon-purple/95 active:scale-95 disabled:bg-vibe-neon-purple/40 text-white font-black rounded-2xl py-4.5 text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 shadow-glow-purple"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Criar Browser da Sala</span>
                </>
              )}
            </button>
          </div>

          {/* Active web browser sync rooms feed list */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-black tracking-widest text-vibe-muted flex items-center">
              <Users className="w-4 h-4 mr-2 text-vibe-neon-purple" />
              Arenas de Navegação Ativas ({activeRooms.length})
            </h3>

            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/5 rounded-3xl space-y-3">
                <div className="w-8 h-8 border-2 border-vibe-neon-purple/30 border-t-vibe-neon-purple rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase text-vibe-muted tracking-widest">Localizando salas...</span>
              </div>
            ) : activeRooms.length === 0 ? (
              <div className="text-center p-10 bg-white/5 border border-white/5 rounded-3xl space-y-2">
                <p className="text-vibe-muted text-xs font-bold uppercase tracking-widest">Nenhuma arena web ativa</p>
                <p className="text-[10px] text-vibe-muted max-w-xs mx-auto">Você pode ser o primeiro a criar e comandar um navegador multiplayer!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRooms.map((r) => {
                  const onCount = r.users ? Object.values(r.users).filter((u: any) => u.online === true).length : 0;
                  return (
                    <div 
                      key={r.id}
                      className="vibe-card bg-black/40 border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-vibe-neon-purple/20 transition-all group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-vibe-neon-purple bg-vibe-neon-purple/10 border border-vibe-neon-purple/20 px-2 py-0.5 rounded-full">
                            COD {r.id}
                          </span>
                          <span className="flex items-center text-[10px] font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                            {onCount} Ativos
                          </span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-white tracking-wide truncate mt-1">
                          Navegando em: {r.browser.currentUrl}
                        </h4>
                        <div className="flex items-center space-x-2 mt-2">
                          <img src={r.browser.hostAvatar} className="w-5 h-5 rounded-full border border-white/10" alt="Host" />
                          <span className="text-[10px] text-vibe-muted font-bold">Iniciado por {r.browser.hostName}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/watch/browser/${r.id}`)}
                        className="w-full bg-white/5 group-hover:bg-vibe-neon-purple text-white group-hover:text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center space-x-1"
                      >
                        <span>Entrar no Co-Browse</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW LAYOUT 2: LOADER WHILE ROOM VERIFY ACTS ---
  if (roomExists === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-vibe-bg space-y-4">
        <div className="w-12 h-12 border-4 border-vibe-neon-purple/30 border-t-vibe-neon-purple rounded-full animate-spin shadow-glow-purple" />
        <span className="text-xs font-black uppercase tracking-widest text-vibe-muted animate-pulse">Sintonizando canais da navegação...</span>
      </div>
    );
  }

  // --- VIEW LAYOUT 3: ROOM NOT FOUND ---
  if (roomExists === false) {
    return (
      <div className="pt-24 px-6 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-vibe-neon-pink/10 border border-vibe-neon-pink/20 text-vibe-neon-pink rounded-full flex items-center justify-center mx-auto shadow-glow-pink">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Sala não encontrada</h2>
          <p className="text-vibe-muted text-xs leading-relaxed">
            Esta sala pode ter sido encerrada pelo moderador ou o ID inserido na URL está incorreto. Verifique o link e tente novamente.
          </p>
        </div>
        <button 
          onClick={() => navigate('/watch')}
          className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Voltar ao Lobby Sync
        </button>
      </div>
    );
  }


  // --- VIEW LAYOUT 4: FULL-FEATURED PLAYER RAVE BROWSER REALTIME CO-BROWSE ROOM ---
  return (
    <div className="pt-6 pb-nav min-h-screen px-4 font-sans text-white select-none relative max-w-6xl mx-auto">
      <SEO 
        title={`Playzi Sync Browser - Co-Browse Room ${roomId}`} 
        description="Assista vídeos, pesquise na web de forma perfeitamente sincronizada em grupo direto no Chrome."
      />

      {/* Main Room Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Large Browser Viewport, Header, Presets */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Room Banner Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/40 border border-white/5 p-4 rounded-2xl relative">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2.5 bg-vibe-neon-purple/10 border border-vibe-neon-purple/20 text-vibe-neon-purple rounded-xl shrink-0">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xs text-vibe-neon-purple font-black uppercase tracking-widest">CO-BROWSE #{roomId}</h1>
                  <span className="text-[8px] font-black tracking-widest border border-amber-500/30 text-amber-400 bg-amber-500/10 px-2 rounded">RAVE BROWSER</span>
                </div>
                <p className="text-xs font-bold text-white uppercase truncate tracking-tight">Sincronização em tempo real na rede</p>
              </div>
            </div>

            {/* Change between Sync Mode Buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              <button 
                onClick={() => navigate(`/watch/youtube/${roomId}`)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-vibe-neon-blue/20 to-vibe-neon-purple/20 border border-vibe-neon-blue/30 hover:from-vibe-neon-blue/30 hover:to-vibe-neon-purple/30 text-vibe-neon-blue text-[10px] font-black uppercase tracking-widest rounded-xl transition-all animate-pulse"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>YouTube Hub</span>
              </button>

              <button 
                onClick={() => navigate(`/watch/${roomId}`)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 hover:bg-vibe-neon-blue/20 text-vibe-neon-blue text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Modo Player</span>
              </button>
              
              <button 
                onClick={() => navigate('/watch')}
                className="flex items-center space-x-1.5 px-3 py-2 bg-white/5 border border-white/5 hover:bg-vibe-neon-pink/10 hover:border-vibe-neon-pink/30 hover:text-vibe-neon-pink text-vibe-muted text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lobby</span>
              </button>
            </div>
          </div>

          {/* Browser Navigation Toolbar */}
          <div className="vibe-card bg-[#18191a] border-white/10 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-md shrink-0">
            {/* Nav Arrows */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={handleGoBack}
                disabled={!canControl || (room?.browser.historyIndex ?? 0) <= 0}
                className="p-2 rounded-xl text-white hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoForward}
                disabled={!canControl || (room?.browser.historyIndex ?? 0) >= ((room?.browser.history || []).length - 1)}
                className="p-2 rounded-xl text-white hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent"
                title="Avançar"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleRefresh}
                disabled={!canControl}
                className="p-2 rounded-xl text-white hover:bg-white/5 disabled:opacity-20"
                title="Recarregar"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* URL Input Box Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                updateBrowserUrl(inputUrl);
              }}
              className="flex-1 flex items-center space-x-2.5 bg-black/50 border border-white/10 focus-within:border-vibe-neon-purple/40 rounded-xl px-3 py-2 transition-colors overflow-hidden"
            >
              <Globe className="w-3.5 h-3.5 text-vibe-muted" />
              <input 
                type="text" 
                disabled={!canControl}
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Abra qualquer link ou pesquise: youtube.com, google.com... "
                className="bg-transparent text-xs text-white focus:outline-none flex-1 font-bold tracking-wide"
              />
              <button type="submit" className="hidden" />
            </form>

            {/* Sync Alert Status */}
            <div className="flex items-center space-x-1.5 shrink-0 px-2 text-[10px] font-black uppercase text-vibe-neon-purple tracking-widest">
              <span className="w-2 h-2 rounded-full bg-vibe-neon-purple animate-pulse" />
              <span className="hidden sm:inline">Sync Ativo</span>
            </div>
          </div>

          {/* Quick presets hotbar */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-black/20 rounded-xl border border-white/5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-vibe-muted px-2 shrink-0">Destaques:</span>
            {BROWSER_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset.url)}
                disabled={!canControl}
                className={cn(
                  "py-1.5 px-3 bg-white/5 rounded-lg border border-white/5 hover:border-vibe-neon-purple/25 text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 transition-all shrink-0",
                  canControl ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-40 cursor-not-allowed"
                )}
              >
                <preset.icon className={cn("w-3.5 h-3.5", preset.color)} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>

          {/* Large Main Browser Emulation Canvas frame */}
          <div className="h-[520px] bg-[#1a1a1a] rounded-3xl border border-white/10 overflow-hidden relative shadow-lg">
            {renderBrowserContent()}

            {/* Host authoritative message bar if viewer is denied control */}
            {!canControl && (
              <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20 pointer-events-none text-[9px] font-black uppercase tracking-widest text-[#00f2ff]">
                <Lock className="w-3.5 h-3.5 text-vibe-neon-pink animate-pulse" />
                <span>Modo Co-Navegador - Host Autorizado</span>
              </div>
            )}
          </div>

          {/* Host Setup Rules */}
          {isHost && (
            <div className="vibe-card bg-black/40 border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <button 
                  type="button"
                  onClick={toggleGuestControls}
                  className={cn(
                    "p-2 rounded-lg border flex items-center justify-center transition-colors",
                    room?.browser.allowNavigationControl 
                      ? "bg-vibe-neon-purple/10 border-vibe-neon-purple/30 text-vibe-neon-purple"
                      : "bg-white/5 border-white/10 text-vibe-muted"
                  )}
                >
                  {room?.browser.allowNavigationControl ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
                <div>
                  <span className="text-xs font-black uppercase tracking-wide block">Navegação Livre ao Squad</span>
                  <span className="text-[9px] text-vibe-muted font-bold uppercase block mt-0.5">Let any viewer change urls/search</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={copyRoomLink}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-vibe-neon-purple" />}
                  <span>{copiedLink ? "Copiado!" : "Convidar Amigos"}</span>
                </button>

                <button 
                  type="button"
                  onClick={deleteRoom}
                  className="px-4 py-2.5 bg-vibe-neon-pink/10 border border-vibe-neon-pink/20 text-vibe-neon-pink rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Terminar Sessão
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Realtime Presence & Sync Chat */}
        <div className="space-y-4">
          
          {/* Active Presence Panel */}
          <div className="vibe-card bg-black/40 border-white/5 p-4 rounded-2xl space-y-3 shrink-0">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#00f2ff] flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5" /> Presença Online
              </span>
              <span className="text-[9px] font-black text-vibe-muted bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {participants.length} Squad
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">
              {participants.map((user) => {
                const userIsHost = room?.browser.host === user.uid;
                return (
                  <div 
                    key={user.uid}
                    className="flex items-center justify-between bg-white/5 border border-white/5 px-3 py-2 rounded-xl"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <img src={user.photoURL} className="w-5.3 h-5.3 rounded-full border border-white/10" alt={user.displayName} />
                      <span className="text-[10px] font-black tracking-tight truncate text-white">
                        {user.displayName}
                      </span>
                    </div>
                    {userIsHost && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sync Chat Card */}
          <div className="vibe-card bg-black/40 border-white/5 p-4 rounded-2xl flex flex-col h-[400px]">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-2 mb-2 shrink-0">
              <MessageSquare className="w-4 h-4 text-vibe-neon-purple animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-vibe-text">Sync Chat</span>
            </div>

            {/* Chat Box panel */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-0">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-vibe-muted">Mensagens em Tempo Real</p>
                  <p className="text-[9px] text-vibe-muted mt-0.5">Mande gifs, links ou comente a navegação da galera!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-2 text-xs">
                    <img src={msg.avatar} className="w-6 h-6 rounded-full border border-white/5 shrink-0 mt-0.5" alt={msg.username} />
                    <div className="space-y-0.5 max-w-[85%]">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="font-black text-vibe-neon-blue text-[10px] tracking-tight">{msg.username}</span>
                        <span className="text-[8px] text-vibe-muted font-bold">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-white bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-2xl text-[11px] break-words">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Form messaging keyboard */}
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-white/5 pt-2 mt-2 shrink-0">
              <input 
                type="text"
                placeholder="Disparar no chat da arena..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-vibe-neon-purple/50 transition-colors"
              />
              <button 
                type="submit"
                className="p-2.5 bg-vibe-neon-purple text-white rounded-xl hover:bg-vibe-neon-purple/90 hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
