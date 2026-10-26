import React from 'react';
import { Link } from 'react-router-dom';

// Only pages search engines can read (everything inside the app needs a login)
const FOOTER_SECTIONS = [
  {
    title: 'Conheça',
    links: [
      { to: '/chat-ao-vivo', label: 'Chat ao vivo' },
      { to: '/assistir-juntos', label: 'Assistir vídeos juntos' },
      { to: '/conhecer-pessoas', label: 'Conhecer pessoas' },
      { to: '/relacionamento', label: 'Relacionamento (18+)' },
      { to: '/communities', label: 'Comunidades' }
    ]
  },
  {
    title: 'Comunidades de games',
    links: [
      { to: '/comunidades/freefire', label: 'Free Fire' },
      { to: '/comunidades/minecraft', label: 'Minecraft' },
      { to: '/comunidades/gta', label: 'GTA V e RP' },
      { to: '/arcade', label: 'Arcade de mini-games' }
    ]
  },
  {
    title: 'Playzi',
    links: [
      { to: '/blog', label: 'Blog' },
      { to: '/diretrizes', label: 'Diretrizes da comunidade' },
      { to: '/privacy', label: 'Privacidade' },
      { to: '/terms', label: 'Termos de uso' }
    ]
  }
];

export default function SEOFooter() {
  return (
    <footer className="w-full bg-vibe-bg border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4">
          <Link to="/" className="text-white font-black uppercase italic tracking-tighter text-xl hover:text-vibe-neon-blue transition-colors">Playzi</Link>
          <p className="text-vibe-muted text-xs leading-relaxed max-w-xs">
            Rede social gratuita para conversar ao vivo, conhecer pessoas novas e fazer amizades com quem curte os mesmos jogos e interesses que você.
          </p>
        </div>

        {FOOTER_SECTIONS.map(section => (
          <nav key={section.title} aria-label={section.title} className="space-y-4">
            <h4 className="text-white font-bold uppercase text-[10px] tracking-[0.3em]">{section.title}</h4>
            <ul className="space-y-2">
              {section.links.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs text-vibe-muted font-medium hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-full border-t border-white/5 pt-8 text-vibe-muted text-xs leading-relaxed space-y-4">
          <p>
            Procurando um <strong>chat ao vivo</strong> para conversar, um app para <strong>fazer amizades online</strong> ou
            uma forma de <strong>conhecer pessoas novas</strong>? No Playzi você conversa em tempo real no chat global e nas
            salas das comunidades, encontra gente com jogos e interesses em comum, continua o papo no privado e pode
            até <strong>assistir vídeos do YouTube juntos</strong> no Playzi Sync. Para maiores
            de 18 anos, o Encontros é o espaço de quem procura um <strong>relacionamento</strong>: você curte perfis, dá match
            e conversa no seu ritmo.
          </p>
          <p>&copy; 2026 Playzi. Grátis no navegador do celular e do computador.</p>
        </div>
      </div>
    </footer>
  );
}
