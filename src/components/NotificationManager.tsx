import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Heart, UserPlus, Zap, Bell, MessageCircle, Sparkles, Star, Gift, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { requestNotificationPermission, getAndSaveFCMToken, setupMessageListener } from '../services/pushNotificationService';

interface UnifiedNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'system';
  title: string;
  content: string;
  link?: string;
  senderName?: string;
  senderPhoto?: string;
  chatId?: string;
}

export default function NotificationManager() {
  const { currentUser, refreshUser } = useAuth();
  const [notification, setNotification] = useState<UnifiedNotification | null>(null);
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const navigate = useNavigate();

  // 1. Service Worker & Push Notification Initialization
  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!('Notification' in window)) return;

      if (Notification.permission === 'default') {
        // Delay pre-prompt for better experience
        setTimeout(() => setShowPrePrompt(true), 10000);
      } else if (Notification.permission === 'granted' && currentUser) {
        initNotifications();
      }
    };

    const initNotifications = async () => {
      console.log('[Notification Manager] Iniciando configuração de notificações...');
      const granted = await requestNotificationPermission();
      
      if (granted) {
        console.log('[Notification Manager] Permissão de notificação concedida.');
        if (currentUser) {
          await getAndSaveFCMToken(currentUser.uid);
          claimNotifReward();
        }
      }
    };

    if (currentUser) {
      checkNotificationStatus();
      setupMessageListener();
    }
  }, [currentUser]);

  const claimNotifReward = async () => {
    if (!currentUser || currentUser.rewards?.notificationsEnabled) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        'rewards.notificationsEnabled': true,
        gems: increment(100),
        xp: increment(50)
      });
      await refreshUser();
      console.log('Notification reward claimed!');
    } catch (err) {
      console.error('Error claiming notif reward:', err);
    }
  };

  const handlePermit = async () => {
    setShowPrePrompt(false);
    const granted = await requestNotificationPermission();
    if (granted && currentUser) {
      await getAndSaveFCMToken(currentUser.uid);
      claimNotifReward();
    }
  };

  // Existing listeners for in-app notifications
  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen to the dedicated notifications subcollection
    const notificationsQuery = query(
      collection(db, 'users', currentUser.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    let isFirstLoad = true;

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (!data.read) {
            const newNotif: UnifiedNotification = {
              id: change.doc.id,
              type: data.type || 'system',
              title: data.title || 'Novidade',
              content: data.content || '',
              link: data.link,
              senderName: data.senderName,
              senderPhoto: data.senderPhoto
            };
            
            showNotification(newNotif);
          }
        }
      });
    });

    // 2. Specialized listener for real-time chat messages (for faster response)
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const chatData = change.doc.data();
          if (chatData.lastMessage && chatData.updatedBy !== currentUser.uid) {
            // Check if we should notify (could avoid double notification if using subcollection too)
            // But usually chat needs to be instant.
            const newChatNotif: UnifiedNotification = {
              id: `msg-${change.doc.id}-${chatData.updatedAt?.seconds || Date.now()}`,
              type: 'message',
              title: 'Nova Mensagem',
              content: chatData.lastMessage,
              chatId: change.doc.id,
              link: `/chat/${change.doc.id}`
            };
            showNotification(newChatNotif);
          }
        }
      });
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeChats();
    };
  }, [currentUser]);

  const playNotificationSound = (type: string) => {
    // Som futurista/gaming para notificações
    let soundUrl = 'https://cdn.pixabay.com/audio/2022/03/15/audio_783d1a3825.mp3'; // Generic tech
    
    if (type === 'like') soundUrl = 'https://cdn.pixabay.com/audio/2021/11/24/audio_311d4d3856.mp3'; // Pop
    if (type === 'follow') soundUrl = 'https://cdn.pixabay.com/audio/2022/01/18/audio_273898f98a.mp3'; // Level up
    if (type === 'comment') soundUrl = 'https://cdn.pixabay.com/audio/2022/03/10/audio_c9769dae13.mp3'; // Message

    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Audio play failed (waiting for user interaction):", error);
        });
      }
    } catch (err) {
      console.error('Audio object error:', err);
    }
  };

  const showNotification = (notif: UnifiedNotification) => {
    setNotification(notif);
    playNotificationSound(notif.type);

    // Browser standard notification (background/native feel)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notif.title, {
        body: notif.content,
        icon: notif.senderPhoto || 'https://i.ibb.co/svpJKdbx/playsi-logo.png'
      });
    }

    // Auto-hide in-app notification
    const timer = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timer);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-vibe-neon-pink" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-vibe-neon-purple" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-vibe-neon-blue" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-vibe-neon-blue" />;
      case 'system': return <Zap className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-vibe-muted" />;
    }
  };

  return (
    <AnimatePresence>
      {/* Notification Pre-Prompt (DOPAMINE UI) */}
      {showPrePrompt && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-[9998] max-w-sm mx-auto"
        >
          <div className="bg-[#0A0B10] border-2 border-vibe-neon-blue/40 rounded-[32px] p-6 shadow-[0_0_80px_rgba(0,242,255,0.25)] overflow-hidden relative group">
             {/* Background Glow */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-vibe-neon-blue/10 blur-3xl -mr-10 -mt-10" />
             
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-vibe-gradient rounded-2xl p-0.5 shadow-lg">
                      <div className="w-full h-full bg-vibe-bg rounded-2xl flex items-center justify-center">
                         <Bell className="w-6 h-6 text-white animate-ring" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-black text-sm uppercase tracking-tighter">Ativar Alertas</h3>
                      <p className="text-[10px] font-bold text-vibe-muted uppercase tracking-widest">Não perca nada!</p>
                    </div>
                  </div>
                  
                  {/* Reward Badge */}
                  <div className="bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 px-3 py-1.5 rounded-full flex items-center space-x-1">
                    <Star className="w-3 h-3 text-vibe-neon-blue fill-vibe-neon-blue" />
                    <span className="text-[10px] font-black text-vibe-neon-blue">+100 GEMS</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                   <div className="flex items-center space-x-2 text-[10px] font-bold text-white/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-vibe-neon-blue" />
                      <span>Mensagens privadas instantâneas</span>
                   </div>
                   <div className="flex items-center space-x-2 text-[10px] font-bold text-white/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-vibe-neon-blue" />
                      <span>Duelos e convites de Squad</span>
                   </div>
                   <div className="flex items-center space-x-2 text-[10px] font-bold text-white/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-vibe-neon-blue" />
                      <span>Bônus diários e recompensas</span>
                   </div>
                </div>

                <div className="flex items-center space-x-3">
                   <button 
                    onClick={handlePermit}
                    className="flex-1 py-4 bg-vibe-gradient text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-vibe-neon-blue/20 active:scale-95 transition-all"
                   >
                     Ativar Agora
                   </button>
                   <button 
                    onClick={() => setShowPrePrompt(false)}
                    className="px-4 py-4 bg-white/5 text-vibe-muted font-bold rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                   >
                     Ignorar
                   </button>
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {notification && (
        <>
          {/* Dopamine Sparkles for Followers */}
          {notification.type === 'follow' && (
            <div className="fixed inset-0 pointer-events-none z-[10000]">
               {[...Array(12)].map((_, i) => (
                 <motion.div
                   key={i}
                   initial={{ 
                     opacity: 1, 
                     scale: 0,
                     x: '50vw',
                     y: '20vh'
                   }}
                   animate={{ 
                     opacity: 0, 
                     scale: [1, 2, 1.5],
                     x: `${Math.random() * 100}vw`,
                     y: `${Math.random() * 100}vh`,
                     rotate: 360
                   }}
                   transition={{ duration: 2, ease: "easeOut" }}
                   className="absolute"
                 >
                   <Sparkles className="text-vibe-neon-blue w-8 h-8" />
                 </motion.div>
               ))}
            </div>
          )}

          <motion.div
            initial={{ y: -120, opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1, 
              rotate: 0,
              transition: {
                type: 'spring',
                damping: 12,
                stiffness: 200
              }
            }}
            exit={{ y: -120, opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="fixed top-4 left-4 right-4 z-[9999] max-w-sm mx-auto"
          >
            {/* XP Float Effect */}
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -50 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-vibe-gradient px-4 py-1 rounded-full shadow-lg"
            >
              <span className="text-white font-black text-[10px] uppercase tracking-widest">+10 XP</span>
            </motion.div>

            <div 
              onClick={() => {
                if (notification.link) navigate(notification.link);
                setNotification(null);
              }}
              className="bg-black/80 backdrop-blur-3xl border-2 border-vibe-neon-blue/30 rounded-3xl p-5 flex items-center space-x-4 cursor-pointer shadow-[0_30px_60px_rgba(0,242,255,0.2)] active:scale-90 transition-all hover:border-vibe-neon-blue group overflow-hidden"
            >
              <div className="absolute inset-0 bg-vibe-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
              
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-vibe-gradient p-[1px] shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                  <img 
                    src={notification.senderPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.senderName || 'P')}&background=0D0E12&color=fff`} 
                    className="w-full h-full rounded-2xl object-cover border-2 border-vibe-bg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-vibe-bg rounded-xl border border-white/10 flex items-center justify-center shadow-2xl z-10"
                >
                  {getIcon(notification.type)}
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-vibe-neon-blue uppercase tracking-widest flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-vibe-neon-blue" />
                    {notification.title}
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotification(null);
                    }}
                    className="p-1 -mr-2 text-white/20 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white font-bold text-sm truncate leading-tight">{notification.content}</p>
                <div className="flex items-center space-x-2 mt-2">
                   <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 6, ease: "linear" }}
                        className="h-full bg-vibe-neon-blue"
                      />
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
