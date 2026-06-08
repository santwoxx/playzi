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
  Globe,
  Chrome,
  Youtube,
  Mic,
  AtSign,
  Image,
  Smile
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerSyncHeartbeat } from '../hooks/useWebRTC';

// Declarations to satisfy TypeScript on window.YT
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
  browser?: any;
}

// Default videos for presets card
const PRESET_VIDEOS = [
  {
    title: "GTA 6 - Official Trailer 1",
    url: "https://www.youtube.com/watch?v=QdBZY2fkU-0"
  },
  {
    title: "A Minecraft Movie - Official Trailer",
    url: "https://www.youtube.com/watch?v=wIPtcoHInHk"
  },
  {
    title: "League of Legends - Still Here Cinematic",
    url: "https://www.youtube.com/watch?v=ZHhqwBwm_Xw"
  },
  {
    title: "Cyberpunk 2077 - Official Launch Trailer",
    url: "https://www.youtube.com/watch?v=Om0KzVStSg8"
  }
];

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

export default function WatchParty() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Basic room data states
  const [activeRooms, setActiveRooms] = useState<SyncRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  // Create Room state
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [createOptOpen, setCreateOptOpen] = useState(false);

  // Active room specific states
  const [room, setRoom] = useState<SyncRoom | null>(null);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState<RoomUser[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [updatingUrl, setUpdatingUrl] = useState(false);
  const [showMobileHostControls, setShowMobileHostControls] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

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

  // HTML5 and YouTube Player DOM / API refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const isSyncingRef = useRef<boolean>(false);
  const ytContainerId = "youtube-player-frame";

  // Check user values
  const userNick = currentUser?.nickname || currentUser?.displayName || 'Jogador';
  const userAvatar = currentUser?.photoURL || `https://ui-avatars.com/api/?name=${userNick}&background=random`;

  // --- PHASE 1: LOAD ROOMS LIST FOR PORTAL VIEW ---
  useEffect(() => {
    if (roomId) return; // Only load rooms list if on dashboard portal

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
            
          // If room has 0 players online and is older than 20 seconds, delete it from RTDB
          const createdTime = rData.createdTime || rData.updatedAt;
          const isLegacy = !createdTime;
          const ageSeconds = createdTime ? (now - Number(createdTime)) / 1000 : 0;
          
          if (onlineCount === 0 && (isLegacy || ageSeconds > 20)) {
            remove(ref(rtdb, `rooms/${key}`)).catch(err => {
              console.warn("Background cleaning empty room:", key, err);
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
      console.error("Error reading RTDB rooms:", error);
      setLoadingRooms(false);
    });

    return () => unsub();
  }, [roomId]);

  // --- PHASE 2: HANDLE ACTIVE ROOM OR ROOM PRESENCE ---
  useEffect(() => {
    if (!roomId || !currentUser) return;

    // Acknowledge presence and keep updated inside rooms/roomId/users/userId
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const userPresenceRef = ref(rtdb, `rooms/${roomId}/users/${currentUser.uid}`);

    // Set self online on join, set offline on disconnect
    const joinUser = () => {
      set(userPresenceRef, {
        uid: currentUser.uid,
        displayName: userNick,
        photoURL: userAvatar,
        online: true,
        joinedAt: serverTimestamp()
      });
      onDisconnect(userPresenceRef).update({ online: false });

      // Publish beautiful join message once per session
      const sessionJoinKey = `r_joined_${roomId}_${currentUser.uid}`;
      if (!sessionStorage.getItem(sessionJoinKey)) {
        sessionStorage.setItem(sessionJoinKey, 'true');
        const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
        push(chatRef, {
          uid: 'system',
          username: 'Playzi Bot',
          avatar: userAvatar || `https://ui-avatars.com/api/?name=${userNick || 'Jogador'}&background=FF2E93&color=fff`,
          text: `${userNick} entrou`,
          timestamp: Date.now()
        });
      }
    };

    joinUser();

    // Listen to parent room
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
          videoTitle: data.videoTitle || 'Vídeo Playzi',
          playing: data.playing ?? false,
          currentTime: data.currentTime ?? 0,
          updatedAt: data.updatedAt ?? Date.now(),
          allowControl: data.allowControl ?? false
        };
        setRoom(parsedRoom);

        // Parse Chat messages
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
                console.warn("Failed to elect host:", err);
              });
            }
          }
        }

      } else {
        setRoomExists(false);
        setRoom(null);
      }
    }, (error) => {
      console.warn("RTDB WatchParty room subscription failed:", error);
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

  // Auto-scroll chat on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const isHost = room ? room.host === currentUser?.uid : false;
  const canControl = isHost || (room?.allowControl ?? false);

  // --- PHASE 3: PLAYBACK SYNCHRONIZATION EVENT LOOPS ---
  // A helper to initialize the YouTube player asynchronously
  const initYoutubePlayer = (vidId: string) => {
    const iframeElement = document.getElementById(ytContainerId);
    if (!iframeElement || iframeElement.tagName !== "IFRAME") {
      ytPlayerRef.current = null;
    }

    if (ytPlayerRef.current) {
      // If already initialized, just load the video ID
      try {
        if (typeof ytPlayerRef.current.getPlayerState === 'function') {
          ytPlayerRef.current.getPlayerState();
          if (typeof ytPlayerRef.current.cueVideoById === 'function') {
            ytPlayerRef.current.cueVideoById(vidId);
          }
          return;
        } else {
          ytPlayerRef.current = null;
        }
      } catch (e) {
        console.warn("YouTube player cue failure, will re-instantiate", e);
        ytPlayerRef.current = null;
      }
    }

    const loadPlayer = () => {
      try {
        // Clear container first to prevent duplication
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
            onReady: (event: any) => {
              // Initial sync once player is ready
              if (room) {
                syncLocalPlayerWithServer();
              }
            },
            onStateChange: (event: any) => {
              // Only push state changes if this is a user-initiated event and controls are enabled
              if (!canControl) return;
              if (isSyncingRef.current) {
                // Ignore state changes triggered by our own sync code
                return;
              }

              const state = event.data;
              const target = event.target;
              if (target && typeof target.getCurrentTime === 'function') {
                const currentTime = target.getCurrentTime();
                // YT.PlayerState: PLAYING=1, PAUSED=2, BUFFERING=3
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
        console.error("Failed to create YT player:", error);
      }
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      // Listen to the global event
      window.onYouTubeIframeAPIReady = () => {
        loadPlayer();
      };
    }
  };

  const isVideoYoutube = room ? getYoutubeVideoId(room.videoUrl) !== null : false;
  const youtubeVideoId = room ? getYoutubeVideoId(room.videoUrl) : null;

  // Watch effect to download YT dynamic script if missing and video is YT
  useEffect(() => {
    if (!roomId || !room || !isVideoYoutube || !youtubeVideoId) return;

    if (!window.YT) {
      // Prepare global callback prior to injecting tag
      window.onYouTubeIframeAPIReady = () => {
        initYoutubePlayer(youtubeVideoId);
      };
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else {
      initYoutubePlayer(youtubeVideoId);
    }
  }, [roomId, room?.videoUrl, isVideoYoutube, youtubeVideoId]);

  // Clean up YT on unmount
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

  // Update server state (only if authenticated & permitted)
  const updateRoomState = async (playing: boolean, currentTime: number) => {
    if (!roomId || !canControl) return;
    
    // Lock sync so we don't trigger feedback loop instantly
    isSyncingRef.current = true;
    try {
      await update(ref(rtdb, `rooms/${roomId}`), {
        playing,
        currentTime: Math.max(0, currentTime),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Firebase Sync Write Blocked", e);
    } finally {
      // Small timeout to give server updates time to settle
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 500);
    }
  };

  // Synchronize local player view to server values
  const syncLocalPlayerWithServer = () => {
    if (!room) return;

    if (isVideoYoutube) {
      const iframeElement = document.getElementById(ytContainerId);
      if (!iframeElement || iframeElement.tagName !== "IFRAME") {
        ytPlayerRef.current = null;
        if (youtubeVideoId) {
          initYoutubePlayer(youtubeVideoId);
        }
        return;
      }
    }
    
    // Parse target server time with latency formula
    // Server time + elapsed time since update if playing
    const latencyAdjustment = room.playing ? (Date.now() - room.updatedAt) / 1000 : 0;
    const targetTime = Math.max(0, room.currentTime + latencyAdjustment);

    isSyncingRef.current = true;

    if (isVideoYoutube && ytPlayerRef.current) {
      try {
        const playerState = typeof ytPlayerRef.current.getPlayerState === 'function' ? ytPlayerRef.current.getPlayerState() : -1;
        const localTime = typeof ytPlayerRef.current.getCurrentTime === 'function' ? ytPlayerRef.current.getCurrentTime() : 0;

        // 1. Sync Play/Pause action
        if (room.playing && playerState !== window.YT.PlayerState.PLAYING) {
          if (typeof ytPlayerRef.current.playVideo === 'function') {
            ytPlayerRef.current.playVideo();
          }
        } else if (!room.playing && playerState === window.YT.PlayerState.PLAYING) {
          if (typeof ytPlayerRef.current.pauseVideo === 'function') {
            ytPlayerRef.current.pauseVideo();
          }
        }

        // 2. Sync Seek adjustments (tolerance threshold of 1.0 second)
        if (Math.abs(localTime - targetTime) > 1.0) {
          if (typeof ytPlayerRef.current.seekTo === 'function') {
            ytPlayerRef.current.seekTo(targetTime, true);
          }
        }
      } catch (e) {}
    } else if (videoRef.current) {
      // HTML5 video tag fallback
      const localTime = videoRef.current.currentTime;
      
      // 1. Play vs Pause
      if (room.playing && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else if (!room.playing && !videoRef.current.paused) {
        videoRef.current.pause();
      }

      // 2. Frame time adjustment with 1.0s threshold
      if (Math.abs(localTime - targetTime) > 1.0) {
        videoRef.current.currentTime = targetTime;
      }
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 600);
  };

  // Run synchronization check when room receives updates from Firebase RTDB
  // For hosts, this sends updates periodically. For viewers, this keeps them aligned.
  useEffect(() => {
    if (!room) return;

    // Viewers strictly listen and follow updates
    if (!isHost) {
      syncLocalPlayerWithServer();
    }
  }, [room?.playing, room?.currentTime, room?.updatedAt, room?.videoUrl]);

  // Host sends periodic heartbeat sync checks (every 4s) to guarantee accurate position matching
  useEffect(() => {
    if (!roomId || !isHost || !room || !room.playing) return;

    const interval = setInterval(() => {
      if (isSyncingRef.current) return;
      let currentTime = 0;
      if (isVideoYoutube && ytPlayerRef.current) {
        try {
          currentTime = ytPlayerRef.current.getCurrentTime();
        } catch (e) {}
      } else if (videoRef.current) {
        currentTime = videoRef.current.currentTime;
      }

      if (currentTime > 0) {
        // Silently update standard currentTime in database coordinates
        update(ref(rtdb, `rooms/${roomId}`), {
          currentTime,
          updatedAt: serverTimestamp()
        }).catch(() => {});
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [roomId, isHost, isVideoYoutube, room?.playing]);

  // Viewers/guests periodic synchronization check via WebRTC Heartbeat Hook
  usePlayerSyncHeartbeat(ytPlayerRef, isVideoYoutube, room, roomId, isHost, isSyncingRef, videoRef);


  // Native video event listeners
  const handleHtml5Play = () => {
    if (!canControl || isSyncingRef.current || !videoRef.current) return;
    updateRoomState(true, videoRef.current.currentTime);
  };

  const handleHtml5Pause = () => {
    if (!canControl || isSyncingRef.current || !videoRef.current) return;
    updateRoomState(false, videoRef.current.currentTime);
  };

  const handleHtml5Seeked = () => {
    if (!canControl || isSyncingRef.current || !videoRef.current) return;
    updateRoomState(room?.playing ?? false, videoRef.current.currentTime);
  };

  // Manual Seek commands (+/- 10s)
  const handleManualSeek = (secondsOffset: number) => {
    if (!canControl) return;
    
    let targetTime = 0;
    if (isVideoYoutube && ytPlayerRef.current) {
      try {
        const local = ytPlayerRef.current.getCurrentTime();
        targetTime = Math.max(0, local + secondsOffset);
        ytPlayerRef.current.seekTo(targetTime, true);
        updateRoomState(room?.playing ?? false, targetTime);
      } catch (e) {}
    } else if (videoRef.current) {
      targetTime = Math.max(0, videoRef.current.currentTime + secondsOffset);
      videoRef.current.currentTime = targetTime;
      updateRoomState(room?.playing ?? false, targetTime);
    }
  };


  // --- PHASE 4: SOCIAL ACTION HANDLERS ---
  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || creating) return;

    const url = newVideoUrl.trim();
    if (!url) return;

    setCreating(true);
    const newRoomId = Math.random().toString(36).substring(2, 9).toUpperCase();

    // Generate readable title
    let title = "Vídeo Compartilhado";
    if (getYoutubeVideoId(url)) {
      title = "Transmissão do YouTube";
    } else if (url.toLowerCase().endsWith('.mp4')) {
      title = "Stream de MP4 Nativo";
    }

    try {
      set(ref(rtdb, `rooms/${newRoomId}`), {
        host: currentUser.uid,
        hostName: userNick,
        hostAvatar: userAvatar,
        videoUrl: url,
        videoTitle: title,
        playing: false,
        currentTime: 0,
        updatedAt: serverTimestamp(),
        allowControl: false,
        createdTime: serverTimestamp()
      });

      // Redirect
      navigate(`/watch/${newRoomId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
      setNewVideoUrl('');
    }
  };

  const handleCreateYoutubeRoom = async () => {
    if (!currentUser || creating) return;
    setCreating(true);
    const newRoomId = Math.random().toString(36).substring(2, 9).toUpperCase();

    try {
      await set(ref(rtdb, `rooms/${newRoomId}`), {
        host: currentUser.uid,
        hostName: userNick,
        hostAvatar: userAvatar,
        videoUrl: `https://www.youtube.com/watch?v=QdBZY2fkU-0`, // Default baseline video
        videoTitle: "GTA 6 - Official Trailer 1",
        playing: false,
        currentTime: 0,
        updatedAt: serverTimestamp(),
        allowControl: false,
        createdTime: serverTimestamp()
      });

      // Post bot welcome message
      await set(ref(rtdb, `rooms/${newRoomId}/chat/${Math.random().toString(36).substring(2, 9)}`), {
        uid: "system",
        username: "Playzi Bot",
        avatar: "https://ui-avatars.com/api/?name=PB&background=FF2E93&color=fff",
        text: `📺 Sala de Vídeo do YouTube criada por ${userNick}! Use a barra de pesquisas na esquerda para começar outros vídeos.`,
        timestamp: Date.now()
      });

      navigate(`/watch/youtube/${newRoomId}`);
    } catch (err) {
      console.error("Erro ao criar sala do Youtube:", err);
    } finally {
      setCreating(false);
      setCreateOptOpen(false);
    }
  };

  const handleCreateBrowserRoom = async () => {
    if (!currentUser || creating) return;
    setCreating(true);
    const newRoomId = Math.random().toString(36).substring(2, 9).toUpperCase();

    try {
      await set(ref(rtdb, `rooms/${newRoomId}`), {
        host: currentUser.uid,
        hostName: userNick,
        hostAvatar: userAvatar,
        videoUrl: 'https://google.com',
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

      // Post bot welcome message
      await set(ref(rtdb, `rooms/${newRoomId}/chat/${Math.random().toString(36).substring(2, 9)}`), {
        uid: "system",
        username: "Playzi Bot",
        avatar: "https://ui-avatars.com/api/?name=PB&background=FF2E93&color=fff",
        text: `🌐 Navegador Global Chrome iniciado por ${userNick}! Use o controle navegador abaixo para surfarem juntos na Web.`,
        timestamp: Date.now()
      });

      navigate(`/watch/browser/${newRoomId}`);
    } catch (err) {
      console.error("Erro ao criar sala do Chrome Web:", err);
    } finally {
      setCreating(false);
      setCreateOptOpen(false);
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

  const handleVideoChange = async (e: FormEvent) => {
    e.preventDefault();
    const url = inputUrl.trim();
    if (!url || !roomId || !canControl) return;

    setUpdatingUrl(true);
    let title = "Sincronização Ativa";
    if (getYoutubeVideoId(url)) {
      title = "Vídeo do YouTube";
    } else if (url.toLowerCase().endsWith('.mp4')) {
      title = "Vídeo MP4 Direto";
    }

    try {
      await update(ref(rtdb, `rooms/${roomId}`), {
        videoUrl: url,
        videoTitle: title,
        playing: false,
        currentTime: 0,
        updatedAt: serverTimestamp()
      });

      // Reset YT player if changing video on iframe
      if (getYoutubeVideoId(url) && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (err) {}
        ytPlayerRef.current = null;
      }

      setInputUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingUrl(false);
    }
  };

  const toggleGuestControls = async () => {
    if (!roomId || !isHost) return;
    try {
      await update(ref(rtdb, `rooms/${roomId}`), {
        allowControl: !(room?.allowControl ?? false)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/watch/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const deleteRoom = async () => {
    if (!roomId || !isHost) return;
    if (window.confirm("Deseja realmente encerrar a sala? Isso desconectará todos os convidados.")) {
      try {
        await remove(ref(rtdb, `rooms/${roomId}`));
        navigate('/watch');
      } catch (err) {
        console.error(err);
      }
    }
  };


  // --- VIEW LAYOUT 1: PORTAL / DASHBOARD (List and Create) ---
  if (!roomId) {
    return (
      <div className="pt-6 pb-20 min-h-screen px-4 sm:px-6 relative gaming-grid select-none text-slate-100">
        <SEO 
          title="Playzi Sync - Rave Co-Browse & Watch Party" 
          description="Assista vídeos sincronizados e navegue na web em tempo real com amigos sem lag."
          keywords="watch party, rave, youtube sincronizado, assistir videos juntos, playzi sync, co-browse"
        />

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Neon Futuristic Header - Responsive Grid layout */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#0d0a1b]/80 to-[#190a2c]/60 border border-white/5 p-6 md:p-8 rounded-[2rem] relative overflow-hidden">
            <div className="absolute inset-0 bg-vibe-neon-blue/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center space-x-2 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 px-3 py-1 rounded-full text-vibe-neon-blue text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-vibe-neon-blue" />
                <span>Playzi Sync Multiverso</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase leading-none">
                Playzi <span className="neon-text-blue">Sync</span>
              </h1>
              <p className="text-vibe-muted text-xs uppercase tracking-widest font-black max-w-sm">
                Rave de vídeos do YouTube e Navegador Web Co-Browsing sincronizados em tempo real!
              </p>
            </div>

            {/* Criar Sala Button triggers Modal */}
            <button
              onClick={() => setCreateOptOpen(true)}
              className="px-6 py-4 bg-gradient-to-r from-vibe-neon-blue to-vibe-neon-purple text-vibe-bg font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center shadow-glow hover:shadow-glow-blue cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 mr-2 stroke-[3]" />
              <span>Criar Sala</span>
            </button>
          </div>

          {/* Active Rooms Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs uppercase font-black tracking-widest text-vibe-muted flex items-center">
                <Users className="w-4 h-4 mr-2 text-vibe-neon-blue" />
                Transmissões ao Vivo ({activeRooms.length})
              </h3>
              <div className="flex items-center space-x-1.5 text-[9px] font-black uppercase text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sincronia Global</span>
              </div>
            </div>

            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center p-16 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                <div className="w-10 h-10 border-2 border-vibe-neon-pink/30 border-t-vibe-neon-pink rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase text-vibe-muted tracking-widest animate-pulse">Varrendo satélites de streaming...</span>
              </div>
            ) : activeRooms.length === 0 ? (
              <div className="text-center p-14 bg-white/5 border border-white/5 rounded-[2rem] space-y-3">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
                  <Tv className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-vibe-muted text-xs font-bold uppercase tracking-widest">Nenhuma arena ativa no momento</p>
                  <p className="text-[10px] text-vibe-muted/60 max-w-xs mx-auto">Inicie seu próprio canal clicando em "Criar Sala" e compartilhe com seu squad!</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRooms.map((r) => {
                  const isWeb = r.browser || r.videoTitle?.includes('Browser') || r.videoTitle?.includes('Chrome') || r.videoUrl?.includes('google');
                  const onCount = r.users ? Object.values(r.users).filter(u => u.online === true).length : 1;
                  const ytId = !isWeb && r.videoUrl ? getYoutubeVideoId(r.videoUrl) : null;
                  
                  return (
                    <div 
                      key={r.id}
                      className="vibe-card bg-[#0d0a1b]/45 border border-white/5 hover:border-vibe-neon-blue/25 rounded-2xl flex flex-col justify-between transition-all group relative overflow-hidden shadow-lg hover:shadow-glow-blue/10"
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                        {ytId ? (
                          <img 
                            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt="YouTube Thumbnail"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                            <img 
                              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                              alt="Web Sandbox"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35" />
                            <div className="relative z-10 flex flex-col items-center justify-center space-y-1.5 p-4 text-center">
                              <div className="w-9 h-9 rounded-full bg-vibe-neon-blue/20 border border-vibe-neon-blue/40 flex items-center justify-center text-vibe-neon-blue">
                                <Globe className="w-4 h-4" />
                              </div>
                              <span className="text-[9px] font-black tracking-widest uppercase text-vibe-neon-blue/90 font-mono">Multi-Browse</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />

                        {/* Top corner Indicators info badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                          {isWeb ? (
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#00f2ff] bg-black/70 backdrop-blur-md border border-[#00f2ff]/30 px-2.5 py-0.5 rounded-full flex items-center">
                              <Globe className="w-3 h-3 mr-1 text-[#00f2ff]" />
                              Navegador
                            </span>
                          ) : (
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#FF2E93] bg-black/70 backdrop-blur-md border border-[#FF2E93]/30 px-2.5 py-0.5 rounded-full flex items-center">
                              <Youtube className="w-3 h-3 mr-1 text-[#FF2E93]" />
                              YouTube
                            </span>
                          )}

                          <span className="flex items-center text-[9px] font-black text-emerald-400 bg-black/70 backdrop-blur-md border border-emerald-500/20 px-2 py-0.5 rounded-lg font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                            {onCount} {onCount === 1 ? 'ONLINE' : 'ONLINE'}
                          </span>
                        </div>

                        {/* Floating Sala ID tag on thumbnail */}
                        <div className="absolute bottom-3 right-3 bg-black/80 border border-white/10 px-2.5 py-0.5 rounded-md text-[9px] font-black text-slate-300 tracking-wider font-mono">
                          SALA {r.id}
                        </div>
                      </div>

                      {/* Card Info Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                        <div className="space-y-1.5">
                          <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide leading-tight line-clamp-2 h-9 sm:h-10 overflow-hidden" title={r.videoTitle}>
                            {r.videoTitle || "Sem título ativo"}
                          </h4>
                          {isWeb && r.videoUrl && (
                            <p className="text-[9px] text-[#A296BD] font-bold truncate uppercase tracking-tight">
                              {r.videoUrl.replace(/^https?:\/\/(www\.)?/i, '')}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (isWeb) {
                              navigate(`/watch/browser/${r.id}`);
                            } else {
                              navigate(`/watch/youtube/${r.id}`);
                            }
                          }}
                          className="w-full bg-white/5 group-hover:bg-vibe-neon-blue group-hover:text-vibe-bg text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center space-x-1 border border-white/5 group-hover:border-transparent cursor-pointer hover:shadow-glow-blue"
                        >
                          <span>Sintonizar Sala</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal "Criar Sala" with options Youtube and Web */}
        <AnimatePresence>
          {createOptOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              {/* Overlay Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCreateOptOpen(false)}
                className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="bg-[#0f0c1e] border border-white/10 p-6 md:p-8 rounded-[2rem] w-full max-w-lg relative z-10 shadow-2xl space-y-6"
              >
                <div className="space-y-1.5 text-center">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Criar Nova Sala Sync</h3>
                  <p className="text-xs text-slate-400">Escolha o ambiente ideal para compartilhar com seu squad:</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* YouTube Option */}
                  <button
                    onClick={handleCreateYoutubeRoom}
                    disabled={creating}
                    className="flex flex-col items-center justify-center text-center p-5 bg-[#ff0055]/5 border border-[#ff0055]/20 hover:border-[#ff0055]/50 rounded-2xl space-y-3 transition-all hover:bg-[#ff0055]/10 group text-left w-full cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#ff0055]/10 border border-[#ff0055]/20 flex items-center justify-center text-[#ff0055] group-hover:scale-110 transition-transform">
                      <Youtube className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 text-center w-full">
                      <h4 className="text-xs font-black uppercase text-white tracking-widest group-hover:text-[#ff0055]">YouTube Party</h4>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Pesquise vídeos, trailers e gameplays. Chat interativo e player sincronizado 1:1.
                      </p>
                    </div>
                  </button>

                  {/* Web Sandbox Option */}
                  <button
                    onClick={handleCreateBrowserRoom}
                    disabled={creating}
                    className="flex flex-col items-center justify-center text-center p-5 bg-vibe-neon-blue/5 border border-vibe-neon-blue/20 hover:border-vibe-neon-blue/50 rounded-2xl space-y-3 transition-all hover:bg-vibe-neon-blue/10 group text-left w-full cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 flex items-center justify-center text-vibe-neon-blue group-hover:scale-110 transition-transform">
                      <Chrome className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 text-center w-full">
                      <h4 className="text-xs font-black uppercase text-white tracking-widest group-hover:text-[#00f2ff]">Navegador Web</h4>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Navegue em links externos de forma colaborativa com chat integrado na barra lateral.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="flex justify-center pt-2 border-t border-white/5">
                  <button
                    onClick={() => setCreateOptOpen(false)}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- VIEW LAYOUT 2: LOADER WHILE ROOM VERIFY ACTS ---
  if (roomExists === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-vibe-bg space-y-4">
        <div className="w-12 h-12 border-4 border-vibe-neon-blue/30 border-t-vibe-neon-blue rounded-full animate-spin shadow-glow-blue" />
        <span className="text-xs font-black uppercase tracking-widest text-vibe-muted animate-pulse">Sincronizando com o satélite...</span>
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


  // --- VIEW LAYOUT 4: FULL-FEATURED PLAYER RAVE SYNC ROOM ---
  return (
    <div className="md:pt-6 md:pb-nav min-h-screen md:px-4 font-sans text-white select-none relative md:max-w-5xl md:mx-auto flex flex-col md:block h-screen md:h-auto overflow-hidden md:overflow-visible">
      <SEO 
        title={`Playzi Sync - Assistindo em Grupo Room ${roomId}`} 
        description="Assista vídeos sincronizados em tempo real com seu squad com chat de presença integrado."
      />

      {/* Main Room Container */}
      <div className="flex-grow flex flex-col md:grid md:grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6 min-h-0">
        
        {/* LEFT COLUMN: Large Player and Controls */}
        <div className="lg:col-span-2 flex flex-col md:space-y-4 shrink-0 md:shrink">
          
          {/* Room Banner Info (Hidden on Mobile) */}
          <div className="hidden md:flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl relative">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2.5 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 text-vibe-neon-blue rounded-xl">
                <Tv className="w-5 h-5 animate-pulse" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-xs text-vibe-neon-blue font-black uppercase tracking-widest">SALA #{roomId}</h1>
                <p className="text-xs font-bold text-white uppercase truncate tracking-tight">{room?.videoTitle}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button 
                onClick={() => navigate(`/watch/youtube/${roomId}`)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-vibe-neon-blue/20 to-vibe-neon-purple/20 border border-vibe-neon-blue/30 hover:from-vibe-neon-blue/30 hover:to-vibe-neon-purple/30 text-vibe-neon-blue text-[10px] font-black uppercase tracking-widest rounded-xl transition-all animate-pulse"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>YouTube Hub</span>
              </button>

              <button 
                onClick={() => navigate(`/watch/browser/${roomId}`)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-vibe-neon-purple/10 border border-vibe-neon-purple/20 hover:bg-vibe-neon-purple/20 text-vibe-neon-purple text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                <Globe className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Modo Browser</span>
              </button>

              <button 
                onClick={() => navigate('/watch')}
                className="flex items-center space-x-1.5 px-3 py-2 bg-white/5 border border-white/5 hover:bg-vibe-neon-pink/10 hover:border-vibe-neon-pink/30 hover:text-vibe-neon-pink text-vibe-muted text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Sync Video Player View block */}
          <div className="aspect-[16/9] bg-black/95 md:rounded-3xl border-b md:border border-white/10 overflow-hidden relative group shadow-[0_0_50px_rgba(0,0,0,0.8)] shrink-0 z-10">
            {isVideoYoutube ? (
              <div className="w-full h-full">
                <div id={ytContainerId} className="w-full h-full" />
              </div>
            ) : (
              // HTML5 native video controls
              <video
                ref={videoRef}
                src={room?.videoUrl}
                className="w-full h-full object-contain"
                onPlay={handleHtml5Play}
                onPause={handleHtml5Pause}
                onSeeked={handleHtml5Seeked}
                controls={canControl}
                playsInline
                crossOrigin="anonymous"
              />
            )}

            {/* If user is viewer and allowControl is FALSE, block manual actions with an overlay if they try to hover */}
            {!canControl && (
              <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-black/80 backdrop-blur px-2.5 py-1 rounded-full border border-white/10 z-20 pointer-events-none text-[9px] font-black uppercase tracking-widest text-vibe-neon-pink">
                <Lock className="w-3 h-3 text-vibe-neon-pink" />
                <span>Sincronizado</span>
              </div>
            )}

            {/* INCREDIBLE INTERACTION BLOCKER DIV ON TOP OF THE YOUTUBE IFRAME */}
            {!canControl && (
              <div className="absolute inset-0 z-10 bg-transparent cursor-not-allowed" />
            )}

            {/* Float Exit button on Mobile Screen */}
            <button 
              onClick={() => navigate('/watch')}
              className="md:hidden absolute top-3 right-3 z-30 p-2 bg-black/60 backdrop-blur border border-white/10 rounded-full text-white/80 hover:text-white"
              title="Sair da Sala"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile compact host playback control bar */}
          {canControl && (
            <div className="md:hidden bg-[#0a0515]/90 border-b border-white/5 py-2 px-4 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[9px] text-[#00f2ff] font-black uppercase tracking-widest">Painel Host</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleManualSeek(-10)}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white"
                >
                  -10s
                </button>
                <button
                  onClick={() => {
                    const nextPlaying = !(room?.playing ?? false);
                    let curr = 0;
                    if (isVideoYoutube && ytPlayerRef.current) {
                      try { curr = ytPlayerRef.current.getCurrentTime(); } catch (e) {}
                    } else if (videoRef.current) {
                      curr = videoRef.current.currentTime;
                    }
                    updateRoomState(nextPlaying, curr);
                  }}
                  className="p-1.5 bg-[#ff2e93] text-white rounded-full"
                >
                  {room?.playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                </button>
                <button
                  onClick={() => handleManualSeek(10)}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white"
                >
                  +10s
                </button>
                {isHost && (
                  <button
                    onClick={() => setShowMobileHostControls(!showMobileHostControls)}
                    className={cn(
                      "p-1.5 rounded-lg border flex items-center justify-center transition-colors",
                      showMobileHostControls ? "bg-vibe-neon-purple/20 border-vibe-neon-purple text-vibe-neon-purple" : "bg-white/5 border-white/10 text-vibe-muted"
                    )}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Expandable Mobile Host controller (Drawer) */}
          {canControl && showMobileHostControls && (
            <div className="md:hidden bg-[#0d071a] p-4 border-b border-white/10 space-y-3 shrink-0 animate-fade-in z-20">
              <span className="text-[10px] font-black uppercase text-vibe-neon-blue block">Sintonizador Rave Direct</span>
              <form onSubmit={handleVideoChange} className="flex gap-2">
                <input 
                  type="text"
                  required
                  placeholder="Link YouTube ou MP4 direto..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-vibe-neon-blue/60"
                />
                <button 
                  type="submit"
                  disabled={updatingUrl}
                  className="bg-vibe-neon-blue text-vibe-bg text-[10px] font-black uppercase px-4 rounded-xl shrink-0"
                >
                  Carregar
                </button>
              </form>

              {isHost && (
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button 
                    onClick={toggleGuestControls}
                    className={cn(
                      "px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase flex items-center space-x-1.5",
                      room?.allowControl ? "bg-vibe-neon-blue/20 border-vibe-neon-blue text-vibe-neon-blue" : "bg-white/5 border-white/10 text-vibe-muted"
                    )}
                  >
                    {room?.allowControl ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>Controle Livre</span>
                  </button>

                  <button 
                    onClick={copyRoomLink}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase flex items-center space-x-1 text-white"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}
                    <span>Convidar</span>
                  </button>

                  <button 
                    onClick={deleteRoom}
                    className="px-3 py-1.5 bg-red-950/40 border border-red-500/35 rounded-lg text-[9px] font-black uppercase text-red-400"
                  >
                    Fechar Sala
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sincronização Controller Dashboard (Desktop Version Only) */}
          {canControl && (
            <div className="hidden md:flex vibe-card bg-black/40 border-white/5 p-4 rounded-2xl items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-vibe-muted uppercase tracking-widest font-black font-mono">PLAYBACK:</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleManualSeek(-10)}
                  className="px-3 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  -10s
                </button>
                <button
                  onClick={() => {
                    const nextPlaying = !(room?.playing ?? false);
                    let curr = 0;
                    if (isVideoYoutube && ytPlayerRef.current) {
                      try { curr = ytPlayerRef.current.getCurrentTime(); } catch (e) {}
                    } else if (videoRef.current) {
                      curr = videoRef.current.currentTime;
                    }
                    updateRoomState(nextPlaying, curr);
                  }}
                  className="p-3 bg-vibe-neon-blue text-vibe-bg rounded-full hover:scale-105 transition-transform"
                >
                  {room?.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-vibe-bg" />}
                </button>
                <button
                  onClick={() => handleManualSeek(10)}
                  className="px-3 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  +10s
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Sincronizando</span>
              </div>
            </div>
          )}

          {/* Host Administration & Video Switch URL card (Desktop Version Only) */}
          {canControl && (
            <div className="hidden md:block vibe-card bg-black/40 border-white/5 p-5 rounded-2xl space-y-4">
              <div>
                <h3 className="text-xs uppercase font-black tracking-widest text-[#00f2ff]">Fila de Vídeos da Sala</h3>
                <p className="text-[10px] text-vibe-muted font-bold uppercase mt-0.5 font-mono">Somente administradores e controles liberados podem mudar.</p>
              </div>
              
              <form onSubmit={handleVideoChange} className="flex gap-2">
                <input 
                  type="text"
                  required
                  placeholder="URL do novo vídeo (YouTube ou MP4 direto)..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-vibe-neon-blue/60 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={updatingUrl}
                  className="bg-vibe-neon-blue hover:bg-vibe-neon-blue/90 text-vibe-bg font-black rounded-xl px-5 text-xs uppercase tracking-widest transition-all flex items-center justify-center shrink-0"
                >
                  {updatingUrl ? "Alterando..." : "Trocar Vídeo"}
                </button>
              </form>

              {/* Host Settings options toggler */}
              {isHost && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5">
                  <div className="flex items-center space-x-3">
                    <button 
                      type="button"
                      onClick={toggleGuestControls}
                      className={cn(
                        "p-2 rounded-lg border flex items-center justify-center transition-colors",
                        room?.allowControl 
                          ? "bg-vibe-neon-blue/10 border-vibe-neon-blue/30 text-vibe-neon-blue"
                          : "bg-white/5 border-white/10 text-vibe-muted"
                      )}
                    >
                      {room?.allowControl ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wide block">Controle Livre</span>
                      <span className="text-[9px] text-vibe-muted font-bold uppercase block mt-0.5">Let guests play/pause/seek</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={copyRoomLink}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-1.5"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-vibe-neon-blue" />}
                      <span>{copiedLink ? "Copiado!" : "Convidar Squad"}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={deleteRoom}
                      className="px-4 py-2.5 bg-vibe-neon-pink/10 border border-vibe-neon-pink/20 text-vibe-neon-pink rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Fechar Sala
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Realtime Chat AND Active Presence list */}
        <div className="flex-grow flex flex-col min-h-0 md:space-y-4">
          
          {/* Active Presence panel (Re-engineered to be a horizontal stream on Mobile) */}
          <div className="bg-black/35 border-b border-white/5 md:border md:rounded-2xl md:p-4 md:vibe-card px-4 py-2 shrink-0 flex items-center justify-between gap-3">
            <div className="shrink-0 flex items-center space-x-1 border-r border-white/5 pr-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Squad</span>
            </div>
            
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-0.5 flex-1 justify-end">
              {participants.map((user) => {
                const userIsHost = room?.host === user.uid;
                return (
                  <div 
                    key={user.uid}
                    className="flex items-center space-x-1.5 bg-white/5 border border-white/5 p-1 pr-2.5 rounded-full shrink-0"
                    title={user.displayName}
                  >
                    <img src={user.photoURL} className="w-4 h-4 rounded-full object-cover border border-white/10" alt="" />
                    <span className="text-[9px] font-black tracking-tight text-white/90">
                      {user.displayName.split(' ')[0]}
                    </span>
                    {userIsHost && <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Sync Rave Chat card */}
          <div className="flex-grow flex flex-col bg-black/25 md:bg-black/40 border-t md:border border-white/5 p-3 md:p-4 rounded-b-none md:rounded-2xl min-h-0 h-full md:h-[400px]">
            <div className="hidden md:flex items-center space-x-2 border-b border-white/5 pb-2 mb-2 shrink-0">
              <MessageSquare className="w-4 h-4 text-vibe-neon-purple animate-bounce" />
              <span className="text-xs font-black uppercase tracking-widest text-vibe-text">Sincronizado Sync-Chat</span>
            </div>

            {/* Messages box */}
            <div className="flex-grow overflow-y-auto space-y-3.5 px-1 py-1 custom-scrollbar min-h-0">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Nenhuma mensagem</p>
                  <p className="text-[9px] text-vibe-muted mt-0.5">Diga olá para o squad e comece a resenha!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isSelf = msg.uid === currentUser?.uid;
                  const isBot = msg.uid === 'system';

                  // Beautiful central notifications pill for joins or bot reports
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

                  // Check if this message is a custom sticker gif
                  const isSticker = msg.text.startsWith('[STICKER]: ');
                  const stickerUrl = isSticker ? msg.text.replace('[STICKER]: ', '') : '';

                  return (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex items-start space-x-3 text-xs animate-fade-in",
                        isSelf ? "flex-row-reverse space-x-reverse" : ""
                      )}
                    >
                      <img 
                        src={msg.avatar} 
                        className="w-7 h-7 rounded-full border border-white/10 shrink-0 mt-0.5 shadow-sm" 
                        alt={msg.username} 
                      />
                      <div className="space-y-1 max-w-[78%] flex flex-col">
                        <div className={cn("flex items-baseline space-x-1.5", isSelf ? "justify-end flex-row-reverse space-x-reverse" : "")}>
                          <span className="font-black text-[#00f2ff] text-[10px] tracking-tight truncate max-w-28 mb-0.5">{msg.username}</span>
                          <span className="text-[8px] text-vibe-muted/65 font-bold">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {isSticker ? (
                          // Custom sticker rendering - perfectly framed gif!
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
                          // Clean aesthetic text message bubble
                          <p className={cn(
                            "px-3 py-2 text-[11px] leading-relaxed break-words border text-white",
                            isSelf 
                              ? "bg-vibe-neon-pink/15 border-vibe-neon-pink/25 rounded-2xl rounded-tr-none text-right"
                              : "bg-[#0b0615] border-white/5 rounded-2xl rounded-tl-none"
                          )}>
                            {msg.text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Mobile stickers panel bar */}
            {showStickerPanel && (
              <div className="bg-black/85 border border-white/10 rounded-2xl p-3 mb-2 animate-fade-in">
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
                        className="w-14 h-14 object-cover rounded-xl border border-white/10 hover:border-vibe-neon-pink transition-all shadow-md"
                        alt={stick.name} 
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form submit bar - Desktop style */}
            <form onSubmit={handleSendMessage} className="hidden md:flex gap-2 border-t border-white/5 pt-2 mt-2 shrink-0">
              <input 
                type="text"
                placeholder="Enviar mensagem para a sala..."
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

            {/* Incredibly polished Mobile footer bar matching the user's design image */}
            <div className="md:hidden pt-2 border-t border-white/5 flex items-center gap-2shrink-0">
              
              {/* Mic / Voice toggle on webrtc context simulation */}
              <button
                type="button"
                onClick={() => setMicMuted(!micMuted)}
                className={cn(
                  "p-2.5 rounded-full flex items-center justify-center shrink-0 shadow-md transition-colors",
                  micMuted 
                    ? "bg-red-500 text-white" 
                    : "bg-white text-black hover:bg-slate-200"
                )}
                title={micMuted ? "Mutado" : "Microfone"}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Bate-papo input box stretching */}
              <form onSubmit={handleSendMessage} className="flex-1 flex items-center bg-[#07030f]/90 border border-white/10 rounded-full px-3 py-1.5 focus-within:border-vibe-neon-purple/40 transition-colors">
                <input 
                  type="text"
                  placeholder="Bate-papo..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none pr-2"
                />
                
                {/* Submit Send on filled, or just generic send button inside bar representing chat flow */}
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

              {/* Quick helper buttons right-side strip */}
              <div className="flex items-center space-x-1 opacity-80 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setChatInput(prev => `${prev}@`);
                  }}
                  className="p-1 px-1.5 text-white/70 hover:text-white"
                  title="Marcar"
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
                  title="Sticker"
                >
                  <Image className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowStickerPanel(!showStickerPanel)}
                  className="p-1 text-white/70 hover:text-white"
                  title="Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={copyRoomLink}
                  className="p-1 text-white/70 hover:text-white"
                  title="Compartilhar"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
