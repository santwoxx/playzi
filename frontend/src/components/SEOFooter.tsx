import React from 'react';
import { Link } from 'react-router-dom';

export default function SEOFooter() {
  return (
    <footer className="w-full bg-vibe-bg border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">Playzi</h3>
          <p className="text-vibe-muted text-xs leading-relaxed max-w-xs">
            A rede social definitiva para conhecer pessoas novas e gamers apaixonados. Chat de vídeo 1v1, encontros, matchmaking e as melhores comunidades de jogos do Brasil.
          </p>
          <div className="flex space-x-4 pt-2">
            <Link to="/blog" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Blog</Link>
            <Link to="/diretrizes" className="text-[10px] font-black text-vibe-neon-blue hover:text-vibe-neon-blue uppercase tracking-widest transition-colors shadow-glow-blue-sm px-2 py-0.5 border border-vibe-neon-blue/20 rounded">Regras</Link>
            <Link to="/privacy" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Privacidade</Link>
            <Link to="/terms" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-purple uppercase tracking-widest transition-colors">Termos</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-white font-bold uppercase text-[10px] tracking-[0.3em]">O que somos</h4>
          <ul className="space-y-2">
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Chat de Vídeo 1v1 Grátis</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Alternativa Gamer ao Omegle</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Encontros e Namoro Gamer</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Comunidades de Free Fire e Roblox</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Matchmaking para Amizades Online</li>
          </ul>
        </div>

        <div className="space-y-4 font-mono">
          <h4 className="text-white font-bold uppercase text-[10px] tracking-[0.3em]">SEO Tags</h4>
          <div className="flex flex-wrap gap-2">
            {[
              'chat de video', 'conhecer pessoas', 'badoo', 'meetme', 'tinder gamer', 
              'ometv', 'videochamada', 'matchmaking', 'free fire squads', 
              'grupos de jogos', 'encontrar amigos', 'jogar com amigos', 'comunidade gamer',
              'grupos de +18 whatsapp', 'links ativos 2025', 'grupo de putaria whatsapp',
              'grupos telegram adulto', 'telegrupos', 'tinder grátis', 'rave assistir juntos',
              'litmatch app amizade', 'bate papo amizade encontro'
            ].map(tag => (
              <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-vibe-muted uppercase tracking-tighter">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-[9px] text-vibe-muted/50 pt-4 leading-tight">
            © 2026 Playzi Network. Experimente videochamadas gratuitas distribuídas de forma segura com qualidade HD no Brasil e no mundo.
          </p>
        </div>

        <div className="col-span-full border-t border-white/5 pt-8 text-vibe-muted text-[11px] leading-relaxed space-y-4">
          <p>
            Procurando por <strong>Links de Grupos de WhatsApp +18 Ativos 2025</strong>, <strong>Grupos de Telegram Adulto</strong> ou links de grupo de putaria? A Playzi é o ambiente perfeito para socializar e encontrar seu squad de forma segura! Muito melhor que grupos de WhatsApp e canais de Telegram sem moderação, aqui você tem salas de chat de vídeo 1v1, comunidades ativas de games e total proteção de dados. Conecte-se com pessoas reais no Brasil em um hub interativo e seguro.
          </p>
          <p>
            Quer um aplicativo de namoro para gamers estilo <strong>Tinder</strong>, Tinder Gold, Bate papo de namoro ou Amizade? A Playzi une o melhor de apps de relacionamento com o universo dos games. Encontre parceiros românticos ou de equipe que jogam Free Fire, Roblox, League of Legends e Minecraft. Deslize para a direita pelo amor ao jogo e marque encontros e bate-papo incríveis!
          </p>
          <p>
            Gosta do app <strong>Rave - Assistir Juntos</strong> para maratonar filmes, assistir a vídeos com amigos ou lives de campeonatos gamer de longe? Na Playzi você pode interagir em tempo real no Chat Global e nas comunidades, compartilhando suas experiências com o squad em sintonia perfeita.
          </p>
          <p>
            Se você curte o <strong>Litmatch - Faça nova amizade</strong> ou o Litmatch Lite para criar salas de voz e compartilhar seus pensamentos de forma segura e acolhedora, a nossa plataforma oferece uma arena social segura, interativa e divertida para você se expressar e ser ouvido por novos amigos do Brasil inteiro.
          </p>
        </div>
      </div>
    </footer>
  );
}
