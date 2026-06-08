import React from 'react';
import { Link } from 'react-router-dom';

export default function SEOFooter() {
  return (
    <footer className="w-full bg-vibe-bg border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <Link to="/" className="text-white font-black uppercase italic tracking-tighter text-xl hover:text-vibe-neon-blue transition-colors">Playzi</Link>
          <p className="text-vibe-muted text-xs leading-relaxed max-w-xs">
            A rede social definitiva para conhecer pessoas novas e gamers apaixonados. Chat de video 1v1, encontros, matchmaking e as melhores comunidades de jogos do Brasil.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
            <Link to="/blog" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Blog</Link>
            <Link to="/diretrizes" className="text-[10px] font-black text-vibe-neon-blue hover:text-vibe-neon-blue uppercase tracking-widest transition-colors shadow-glow-blue-sm px-2 py-0.5 border border-vibe-neon-blue/20 rounded">Regras</Link>
            <Link to="/privacy" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Privacidade</Link>
            <Link to="/terms" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-purple uppercase tracking-widest transition-colors">Termos</Link>
            <Link to="/arcade" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Arcade</Link>
            <Link to="/rankings" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Rankings</Link>
            <Link to="/encontros" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-pink uppercase tracking-widest transition-colors">Encontros</Link>
            <Link to="/jogar-agora" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-purple uppercase tracking-widest transition-colors">Jogar Agora</Link>
            <Link to="/comunidades/freefire" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Free Fire</Link>
            <Link to="/comunidades/roblox" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Roblox</Link>
            <Link to="/comunidades/minecraft" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Minecraft</Link>
            <Link to="/chat/global" className="text-[10px] font-black text-vibe-muted hover:text-vibe-neon-blue uppercase tracking-widest transition-colors">Chat Global</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-white font-bold uppercase text-[10px] tracking-[0.3em]">Navegue</h4>
          <ul className="space-y-2">
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Chat de Video 1v1 Gratis</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Alternativa Gamer ao Omegle e OmeTV</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Encontros e Namoro Gamer</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Comunidades de Free Fire e Roblox</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Matchmaking para Amizades Online</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Arcade de Mini-Games Online</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Watch Party: Assista Videos com Amigos</li>
            <li className="text-xs text-vibe-muted font-medium hover:text-white transition-colors cursor-default">Ranking Global de Gamers</li>
          </ul>
        </div>

        <div className="space-y-4 font-mono">
          <h4 className="text-white font-bold uppercase text-[10px] tracking-[0.3em]">SEO Tags</h4>
          <div className="flex flex-wrap gap-2">
            {[
              'chat de video', 'conhecer pessoas', 'badoo', 'meetme', 'tinder gamer',
              'ometv', 'videochamada', 'matchmaking', 'free fire squads',
              'grupos de jogos', 'encontrar amigos', 'jogar com amigos', 'comunidade gamer',
              'tinder gratis', 'rave assistir juntos', 'litmatch app',
              'bate papo amizade', 'duo free fire', 'squad roblox', 'minecraft amigos',
              'video chat gratis', 'namoro online', 'app de relacionamento'
            ].map(tag => (
              <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-vibe-muted uppercase tracking-tighter">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-[9px] text-vibe-muted/50 pt-4 leading-tight">
            &copy; 2026 Playzi Network. Experimente videochamadas gratuitas com qualidade HD no Brasil e no mundo.
          </p>
        </div>

        <div className="col-span-full border-t border-white/5 pt-8 text-vibe-muted text-[11px] leading-relaxed space-y-4">
          <p>
            Procurando por <strong>como encontrar squad no Free Fire</strong>, <strong>amigos para jogar Roblox</strong> ou um <strong>app de relacionamento para gamers</strong>? A Playzi e o ambiente perfeito para socializar e encontrar seu squad de forma segura! Muito melhor que grupos de WhatsApp sem moderacao, aqui voce tem salas de chat de video 1v1, comunidades ativas de jogos e total protecao de dados. Conecte-se com pessoas reais no Brasil em um hub interativo e seguro.
          </p>
          <p>
            Quer um <strong>aplicativo de namoro gamer</strong> estilo Tinder, Bate papo de namoro ou Amizade? A Playzi une o melhor dos apps de relacionamento com o universo dos games. Encontre parceiros romanticos ou de equipe que jogam Free Fire, Roblox, League of Legends e Minecraft. Deslize para a direita pelo amor ao jogo e marque encontros e bate-papos incriveis!
          </p>
          <p>
            Gosta do app <strong>Rave - Assistir Juntos</strong> para maratonar filmes ou assistir a videos com amigos? Na Playzi voce pode interagir em tempo real no Chat Global e nas comunidades, compartilhando suas experiencias com o squad em sintonia perfeita. A melhor alternativa ao Rave para gamers brasileiros.
          </p>
          <p>
            Se voce curte o <strong>Litmatch</strong> para criar salas de voz e compartilhar seus pensamentos, a nossa plataforma oferece uma arena social segura, interativa e divertida para voce se expressar e ser ouvido por novos amigos do Brasil inteiro. Playzi e a evolucao do Litmatch para a comunidade gamer.
          </p>
          <p>
            Voces e um <strong>casal procurando apps para assistir juntos</strong> ou quer <strong>encontrar um duo para rankeada</strong>? A Playzi tem watch party integrado, matchmaking inteligente e video chamadas 1v1. Tudo que voce precisa em um unico lugar. Junte-se a mais de 10 mil gamers ativos!
          </p>
        </div>
      </div>
    </footer>
  );
}
