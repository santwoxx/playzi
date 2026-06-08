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
  Search, 
  Globe, 
  Compass, 
  Flame, 
  Skull, 
  Gamepad2, 
  Music, 
  Laptop, 
  AlertCircle,
  Clock,
  ArrowRight,
  TvMinimalPlay,
  Trash2,
  Mic,
  AtSign,
  Image,
  Smile,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerSyncHeartbeat } from '../hooks/useWebRTC';

// Declarations for window.YT
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

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

interface SyncRoom {
  id: string;
  host: string;
  hostName: string;
  hostAvatar: string;
  videoUrl: string;
  videoTitle: string;
  playing: boolean;
  currentTime: number;
  updatedAt: number;
  allowControl: boolean;
  users?: Record<string, RoomUser>;
  chat?: Record<string, ChatMessage>;
}

interface SearchVideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
  publishedAt?: string;
}

// Extract Video Id
function getYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const stripped = url.trim();
  
  // YouTube Shorts check
  const shortsMatch = stripped.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }
  
  // Standard and youtu.be links
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = stripped.match(regExp);
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  // Fallback direct extraction via url objects
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

// Awesome preset results in case API key is empty or returns failure
const FALLBACK_YOUTUBE_RESULTS: SearchVideoResult[] = [
  {
    id: 'QdBZY2fkU-0',
    title: 'GTA 6 - Official Trailer 1 (Playzi Rave Choice)',
    thumbnail: 'https://img.youtube.com/vi/QdBZY2fkU-0/mqdefault.jpg',
    channelTitle: 'Rockstar Games',
    duration: '1:30',
    publishedAt: '2023-12-05'
  },
  {
    id: 'wIPtcoHInHk',
    title: 'A Minecraft Movie | Official Trailer',
    thumbnail: 'https://img.youtube.com/vi/wIPtcoHInHk/mqdefault.jpg',
    channelTitle: 'Warner Bros. Pictures',
    duration: '2:40',
    publishedAt: '2024-11-19'
  },
  {
    id: 'eAvXh_0YiLU',
    title: 'What is Roblox? Official Experience Guide',
    thumbnail: 'https://img.youtube.com/vi/eAvXh_0YiLU/mqdefault.jpg',
    channelTitle: 'Roblox Official',
    duration: '1:45',
    publishedAt: '2024-03-10'
  },
  {
    id: 'ZHhqwBwm_Xw',
    title: 'League of Legends - Still Here | Season 2024 Cinematic',
    thumbnail: 'https://img.youtube.com/vi/ZHhqwBwm_Xw/mqdefault.jpg',
    channelTitle: 'League of Legends',
    duration: '3:45',
    publishedAt: '2024-01-10'
  },
  {
    id: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio 📚 beats to relax/study to',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg',
    channelTitle: 'Lofi Girl',
    duration: 'Ao Vivo',
    publishedAt: '2025-01-01'
  },
  {
    id: 'gHzu08pZ6O4',
    title: 'MrBeast - Extreme $500,000 Survival Challenge',
    thumbnail: 'https://img.youtube.com/vi/gHzu08pZ6O4/mqdefault.jpg',
    channelTitle: 'MrBeast',
    duration: '14:20',
    publishedAt: '2024-09-21'
  },
  {
    id: 'mO_Jv7VunqA',
    title: 'Minecraft 1.21 Tricky Trials Update: Official Trailer',
    thumbnail: 'https://img.youtube.com/vi/mO_Jv7VunqA/mqdefault.jpg',
    channelTitle: 'Minecraft',
    duration: '2:15',
    publishedAt: '2024-06-13'
  },
  {
    id: 'QkkoHAzjn0',
    title: 'Grand Theft Auto V: Official Launch Trailer',
    thumbnail: 'https://img.youtube.com/vi/QkkoHAzjn0/mqdefault.jpg',
    channelTitle: 'Rockstar Games',
    duration: '1:00',
    publishedAt: '2013-08-30'
  },
  {
    id: '1zW_6oYnBAs',
    title: 'Roblox - Classic Games & Retro Worlds Event',
    thumbnail: 'https://img.youtube.com/vi/1zW_6oYnBAs/mqdefault.jpg',
    channelTitle: 'Roblox Corp',
    duration: '2:50',
    publishedAt: '2024-05-14'
  }
];

export default function YoutubeHub() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Basic lists/room states
  const [activeRooms, setActiveRooms] = useState<SyncRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Active room states
  const [room, setRoom] = useState<SyncRoom | null>(null);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState<RoomUser[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('minecraft');
  const [searchResults, setSearchResults] = useState<SearchVideoResult[]>(FALLBACK_YOUTUBE_RESULTS);
  const [searching, setSearching] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  
  // Right sidebar tab state: 'chat' | 'users'
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const [activeTabMobile, setActiveTabMobile] = useState<'chat' | 'search' | 'users'>('chat');
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [showMobileHostControls, setShowMobileHostControls] = useState(false);

  const MOBILE_STICKERS = [
    { name: "Anya Calma", url: "https://media.giphy.com/media/X99M8D7B0M6X3c69U7/giphy.gif" },
    { name: "Hehe Risos", url: "https://media.giphy.com/media/FWi1f9rrS7A76/giphy.gif" },
    { name: "Gatinho Funk", url: "https://media.giphy.com/media/13CoXDiaCcC9R6/giphy.gif" },
    { name: "Meme Peixe", url: "https://media.giphy.com/media/Wsk4Y90asIs4xZcTda/giphy.gif" },
    { name: "Anya Cry", url: "https://media.giphy.com/media/3o7WTq6P2X3lT5Dq9O/giphy.gif" },
    { name: "Doge Dance", url: "https://media.giphy.com/media/hTAsf9O5YfPMFasZ9g/giphy.gif" },
  ];

  const handleSendSticker = (stickerUrl: string) => {
    if (!roomId || !currentUser) return;
    const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
    const newMsgRef = push(chatRef);
    set(newMsgRef, {
      uid: currentUser.uid,
      username: userNick,
      avatar: userAvatar,
      text: `[STICKER]: ${stickerUrl}`,
      timestamp: Date.now()
    }).then(() => {
      setShowStickerPanel(false);
    }).catch(e => console.error(e));
  };
  const [chromeUrlInput, setChromeUrlInput] = useState('');

  // Player synchronization refs and variables
  const ytPlayerRef = useRef<any>(null);
  const isSyncingRef = useRef<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const ytContainerId = "youtube-hub-iframe-player";

  // Check username & identity profiles
  const userNick = currentUser?.nickname || currentUser?.displayName || 'Jogador';
  const userAvatar = currentUser?.photoURL || `https://ui-avatars.com/api/?name=${userNick}&background=random`;

  // Dynamic tags
  const QUICK_TAGS = ['Minecraft', 'Roblox', 'GTA trailer', 'Lofi Girl', 'MrBeast', 'Minecraft Cave Update', 'Nintendo Direct'];

  const hasApiKey = !!import.meta.env.VITE_YOUTUBE_API_KEY;

  // --- PHASE 1: SEARCH FUNCTION ---
  const handleSearch = async (term: string) => {
    if (!term.trim()) return;
    setSearching(true);
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

    if (!apiKey) {
      // Offline fallback search
      setIsUsingFallback(true);
      setTimeout(() => {
        const queryNorm = term.toLowerCase();
        const filtered = FALLBACK_YOUTUBE_RESULTS.filter(v => 
          v.title.toLowerCase().includes(queryNorm) || 
          v.channelTitle.toLowerCase().includes(queryNorm)
        );
        // If query finds nothing, add some custom simulated results
        if (filtered.length === 0) {
          setSearchResults([
            {
              id: 'dQw4w9WgXcQ',
              title: `Pesquisa Simulada: ${term} - Vídeo de Exemplo`,
              thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
              channelTitle: 'Canal Pesquisado Playzi',
              duration: '3:32',
              publishedAt: '2026'
            },
            ...FALLBACK_YOUTUBE_RESULTS.slice(0, 3)
          ]);
        } else {
          setSearchResults(filtered);
        }
        setSearching(false);
      }, 400);
      return;
    }

    try {
      setIsUsingFallback(false);
      const hostOrigin = window.location.origin;
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(term)}&type=video&key=${apiKey}`);
      if (!res.ok) {
        throw new Error(`Google YouTube API status ${res.status}`);
      }
      const data = await res.json();
      const mapped: SearchVideoResult[] = (data.items || []).map((item: any) => ({
        id: item.id?.videoId || '',
        title: item.snippet?.title || 'Video Sem Título',
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
        channelTitle: item.snippet?.channelTitle || 'Canal Desconhecido',
        publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt).toLocaleDateString() : ''
      })).filter((v: any) => v.id);

      setSearchResults(mapped);
    } catch (err) {
      console.warn("YouTube live search failed, reverting to sandbox mode database:", err);
      setIsUsingFallback(true);
      // Fallback matching
      const queryNorm = term.toLowerCase();
      const filtered = FALLBACK_YOUTUBE_RESULTS.filter(v => 
        v.title.toLowerCase().includes(queryNorm) || 
        v.channelTitle.toLowerCase().includes(queryNorm)
      );
      setSearchResults(filtered.length > 0 ? filtered : FALLBACK_YOUTUBE_RESULTS);
    } finally {
      setSearching(false);
    }
  };

  // Initial trigger
  useEffect(() => {
    if (roomId) {
      handleSearch(searchQuery);
    }
  }, [roomId]);

  // --- PHASE 2: PORTAL VIEW (LOAD ACTIVE ROOMS) ---
  useEffect(() => {
    if (roomId) return;

    setLoadingRooms(true);
    const roomsRef = ref(rtdb, 'rooms');
    const unsub = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: SyncRoom[] = [];
        const now = Date.now();
        
        Object.keys(data).forEach(key => {
          const rData = data[key];
          
          const onlineCount = rData.users 
            ? Object.values(rData.users).filter((u: any) => u.online === true).length 
            : 0;
            
          const createdTime = rData.createdTime || rData.updatedAt;
          const isLegacy = !createdTime;
          const ageSeconds = createdTime ? (now - Number(createdTime)) / 1000 : 0;
          
          if (onlineCount === 0 && (isLegacy || ageSeconds > 30)) {
            remove(ref(rtdb, `rooms/${key}`)).catch(err => {
              console.warn("Background cleaning empty room from YouTube Hub:", key, err);
            });
          } else {
            list.push({
              id: key,
              ...rData
            });
          }
        });

        // Sort by updatedAt desc
        setActiveRooms(list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
      } else {
        setActiveRooms([]);
      }
      setLoadingRooms(false);
    }, (error) => {
      console.error("Error reading RTDB rooms inside YouTube Hub:", error);
      setLoadingRooms(false);
    });

    return () => unsub();
  }, [roomId]);

  // --- PHASE 3: HANDLE ACTIVE ROOM CONNECTION AND LOBBY JOIN ---
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const userPresenceRef = ref(rtdb, `rooms/${roomId}/users/${currentUser.uid}`);

    // Join and sign presence
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

    // Listen to parent room fields
    const unsubRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomExists(true);
        const parsedRoom: SyncRoom = {
          id: roomId,
          host: data.host,
          hostName: data.hostName || 'Anônimo',
          hostAvatar: data.hostAvatar || '',
          videoUrl: data.videoUrl || '',
          videoTitle: data.videoTitle || 'Sessão YouTube Hub',
          playing: data.playing ?? false,
          currentTime: data.currentTime ?? 0,
          updatedAt: data.updatedAt ?? Date.now(),
          allowControl: data.allowControl ?? false
        };
        setRoom(parsedRoom);

        // Parse chat list
        if (data.chat) {
          const msgs: ChatMessage[] = Object.keys(data.chat).map(key => ({
            id: key,
            ...data.chat[key]
          }));
          setChatMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
        } else {
          setChatMessages([]);
        }

        // Parse online players
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
          const isHostOnline = usrs.some(u => u.uid === data.host);
          if (!isHostOnline) {
            // Sort by joinedAt ascending (oldest first)
            const sortedUsrs = [...usrs].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
            const oldestUser = sortedUsrs[0];
            if (currentUser && currentUser.uid === oldestUser.uid) {
              update(roomRef, {
                host: oldestUser.uid,
                hostName: oldestUser.displayName || 'Jogador',
                hostAvatar: oldestUser.photoURL || `https://ui-avatars.com/api/?name=${oldestUser.displayName || 'Jogador'}&background=random`
              }).then(async () => {
                const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
                await push(chatRef, {
                  uid: "system",
                  username: "Playzi Bot",
                  avatar: "https://ui-avatars.com/api/?name=PB&background=FF2E93&color=fff",
                  text: `👑 ${oldestUser.displayName || 'Jogador'} é o novo anfitrião da sala!`,
                  timestamp: Date.now()
                });
              }).catch(err => {
                console.warn("Failed to elect host in YoutubeHub:", err);
              });
            }
          }
        }

      } else {
        setRoomExists(false);
        setRoom(null);
      }
    }, (error) => {
      console.warn("RTDB YoutubeHub room subscription failed:", error);
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

  // Auto-scroll chat on incoming logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const isHost = room ? room.host === currentUser?.uid : false;
  const canControl = isHost || (room?.allowControl ?? false);

  const parsedYtVideoId = room ? getYoutubeVideoId(room.videoUrl) : null;

  // Pause YouTube player if active when we switch to Chrome browser / custom url
  useEffect(() => {
    if (!parsedYtVideoId && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch (e) {
        console.warn("Could not pause background video:", e);
      }
    }
  }, [parsedYtVideoId]);

  // --- PHASE 4: PLAYER INITIALIZATION & SYNC LOOPS ---
  const initYoutubePlayer = (vidId: string) => {
    const iframeElement = document.getElementById(ytContainerId);
    if (!iframeElement || iframeElement.tagName !== "IFRAME") {
      ytPlayerRef.current = null;
    }

    if (ytPlayerRef.current) {
      try {
        // Test call to verify if player is attached and active
        if (typeof ytPlayerRef.current.getPlayerState === 'function') {
          ytPlayerRef.current.getPlayerState();
          const videoUrl = typeof ytPlayerRef.current.getVideoUrl === 'function' ? ytPlayerRef.current.getVideoUrl() : '';
          const currentPlayerId = getYoutubeVideoId(videoUrl || '');
          if (currentPlayerId && currentPlayerId === vidId) {
            return; // Already playing/ready with correct ID
          } else {
            if (typeof ytPlayerRef.current.cueVideoById === 'function') {
              ytPlayerRef.current.cueVideoById(vidId);
            }
            if (room?.playing && typeof ytPlayerRef.current.playVideo === 'function') {
              ytPlayerRef.current.playVideo();
            }
            return;
          }
        } else {
          ytPlayerRef.current = null;
        }
      } catch (e) {
        console.warn("YouTube player cue failure or detached, recreating player", e);
        ytPlayerRef.current = null;
      }
    }

    const loadPlayer = () => {
      try {
        const container = document.getElementById(ytContainerId);
        if (!container) {
          console.warn("YouTube container element not found. Retrying in 100ms...");
          setTimeout(loadPlayer, 100);
          return;
        }
        container.innerHTML = "";

        ytPlayerRef.current = new window.YT.Player(ytContainerId, {
          videoId: vidId,
          playerVars: {
            autoplay: 1,
            controls: canControl ? 1 : 0,
            disablekb: canControl ? 0 : 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
            playsinline: 1,
            enablejsapi: 1
          },
          events: {
            onReady: () => {
              if (room) {
                syncLocalPlayerWithServer();
              }
            },
            onStateChange: (event: any) => {
              if (!canControl || isSyncingRef.current) return;

              const state = event.data;
              const target = event.target;
              if (target && typeof target.getCurrentTime === 'function') {
                const currentTime = target.getCurrentTime();
                if (state === window.YT.PlayerState.PLAYING) {
                  updateRoomState(true, currentTime);
                } else if (state === window.YT.PlayerState.PAUSED) {
                  updateRoomState(false, currentTime);
                }
              }
            }
          }
        });
      } catch (error) {
        console.error("Failed to build YT Web Player:", error);
      }
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        loadPlayer();
      };
    }
  };

  // Watch effect to download YT dynamic script if missing and video is YT
  useEffect(() => {
    if (!roomId || !room || !parsedYtVideoId) return;

    if (!window.YT) {
      window.onYouTubeIframeAPIReady = () => {
        initYoutubePlayer(parsedYtVideoId);
      };
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else {
      initYoutubePlayer(parsedYtVideoId);
    }
  }, [roomId, room?.videoUrl, parsedYtVideoId]);

  // Clean up YT frame on unmount
  useEffect(() => {
    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
        ytPlayerRef.current = null;
      }
    };
  }, []);

  // Sync Room writes back state and logs values in DB
  const updateRoomState = async (playing: boolean, currentTime: number) => {
    if (!roomId || !canControl) return;

    isSyncingRef.current = true;
    try {
      await update(ref(rtdb, `rooms/${roomId}`), {
        playing,
        currentTime: Math.max(0, currentTime),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Firebase Sync write failed:", e);
    } finally {
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 550);
    }
  };

  // Synchronizes local client with server state
  const syncLocalPlayerWithServer = () => {
    if (isHost) return;

    if (parsedYtVideoId) {
      const iframeElement = document.getElementById(ytContainerId);
      if (!iframeElement || iframeElement.tagName !== "IFRAME") {
        ytPlayerRef.current = null;
        initYoutubePlayer(parsedYtVideoId);
        return;
      }
    }

    if (!room || !ytPlayerRef.current) return;

    const latencyAdjustment = room.playing ? (Date.now() - room.updatedAt) / 1000 : 0;
    // Cap latency adjustment to reasonable 10 seconds to avoid giant skips on long out-of-focus tabs
    const targetTime = Math.max(0, room.currentTime + (latencyAdjustment < 10 ? latencyAdjustment : 0));

    isSyncingRef.current = true;

    try {
      const playerState = typeof ytPlayerRef.current.getPlayerState === 'function' ? ytPlayerRef.current.getPlayerState() : -1;
      const localTime = typeof ytPlayerRef.current.getCurrentTime === 'function' ? ytPlayerRef.current.getCurrentTime() : 0;

      // play or pause sync
      if (room.playing && playerState !== window.YT.PlayerState.PLAYING) {
        if (typeof ytPlayerRef.current.playVideo === 'function') {
          ytPlayerRef.current.playVideo();
        }
      } else if (!room.playing && playerState === window.YT.PlayerState.PLAYING) {
        if (typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
      }

      // 2 seconds seek threshold checking - adjusted to 1.0s for tighter alignment without video loop restarting
      if (Math.abs(localTime - targetTime) > 1.0) {
        if (typeof ytPlayerRef.current.seekTo === 'function') {
          ytPlayerRef.current.seekTo(targetTime, true);
        }
      }
    } catch (e) {
      console.warn("Error running syncLocalPlayerWithServer:", e);
    }

    // Unblock syncing shortly
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 400);
  };

  // Watch state changes in database room
  useEffect(() => {
    if (!roomId || !room || !ytPlayerRef.current || isHost) return;
    if (isSyncingRef.current) return;

    syncLocalPlayerWithServer();
  }, [room?.playing, room?.currentTime, room?.videoUrl, isHost]);

  // Host periodic heartbeat: writes current position to Firebase RTDB for exact sync
  useEffect(() => {
    if (!roomId || !isHost || !room || !room.playing) return;

    const interval = setInterval(() => {
      if (!ytPlayerRef.current || isSyncingRef.current) return;
      try {
        const currentTime = ytPlayerRef.current.getCurrentTime();
        if (currentTime > 0) {
          update(ref(rtdb, `rooms/${roomId}`), {
            currentTime,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        }
      } catch (e) {}
    }, 4000); // Heartbeat every 4 seconds

    return () => clearInterval(interval);
  }, [roomId, isHost, room?.playing]);

  // Viewers/guests periodic synchronization check via WebRTC Heartbeat Hook (compares and seeks only if > 1s)
  usePlayerSyncHeartbeat(ytPlayerRef, true, room, roomId, isHost, isSyncingRef);

  // Synchronized Controls
  const togglePlayPause = () => {
    if (!canControl || !room) return;
    const nextPlaying = !room.playing;
    let localTime = 0;
    if (ytPlayerRef.current) {
      try {
        localTime = ytPlayerRef.current.getCurrentTime();
      } catch (e) {}
    }
    updateRoomState(nextPlaying, localTime);
  };

  const handleManualSeek = (offset: number) => {
    if (!canControl || !room) return;
    let localTime = 0;
    if (ytPlayerRef.current) {
      try {
        localTime = ytPlayerRef.current.getCurrentTime();
      } catch (e) {}
    }
    const target = Math.max(0, localTime + offset);
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(target, true);
      } catch (e) {}
    }
    updateRoomState(room.playing, target);
  };

  // --- PHASE 5: EVENT HANDLERS ---
  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || creating) return;

    setCreating(true);
    const newRoomId = Math.random().toString(36).substring(2, 9).toUpperCase();

    try {
      await set(ref(rtdb, `rooms/${newRoomId}`), {
        host: currentUser.uid,
        hostName: userNick,
        hostAvatar: userAvatar,
        videoUrl: `https://www.youtube.com/watch?v=QdBZY2fkU-0`, // GTA 6 standard baseline
        videoTitle: "GTA 6 - Official Trailer 1",
        playing: false,
        currentTime: 0,
        updatedAt: serverTimestamp(),
        allowControl: false,
        createdTime: serverTimestamp()
      });

      // Redirect to YouTube Hub screen
      navigate(`/watch/youtube/${newRoomId}`);
    } catch (err) {
      console.error("Room creation error:", err);
    } finally {
      setCreating(false);
    }
  };

  // Join existing from Lobby List
  const handleJoinExistingRoom = (id: string) => {
    navigate(`/watch/youtube/${id}`);
  };

  // Send message inside active room
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !roomId || !currentUser) return;

    const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
    push(chatRef, {
      uid: currentUser.uid,
      username: userNick,
      avatar: userAvatar,
      text: chatInput.trim(),
      timestamp: Date.now()
    });

    setChatInput('');
  };

  // Select video to play (Host actions)
  const handleSelectVideoToPlay = async (videoId: string, title: string) => {
    if (!roomId) return;
    if (!canControl) {
      alert("Apenas o Host pode alterar o vídeo da transmissão.");
      return;
    }

    try {
      await update(ref(rtdb, `rooms/${roomId}`), {
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        videoTitle: title,
        playing: true,
        currentTime: 0,
        updatedAt: serverTimestamp()
      });
      
      // Post system announcement message inside chat database log
      const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
      await push(chatRef, {
        uid: "system",
        username: "Playzi Bot",
        avatar: "https://ui-avatars.com/api/?name=PB&background=FF2E93&color=fff",
        text: `📺 Alterou o vídeo para: "${title}"`,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error("Failed choosing active stream:", e);
    }
  };

  // Copy Room Link to lock friends
  const handleCopyLink = () => {
    if (!roomId) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Toggle controller level rules
  const handleToggleAllowControl = async () => {
    if (!roomId || !isHost || !room) return;
    try {
      await update(ref(rtdb, `rooms/${roomId}`), {
        allowControl: !room.allowControl
      });
    } catch (e) {
      console.error(e);
    }
  };

  // --- RENDER MAIN ---
  if (roomId && roomExists === null) {
    return (
      <div className="min-h-screen bg-[#06020c] flex flex-col items-center justify-center space-y-4">
        <Globe className="w-12 h-12 text-vibe-neon-purple animate-spin" />
        <h2 className="text-sm font-black text-white uppercase tracking-widest animate-pulse">Sintonizando Canal...</h2>
      </div>
    );
  }

  if (roomId && roomExists === false) {
    return (
      <div className="min-h-screen bg-[#06020c] flex flex-col items-center justify-center space-y-6">
        <AlertCircle className="w-16 h-16 text-[#FF2E93] stroke-[1.5]" />
        <div className="text-center">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Sala Não Encontrada</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">Esta sala de transmissão do YouTube Hub não existe ou foi encerrada pelo anfitrião.</p>
        </div>
        <button 
          onClick={() => navigate('/watch/youtube')}
          className="px-6 py-3 bg-gradient-to-r from-vibe-neon-purple to-[#FF2E93] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-glow hover:shadow-glow-blue"
        >
          Voltar para o Portal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06020c] text-slate-100 select-none pb-12 relative overflow-x-hidden">
      <SEO title={roomId ? `Playzi YouTube Hub | Sala ${roomId}` : "Playzi YouTube Hub - Rave Sincronizado"} />
      
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 gaming-grid opacity-[0.06] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-vibe-neon-purple/10 rounded-full filter blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-vibe-neon-blue/10 rounded-full filter blur-[120px] pointer-events-none" />

      {/* PORTAL/LOBBY BOARD (Missing roomId route) */}
      {!roomId && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 mt-6"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-vibe-neon-purple/20 to-vibe-neon-pink/20 border border-vibe-neon-purple/40 px-4 py-1.5 rounded-full text-vibe-neon-purple text-xs font-black uppercase tracking-widest mb-4 animate-pulse">
              <Sparkles className="w-4 h-4 text-vibe-neon-pink fill-vibe-neon-pink" />
              <span>Sincronização em Tempo Real</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
              Playzi <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibe-neon-blue via-vibe-neon-purple to-vibe-neon-pink">YouTube Hub</span>
            </h1>
            <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
              Crie salas interativas estilo Rave. Pesquise vídeos do YouTube diretamente na plataforma, curta com sua galera e jogue sincronizado sem complicação!
            </p>
          </motion.div>

          {/* Core Creation Callout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              className="md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-vibe-neon-blue/10 rounded-full blur-3xl" />
              <div>
                <span className="text-vibe-neon-blue text-[10px] font-black tracking-wider uppercase bg-vibe-neon-blue/10 px-2.5 py-1 rounded-full border border-vibe-neon-blue/20">Modo Anfitrião</span>
                <h3 className="text-xl font-bold text-white mt-3 uppercase">Crie sua Transmissão</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Decida o que assistir pesquisando direto do YouTube, convide amigos enviando o link e controle o playback de todos com sincronia garantida de 1s!
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button 
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-vibe-neon-purple to-vibe-neon-pink hover:to-vibe-neon-blue text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-glow hover:shadow-glow-blue disabled:opacity-50"
                  id="btn-create-yt-hub"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creating ? 'Criando Sala...' : 'Criar Nova Sala'}</span>
                </button>
                
                <button 
                  onClick={() => navigate('/watch/browser')}
                  className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Ir para Modo Browser Sync
                </button>
              </div>
            </motion.div>

            {/* Quick Tutorial card */}
            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="text-white text-xs font-black uppercase tracking-widest text-[#FF2E93]">Como Funciona?</h4>
                <ul className="mt-4 space-y-3.5 text-[11px] text-slate-400">
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 flex items-center justify-center font-bold text-[10px] text-vibe-neon-blue shrink-0 mt-0.5">1</span>
                    <span>Dê o Launch criando ou entrando em uma sala de reprodução pública.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-vibe-neon-purple/10 border border-vibe-neon-purple/20 flex items-center justify-center font-bold text-[10px] text-vibe-neon-purple shrink-0 mt-0.5">2</span>
                    <span>Use a barra lateral de buscas para resgatar vídeos reais do YouTube.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-vibe-neon-pink/10 border border-vibe-neon-pink/20 flex items-center justify-center font-bold text-[10px] text-vibe-neon-pink shrink-0 mt-0.5">3</span>
                    <span>Clique em qualquer resultado e o player atualizará para você e seus amigos!</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-[10px] text-slate-500 italic mt-4 flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Integração YouTube Data API v3</span>
              </div>
            </div>
          </div>

          {/* Active Salas List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4 text-vibe-neon-blue" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Salas do YouTube Hub Ativas</h2>
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-black">{activeRooms.length} Salas</span>
            </div>

            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Globe className="w-8 h-8 text-vibe-neon-purple animate-spin" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Escaneando salas nos servidores...</p>
              </div>
            ) : activeRooms.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center">
                <TvMinimalPlay className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-white text-xs font-black uppercase tracking-wider">Nenhuma sala pública ativa no momento</h3>
                <p className="text-slate-400 text-[11px] mt-1 max-w-sm mx-auto">
                  Crie a primeira sala de transmissão utilizando o botão acima e divirta-se!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRooms.map((r) => {
                  const onCount = r.users ? Object.values(r.users).filter((u: any) => u.online === true).length : 0;
                  const roomYtId = getYoutubeVideoId(r.videoUrl);
                  
                  return (
                    <div 
                      key={r.id}
                      onClick={() => handleJoinExistingRoom(r.id)}
                      className="group bg-white/5 border border-white/5 hover:border-vibe-neon-blue/40 hover:bg-white/10 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden"
                    >
                      {/* Thumbnail absolute glow */}
                      {roomYtId && (
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 group-hover:opacity-30 transition-all filter blur-[10px]"
                          style={{ backgroundImage: `url(https://img.youtube.com/vi/${roomYtId}/mqdefault.jpg)`, backgroundSize: 'cover' }}
                        />
                      )}

                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5 mb-1.5">
                            <span className="px-2 py-0.5 bg-vibe-neon-blue/15 text-vibe-neon-blue border border-vibe-neon-blue/20 rounded text-[9px] font-black uppercase tracking-widest">
                              # {r.id}
                            </span>
                            <span className="flex items-center space-x-1 text-[10px] text-slate-400">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{onCount} online</span>
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-black text-white group-hover:text-vibe-neon-blue transition-colors max-w-xs truncate uppercase tracking-tight">
                            {r.videoTitle}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Anfitrião: <span className="text-slate-300 font-bold">{r.hostName}</span>
                          </p>
                        </div>

                        <div className="shrink-0">
                          <img 
                            src={r.hostAvatar || `https://ui-avatars.com/api/?name=User&background=random`} 
                            className="w-10 h-10 rounded-xl border border-white/10" 
                            alt="Avatar Host" 
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-vibe-neon-blue transition-colors">
                        <span className="flex items-center space-x-1">
                          <Compass className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[170px] max-w-xs">{r.videoUrl}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE TRANSMISSION SCREEN (roomId present) */}
      {roomId && (
        <div className="w-full flex-grow flex flex-col h-[calc(100vh-68px)] md:h-auto overflow-hidden md:overflow-visible max-w-7xl mx-auto px-0 sm:px-4 py-0 md:py-4 mt-0 md:mt-2">
          {/* Room Top Header Info (Hidden on Mobile) */}
          <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between bg-white/5 md:bg-white/3 border border-white/10 rounded-2xl p-4 gap-4 mb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-vibe-neon-purple/20 border border-vibe-neon-purple/40 flex items-center justify-center shrink-0">
                <Tv className="w-6 h-6 text-vibe-neon-purple" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF2E93] bg-gradient-to-r from-vibe-neon-pink/15 to-transparent border-l-2 border-[#FF2E93] pl-2">
                    PLAYZI YOUTUBE HUB
                  </span>
                  <span className="px-2 py-0.5 bg-white/10 text-white rounded text-[9px] font-black uppercase tracking-wider select-text">
                    SALA: {roomId}
                  </span>
                  
                  {isUsingFallback && (
                    <span 
                      title="API Key indevida ou indisponível. Usando sandbox de vídeos populares do YouTube."
                      className="px-2 py-0.5 bg-yellow-500/15 text-yellow-500 border border-yellow-500/35 rounded text-[8px] font-bold uppercase tracking-wider shrink-0"
                    >
                      Modo Sandbox Actived
                    </span>
                  )}
                </div>
                
                <h2 className="text-sm font-black text-white truncate max-w-xs sm:max-w-md md:max-w-xl uppercase tracking-tight mt-1">
                  {room ? room.videoTitle : 'Carregando sessão...'}
                </h2>
              </div>
            </div>

            {/* CTA Option control actions */}
            <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
              <button 
                onClick={handleCopyLink}
                className={cn(
                  "flex items-center space-x-1.5 px-3 py-2 border text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  copiedLink 
                    ? "bg-green-500/10 border-green-500/30 text-green-400" 
                    : "bg-white/5 border-white/5 hover:bg-white/15 text-slate-300"
                )}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Convidar'}</span>
              </button>

              {isHost ? (
                <button 
                  onClick={async () => {
                    if (window.confirm("Deseja realmente encerrar a sala? Todos os participantes serão desconectados e a sala será excluída.")) {
                      try {
                        if (roomId) {
                          await remove(ref(rtdb, `rooms/${roomId}`));
                        }
                        navigate('/watch/youtube');
                      } catch (err) {
                        console.error("Erro ao fechar sala:", err);
                      }
                    }
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-[#ff0055]/20 border border-[#ff0055]/40 hover:bg-[#ff0055]/30 text-[#ff0055] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Fechar Sala</span>
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/watch/youtube')}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white/5 border border-white/5 hover:bg-[#ff0055]/10 hover:border-[#ff0055]/20 hover:text-[#ff0055] text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          </div>

          {/* THREE-COLUMN WORKSPACE OR TABBED DESKTOP/MOBILE WRAPPER */}
          <div className="flex-grow flex flex-col md:grid md:grid-cols-12 gap-0 md:gap-4 min-h-0">
            
            {/* COLUMN 1: YouTube Search Panel (4 Cols) - Desktop Persistent */}
            <div className="hidden md:flex lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex-col h-[620px] overflow-hidden shrink-0">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-vibe-neon-blue" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">Pesquisa Rave Direct</span>
                </div>
                <span className="text-[9px] text-[#A296BD] font-medium bg-[#1d1430] border border-vibe-neon-purple/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none">
                  {hasApiKey ? "YouTube Live Active" : "Sandbox Fallback"}
                </span>
              </div>

              {/* Search Bar Input */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
                className="relative mb-3 shrink-0"
              >
                <input 
                  type="text"
                  placeholder="Pesquise GTA6, Roblox, Minecraft, Lofi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0515] border border-white/10 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vibe-neon-blue/50 focus:shadow-glow-blue transition-all"
                />
                <button 
                  type="submit"
                  disabled={searching}
                  className="absolute right-1.5 top-1.5 p-1 bg-white/5 hover:bg-vibe-neon-blue/15 text-slate-300 hover:text-vibe-neon-blue rounded-lg transition-all"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Tags Scrollable */}
              <div className="flex items-center overflow-x-auto no-scrollbar space-x-1.5 pb-2.5 shrink-0 border-b border-white/5">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      handleSearch(tag);
                    }}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 border uppercase transition-all select-none",
                      searchQuery.toLowerCase() === tag.toLowerCase()
                        ? "bg-vibe-neon-blue/10 border-vibe-neon-blue/30 text-vibe-neon-blue font-black"
                        : "bg-white/3 border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Results Scroller */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-3.5 pb-2">
                {searching ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <Globe className="w-6 h-6 text-vibe-neon-blue animate-spin" />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest animate-pulse">
                      Consultando o YouTube API...
                    </span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-16">
                    <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Sem correspondências</span>
                    <p className="text-[10px] text-slate-500 px-4 mt-1">Busque algo diferente acima (Minecraft, Roblox, Phonk, etc).</p>
                  </div>
                ) : (
                  searchResults.map((video) => {
                    const isSelected = parsedYtVideoId === video.id;
                    return (
                      <div 
                        key={video.id}
                        onClick={() => handleSelectVideoToPlay(video.id, video.title)}
                        className={cn(
                          "group rounded-xl p-2.5 cursor-pointer flex space-x-3 transition-all border relative overflow-hidden",
                          isSelected 
                            ? "bg-vibe-neon-purple/10 border-vibe-neon-purple/40" 
                            : "bg-[#0b0617] hover:bg-[#150d26] border-white/5 hover:border-white/10"
                        )}
                      >
                        {/* Selected vertical badge */}
                        {isSelected && (
                          <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-vibe-neon-purple to-vibe-neon-pink" />
                        )}

                        {/* Video Thumbnail with hover play overlay */}
                        <div className="relative w-24 h-14 aspect-video rounded-lg overflow-hidden border border-white/5 shrink-0 bg-black flex items-center justify-center">
                          <img 
                            src={video.thumbnail} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt="Yt Cover" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white animate-pulse" />
                          </div>
                        </div>

                        {/* Snippets detail metadata */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="text-[11px] font-black text-slate-200 line-clamp-2 leading-tight uppercase group-hover:text-vibe-neon-blue transition-colors">
                              {video.title}
                            </h5>
                            <span className="text-[9px] text-[#A296BD] font-bold block mt-1">
                              {video.channelTitle}
                            </span>
                          </div>
                          
                          {video.publishedAt && (
                            <span className="text-[8px] text-slate-500 uppercase">
                              {video.publishedAt}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUMN 2: Sync Video Player & Host Controls (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col shrink-0 md:shrink md:space-y-4">
              
              {/* Main Player Frame box */}
              <div className="bg-[#040108] border-b md:border border-white/10 md:rounded-2xl overflow-hidden shadow-glow-purple flex flex-col relative z-20 shrink-0">
                <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                  
                  {/* Real YouTube SDK Iframe container */}
                  <div className={cn("w-full h-full", parsedYtVideoId ? "block" : "hidden")}>
                    <div id={ytContainerId} className="w-full h-full aspect-video" />
                  </div>

                  {/* Google Chrome / Web Iframe Sandbox container */}
                  {!parsedYtVideoId && room?.videoUrl && (
                    <div className="w-full h-full bg-[#0d0a1b] flex flex-col relative">
                      <iframe 
                        key={room.updatedAt || room.videoUrl} 
                        src={room.videoUrl}
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        title="Google Chrome Sandbox Browser"
                      />
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between bg-black/90 border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-vibe-neon-blue pointer-events-none shadow-md">
                        <span className="flex items-center">
                          <Lock className="w-3.5 h-3.5 mr-1 text-emerald-400 animate-pulse" /> Google Chrome Ativo
                        </span>
                        <span className="truncate max-w-[200px] font-bold text-slate-400">{room.videoUrl}</span>
                      </div>
                    </div>
                  )}

                  {/* Empty state when video ID and URL are both missing */}
                  {!parsedYtVideoId && !room?.videoUrl && (
                    <div className="text-center p-6 space-y-4">
                      <Tv className="w-12 h-12 text-[#FF2E93] animate-bounce mx-auto" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Aguardando Host Iniciar...</h4>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Selecione qualquer vídeo no painel de buscas do lado esquerdo ou utilize a aba Google Chrome no painel do controlador abaixo.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Top Bar HUD lock indicators */}
                  {parsedYtVideoId && (
                    <div className="absolute top-2.5 left-2.5 right-2.5 pointer-events-none flex items-center justify-between">
                      <div className="bg-black/85 border border-white/10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-green-400 flex items-center space-x-1 shadow-md">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping shrink-0" />
                        <span>Sincronia Servidor Ativa</span>
                      </div>
                      
                      {canControl && (
                        <div className="bg-black/85 border border-vibe-neon-blue/20 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-vibe-neon-blue shadow-md">
                          Anfitrião Autorizado
                        </div>
                      )}
                    </div>
                  )}

                  {/* INCREDIBLE INTERACTION BLOCKER DIV ON TOP OF THE YOUTUBE IFRAME */}
                  {!canControl && (
                    <div className="absolute inset-0 z-20 bg-transparent" />
                  )}

                  {/* Float Exit button on Mobile Screen */}
                  <button 
                    onClick={() => navigate('/watch/youtube')}
                    className="md:hidden absolute top-3 right-3 z-30 p-2 bg-black/60 backdrop-blur border border-white/10 rounded-full text-white/80 hover:text-white"
                    title="Sair da Sala"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Video Info banner strip */}
                <div className="p-3.5 border-t border-white/5 bg-[#0a0515] flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <span className="text-[8px] text-[#A296BD] uppercase font-black tracking-widest block mb-0.5">ESTREANDO AGORA</span>
                    <h3 className="text-xs font-black text-white truncate max-w-xs uppercase">
                      {room ? room.videoTitle : 'Pesquise para ver'}
                    </h3>
                  </div>
                  
                  <div className="shrink-0 flex items-center space-x-2">
                    <button 
                      type="button"
                      onClick={togglePlayPause}
                      className={cn(
                        "p-2 rounded-xl transition-all border",
                        !canControl 
                          ? "opacity-50 cursor-not-allowed bg-white/5 border-white/5 text-slate-500"
                          : room?.playing 
                            ? "bg-[#ff0055]/15 border-[#ff0055]/25 text-[#ff0055] hover:bg-[#ff0055]/25"
                            : "bg-vibe-neon-blue/15 border-vibe-neon-blue/25 text-vibe-neon-blue hover:bg-vibe-neon-blue/25"
                      )}
                      disabled={!canControl}
                      title={canControl ? "Play/Pause" : "Apenas o host possui o controle de reprodução"}
                    >
                      {room?.playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    {/* Simple settings toggle triggers for Host controls on mobile */}
                    {canControl && (
                      <button 
                        type="button"
                        onClick={() => setShowMobileHostControls(!showMobileHostControls)}
                        className={cn(
                          "md:hidden p-2 rounded-xl border flex items-center justify-center transition-all",
                          showMobileHostControls ? "bg-vibe-neon-purple/20 border-vibe-neon-purple text-vibe-neon-purple" : "bg-white/5 border-white/10 text-vibe-muted"
                        )}
                        title="Configurações Móveis"
                      >
                        <Settings className="w-4 h-4 shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Host Expandable Controls (Mobile Drawer version) */}
              {canControl && showMobileHostControls && (
                <div className="md:hidden bg-[#0a0515]/95 p-4 border-b border-white/10 space-y-4 shrink-0 animate-fade-in z-25">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black uppercase text-vibe-neon-blue">Sintonizar Canal & Navegar</span>
                    <button 
                      type="button"
                      onClick={() => setShowMobileHostControls(false)}
                      className="text-[9px] font-black text-vibe-neon-pink uppercase"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => handleManualSeek(-10)}
                      className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black"
                    >
                      -10s
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleManualSeek(10)}
                      className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black"
                    >
                      +10s
                    </button>
                  </div>

                  {/* Chrome Browser mode loader inside mobile dashboard */}
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const targetUrl = chromeUrlInput.trim();
                      if (!targetUrl) return;
                      let finalUrl = targetUrl;
                      if (!/^https?:\/\//i.test(finalUrl)) {
                        finalUrl = `https://${finalUrl}`;
                      }
                      try {
                        await update(ref(rtdb, `rooms/${roomId}`), {
                          videoUrl: finalUrl,
                          videoTitle: `Chrome: ${finalUrl.replace(/^https?:\/\/(www\.)?/i, '')}`,
                          playing: true,
                          currentTime: 0,
                          updatedAt: serverTimestamp()
                        });
                        setChromeUrlInput('');
                        setShowMobileHostControls(false);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex flex-col gap-2"
                  >
                    <span className="text-[9px] font-black uppercase text-[#A296BD]">Carregar Modo Chrome</span>
                    <div className="flex gap-1.5">
                      <input 
                        type="text"
                        placeholder="Link, ex: google.com..."
                        value={chromeUrlInput}
                        onChange={(e) => setChromeUrlInput(e.target.value)}
                        className="flex-1 bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                      />
                      <button 
                        type="submit"
                        className="px-3 bg-vibe-neon-blue text-vibe-bg text-[10px] font-black uppercase rounded-lg"
                      >
                        Ir
                      </button>
                    </div>
                  </form>

                  {isHost && (
                    <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                      <button 
                        type="button"
                        onClick={handleToggleAllowControl}
                        className={cn(
                          "px-2.5 py-1.5 border rounded-lg text-[9px] font-black uppercase flex items-center space-x-1.5",
                          room?.allowControl ? "bg-vibe-neon-blue/20 border-vibe-neon-blue text-vibe-neon-blue" : "bg-white/5 border-white/10 text-vibe-muted"
                        )}
                      >
                        {room?.allowControl ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>Convidado Controla</span>
                      </button>

                      <button 
                        type="button"
                        onClick={handleCopyLink}
                        className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-white flex items-center space-x-1"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                        <span>{copiedLink ? "Copiado!" : "Convidar"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Real Seek adjustment host panel */}
              {canControl && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 border-b border-white/5 pb-2.5 mb-3">
                    <Laptop className="w-4 h-4 text-vibe-neon-purple" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">Painel do Host / Controlador</span>
                  </div>

                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-2.5">
                    <button 
                      onClick={() => handleManualSeek(-30)}
                      className="px-2.5 py-2 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl text-[10px] font-bold text-slate-300 transition-all uppercase tracking-wider"
                    >
                      -30 Segundos
                    </button>
                    <button 
                      onClick={() => handleManualSeek(-10)}
                      className="px-2.5 py-2 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl text-[10px] font-bold text-slate-300 transition-all uppercase tracking-wider"
                    >
                      -10 Segundos
                    </button>
                    <button 
                      onClick={() => handleManualSeek(10)}
                      className="px-2.5 py-2 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl text-[10px] font-bold text-slate-300 transition-all uppercase tracking-wider"
                    >
                      +10 Segundos
                    </button>
                    <button 
                      onClick={() => handleManualSeek(30)}
                      className="px-2.5 py-2 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl text-[10px] font-bold text-slate-300 transition-all uppercase tracking-wider"
                    >
                      +30 Segundos
                    </button>
                  </div>

                  {/* Navegador Google Chrome / Custom URL Selector */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <label className="text-[9px] font-black uppercase text-vibe-neon-blue tracking-widest block mb-1.5 flex items-center">
                      <Globe className="w-3.5 h-3.5 mr-1 text-vibe-neon-blue animate-pulse" />
                      Navegador Google Chrome (Navegar em qualquer URL/Vídeo)
                    </label>
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const targetUrl = chromeUrlInput.trim();
                        if (!targetUrl) return;
                        
                        // Convert shorthand without protocols safely
                        let finalUrl = targetUrl;
                        if (!/^https?:\/\//i.test(finalUrl)) {
                          finalUrl = `https://${finalUrl}`;
                        }

                        try {
                          await update(ref(rtdb, `rooms/${roomId}`), {
                            videoUrl: finalUrl,
                            videoTitle: `Chrome: ${finalUrl.replace(/^https?:\/\/(www\.)?/i, '')}`,
                            playing: true,
                            currentTime: 0,
                            updatedAt: serverTimestamp()
                          });

                          // Post system message
                          const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
                          await push(chatRef, {
                            uid: "system",
                            username: "Playzi Bot",
                            avatar: "https://ui-avatars.com/api/?name=PB&background=FF2E93&color=fff",
                            text: `🌐 Navegador Chrome sintonizado em: ${finalUrl}`,
                            timestamp: Date.now()
                          });

                          setChromeUrlInput('');
                        } catch (err) {
                          console.error("Chrome URL update error:", err);
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input 
                        type="text"
                        placeholder="Digite um link, ex: google.com, twitch.tv, vimeo.com..."
                        value={chromeUrlInput}
                        onChange={(e) => setChromeUrlInput(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-vibe-neon-blue/50 transition-all placeholder-slate-600"
                      />
                      <button 
                        type="submit"
                        className="px-3.5 py-2 bg-vibe-neon-pink/20 hover:bg-vibe-neon-pink text-vibe-neon-pink hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-vibe-neon-pink/30 shadow-glow hover:shadow-glow-pink"
                      >
                        Navegar
                      </button>
                    </form>
                  </div>

                  {isHost && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-tight block">Liberar Controles da Sala</span>
                        <p className="text-[9px] text-slate-500">Permitir que convidados dêem Pause, Play ou procurem vídeo</p>
                      </div>

                      <button 
                        onClick={handleToggleAllowControl}
                        className={cn(
                          "flex items-center space-x-1 px-3 py-1.5 border rounded-lg text-[9px] font-bold uppercase transition-all",
                          room?.allowControl 
                            ? "bg-vibe-neon-blue/15 border-vibe-neon-blue/30 text-vibe-neon-blue" 
                            : "bg-white/5 border-white/10 text-slate-400"
                        )}
                      >
                        {room?.allowControl ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Controle Livre</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Exclusivo Host</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status and instruction notice board */}
              <div className="bg-gradient-to-br from-[#100721] to-[#12082a] border border-vibe-neon-purple/20 rounded-2xl p-4 flex items-start space-x-3 shadow-glow">
                <Skull className="w-5 h-5 text-[#FF2E93] shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-white uppercase tracking-wide block">Rave Sync Ativo</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Você pode selecionar outros vídeos a qualquer momento. Se o Host trocar de vídeo na barra esquerda, todos os membros sincronizam instantaneamente!
                  </p>
                </div>
              </div>
            </div>

            {/* COLUMN 3: Active Tabbed Interface (Persistent Right on Desktop, Tabbed Switcher below Player on Mobile) */}
            <div className="flex-grow flex flex-col md:col-span-3 bg-black/25 md:bg-white/5 md:border border-white/10 md:rounded-2xl p-0 md:p-4 min-h-0 h-[620px] overflow-hidden">
              
              {/* Squad Horizontal View (Mobile Only) */}
              <div className="md:hidden bg-black/35 border-b border-white/5 px-4 py-2 shrink-0 flex items-center justify-between gap-3 animate-fade-in relative z-10">
                <div className="shrink-0 flex items-center space-x-1 border-r border-white/5 pr-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Squad</span>
                </div>
                
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-0.5 flex-1 justify-end">
                  {participants.map((user) => {
                    const userIsHost = room?.host === user.uid;
                    return (
                      <div 
                        key={user.uid}
                        className="flex items-center space-x-1.5 bg-white/5 border border-white/5 p-1 pr-2.5 rounded-full shrink-0 animate-fade-in"
                        title={user.displayName}
                      >
                        <img src={user.photoURL} className="w-4 h-4 rounded-full object-cover border border-white/10 shrink-0" alt="" />
                        <span className="text-[9px] font-black tracking-tight text-white/90">
                          {user.displayName.split(' ')[0]}
                        </span>
                        {userIsHost && <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TAB SELECTOR HEADER - Desktop Version Only */}
              <div className="hidden md:flex border-b border-white/5 pb-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-1.5 pb-2 text-[11px] font-black uppercase tracking-wider relative transition-all",
                    activeTab === 'chat' ? "text-vibe-neon-pink" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                  {chatMessages.length > 0 && (
                    <span className="bg-vibe-neon-pink text-white rounded-full text-[8px] font-black w-4 h-4 flex items-center justify-center scale-90 shrink-0">
                      {chatMessages.length}
                    </span>
                  )}
                  {activeTab === 'chat' && (
                    <motion.div layoutId="room-active-tab-indicator-desktop" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-vibe-neon-pink" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-1.5 pb-2 text-[11px] font-black uppercase tracking-wider relative transition-all",
                    activeTab === 'users' ? "text-vibe-neon-blue" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Membros</span>
                  <span className="bg-vibe-neon-blue text-white rounded-full text-[8px] font-bold w-4 h-4 flex items-center justify-center scale-90 shrink-0">
                    {participants.length}
                  </span>
                  {activeTab === 'users' && (
                    <motion.div layoutId="room-active-tab-indicator-desktop" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-vibe-neon-blue" />
                  )}
                </button>
              </div>

              {/* TAB SELECTOR HEADER - Mobile Version (With search play features) */}
              <div className="md:hidden bg-[#07030f]/95 border-b border-white/10 flex items-center py-1.5 shrink-0 relative z-10">
                <button
                  type="button"
                  onClick={() => setActiveTabMobile('chat')}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-1 text-[9px] font-black uppercase tracking-wider relative transition-all",
                    activeTabMobile === 'chat' ? "text-vibe-neon-pink" : "text-slate-400"
                  )}
                >
                  <MessageSquare className="w-4 h-4 mb-0.5 shrink-0" />
                  <span>Sinc-Chat</span>
                  {activeTabMobile === 'chat' && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-vibe-neon-pink" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabMobile('search')}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-1 text-[9px] font-black uppercase tracking-wider relative transition-all",
                    activeTabMobile === 'search' ? "text-[#00f2ff]" : "text-slate-400"
                  )}
                >
                  <Search className="w-4 h-4 mb-0.5 shrink-0" />
                  <span>Músicas</span>
                  {activeTabMobile === 'search' && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#00f2ff]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabMobile('users')}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-1 text-[9px] font-black uppercase tracking-wider relative transition-all",
                    activeTabMobile === 'users' ? "text-vibe-neon-purple" : "text-slate-400"
                  )}
                >
                  <Users className="w-4 h-4 mb-0.5 shrink-0" />
                  <span>Membros</span>
                  {activeTabMobile === 'users' && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-vibe-neon-purple" />
                  )}
                </button>
              </div>

              {/* MOBILE ONLY TAB: SEARCH PLAYLIST */}
              <div className={cn(
                "md:hidden flex-Grow flex flex-col min-h-0 p-3",
                activeTabMobile === 'search' ? "flex" : "hidden"
              )}>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch(searchQuery);
                  }}
                  className="flex gap-1.5 shrink-0 mb-3"
                >
                  <input 
                    type="text"
                    required
                    placeholder="Pesquise no YouTube..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-[#0b0615] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button 
                    type="submit"
                    className="bg-vibe-neon-blue text-vibe-bg p-2 rounded-xl text-xs uppercase font-black shrink-0"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                {/* Scroller de Resultados Mobile */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 min-h-0 pt-1 pb-2">
                  {searching ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Globe className="w-5 h-5 text-vibe-neon-blue animate-spin mb-2" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Buscando Playlist...</span>
                    </div>
                  ) : (
                    searchResults.map((video) => {
                      const isSelected = parsedYtVideoId === video.id;
                      return (
                        <div 
                          key={video.id}
                          onClick={() => handleSelectVideoToPlay(video.id, video.title)}
                          className={cn(
                            "rounded-lg p-2 flex space-x-2 border transition-all cursor-pointer",
                            isSelected ? "bg-vibe-neon-purple/15 border-vibe-neon-purple/40" : "bg-black/40 border-white/5"
                          )}
                        >
                          <img src={video.thumbnail} className="w-20 h-10 aspect-video object-cover rounded shrink-0 bg-black" alt="" referrerPolicy="no-referrer" />
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[10px] font-black text-slate-200 truncate leading-tight uppercase">{video.title}</h5>
                            <span className="text-[8px] text-[#A296BD] block truncate mt-0.5">{video.channelTitle}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* CHAT TAB (INTEGRATED FOR BOTH) */}
              <div className={cn(
                "flex-grow flex flex-col min-h-0",
                "md:flex", // Always active for desktop state block
                "md:hidden", // Controlled on mobile dynamically
                (activeTab === 'chat' && activeTabMobile === 'chat') ? "flex" : (activeTabMobile === 'chat' ? "flex" : "hidden")
              )}>
                
                {/* Rolling Chat list view */}
                <div className="flex-grow overflow-y-auto no-scrollbar px-3 py-3 space-y-3.5 min-h-0">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <MessageSquare className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Resenha Vazia</span>
                      <p className="text-[9px] text-slate-600 mt-1 max-w-[170px]">Engaje o pessoal mandando uma mensagem fofa para a rapaziada!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isSelf = msg.uid === currentUser?.uid;
                      const isBot = msg.uid === 'system';
                      
                      if (isBot) {
                        return (
                          <div key={msg.id} className="flex justify-center my-1.5 animate-fade-in">
                            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur border border-white/5 px-4 py-1.5 rounded-full shadow-md">
                              <img src={msg.avatar} className="w-4 h-4 rounded-full object-cover border border-white/15 shrink-0" alt="" />
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wide">{msg.text}</span>
                            </div>
                          </div>
                        );
                      }

                      const isSticker = msg.text.startsWith('[STICKER]: ');
                      const stickerUrl = isSticker ? msg.text.replace('[STICKER]: ', '') : '';

                      return (
                        <div 
                          key={msg.id} 
                          className={cn(
                            "flex items-start space-x-2.5 animate-fade-in",
                            isSelf ? "flex-row-reverse space-x-reverse" : ""
                          )}
                        >
                          <img 
                            src={msg.avatar} 
                            className="w-7 h-7 rounded-lg border border-white/10 shrink-0 mt-0.5 object-cover" 
                            alt="Avatar" 
                          />
                          <div className="space-y-1 max-w-[78%] flex flex-col">
                            <div className={cn("flex items-baseline space-x-1.5", isSelf ? "justify-end flex-row-reverse space-x-reverse" : "")}>
                              <span className="text-[9px] font-black text-[#00f2ff] truncate uppercase max-w-[80px]">
                                {msg.username}
                              </span>
                              <span className="text-[8px] text-vibe-muted/65 font-bold">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {isSticker ? (
                              <img 
                                src={stickerUrl} 
                                className={cn(
                                  "w-32 h-32 object-cover rounded-2xl border border-white/15 shadow-glow",
                                  isSelf ? "self-end" : "self-start"
                                )} 
                                alt="Sticker" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={cn(
                                "p-2 rounded-xl text-[11px] font-medium leading-normal break-words shadow-sm border text-white",
                                isSelf 
                                  ? "bg-vibe-neon-pink/15 border-vibe-neon-pink/25 rounded-tr-none text-right" 
                                  : "bg-[#0c0617] border-white/5 rounded-tl-none"
                              )}>
                                {msg.text}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Mobile stickers drawer block */}
                {showStickerPanel && (
                  <div className="bg-black/85 border border-white/10 rounded-2xl p-3 mb-2 mx-3 animate-fade-in shrink-0 relative z-10">
                    <span className="text-[10px] font-black uppercase text-vibe-neon-pink block mb-2">Selecione uma Figurinha</span>
                    <div className="flex items-center overflow-x-auto no-scrollbar gap-3 py-1.5">
                      {MOBILE_STICKERS.map((stick) => (
                        <button
                          key={stick.name}
                          type="button"
                          onClick={() => handleSendSticker(stick.url)}
                          className="shrink-0 group hover:scale-105 transition-transform"
                        >
                          <img 
                            src={stick.url} 
                            className="w-12 h-12 object-cover rounded-lg border border-white/10 hover:border-vibe-neon-pink transition-all shadow-md"
                            alt={stick.name} 
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Chat form (Desktop style) */}
                <form onSubmit={handleSendMessage} className="hidden md:flex mt-2 mx-3 mb-3 p-1.5 border-t border-white/5 space-x-1.5 shrink-0">
                  <input 
                    type="text"
                    placeholder="Anote as resenhas..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-[#0b0615] border border-white/10 rounded-xl py-2 px-3 text-xs placeholder-slate-600 text-white focus:outline-none focus:border-vibe-neon-pink/50 transition-all"
                  />
                  <button 
                    type="submit"
                    className="p-2 bg-gradient-to-r from-[#ff0055] to-vibe-neon-pink text-white rounded-xl hover:shadow-glow-pink transition-all shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Input form footer structure (Mobile Style matching requested layout) */}
                <div className="md:hidden mx-3 mb-3 pt-2 border-t border-white/5 flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMicMuted(!micMuted)}
                    className={cn(
                      "p-2.5 rounded-full flex items-center justify-center shrink-0 shadow-md transition-colors",
                      micMuted ? "bg-red-500 text-white" : "bg-white text-black hover:bg-slate-200"
                    )}
                    title={micMuted ? "Mutado" : "Microfone"}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <form onSubmit={handleSendMessage} className="flex-1 flex items-center bg-[#07030f]/90 border border-white/10 rounded-full px-3 py-1.5 focus-within:border-vibe-neon-purple/40 transition-colors">
                    <input 
                      type="text"
                      placeholder="Bate-papo..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none pr-2"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim()}
                      className={cn(
                        "p-1.5 rounded-full transition-all shrink-0",
                        chatInput.trim() ? "bg-vibe-neon-purple text-white hover:scale-105" : "text-white/30 cursor-not-allowed"
                      )}
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>

                  <div className="flex items-center space-x-1 opacity-80 shrink-0">
                    <button
                      type="button"
                      onClick={() => setChatInput(prev => `${prev}@`)}
                      className="p-1 px-1.5 text-white/70 hover:text-white"
                      title="At"
                    >
                      <AtSign className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStickerPanel(!showStickerPanel)}
                      className={cn(
                        "p-1 text-white/70 hover:text-white transition-colors",
                        showStickerPanel ? "text-vibe-neon-pink" : ""
                      )}
                      title="Stickers"
                    >
                      <Image className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStickerPanel(!showStickerPanel)}
                      className="p-1 text-white/70 hover:text-white"
                      title="Smileys"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 text-white/70 hover:text-white"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* MEMBERS LIST TAB (FOR BOTH) */}
              <div className={cn(
                "flex-grow overflow-y-auto no-scrollbar p-3 space-y-2.5 min-h-0",
                "md:block", // Always active on desktop if activeTab === 'users'
                "md:hidden", // Controlled on mobile dynamically
                (activeTab === 'users' && activeTabMobile === 'users') ? "block" : (activeTabMobile === 'users' ? "block" : "hidden")
              )}>
                
                <div className="text-[9px] font-black text-[#A296BD] uppercase tracking-wider mb-2 select-none">
                  LOBBY COMPANIONS
                </div>
                
                {participants.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">Apenas você na sala.</div>
                ) : (
                  participants.map((m) => {
                    const isLobbyHost = room?.host === m.uid;
                    return (
                      <div 
                        key={m.uid}
                        className="bg-[#0b0717]/80 border border-white/5 rounded-xl p-2.5 flex items-center justify-between animate-fade-in"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="relative">
                            <img src={m.photoURL} className="w-8 h-8 rounded-lg object-cover border border-white/5" alt="" />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#06020c] rounded-full" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-slate-200 block truncate uppercase">
                              {m.displayName}
                            </span>
                            <span className="text-[8px] text-slate-500 uppercase block">
                              {isLobbyHost ? "ANFITRIÃO" : "PARTICIPANTE"}
                            </span>
                          </div>
                        </div>

                        {isLobbyHost && (
                          <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
