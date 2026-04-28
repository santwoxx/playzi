import React, { useState, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Camera, X, Image as ImageIcon, Loader2, Sparkles, Send, MapPin, Smile, ChevronRight, ShieldAlert, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SafetyService } from '../lib/safetyService';
import { securityUtils } from '../lib/security';
import { cn } from '../lib/utils';

export default function CreatePost() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [postType, setPostType] = useState<'image' | 'text'>('image');
  const [bgColor, setBgColor] = useState('bg-vibe-bg');

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaUrl(e.target?.result as string);
        setPostType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    // Validate: if text post, caption is required. If image post, media is required.
    if (postType === 'image' && !mediaUrl.trim()) {
      alert("Por favor, selecione uma imagem.");
      return;
    }
    if (postType === 'text' && !caption.trim()) {
      alert("Por favor, escreva algo.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (postType === 'image' && mediaUrl) {
        const isImageSafe = await SafetyService.checkImageSafety(mediaUrl);
        if (!isImageSafe) {
          alert("Ops! Esta imagem parece violar nossas regras de comunidade.");
          setIsSubmitting(false);
          return;
        }
      }

      const isCaptionSafe = await SafetyService.checkTextSafety(caption);
      if (!isCaptionSafe) {
        alert("Sua legenda contém linguagem inadequada.");
        setIsSubmitting(false);
        return;
      }

      const sanitizedCaption = securityUtils.sanitizeText(caption);

      const postData: any = {
        userId: currentUser.uid,
        userDisplayName: currentUser.nickname || currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        type: postType,
        caption: sanitizedCaption,
        likes: [],
        commentCount: 0,
        createdAt: serverTimestamp()
      };

      if (postType === 'image') {
        postData.mediaUrl = mediaUrl.trim();
      } else {
        postData.backgroundColor = bgColor;
      }

      await addDoc(collection(db, 'posts'), postData);
      navigate('/');
    } catch (error) {
      console.error("Erro ao criar post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const GAMER_COLORS = [
    { name: 'Default', class: 'bg-vibe-bg' },
    { name: 'Neon', class: 'bg-vibe-gradient' },
    { name: 'Ocean', class: 'bg-blue-600' },
    { name: 'Pulsar', class: 'bg-purple-600' },
    { name: 'Cyber', class: 'bg-pink-600' },
    { name: 'Dark', class: 'bg-zinc-900' },
  ];

  const canPost = postType === 'image' ? (!!mediaUrl && !isSubmitting) : (caption.trim().length > 0 && !isSubmitting);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-0 md:p-6 lg:p-10 gaming-grid overflow-y-auto overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-4xl w-full bg-vibe-bg border border-vibe-border md:rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.8)] min-h-screen md:min-h-[600px] relative"
      >
        {/* Close Button Desktop */}
        <button 
          onClick={() => navigate(-1)}
          className="hidden md:flex absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full items-center justify-center text-vibe-muted transition-all z-50 border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media / Preview Side */}
        <div className={cn(
          "flex-1 relative flex items-center justify-center p-6 md:p-10 transition-all duration-500 min-h-[300px] md:min-h-0",
          postType === 'text' ? bgColor : 'bg-black'
        )}>
          {postType === 'image' && mediaUrl ? (
            <div className="relative group w-full h-full flex items-center justify-center">
              <motion.img 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={mediaUrl} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
              />
              <button 
                onClick={() => setMediaUrl('')}
                className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-md p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : postType === 'text' ? (
            <div className="w-full max-w-sm text-center">
              <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-6 animate-pulse" />
              <div className="text-white font-black text-2xl md:text-3xl tracking-tight leading-tight break-words">
                {caption || "Sua mensagem aqui..."}
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "w-full h-full border-4 border-dashed border-vibe-border rounded-[32px] flex flex-col items-center justify-center transition-all cursor-pointer group",
                dragActive ? "border-vibe-neon-blue bg-vibe-neon-blue/5 scale-95" : "hover:border-vibe-neon-blue/50 hover:bg-white/[0.02]"
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-vibe-card rounded-2xl flex items-center justify-center text-vibe-muted mb-6 group-hover:text-vibe-neon-blue group-hover:scale-110 transition-all shadow-xl">
                 <ImageIcon className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-vibe-text uppercase tracking-widest">Post de Imagem</h3>
              <p className="text-vibe-muted text-xs font-bold uppercase mt-2">Clique ou arraste um arquivo</p>
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          )}

          {/* Floating Mode Toggle */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex bg-black/40 backdrop-blur-xl p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setPostType('image')}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                postType === 'image' ? "bg-vibe-neon-blue text-vibe-bg shadow-lg shadow-vibe-neon-blue/20" : "text-white/40 hover:text-white"
              )}
            >
              Foto
            </button>
            <button 
              onClick={() => setPostType('text')}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                postType === 'text' ? "bg-vibe-neon-blue text-vibe-bg shadow-lg shadow-vibe-neon-blue/20" : "text-white/40 hover:text-white"
              )}
            >
              Texto
            </button>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-[400px] border-l border-vibe-border flex flex-col bg-vibe-card">
          <div className="p-6 md:p-10 flex-1 overflow-y-auto no-scrollbar">
             {/* Header Mobile */}
             <div className="flex items-center justify-between mb-8 md:hidden">
                <button onClick={() => navigate(-1)} className="p-2"><X className="w-6 h-6 text-vibe-text" /></button>
                <h1 className="text-sm font-black text-vibe-text uppercase tracking-widest">Publicar</h1>
                <div className="w-10" />
             </div>

             <div className="space-y-8">
               {/* User Context */}
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-vibe-gradient p-[1px]">
                     <img src={currentUser?.photoURL || ''} className="w-full h-full rounded-xl object-cover border-2 border-vibe-bg" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-vibe-text uppercase tracking-widest">{currentUser?.nickname || 'Gamer'}</span>
                    <span className="block text-[8px] font-black text-vibe-muted uppercase tracking-widest">Level {currentUser?.level}</span>
                  </div>
               </div>

               {/* Caption Input */}
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.2em] ml-1 flex items-center">
                   <Smile className="w-3 h-3 mr-2" />
                   {postType === 'image' ? 'Legenda' : 'Sua Mensagem'}
                 </label>
                 <textarea 
                   value={caption}
                   onChange={(e) => setCaption(e.target.value)}
                   placeholder={postType === 'image' ? "Escreva algo épico..." : "O que está pensando, Gamer?"}
                   className="w-full bg-vibe-bg border-2 border-vibe-border rounded-[24px] p-6 text-sm font-bold text-vibe-text focus:neon-border outline-none transition-all h-48 resize-none placeholder:opacity-30"
                 />
               </div>

               {/* Text Background Selector */}
               {postType === 'text' && (
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-vibe-muted uppercase tracking-[0.2em] ml-1">Estilo do Deck</label>
                    <div className="grid grid-cols-6 gap-2">
                      {GAMER_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setBgColor(color.class)}
                          className={cn(
                            "w-full aspect-square rounded-xl transition-all",
                            color.class,
                            bgColor === color.class ? "ring-2 ring-vibe-neon-blue ring-offset-2 ring-offset-vibe-bg scale-110" : "opacity-40 hover:opacity-100"
                          )}
                        />
                      ))}
                    </div>
                 </div>
               )}

               {/* Add-ons */}
               <div className="space-y-3 pt-4">
                  <button className="w-full flex items-center justify-between p-4 bg-vibe-bg border border-vibe-border rounded-2xl hover:neon-border transition-all group">
                     <div className="flex items-center space-x-3 text-vibe-muted group-hover:text-vibe-neon-blue transition-colors">
                        <MapPin className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-vibe-text">Adicionar Local</span>
                     </div>
                     <ChevronRight className="w-4 h-4 text-vibe-muted" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-vibe-bg border border-vibe-border rounded-2xl hover:neon-border transition-all group">
                     <div className="flex items-center space-x-3 text-vibe-muted group-hover:text-vibe-neon-blue transition-colors">
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-vibe-text">Marcar Amigos</span>
                     </div>
                     <ChevronRight className="w-4 h-4 text-vibe-muted" />
                  </button>
               </div>
             </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 border-t border-vibe-border space-y-4 bg-vibe-bg/50">
             <button 
               onClick={handleSubmit}
               disabled={!canPost}
               className="w-full py-5 bg-vibe-gradient text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-vibe-neon-blue/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center space-x-3"
             >
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                 <>
                   <Send className="w-4 h-4" />
                   <span>Lançar Post</span>
                 </>
               )}
             </button>
             <p className="text-[8px] text-vibe-muted text-center uppercase tracking-widest font-black opacity-40">
                Sua postagem será revisada por nossa IA de segurança
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
