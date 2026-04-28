import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Chat, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Send, Lock, EyeOff, MessageSquare, ChevronRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function QuickInbox({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !isOpen) return;
    
    // Top 8 recent chats
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', currentUser.uid)
    );
    
    return onSnapshot(q, (snapshot) => {
      const allChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      // Sort in memory to avoid composite index requirement
      const sortedChats = allChats.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      }).slice(0, 8);
      setChats(sortedChats);
    });
  }, [currentUser, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-vibe-bg/60 backdrop-blur-sm z-[100] md:z-[60]"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-vibe-bg border-l border-vibe-border shadow-2xl z-[101] md:z-[70] flex flex-col gaming-grid"
          >
            <header className="p-6 flex items-center justify-between border-b border-white/5">
               <div>
                  <h2 className="text-xl font-black text-white tracking-tighter uppercase">Inbox</h2>
                  <p className="text-[10px] font-bold text-vibe-muted uppercase tracking-widest leading-none mt-1">Transmissões Recentes</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X className="w-6 h-6 text-vibe-muted" />
               </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
               {chats.length === 0 ? (
                 <div className="text-center py-20 opacity-20">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Vazio</p>
                 </div>
               ) : (
                 chats.map((chat) => (
                   <QuickChatItem 
                    key={chat.id} 
                    chat={chat} 
                    currentUserId={currentUser!.uid} 
                    onSelect={() => {
                        navigate(`/chat/${chat.id}`);
                        onClose();
                    }}
                   />
                 ))
               )}
            </div>

            <footer className="p-6 border-t border-white/5">
               <button 
                onClick={() => {
                   navigate('/chat');
                   onClose();
                }}
                className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:neon-border transition-all flex items-center justify-center space-x-2"
               >
                  <span>Ver Todas as Conversas</span>
                  <ChevronRight className="w-4 h-4" />
               </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function QuickChatItem({ chat, currentUserId, onSelect }: { chat: Chat, currentUserId: string, onSelect: () => void, key?: any }) {
  const [recipient, setRecipient] = useState<User | null>(null);

  useEffect(() => {
    const recipientId = chat.participants.find(p => p !== currentUserId);
    if (recipientId && (!recipient || recipient.uid !== recipientId)) {
      getDoc(doc(db, 'users', recipientId)).then(s => {
        if (s.exists()) setRecipient({ uid: s.id, ...s.data() } as User);
      });
    }
  }, [chat, currentUserId, recipient]);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient?.nickname || recipient?.displayName || 'A')}&background=0D0E12&color=fff`;

  return (
    <button 
      onClick={onSelect}
      className="w-full vibe-card p-4 flex items-center space-x-4 hover:neon-border transition-all text-left group"
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-xl bg-vibe-gradient p-[1px]">
          <div className="w-full h-full rounded-[10px] bg-vibe-bg overflow-hidden border-2 border-vibe-bg">
             {chat.security?.isAnonymous ? (
                <div className="w-full h-full flex items-center justify-center text-vibe-muted bg-white/5">
                   <EyeOff className="w-5 h-5" />
                </div>
             ) : (
                <img 
                  src={recipient?.photoURL || fallbackAvatar} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
             )}
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-vibe-bg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="text-xs font-black text-white uppercase truncate pr-2 flex items-center">
            {chat.security?.isAnonymous ? 'Anônimo' : (recipient?.nickname || 'Agente')}
            {(chat as any).isInstantMatch && (
               <span className="ml-2 inline-flex items-center text-[7px] bg-vibe-neon-blue/20 text-vibe-neon-blue px-1.5 py-0.5 rounded-md border border-vibe-neon-blue/20 tracking-tighter">MATCH</span>
            )}
          </h4>
          <span className="text-[8px] font-bold text-vibe-muted uppercase opacity-50">
            {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt.seconds * 1000), { locale: ptBR, addSuffix: false }) : 'agora'}
          </span>
        </div>
        <p className="text-[10px] text-vibe-muted font-bold truncate opacity-80 uppercase tracking-tighter">
          {chat.lastMessage || 'Nova transmissão...'}
        </p>
      </div>
    </button>
  );
}
