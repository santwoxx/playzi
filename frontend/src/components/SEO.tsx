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
  // Canonical without query string or hash, so ?ref=... links don't look like separate pages
  const currentUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : SITE_URL);
  const defaultKeywords = 'playzi, chat ao vivo, conhecer pessoas, fazer amizades online, app de relacionamento, comunidade gamer';
  const fullTitle = title ? `${title} | Playzi` : 'Playzi | Chat ao vivo para conhecer pessoas e fazer amizades';
  const fullDescription = description || 'Converse ao vivo, conheça pessoas novas e faça amizades que curtem os mesmos jogos e interesses que você. Encontros para maiores de 18. Grátis.';
  // Page keywords replace the defaults (search engines ignore long keyword lists or treat them as spam)
  const fullKeywords = keywords || defaultKeywords;

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
