import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Heart, UserPlus, Zap, Bell, MessageCircle, Sparkles, Star, Gift, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { requestNotificationPermission, getAndSaveFCMToken, setupMessageListener } from '../services/pushNotificationService';
import { soundService } from '../services/soundService';

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

      const isDismissed = localStorage.getItem('playzi_notif_preprompt_dismissed') === 'true';
      if (Notification.permission === 'default' && !isDismissed) {
        // Only show prompt on mobile or after a relaxed delay, avoiding instant aggressive popups
        const isDesktop = window.innerWidth >= 1024;
        if (!isDesktop) {
          setTimeout(() => setShowPrePrompt(true), 20000);
        }
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
    try {
      localStorage.setItem('playzi_notif_preprompt_dismissed', 'true');
    } catch {}
    const granted = await requestNotificationPermission();
    if (granted && currentUser) {
      await getAndSaveFCMToken(currentUser.uid);
      claimNotifReward();
    }
  };

  const handleDismissPrePrompt = () => {
    setShowPrePrompt(false);
    try {
      localStorage.setItem('playzi_notif_preprompt_dismissed', 'true');
    } catch {}
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
    }, (error) => {
      console.warn("Global notifications snapshot listener caught safely:", error);
    });

    // 2. Specialized listener for real-time chat messages
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const chatData = change.doc.data();
          if (chatData.lastMessage && chatData.updatedBy !== currentUser.uid) {
            // Avoid showing banner toast if user is already inside this chat
            if (window.location.pathname === `/chat/${change.doc.id}`) {
              return;
            }
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
    }, (error) => {
      console.warn("Global chats snapshot listener caught safely:", error);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeChats();
    };
  }, [currentUser]);

  const playNotificationSound = (type: string) => {
    switch (type) {
      case 'like':
        soundService.play('pop');
        break;
      case 'follow':
        soundService.play('levelup');
        break;
      case 'comment':
      case 'message':
        soundService.play('message');
        break;
      default:
        soundService.play('notification');
        break;
    }
  };

  const showNotification = (notif: UnifiedNotification) => {
    setNotification(notif);
    playNotificationSound(notif.type);

    // Browser standard notification: only trigger when document is hidden (background)
    // so active users don't get double notifications on screen
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.content,
          icon: notif.senderPhoto || 'https://i.ibb.co/svpJKdbx/playsi-logo.png'
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }

    // Auto-hide in-app notification after 3.5s
    const timer = setTimeout(() => setNotification(null), 3500);
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
      {/* Notification Pre-Prompt */}
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
                    onClick={handleDismissPrePrompt}
                    className="px-4 py-4 bg-white/5 text-vibe-muted font-bold rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all hover:text-white"
                   >
                     Ignorar
                   </button>
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {notification && (
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.95 }}
          animate={{ 
            y: 0, 
            opacity: 1, 
            scale: 1, 
            transition: {
              type: 'spring',
              damping: 15,
              stiffness: 220
            }
          }}
          exit={{ y: -60, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="fixed top-4 left-4 right-4 z-[9999] max-w-sm mx-auto lg:top-6 lg:right-6 lg:left-auto lg:mx-0"
        >
          <div 
            onClick={() => {
              if (notification.link) navigate(notification.link);
              setNotification(null);
            }}
            className="bg-[#0c0d15]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center space-x-3.5 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.8)] active:scale-95 transition-all hover:border-vibe-neon-blue/40 group overflow-hidden"
          >
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-vibe-gradient p-[1px] shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                <img 
                  src={notification.senderPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.senderName || 'P')}&background=0D0E12&color=fff`} 
                  className="w-full h-full rounded-xl object-cover border border-vibe-bg"
                  referrerPolicy="no-referrer"
                  alt={notification.senderName || 'Notification'}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-vibe-bg rounded-lg border border-white/10 flex items-center justify-center shadow z-10 scale-75">
                {getIcon(notification.type)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[10px] font-black text-vibe-neon-blue uppercase tracking-wider flex items-center truncate">
                  {notification.title}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotification(null);
                  }}
                  className="p-1 -mr-1 text-white/40 hover:text-white transition-colors"
                  title="Fechar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-white font-bold text-xs truncate leading-snug">{notification.content}</p>
              <div className="h-0.5 bg-white/10 rounded-full overflow-hidden mt-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3.5, ease: "linear" }}
                  className="h-full bg-vibe-neon-blue"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
