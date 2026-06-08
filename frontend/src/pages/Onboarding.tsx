import React, { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc, increment, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, User as UserIcon, ChevronRight, Check, Calendar, Heart, Gift, Globe, Share2, Award, Users, Copy, Shield, MapPin, Search, Plus, Sparkles, Filter, Info, Briefcase, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { APP_LOGO, AVATARS_GALLERY } from '../constants/assets';
import { User } from '../types';

const APP_URL = "https://playzi.app.br";

const GAMES = [
  'Free Fire', 'Roblox', 'Minecraft', 'Fortnite', 
  'Call of Duty', 'Valorant', 'League of Legends', 
  'CS:GO', 'FIFA', 'Genshin Impact', 'Among Us', 'Rocket League', 
  'Cyberpunk 2077', 'Spider-Man', 'Elden Ring', 'God of War'
];

const LANGUAGES = [
  { id: 'pt', label: 'Português', flag: '🇧🇷' },
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' }
];

const INTERESTS = ['Música', 'Gaming', 'Filmes', 'Esportes', 'Culinária', 'Tecnologia', 'Arte', 'Viagens', 'Hardware', 'Cosplay', 'E-Sports', 'RPG'];

const CITIES_MOCK = [
  'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR', 
  'Salvador, BA', 'Porto Alegre, RS', 'Brasília, DF', 'Fortaleza, CE',
  'Manaus, AM', 'Recife, PE', 'Goiânia, GO', 'Belém, PA'
];

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const { currentUser, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const referralCode = React.useMemo(() => 
    Math.random().toString(36).substring(2, 10).toUpperCase(), []
  );

  const [formData, setFormData] = useState({
    nickname: currentUser?.displayName || '',
    birthday: '',
    gender: 'other' as 'male' | 'female' | 'other',
    relationshipStatus: 'single' as 'single' | 'dating' | 'married' | 'searching' | 'open',
    interestedIn: [] as ('male' | 'female' | 'other')[],
    location: {
      city: '',
      state: '',
      coordinates: { lat: 0, lng: 0 }
    },
    country: '',
    interests: [] as string[],
    favoriteGames: [] as string[],
    bio: '',
    photoURL: currentUser?.photoURL || AVATARS_GALLERY[0],
    onboarded: true,
    referralCode: referralCode,
    referralCount: 0,
    referredBy: searchParams.get('ref') || '',
    links: [] as User['links']
  });

  useEffect(() => {
    if (formData.location.city) {
      setCitySearch(`${formData.location.city}${formData.location.state ? `, ${formData.location.state}` : ''}`);
    }
  }, [formData.location.city, formData.location.state]);

  const handleCopyLink = () => {
    const link = `${APP_URL}/login?ref=${formData.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    if (!currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Calculate age from birthday
      let age = 0;
      if (formData.birthday) {
        const birthDate = new Date(formData.birthday);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // 1. Update Current User
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...formData,
        age,
        displayName: formData.nickname,
        onboarded: true,
        language: i18n.language,
        photoURL: formData.photoURL
      });

      // 2. Handle Referral Credit (Logic for finding referrer)
      if (formData.referredBy) {
         // In a production app, we would call a cloud function here.
         // For the demo, we store it in the user doc above (referredBy)
         // And award a "Welcome Bonus" to the new user for using a referral
         await updateDoc(doc(db, 'users', currentUser.uid), {
            coins: increment(500), // Welcome gift
            xp: increment(250)
         });
      }

      await refreshUser();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-vibe-bg flex items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Background Decorative */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vibe-neon-blue/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vibe-neon-purple/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 gaming-grid" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0d0720]/95 border border-white/10 backdrop-blur-3xl rounded-[32px] sm:rounded-[48px] shadow-[0_0_50px_rgba(139,92,246,0.15)] p-0 relative z-10 overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/5 flex">
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-full flex-1 transition-all duration-500",
                step >= s ? "bg-vibe-neon-blue shadow-[0_0_10px_rgba(0,242,255,0.5)]" : "bg-transparent"
              )} 
            />
          ))}
        </div>

        <div className="p-6 sm:p-10">
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-vibe-gradient rounded-2xl sm:rounded-3xl mx-auto mb-4 p-1 shadow-2xl shadow-vibe-neon-blue/20"
            >
               <div className="w-full h-full bg-vibe-bg rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src={APP_LOGO} className="w-10 h-10 sm:w-12 sm:h-12" alt="Logo" />
               </div>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-1.5 uppercase">
              {step === 0 ? "BEM-VINDO" : step === 1 ? "SEGURANÇA" : step === 2 ? "AVATAR" : step === 3 ? "PERFIL" : step === 4 ? "GOSTOS" : "RECOMPENSA"}
            </h1>
            <p className="text-slate-300 text-[10px] leading-relaxed max-w-[280px] mx-auto font-black uppercase tracking-[0.2em] opacity-80">
              {step === 0 ? "Escolha seu idioma para começar a jornada" : 
               step === 1 ? "Playzi é uma comunidade inclusiva e segura" :
               step === 2 ? "Escolha um avatar que combina com você" :
               step === 3 ? "Como podemos te chamar na arena?" : 
               step === 4 ? "Personalize sua experiência gamer" :
               "Convide seus squads e ganhe benefícios!"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => handleLanguageChange(lang.id)}
                      className="group relative overflow-hidden vibe-card p-6 flex flex-col items-center justify-center space-y-4 hover:neon-border transition-all active:scale-95 bg-white/5 border-white/10"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-vibe-neon-blue/0 to-vibe-neon-blue/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform group-hover:scale-110">{lang.flag}</span>
                      <span className="text-xs font-black text-white uppercase tracking-widest relative z-10">{lang.label}</span>
                    </button>
                  ))}
                  <div className="col-span-2 pt-4 flex justify-center">
                    <button 
                      type="button"
                      onClick={() => navigate('/')}
                      className="text-vibe-muted hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                </motion.div>
              ) : step === 1 ? (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div className="flex justify-center">
                       <div className="p-4 bg-vibe-neon-blue/10 rounded-full border border-vibe-neon-blue/20">
                          <Shield className="w-12 h-12 text-vibe-neon-blue" />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-center text-xl font-black text-white italic uppercase tracking-tighter">Regras da nossa Arena</h3>
                       <p className="text-center text-vibe-muted text-[11px] font-medium max-w-xs mx-auto">Para manter a Playzi segura para todos, siga estas diretrizes:</p>
                    </div>

                    <div className="space-y-3 bg-white/5 p-6 rounded-[32px] border border-white/10">
                      {[
                        { text: "Seja respeitoso: Proibido bullying ou ódio.", icon: Heart, color: "text-red-500" },
                        { text: "Autêntico: Use fotos reais, nada de fakes.", icon: Camera, color: "text-vibe-neon-blue" },
                        { text: "Segurança: 18+ apenas.", icon: Shield, color: "text-green-500" },
                        { text: "Diversão: Foco em games e novas amizades.", icon: Gamepad2, color: "text-vibe-neon-purple" }
                      ].map((rule, i) => (
                        <div key={rule.text} className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                           <div className={cn("p-2 rounded-xl bg-white/5", rule.color)}>
                              <rule.icon className="w-4 h-4" />
                           </div>
                           <p className="text-[11px] text-white font-bold tracking-tight">{rule.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col space-y-4">
                    <button 
                      type="button" 
                      onClick={() => setStep(2)}
                      className="w-full py-5 bg-vibe-neon-blue text-vibe-bg font-black rounded-2xl transition-all active:scale-[0.98] shadow-glow-blue uppercase tracking-widest text-[11px]"
                    >
                      Eu Concordo e Entendo
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(0)}
                      className="w-full py-2 text-vibe-muted hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Voltar
                    </button>
                  </div>
                </motion.div>
              ) : step === 2 ? (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-4 gap-4 max-h-64 overflow-y-auto no-scrollbar p-2">
                    {AVATARS_GALLERY.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({...formData, photoURL: url})}
                        className={cn(
                          "aspect-square rounded-[24px] overflow-hidden border-2 transition-all p-1 active:scale-90 group relative",
                          formData.photoURL === url ? "border-vibe-neon-blue bg-vibe-neon-blue/20 scale-110 z-10 shadow-glow-blue" : "border-white/5 bg-white/5 grayscale opacity-40 hover:opacity-100 hover:grayscale-0"
                        )}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover rounded-[18px]" />
                        {formData.photoURL === url && (
                          <div className="absolute top-1 right-1 bg-vibe-neon-blue rounded-full p-0.5 shadow-lg">
                            <Check className="w-2 h-2 text-vibe-bg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 flex flex-col space-y-4">
                    <button 
                      type="button" 
                      onClick={() => setStep(3)}
                      className="w-full py-5 bg-vibe-gradient text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-vibe-neon-blue/20 uppercase tracking-widest text-[11px]"
                    >
                      Visual Épico!
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="w-full py-2 text-vibe-muted hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Voltar
                    </button>
                  </div>
                </motion.div>
              ) : step === 3 ? (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 h-[480px] overflow-y-auto no-scrollbar pr-2"
                >
                  <div className="text-center space-y-1.5 mb-4">
                     <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Apresente-se!</h2>
                     <p className="text-slate-300 text-[11px] font-medium max-w-xs mx-auto">Preencha os detalhes para que o squad te conheça melhor</p>
                  </div>

                  {/* Nickname */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 flex items-center">
                       <UserIcon className="w-3.5 h-3.5 mr-2 text-vibe-neon-blue" />
                       Como quer ser chamado?
                    </label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-white/30 focus:border-vibe-neon-blue/60 focus:bg-white/15 outline-none transition-all shadow-inner"
                      placeholder="Ex: @ghost_killer"
                      value={formData.nickname}
                      onChange={e => setFormData({...formData, nickname: e.target.value})}
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 flex items-center">
                       <Sparkles className="w-3.5 h-3.5 mr-2 text-vibe-neon-purple" />
                       Sua Biografia
                    </label>
                    <textarea 
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white font-semibold placeholder:text-white/30 focus:border-vibe-neon-blue/60 focus:bg-white/15 outline-none transition-all resize-none h-24 shadow-inner"
                      placeholder="Sou fã de RPG e FPS, procurando um squad para jogar..."
                      value={formData.bio}
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                    />
                  </div>

                  {/* Birthday & Gender Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 flex items-center">
                         <Calendar className="w-3.5 h-3.5 mr-2 text-vibe-neon-blue" />
                         Nascimento
                      </label>
                      <div className="relative">
                        <input 
                          type="date"
                          style={{ colorScheme: 'dark' }}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-6 pr-10 text-white font-bold focus:border-vibe-neon-blue/60 focus:bg-white/15 outline-none transition-all"
                          value={formData.birthday}
                          onChange={e => setFormData({...formData, birthday: e.target.value})}
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 flex items-center">
                         <Filter className="w-3.5 h-3.5 mr-2 text-vibe-neon-purple" />
                         Gênero
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                         {[
                           { id: 'male', label: 'Masc' },
                           { id: 'female', label: 'Fem' },
                           { id: 'other', label: 'Outro' }
                         ].map(g => (
                           <button
                             key={g.id}
                             type="button"
                             onClick={() => setFormData({...formData, gender: g.id as any})}
                             className={cn(
                               "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                               formData.gender === g.id 
                                ? "bg-vibe-neon-purple border-vibe-neon-purple text-white shadow-glow-purple scale-105" 
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                             )}
                           >
                             {g.label}
                           </button>
                         ))}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 flex items-center">
                       <MapPin className="w-3.5 h-3.5 mr-2 text-vibe-neon-blue" />
                       Localização
                    </label>
                    <div className="relative">
                       <input 
                         type="text"
                         className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-6 text-white font-bold placeholder:text-white/30 focus:border-vibe-neon-blue/60 focus:bg-white/15 outline-none transition-all shadow-inner"
                         placeholder="Sua cidade (Ex: São Paulo, SP)"
                         value={citySearch}
                         onFocus={() => setShowSuggestions(true)}
                         onChange={e => {
                            setCitySearch(e.target.value);
                            setShowSuggestions(true);
                         }}
                       />
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {showSuggestions && citySearch.length > 1 && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-[#12082b] border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl animate-in fade-in slide-in-from-top-2">
                        {CITIES_MOCK.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map(city => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              const [cityName, state] = city.split(', ').map(s => s.trim());
                              setFormData({
                                ...formData,
                                location: { ...formData.location, city: cityName, state }
                              });
                              setCitySearch(city);
                              setShowSuggestions(false);
                            }}
                            className="w-full px-6 py-3 text-left text-xs font-bold text-white hover:bg-vibe-neon-blue/15 transition-colors border-b border-white/5 last:border-none"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interested In (Orientation) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 flex items-center">
                       <Heart className="w-3.5 h-3.5 mr-2 text-red-500" />
                       Tenho interesse em conhecer
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                       {[
                         { id: 'male', label: 'Homens' },
                         { id: 'female', label: 'Mulheres' },
                         { id: 'other', label: 'Todos' }
                       ].map(option => {
                         const isSelected = formData.interestedIn.includes(option.id as any);
                         return (
                           <button
                             key={option.id}
                             type="button"
                             onClick={() => {
                               const current = formData.interestedIn;
                               if (isSelected) {
                                 setFormData({...formData, interestedIn: current.filter(i => i !== option.id)});
                               } else {
                                 setFormData({...formData, interestedIn: [...current, option.id as any]});
                               }
                             }}
                             className={cn(
                               "py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                               isSelected 
                                ? "bg-vibe-neon-pink border-vibe-neon-pink text-white shadow-glow-pink scale-105" 
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                             )}
                           >
                             {option.label}
                           </button>
                         );
                       })}
                    </div>
                  </div>

                  {/* Relationship Status */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 flex items-center">
                       <Info className="w-3.5 h-3.5 mr-2 text-vibe-neon-blue" />
                       Status de Relacionamento
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                       {[
                         { id: 'single', label: 'Solteiro(a)' },
                         { id: 'searching', label: 'Buscando duo' },
                         { id: 'open', label: 'Aberto(a)' },
                         { id: 'dating', label: 'Namorando' },
                         { id: 'married', label: 'Casado(a)' }
                       ].map(option => {
                         const isSelected = formData.relationshipStatus === option.id;
                         return (
                           <button
                             key={option.id}
                             type="button"
                             onClick={() => setFormData({...formData, relationshipStatus: option.id as any})}
                             className={cn(
                               "px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
                               isSelected 
                                ? "bg-vibe-neon-blue border-vibe-neon-blue text-vibe-bg shadow-glow-blue scale-105" 
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                             )}
                           >
                             {option.label}
                           </button>
                         );
                       })}
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col space-y-3">
                    <button 
                      type="button" 
                      disabled={!formData.nickname || !formData.gender || !formData.birthday}
                      onClick={() => setStep(4)}
                      className="w-full py-5 bg-vibe-gradient text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-vibe-neon-blue/20 uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:cursor-not-allowed group flex items-center justify-center space-x-2"
                    >
                      <span>Quase lá</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(2)}
                      className="w-full py-2 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Voltar ao Avatar
                    </button>
                  </div>
                </motion.div>
              ) : step === 4 ? (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Seus Interesses</label>
                      <span className="text-[9px] font-black text-vibe-neon-blue uppercase px-2.5 py-1 bg-vibe-neon-blue/15 rounded-full">{formData.interests.length} Selecionados</span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto no-scrollbar pb-2">
                      {INTERESTS.map(item => {
                        const active = formData.interests.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleToggleInterest(item, 'interests')}
                            className={cn(
                              "px-4 py-2.5 rounded-full text-[10px] font-black transition-all border uppercase tracking-widest",
                              active
                                ? "bg-vibe-neon-blue border-vibe-neon-blue text-vibe-bg shadow-glow-blue scale-105"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                            )}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Jogos Favoritos</label>
                      <span className="text-[9px] font-black text-vibe-neon-purple uppercase px-2.5 py-1 bg-vibe-neon-purple/15 rounded-full">{formData.favoriteGames.length} Selecionados</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                      {GAMES.map(game => {
                        const active = formData.favoriteGames.includes(game);
                        return (
                          <button
                            key={game}
                            type="button"
                            onClick={() => handleToggleInterest(game, 'favoriteGames')}
                            className={cn(
                              "p-4 rounded-[24px] text-[10px] font-black transition-all border uppercase tracking-tighter text-left flex items-center justify-between group",
                              active
                                ? "bg-vibe-neon-purple/20 border-vibe-neon-purple text-vibe-neon-purple shadow-glow-purple-sm"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                            )}
                          >
                            <span>{game}</span>
                            <div className={cn(
                               "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                               active ? "bg-vibe-neon-purple border-vibe-neon-purple" : "bg-transparent border-white/20 group-hover:border-white/40"
                            )}>
                               {active && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <button 
                      type="button"
                      disabled={formData.interests.length < 2}
                      onClick={() => setStep(5)}
                      className="w-full py-5 bg-vibe-gradient text-white font-black rounded-2xl shadow-xl shadow-vibe-neon-blue/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] uppercase tracking-widest text-[11px] group"
                    >
                      <span>Continuar</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(3)}
                      className="w-full py-2 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Voltar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="step5"
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                       <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Tudo pronto!</h2>
                       <p className="text-slate-300 text-[11px] font-medium">Você já faz parte da maior arena gamer do Brasil.</p>
                    </div>

                    <div className="vibe-card bg-[#140b2e]/60 border-white/10 p-8 space-y-6 rounded-[40px] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Gift className="w-20 h-20 text-vibe-neon-purple rotate-12" />
                      </div>

                      <div className="flex items-center space-x-4 relative z-10">
                         <div className="w-14 h-14 bg-vibe-neon-purple/20 rounded-[22px] flex items-center justify-center shadow-glow-purple-sm">
                            <Users className="w-7 h-7 text-vibe-neon-purple" />
                         </div>
                         <div>
                            <h3 className="text-white font-black text-sm uppercase tracking-widest">Indique & Ganhe</h3>
                            <p className="text-slate-300 text-[9px] font-bold uppercase">Compartilhe e desbloqueie o Selo VIP</p>
                         </div>
                      </div>

                      <div className="bg-black/60 rounded-3xl p-5 border border-white/10 flex items-center justify-between gap-4 backdrop-blur-md">
                         <div className="flex-1">
                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">Seu Código Único</span>
                            <code className="text-vibe-neon-blue font-mono font-black text-xl tracking-wider">{formData.referralCode}</code>
                         </div>
                         <button 
                           type="button"
                           onClick={handleCopyLink}
                           className={cn(
                             "p-4 rounded-2xl transition-all active:scale-90",
                             copied ? "bg-green-500 text-white shadow-glow-green" : "bg-white/10 text-slate-300 hover:text-white border border-white/5"
                           )}
                         >
                           {copied ? <Check className="w-5 h-5 animate-in zoom-in" /> : <Copy className="w-5 h-5" />}
                         </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="p-1 bg-white/5 rounded-[32px] border border-white/5">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                          "w-full py-5 text-vibe-bg font-black rounded-[28px] flex items-center justify-center space-x-3 transition-all uppercase tracking-[0.2em] text-xs group",
                          isSubmitting 
                            ? "bg-vibe-neon-blue/40 cursor-not-allowed opacity-70" 
                            : "bg-vibe-neon-blue shadow-glow-blue active:scale-[0.98]"
                        )}
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-vibe-bg border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        )}
                        <span>{isSubmitting ? "Entrando na Arena..." : "Começar o Quiz!"}</span>
                      </button>
                    </div>
                    
                    <button 
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      className="w-full py-3 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors opacity-50 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                      Pular para o Início
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
