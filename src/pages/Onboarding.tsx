import React, { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, User, ChevronRight, Check, Calendar, Heart, Gift, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { APP_LOGO } from '../constants/assets';

const GAMES = [
  'Free Fire', 'Roblox', 'Minecraft', 'Fortnite', 
  'Call of Duty', 'Valorant', 'League of Legends', 
  'CS:GO', 'FIFA', 'Genshin Impact'
];

const LANGUAGES = [
  { id: 'pt', label: 'Português', flag: '🇧🇷' },
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' }
];

const INTERESTS = ['Música', 'Gaming', 'Filmes', 'Esportes', 'Culinária', 'Tecnologia', 'Arte', 'Viagens'];

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const { currentUser, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    nickname: currentUser?.displayName || '',
    birthday: '',
    gender: '' as 'Masculino' | 'Feminino' | '',
    country: '',
    interests: [] as string[],
    favoriteGames: [] as string[],
    bio: '',
    onboarded: true
  });

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setStep(1);
  };

  const handleToggleInterest = (item: string, field: 'interests' | 'favoriteGames') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) 
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...formData,
        displayName: formData.nickname,
        onboarded: true,
        language: i18n.language
      });
      await refreshUser();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-vibe-bg flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decorative */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vibe-neon-blue/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vibe-neon-purple/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 gaming-grid" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/90 dark:bg-vibe-card backdrop-blur-2xl rounded-[40px] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.3)] p-10 relative z-10 overflow-hidden border border-white/20"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-vibe-gradient rounded-2xl mx-auto mb-6 p-0.5 shadow-xl animate-float">
             <div className="w-full h-full bg-vibe-bg rounded-2xl flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-vibe-neon-blue" />
             </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">
            {step === 0 ? "Idioma / Language" : "Perfil Gamer"}
          </h1>
          <p className="text-slate-400 dark:text-vibe-muted text-[11px] leading-relaxed max-w-[240px] mx-auto font-medium">
            {step === 0 ? "Escolha seu idioma para continuar" : "Personalize sua identidade para encontrar o seu par ideal!"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div 
                key="step0"
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="grid grid-cols-2 gap-4"
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleLanguageChange(lang.id)}
                    className="vibe-card p-6 flex flex-col items-center justify-center space-y-3 hover:neon-border transition-all group active:scale-95"
                  >
                    <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">{lang.flag}</span>
                    <span className="text-xs font-black text-vibe-text uppercase">{lang.label}</span>
                  </button>
                ))}
              </motion.div>
            ) : step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Nickname */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Seu Nickname</label>
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-4 px-6 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-vibe-neon-blue/20 outline-none transition-all shadow-sm"
                    placeholder="Ex: GhostKiller"
                    value={formData.nickname}
                    onChange={e => setFormData({...formData, nickname: e.target.value})}
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">País / Região</label>
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-4 px-6 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-vibe-neon-blue/20 outline-none transition-all shadow-sm"
                    placeholder="Brasil, Portugal, etc..."
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  />
                </div>

                {/* Birthday */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Data de Nascimento</label>
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-4 px-6 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-vibe-neon-blue/20 outline-none transition-all shadow-sm tracking-[0.2em]"
                    placeholder="DD / MM / AAAA"
                    value={formData.birthday}
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.length > 8) v = v.substring(0, 8);
                      let formatted = v;
                      if (v.length > 2) formatted = v.substring(0, 2) + ' / ' + v.substring(2);
                      if (v.length > 4) formatted = v.substring(0, 2) + ' / ' + v.substring(2, 4) + ' / ' + v.substring(4);
                      setFormData({...formData, birthday: formatted});
                    }}
                  />
                </div>

                {/* Gender */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'Masculino'})}
                    className={cn(
                      "py-4 rounded-2xl flex items-center justify-center space-x-2 font-black text-xs transition-all shadow-sm uppercase tracking-widest",
                      formData.gender === 'Masculino' 
                        ? "bg-vibe-neon-blue text-white shadow-[0_0_20px_rgba(0,242,255,0.4)]" 
                        : "bg-slate-100 dark:bg-white/5 text-slate-400"
                    )}
                  >
                    <User className="w-4 h-4" />
                    <span>Masc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'Feminino'})}
                    className={cn(
                      "py-4 rounded-2xl flex items-center justify-center space-x-2 font-black text-xs transition-all shadow-sm uppercase tracking-widest",
                      formData.gender === 'Feminino' 
                        ? "bg-vibe-neon-pink text-white shadow-[0_0_20px_rgba(255,0,255,0.4)]" 
                        : "bg-slate-100 dark:bg-white/5 text-slate-400"
                    )}
                  >
                    <Heart className="w-4 h-4" />
                    <span>Fem</span>
                  </button>
                </div>

                <div className="pt-4 flex flex-col space-y-3">
                  <button 
                    type="button" 
                    disabled={!formData.nickname || !formData.birthday || !formData.gender || !formData.country}
                    onClick={() => setStep(2)}
                    className="w-full py-5 bg-vibe-gradient text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-vibe-neon-blue/20 uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:grayscale"
                  >
                    Próximo Passo
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(0)}
                    className="w-full py-2 text-slate-300 dark:text-vibe-muted font-bold text-[10px] uppercase tracking-widest border border-transparent hover:border-vibe-muted/20 rounded-xl transition-all"
                  >
                    Trocar Idioma
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center block">Seus gostos e preferências</label>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {INTERESTS.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleToggleInterest(item, 'interests')}
                        className={cn(
                          "px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm",
                          formData.interests.includes(item)
                            ? "bg-vibe-gradient text-white shadow-lg"
                            : "bg-slate-50 text-slate-400 border border-slate-100"
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center block">Jogos favoritos</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                    {GAMES.map(game => (
                      <button
                        key={game}
                        type="button"
                        onClick={() => handleToggleInterest(game, 'favoriteGames')}
                        className={cn(
                          "p-3 rounded-2xl text-[10px] font-bold transition-all shadow-sm border",
                          formData.favoriteGames.includes(game)
                            ? "bg-vibe-neon-blue/10 border-vibe-neon-blue text-vibe-neon-blue shadow-inner"
                            : "bg-slate-50 border-transparent text-slate-400"
                        )}
                      >
                        {game}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-vibe-gradient text-white font-black rounded-full shadow-xl shadow-vibe-neon-blue/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                  >
                    <span>Concluído</span>
                    <Check className="w-5 h-5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="w-full py-3 text-slate-300 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Voltar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
