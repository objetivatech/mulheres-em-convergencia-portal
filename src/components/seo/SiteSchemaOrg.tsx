import { Helmet } from 'react-helmet-async';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

export const SiteSchemaOrg = () => {
  const baseUrl = PRODUCTION_DOMAIN;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Mulheres em Convergência",
        "description": "Espaço criado para educar, conectar e impulsionar mulheres por meio do empreendedorismo e do fortalecimento de redes de apoio",
        "publisher": { "@id": `${baseUrl}/#organization` },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${baseUrl}/convergindo?search={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Mulheres em Convergência",
        "alternateName": "MeC",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/assets/logo-horizontal.png`,
          "width": 400,
          "height": 100
        },
        "description": "Portal dedicado ao empoderamento e conexão de mulheres empreendedoras",
        "foundingDate": "2024",
        "sameAs": [
          "https://www.instagram.com/mulheresemconvergencia",
          "https://www.linkedin.com/company/mulheresemconvergencia",
          "https://www.facebook.com/mulheresemconvergencia"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "email": "juntas@mulheresemconvergencia.com.br",
          "url": `${baseUrl}/contato`
        }
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
