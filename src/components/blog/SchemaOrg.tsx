import { Helmet } from 'react-helmet-async';

interface Author {
  full_name: string;
}

interface Category {
  name: string;
  slug: string;
}

interface Tag {
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  published_at: string;
  updated_at?: string;
  author: Author;
  category?: Category;
  tags?: Tag[];
}

interface SchemaOrgProps {
  post: BlogPost;
  baseUrl?: string;
}

export const SchemaOrg = ({ post, baseUrl = 'https://mulhereemconvergeencia.com.br' }: SchemaOrgProps) => {
  const postUrl = `${baseUrl}/convergindo/${post.slug}`;
  const authorName = post.author?.full_name || 'Mulheres em Convergência';
  
  // Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": postUrl,
    "headline": post.title,
    "description": post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 160),
    "image": post.featured_image_url ? [post.featured_image_url] : [`${baseUrl}/assets/logo-horizontal.png`],
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "Mulheres em Convergência",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/assets/logo-horizontal.png`,
        "width": 400,
        "height": 100
      },
      "url": baseUrl
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "articleSection": post.category?.name || "Blog",
    "keywords": post.tags?.map(tag => tag.name).join(', ') || "mulheres, empreendedorismo, convergência",
    "wordCount": post.content.replace(/<[^>]*>/g, '').split(' ').length,
    "url": postUrl,
    "isPartOf": {
      "@type": "Blog",
      "name": "Blog Convergindo",
      "url": `${baseUrl}/convergindo`
    }
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog Convergindo",
        "item": `${baseUrl}/convergindo`
      },
      ...(post.category ? [{
        "@type": "ListItem",
        "position": 3,
        "name": post.category.name,
        "item": `${baseUrl}/convergindo/categoria/${post.category.slug}`
      }] : []),
      {
        "@type": "ListItem",
        "position": post.category ? 4 : 3,
        "name": post.title,
        "item": postUrl
      }
    ]
  };

  // Organization Schema (for the site)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Mulheres em Convergência",
    "alternateName": "Portal Mulheres em Convergência",
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
      "https://www.instagram.com/mulhereemconvergencia",
      "https://www.linkedin.com/company/mulhereemconvergencia",
      "https://www.facebook.com/mulhereemconvergencia",
      "https://www.pinterest.com/mulhereemconvergencia"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "contato@mulhereemconvergeencia.com.br",
      "url": `${baseUrl}/contato`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/convergindo?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  // WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "url": baseUrl,
    "name": "Mulheres em Convergência",
    "description": "Portal dedicado ao empoderamento e conexão de mulheres empreendedoras",
    "publisher": {
      "@id": `${baseUrl}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/convergindo?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      websiteSchema,
      organizationSchema,
      articleSchema,
      breadcrumbSchema
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(combinedSchema)}
      </script>
    </Helmet>
  );
};