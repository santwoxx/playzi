import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ShieldCheck, MessageCircle, ChevronRight, Sparkles } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { TOPIC_LANDINGS } from '../constants/topicLandings';

const SITE_URL = 'https://playzi.app.br';

export default function TopicLanding({ topic }: { topic: string }) {
  const { currentUser } = useAuth();
  const data = TOPIC_LANDINGS[topic];
  const url = `${SITE_URL}${data.path}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "name": data.h1,
        "description": data.description,
        "url": url,
        "inLanguage": "pt-BR",
        "isPartOf": { "@type": "WebSite", "name": "Playzi", "url": SITE_URL }
      },
      {
        "@type": "FAQPage",
        "mainEntity": data.faq.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": { "@type": "Answer", "text": item.a }
        }))
      }
    ]
  };

  // Signed-out visitors (and search engines) get the sign-in screen; members go straight to the feature
  const cta = (
    <Link
      to={currentUser ? data.appPath : '/'}
      className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-vibe-neon-blue text-vibe-bg font-black uppercase tracking-[0.15em] rounded-2xl shadow-glow-blue hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
    >
      <MessageCircle className="w-5 h-5" />
      <span>{currentUser ? data.appLabel : 'Entrar com Google e começar'}</span>
    </Link>
  );

  return (
    <div className="pt-20 pb-16 px-4 min-h-screen bg-vibe-bg gaming-grid">
      <SEO
        title={data.seoTitle}
        description={data.description}
        keywords={data.keywords}
        url={url}
        schema={schema}
        breadcrumbs={[
          { name: 'Playzi', url: '/' },
          { name: data.h1, url: data.path }
        ]}
      />

      <article className="max-w-3xl mx-auto space-y-14">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <span className="inline-flex items-center px-3 py-1 bg-vibe-neon-blue/10 border border-vibe-neon-blue/20 rounded-full text-xs font-black text-vibe-neon-blue uppercase tracking-[0.2em]">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            {data.badge}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-tight">
            {data.h1}
          </h1>
          <p className="text-base sm:text-lg text-vibe-muted leading-relaxed">{data.intro}</p>
          {data.adultsOnly && (
            <p className="flex items-start gap-3 p-4 rounded-2xl bg-vibe-neon-pink/10 border border-vibe-neon-pink/20 text-sm text-white/90">
              <ShieldCheck className="w-5 h-5 text-vibe-neon-pink shrink-0 mt-0.5" />
              <span>Exclusivo para maiores de 18 anos.</span>
            </p>
          )}
          {cta}
        </motion.header>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white tracking-tight">O que você encontra no Playzi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.features.map(feature => (
              <div key={feature.title} className="vibe-card p-5 border-white/5 space-y-2">
                <h3 className="text-base font-black text-white">{feature.title}</h3>
                <p className="text-sm text-vibe-muted leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white tracking-tight">Como começar</h2>
          <ol className="space-y-3">
            {data.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-4 text-sm text-white/85 leading-relaxed">
                <span className="w-7 h-7 shrink-0 rounded-full bg-vibe-neon-purple/20 text-vibe-neon-purple font-black flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white tracking-tight">{data.safetyTitle}</h2>
          <ul className="space-y-3">
            {data.safetyTips.map(tip => (
              <li key={tip} className="flex items-start gap-3 text-sm text-white/85 leading-relaxed">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <Link to="/diretrizes" className="inline-flex items-center gap-1 text-sm font-bold text-vibe-neon-blue hover:underline">
            Leia as diretrizes da comunidade
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white tracking-tight">Perguntas frequentes</h2>
          <div className="space-y-3">
            {data.faq.map(item => (
              <details key={item.q} className="vibe-card p-5 border-white/5 group">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-base font-bold text-white flex items-center justify-between gap-4">
                  {item.q}
                  <ChevronRight className="w-5 h-5 text-vibe-muted shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-vibe-muted leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="vibe-card p-8 border-vibe-neon-blue/30 text-center space-y-5">
          <h2 className="text-2xl font-black text-white tracking-tight">Pronto para começar?</h2>
          <p className="text-sm text-vibe-muted">É grátis: basta entrar com sua conta Google.</p>
          {cta}
        </section>

        <nav aria-label="Veja também" className="space-y-4">
          <h2 className="text-sm font-black text-vibe-muted uppercase tracking-[0.2em]">Veja também</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.related.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-vibe-neon-blue/30 text-sm font-bold text-white/80 hover:text-white transition-all"
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4 text-vibe-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </div>
  );
}
