import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Heart, MessageSquare, UserPlus, Zap, ArrowLeft, Trash2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'system';
  title: string;
  content: string;
  senderName?: string;
  senderPhoto?: string;
  link?: string;
  createdAt: any;
  read: boolean;
}

export default function Notifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(list);
      setLoading(false);
    });
  }, [currentUser]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-vibe-neon-pink" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-vibe-neon-blue" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-vibe-neon-purple" />;
      case 'message': return <Zap className="w-4 h-4 text-yellow-500" />;
      default: return <Bell className="w-4 h-4 text-vibe-muted" />;
    }
  };

  return (
    <div className="pt-6 pb-nav px-6 max-w-lg mx-auto min-h-screen bg-vibe-bg">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Notificações</h1>
        </div>
        <span className="text-[10px] font-black bg-vibe-card px-3 py-1 rounded-full text-vibe-muted uppercase tracking-widest border border-vibe-border">
          {notifications.length} Novas
        </span>
      </header>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="vibe-card p-6 animate-pulse bg-white/5" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
            <Bell className="w-16 h-16 mb-6" />
            <p className="text-xs font-black uppercase tracking-[0.5em]">Sem novidades por enquanto</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => notif.link && navigate(notif.link)}
                className={cn(
                  "vibe-card p-5 cursor-pointer hover:neon-border transition-all group relative overflow-hidden",
                  !notif.read && "border-vibe-neon-blue/30 bg-vibe-neon-blue/5"
                )}
              >
                {!notif.read && <div className="absolute top-0 left-0 w-1 h-full bg-vibe-neon-blue" />}
                
                <div className="flex items-start space-x-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-vibe-gradient p-[1px]">
                      <img 
                        src={notif.senderPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.senderName || 'P')}&background=0D0E12&color=fff`} 
                        className="w-full h-full rounded-2xl object-cover border-2 border-vibe-bg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-vibe-card rounded-lg flex items-center justify-center border border-vibe-border shadow-lg">
                      {getIcon(notif.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-black text-white uppercase tracking-tighter truncate">
                        {notif.title}
                      </p>
                      <span className="text-[8px] font-bold text-vibe-muted flex items-center">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {notif.createdAt && formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-vibe-muted line-clamp-2 leading-relaxed">
                      {notif.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center">
        <button 
          className="text-[10px] font-black text-vibe-muted uppercase tracking-widest flex items-center space-x-2 hover:text-white transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Limpar Tudo</span>
        </button>
      </div>
    </div>
  );
}
