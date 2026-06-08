import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Globe, ArrowLeft, Users, Sparkles, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface GlobalMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string;
  createdAt: any;
}

export default function GlobalChat() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'globalMessages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GlobalMessage[];
      // Invert back to asc for display
      setMessages(msgs.reverse());
      setTimeout(scrollToBottom, 50);
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'globalMessages'), {
        text: newMessage.trim(),
        userId: currentUser.uid,
        userName: currentUser.nickname || currentUser.displayName || 'Gamer',
        userPhoto: currentUser.photoURL || '',
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-128px)] bg-vibe-bg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-vibe-border flex items-center justify-between bg-vibe-card/50 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-vibe-muted/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-vibe-text" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-vibe-neon-blue animate-pulse" />
              <h1 className="text-sm font-black text-vibe-text uppercase tracking-tighter">Chat Global</h1>
            </div>
            <p className="text-[10px] text-vibe-muted font-bold uppercase tracking-widest flex items-center">
              <Users className="w-3 h-3 mr-1" />
              Arena dos Gamers
            </p>
          </div>
        </div>
        <div className="bg-vibe-neon-blue/10 px-3 py-1 rounded-full border border-vibe-neon-blue/20">
          <span className="text-[10px] font-black text-vibe-neon-blue uppercase">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth custom-scrollbar"
      >
        <div className="text-center py-8">
           <div className="inline-flex p-3 rounded-2xl bg-vibe-card border border-vibe-border mb-3">
              <Sparkles className="w-6 h-6 text-yellow-400" />
           </div>
           <h2 className="text-xs font-black text-vibe-muted uppercase tracking-[0.2em]">Bem-vindo ao Chat Global</h2>
           <p className="text-[10px] text-vibe-muted/50 uppercase mt-1">Converse com todos os jogadores do servidor</p>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isMe = msg.userId === currentUser?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-start space-x-3",
                  isMe ? "flex-row-reverse space-x-reverse" : "flex-row"
                )}
              >
                <button 
                  onClick={() => navigate(`/profile/${msg.userId}`)}
                  className="relative group shrink-0"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-vibe-border group-hover:border-vibe-neon-blue transition-all">
                    <img 
                      src={msg.userPhoto || `https://ui-avatars.com/api/?name=${msg.userName}`} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {!isMe && (
                    <div className="absolute -bottom-1 -right-1 bg-vibe-bg rounded-full p-0.5 border border-vibe-border">
                       <Hash className="w-2.5 h-2.5 text-vibe-neon-blue" />
                    </div>
                  )}
                </button>

                <div className={cn(
                  "max-w-[75%] space-y-1",
                  isMe ? "items-end" : "items-start"
                )}>
                  {!isMe && (
                    <span className="text-[10px] font-black text-vibe-muted uppercase tracking-widest ml-1">
                      {msg.userName}
                    </span>
                  )}
                  <div className={cn(
                    "p-3 rounded-2xl text-sm font-medium leading-relaxed",
                    isMe 
                      ? "bg-vibe-gradient text-white rounded-tr-none shadow-glow-blue" 
                      : "bg-vibe-card border border-vibe-border text-vibe-text rounded-tl-none shadow-sm"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-vibe-muted uppercase font-black px-1 opacity-50">
                    {msg.createdAt && new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-vibe-card border-t border-vibe-border safe-bottom">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mande uma mensagem para o server..."
            className="flex-1 bg-vibe-muted/5 border border-vibe-border rounded-2xl py-4 px-6 text-sm font-bold text-vibe-text outline-none focus:neon-border transition-all uppercase tracking-tight"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="w-14 h-14 bg-vibe-gradient rounded-2xl flex items-center justify-center text-white shadow-glow disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
