import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Dices, GraduationCap, Brain, Target, Swords, Image, Globe, Award, Sparkles, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface NewsItem {
  id: number;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: 'blue' | 'pink' | 'purple' | 'yellow';
  badges?: string[];
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    title: "Seu Progresso",
    desc: "Vitórias: 5 | Selo Streak: Ativo | 150 Tickets",
    icon: <Trophy className="w-5 h-5" />,
    color: 'yellow',
    badges: ['Stats']
  },
  {
    id: 2,
    title: "Tryhard Academy",
    desc: "Entre na academia dos pro-players e domine o cenário. (+100 XP)",
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'blue',
    badges: ['Solo', 'Online']
  },
  {
    id: 3,
    title: "Gamer Quiz",
    desc: "Teste seus conhecimentos sobre o mundo dos games. (+50 XP)",
    icon: <Brain className="w-5 h-5" />,
    color: 'purple',
    badges: ['1-4 Players']
  },
  {
    id: 4,
    title: "Desafio Reflexo",
    desc: "Quem é o mais rápido no gatilho? (+75 XP)",
    icon: <Zap className="w-5 h-5" />,
    color: 'pink',
    badges: ['Duelo 1v1']
  },
  {
    id: 5,
    title: "Jokenpô Neo",
    desc: "Pedra, papel ou tesoura em tempo real. (+30 XP)",
    icon: <Swords className="w-5 h-5" />,
    color: 'blue',
    badges: ['Duelo 1v1']
  },
  {
    id: 6,
    title: "Adivinhe o Jogo",
    desc: "Descubra qual é o jogo pela imagem pixelada. (+40 XP)",
    icon: <Image className="w-5 h-5" />,
    color: 'purple',
    badges: ['Solo', 'Co-op']
  },
  {
    id: 7,
    title: "Chat Global",
    desc: "Converse com todos os jogadores em tempo real.",
    icon: <Globe className="w-5 h-5" />,
    color: 'blue',
    badges: ['Social Hub']
  },
  {
    id: 8,
    title: "Torneio de Reflexo",
    desc: "Prêmio: 5,000 Moedas + Medalha Pro. Participe já!",
    icon: <Award className="w-5 h-5" />,
    color: 'yellow',
    badges: ['48 Inscritos']
  }
];

// AnnouncementTicker was disabled to avoid excessive on-screen notifications/popups.
export default function AnnouncementTicker() {
  return null;
}

