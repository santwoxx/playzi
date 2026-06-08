import React from 'react';
import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: any;
  locale?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  alternateLocales?: { lang: string; url: string }[];
}

const SITE_URL = 'https://playzi.app.br';
const DEFAULT_IMAGE = 'https://i.ibb.co/svpJKdbx/playsi-logo.png';

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  schema,
  locale = 'pt_BR',
  publishedTime,
  modifiedTime,
  noIndex = false,
  breadcrumbs,
  alternateLocales,
}) => {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : SITE_URL);
  const defaultKeywords = 'playzi, playsi, chat de video gamer, chat de video 1v1, grupos de jogos, encontrar amigos, jogar com amigos, comunidade gamer, matchmaking, squad free fire, roblox amigos, tinder gamer, app de relacionamento, bate papo amizade encontro, video chamada gratis, amizades online brasil';
  const fullTitle = title ? `${title} | Playzi` : 'Playzi - Chat de Video Gamer, Matchmaking e Squad Gratis';
  const fullDescription = description || 'Conheca pessoas novas na Playzi! O melhor app de socializacao gamer com chat de video 1v1, matchmaking e comunidades ativas. Encontre seu squad agora no Brasil.';
  const fullKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

  const defaultSchema: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Playzi",
    "operatingSystem": "Web, Android",
    "applicationCategory": "SocialNetworkingApplication",
    "applicationSubCategory": "GamingSocialNetwork",
    "description": fullDescription,
    "url": SITE_URL,
    "image": DEFAULT_IMAGE,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    }
  };

  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`
    }))
  } : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={fullKeywords} />
      <link rel="canonical" href={currentUrl} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      )}
      <html lang={locale === 'pt_BR' ? 'pt-BR' : locale?.split('_')[0] || 'pt'} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="Playzi" />
      <meta property="og:locale" content={locale} />
      {publishedTime && type === 'article' && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && type === 'article' && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {alternateLocales?.map((alt) => (
        <link
          key={alt.lang}
          rel="alternate"
          href={alt.url}
          hrefLang={alt.lang}
        />
      ))}

      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}

      {schema ? (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ) : (
        <script type="application/ld+json">
          {JSON.stringify(defaultSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
