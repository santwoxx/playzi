import React, { useState, useEffect, useRef, FormEvent, ChangeEvent, memo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Message, User, Chat } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Info, Send, Camera, Smile, ChevronRight, Shield, Lock, EyeOff, Trash2, Clock, Ban, AlertTriangle, ShieldCheck, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { encryptMessage, decryptMessage } from '../lib/encryption';
import { sendNotification } from '../services/notificationService';
import { apiService } from '../services/apiService';

const MessageItem = memo(({ msg, isMine, showAvatar, chatData, recipient }: { 
  msg: Message, 
  isMine: boolean, 
  showAvatar: boolean, 
  chatData: Chat | null, 
  recipient: User | null 
}) => {
  const decodedText = msg.isEncrypted 
    ? decryptMessage(msg.text, chatData?.security?.encryptionKey || 'playzi-default-key') 
    : msg.text;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col will-change-transform", isMine ? "items-end" : "items-start")}
    >
      <div className={cn("flex items-end max-w-[85%] space-x-3", isMine && "flex-row-reverse space-x-reverse")}>
        {!isMine && showAvatar && (
          <div className="w-8 h-8 rounded-xl bg-vibe-gradient p-[1px] mb-1">
            {chatData?.security?.isAnonymous ? (
              <div className="w-full h-full rounded-xl bg-vibe-card flex items-center justify-center border-2 border-vibe-bg">
                <UserIcon className="w-4 h-4 text-vibe-muted" />
              </div>
            ) : (
              <img 
                src={recipient?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient?.nickname || recipient?.displayName || 'User')}&background=0D0E12&color=fff`} 
                className="w-full h-full rounded-xl object-cover border-2 border-vibe-bg" 
                referrerPolicy="no-referrer" 
                loading="lazy"
              />
            )}
          </div>
        )}
        {!isMine && !showAvatar && <div className="w-8" />}
        
        <div className={cn(
          "rounded-2xl relative group border overflow-hidden transition-colors duration-200",
          isMine 
            ? "bg-vibe-gradient text-white border-transparent rounded-br-none shadow-lg shadow-vibe-neon-blue/10" 
            : "bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-950 dark:text-white rounded-bl-none font-bold"
        )}>
          {msg.mediaUrl && (
            <div className="mb-0 overflow-hidden bg-black/20">
               {msg.mediaType === 'image' ? (
                 <img 
                   src={msg.isEncrypted ? decryptMessage(msg.mediaUrl, chatData?.security?.encryptionKey || 'playzi-default-key') : msg.mediaUrl} 
                   className="max-h-64 h-auto w-full object-cover"
                   referrerPolicy="no-referrer"
                   loading="lazy"
                 />
               ) : (
                 <video 
                   src={msg.isEncrypted ? decryptMessage(msg.mediaUrl, chatData?.security?.encryptionKey || 'playzi-default-key') : msg.mediaUrl} 
                   controls 
                   className="max-h-64 w-full" 
                   preload="none"
                 />
               )}
            </div>
          )}
          <div className="px-5 py-3">
            <p className={cn(
              "text-sm leading-relaxed font-semibold dark:font-medium text-slate-950 dark:text-white",
              isMine && "text-white"
            )}>{decodedText}</p>
            
            {msg.isEncrypted && (
              <div className="absolute top-2 right-2 bg-vibe-bg/40 backdrop-blur-md border border-white/10 p-1 rounded-lg text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
                <Lock className="w-2.5 h-2.5" />
              </div>
            )}

            {msg.expiresAt && (
              <div className="flex items-center space-x-1 mt-1 text-[8px] font-black uppercase text-white/30 tracking-wider">
                 <Clock className="w-2.5 h-2.5" />
                 <span>Auto-destruição ativa</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function ChatRoom() {
  const { chatId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatData, setChatData] = useState<Chat | null>(null);
  const [inputText, setInputText] = useState('');
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [recipient, setRecipient] = useState<User | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!chatId) return;
    
    // Chat Data
    const chatUnsub = onSnapshot(doc(db, 'chats', chatId), async (snapshot) => {
      if (!snapshot.exists()) return;
      const data = { id: snapshot.id, ...snapshot.data() } as Chat;
      setChatData(data);
      
      // Fetch recipient once or when set/changed
      const recipientId = data.participants.find(p => p !== currentUser?.uid);
      if (recipientId && (!recipient || recipient.uid !== recipientId)) {
        const userDoc = await getDoc(doc(db, 'users', recipientId));
        if (userDoc.exists()) setRecipient({ uid: userDoc.id, ...userDoc.data() } as User);
      }
    });

    // Messages
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const msgUnsub = onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Client-side expiry filtering for "Auto-destruição"
      const now = new Date();
      const filtered = allMessages.filter(msg => {
        if (!msg.expiresAt) return true;
        const expiry = (msg.expiresAt as any).toDate ? (msg.expiresAt as any).toDate() : new Date(msg.expiresAt);
        return expiry > now;
      });
      setMessages(filtered);
    });

    return () => {
      chatUnsub();
      msgUnsub();
    };
  }, [chatId, currentUser]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !isUploading) || !chatId || !currentUser || !chatData) return;

    const msgText = inputText.trim();
    if (!msgText && !isUploading) return;
    const currentInput = msgText;
    setInputText('');

    const isEncrypted = chatData.security?.isEncrypted ?? false;
    const finalKey = chatData.security?.encryptionKey || 'playzi-default-key'; 
    const encryptedText = isEncrypted ? encryptMessage(currentInput, finalKey) : currentInput;

    const expiresAt = chatData.security?.autoDelete24h 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000) 
      : null;

    try {
      await apiService.sendMessage(chatId || '', encryptedText, {
        isEncrypted,
        expiresAt: expiresAt?.toISOString()
      });

      const recipientId = chatData.participants.find(p => p !== currentUser.uid);
      if (recipientId) {
        await sendNotification({
          userId: recipientId,
          type: 'message',
          title: chatData.security?.isAnonymous ? 'Nova Mensagem Anônima' : (currentUser.nickname || currentUser.displayName || 'Nova Mensagem'),
          content: isEncrypted ? '🔒 Mensagem Protegida' : currentInput,
          link: `/chat/${chatId}`,
          senderName: chatData.security?.isAnonymous ? 'Anônimo' : (currentUser.nickname || currentUser.displayName),
          senderPhoto: chatData.security?.isAnonymous ? undefined : currentUser.photoURL
        });
      }

    } catch (error) {
       console.error("Erro ao enviar mensagem:", error);
    }
  }, [inputText, isUploading, chatId, currentUser, chatData]);

  const toggleEncryption = async () => {
    if (!chatId || !chatData) return;
    await updateDoc(doc(db, 'chats', chatId), {
      'security.isEncrypted': !(chatData.security?.isEncrypted)
    });
  };

  const toggleEphemeral = async () => {
    if (!chatId || !chatData) return;
    await updateDoc(doc(db, 'chats', chatId), {
      'security.autoDelete24h': !(chatData.security?.autoDelete24h)
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !currentUser || !chatData) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const isEncrypted = chatData.security?.isEncrypted ?? false;
        const finalKey = chatData.security?.encryptionKey || 'playzi-default-key'; 
        const encryptedUrl = isEncrypted ? encryptMessage(base64String, finalKey) : base64String;

        const expiresAt = chatData.security?.autoDelete24h 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) 
          : null;

        await apiService.sendMessage(chatId, isEncrypted ? '🔒 Mídia Criptografada' : (file.type.startsWith('image') ? '📷 Foto' : '🎥 Vídeo'), {
          mediaUrl: encryptedUrl,
          mediaType: file.type.startsWith('image') ? 'image' : 'video',
          isEncrypted,
          expiresAt: expiresAt?.toISOString()
        });

        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro no upload:", error);
      setIsUploading(false);
    }
  };

  const deleteChat = async () => {
    if (!chatId || !window.confirm("Apagar conversa permanentemente?")) return;
    await deleteDoc(doc(db, 'chats', chatId));
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-vibe-bg z-[60] flex flex-col h-full font-sans overflow-hidden gaming-grid">
      {/* Header */}
      <div className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 pt-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="relative">
               <div className="w-10 h-10 rounded-2xl bg-vibe-gradient p-[1px]">
                   {chatData?.security?.isAnonymous ? (
                     <div className="w-full h-full rounded-2xl bg-vibe-card flex items-center justify-center border-2 border-vibe-bg">
                       <EyeOff className="w-5 h-5 text-vibe-muted" />
                     </div>
                   ) : (
                     <img 
                       src={recipient?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient?.nickname || recipient?.displayName || 'User')}&background=0D0E12&color=fff`} 
                       className="w-full h-full rounded-2xl object-cover border-2 border-vibe-bg" 
                       referrerPolicy="no-referrer" 
                     />
                   )}
               </div>
               <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-vibe-bg" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-tighter leading-tight truncate max-w-[120px]">
                {chatData?.security?.isAnonymous ? 'Jogador Anônimo' : (recipient?.nickname || recipient?.displayName || 'Chat Privado')}
              </p>
              <div className="flex items-center text-[8px] font-black text-vibe-neon-blue uppercase tracking-widest mt-0.5">
                 <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                 <span>{chatData?.security?.isAnonymous ? 'Modo Anônimo Ativo' : 'Conversa Protegida'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           {chatData?.security?.isEncrypted && (
             <div className="p-2 bg-vibe-neon-blue/10 rounded-xl text-vibe-neon-blue animate-pulse">
                <Lock className="w-5 h-5" />
             </div>
           )}
           <button 
              onClick={() => setShowPrivacyMenu(true)}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-vibe-muted"
           >
             <Info className="w-6 h-6" />
           </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-vibe-neon-blue/5 border-b border-vibe-neon-blue/10 px-6 py-2 flex items-center justify-center space-x-2">
         <Shield className="w-3 h-3 text-vibe-neon-blue" />
         <span className="text-[9px] font-black text-vibe-neon-blue uppercase tracking-widest">Criptografia de ponta a ponta ativa</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-10">
        <div className="flex flex-col items-center justify-center py-10 opacity-30">
           <Lock className="w-12 h-12 text-vibe-muted mb-4" />
           <p className="text-[10px] font-black uppercase tracking-widest text-center max-w-[200px]">
             Suas mensagens e chamadas são protegidas. Ninguém fora desta conversa, nem o Playzi, pode ler.
           </p>
        </div>

        {messages.map((msg, index) => (
          <MessageItem 
            key={msg.id}
            msg={msg}
            isMine={msg.senderId === currentUser?.uid}
            showAvatar={index === 0 || messages[index-1].senderId !== msg.senderId}
            chatData={chatData}
            recipient={recipient}
          />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-black/40 backdrop-blur-xl border-t border-white/5">
        <form 
          onSubmit={handleSend}
          className="flex items-center space-x-4 bg-white/5 border border-white/10 rounded-3xl py-3 px-5 focus-within:neon-border transition-all"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*"
            onChange={handleFileUpload}
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-vibe-muted hover:text-white transition-colors disabled:opacity-50"
          >
            <Camera className={cn("w-6 h-6", isUploading && "animate-pulse")} />
          </button>
          <button type="button" className="text-vibe-muted hover:text-white transition-colors">
            <Smile className="w-6 h-6" />
          </button>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isUploading ? "Enviando mídia..." : "Mensagem protegida..."}
            disabled={isUploading}
            className="flex-1 text-sm bg-transparent border-none focus:outline-none text-white font-medium"
          />
          <button 
            type="submit" 
            disabled={(!inputText.trim() && !isUploading) || isUploading}
            className={cn(
              "p-3 rounded-2xl transition-all",
              inputText.trim() ? "bg-vibe-gradient text-white shadow-lg shadow-vibe-neon-blue/20" : "bg-white/5 text-vibe-muted"
            )}
          >
            <Send className="w-5 h-5 flex-shrink-0" />
          </button>
        </form>
      </div>

      {/* Privacy Menu Sidebar/Modal */}
      <AnimatePresence>
        {showPrivacyMenu && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute inset-0 bg-vibe-bg z-[70] flex flex-col"
          >
             <div className="h-20 border-b border-white/5 flex items-center px-6">
                <button onClick={() => setShowPrivacyMenu(false)} className="p-2 mr-4">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-black neon-text-blue uppercase tracking-tighter">Segurança & Privacidade</h2>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                 <div className="w-24 h-24 rounded-3xl p-1 bg-vibe-gradient">
                    {chatData?.security?.isAnonymous ? (
                      <div className="w-full h-full rounded-3xl bg-vibe-card flex items-center justify-center border-4 border-vibe-bg">
                        <EyeOff className="w-10 h-10 text-vibe-muted" />
                      </div>
                    ) : (
                      <img src={recipient?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient?.nickname || recipient?.displayName || 'User')}&background=0D0E12&color=fff`} className="w-full h-full rounded-3xl object-cover border-4 border-vibe-bg" referrerPolicy="no-referrer" />
                    )}
                 </div>
                 <div>
                    <h3 className="text-lg font-black">{chatData?.security?.isAnonymous ? 'Conversa Anônima' : (recipient?.nickname || recipient?.displayName)}</h3>
                    <p className="text-xs text-vibe-muted lowercase truncate max-w-[200px]">{chatData?.security?.isAnonymous ? 'Identidades Ocultas' : recipient?.email}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.3em] ml-2">Blindagem</h4>
                 
                 <PrivacyToggle 
                   icon={<EyeOff className="w-5 h-5 text-vibe-neon-purple" />} 
                   title="Modo Anônimo" 
                   desc="Oculta nomes e fotos nesta conversa" 
                   active={chatData?.security?.isAnonymous ?? false}
                   onClick={() => updateDoc(doc(db, 'chats', chatId!), { 'security.isAnonymous': !chatData?.security?.isAnonymous })}
                 />

                 <PrivacyToggle 
                   icon={<Lock className="w-5 h-5 text-vibe-neon-blue" />} 
                   title="Criptografia Total" 
                   desc="Ativa E2EE AES-256 nesta conversa" 
                   active={chatData?.security?.isEncrypted ?? false}
                   onClick={toggleEncryption}
                 />

                   <PrivacyToggle 
                     icon={<Clock className="w-5 h-5 text-vibe-neon-pink" />} 
                     title="Mensagens Temporárias" 
                     desc="Apagar automaticamente após 24h" 
                     active={chatData?.security?.autoDelete24h ?? false}
                     onClick={toggleEphemeral}
                   />

                   <PrivacyToggle 
                     icon={<EyeOff className="w-5 h-5 text-vibe-neon-purple" />} 
                     title="Ocultar Conversa" 
                     desc="Exige PIN para visualizar no feed" 
                     active={chatData?.security?.isHidden ?? false}
                     onClick={() => updateDoc(doc(db, 'chats', chatId!), { 'security.isHidden': !chatData?.security?.isHidden })}
                   />
                </div>

                <div className="space-y-4 pb-10">
                   <h4 className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.3em] ml-2">Ações Críticas</h4>
                   
                   <button 
                     onClick={deleteChat}
                     className="w-full p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-4 hover:bg-red-500/20 transition-all text-left"
                   >
                      <Trash2 className="w-6 h-6 text-red-500" />
                      <div>
                         <p className="text-sm font-black text-red-500 uppercase tracking-widest">Excluir com Segurança</p>
                         <p className="text-[10px] text-vibe-muted font-bold">Remove do banco e impede recuperação</p>
                      </div>
                   </button>

                   <button className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center space-x-4 opacity-50 cursor-not-allowed">
                      <Ban className="w-6 h-6 text-orange-500" />
                      <div>
                         <p className="text-sm font-black text-orange-500 uppercase tracking-widest">Bloquear Jogador</p>
                         <p className="text-[10px] text-vibe-muted font-bold">Impedir novos contatos</p>
                      </div>
                   </button>

                   <button className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center space-x-4 opacity-50 cursor-not-allowed">
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                      <div>
                         <p className="text-sm font-black text-yellow-500 uppercase tracking-widest">Denunciar Abuso</p>
                         <p className="text-[10px] text-vibe-muted font-bold">Analisar conduta inadequada</p>
                      </div>
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrivacyToggle({ icon, title, desc, active, onClick }: { icon: any, title: string, desc: string, active: boolean, onClick: () => void }) {
  return (
    <div onClick={onClick} className="vibe-card p-5 flex items-center justify-between cursor-pointer hover:neon-border transition-all group">
       <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors">
             {icon}
          </div>
          <div>
             <p className="text-sm font-black text-white uppercase tracking-widest">{title}</p>
             <p className="text-[10px] text-vibe-muted font-bold tracking-tight">{desc}</p>
          </div>
       </div>
       <div className={cn(
         "w-10 h-6 rounded-full relative transition-all",
         active ? "bg-vibe-neon-blue" : "bg-white/10"
       )}>
          <div className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
            active ? "left-5" : "left-1"
          )} />
       </div>
    </div>
  )
}
