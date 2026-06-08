import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: any;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords,
  image = 'https://i.ibb.co/svpJKdbx/playsi-logo.png', 
  url, 
  type = 'website',
  schema
}) => {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://playzi.app.br/');
  const defaultKeywords = 'playzi, playsi, chat de vídeo gamer, chat de vídeo 1v1, grupos de jogos, encontrar amigos, jogar com amigos, comunidade gamer, badoo gamer, tinder gamer, matchmaking brasil, squad free fire, roblox amigos, tinder brasil, tinder gratis, tinder login, tinder app de relacionamento, bate papo amizade encontro, rave assistir juntos, rave watch party, litmatch fazer nova amizade, litmatch app, grupos de +18 whatsapp, links de grupos ativos 2025, grupo de putaria whatsapp, grupos telegram adulto, telegrupos +18';
  const fullTitle = title ? `${title} | Playzi` : 'Playzi - Chat de Vídeo 1v1, Encontro Gamer e Comunidade';
  const fullDescription = description || 'Conheça pessoas novas na Playzi! O melhor app de socialização gamer com chat de vídeo 1v1, matchmaking e comunidades ativas. Encontre seu squad agora no Brasil.';
  const fullKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

  // Global default schema for Organization
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Playzi",
    "operatingSystem": "Web, Android, iOS",
    "applicationCategory": "SocialNetworkingApplication",
    "description": "Rede social definitiva para gamers apaixonados. Chat de vídeo 1v1 e matchmaking.",
    "url": "https://playzi.app.br/",
    "image": "https://i.ibb.co/svpJKdbx/playsi-logo.png",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    }
  };

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={fullKeywords} />
      <link rel="canonical" href={currentUrl} />
      <meta name="robots" content="index, follow" />
      <html lang="pt-BR" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Playzi" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schema || defaultSchema)}
      </script>
    </Helmet>
  );
};

export default SEO;
