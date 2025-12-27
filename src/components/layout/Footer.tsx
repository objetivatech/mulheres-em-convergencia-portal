import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import LogoComponent from './LogoComponent';
import { TagCloud } from '@/components/blog/TagCloud';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useFooterNavigation } from '@/hooks/useFooterNavigation';
import { getSocialIcon } from '@/lib/socialIconMap';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useSiteSettings();
  const { footerNavigation, footerLegal } = useFooterNavigation();

  // Fallback social links (mantém compatibilidade se não houver configurações)
  const defaultSocialLinks = [
    { name: 'Instagram', url: 'https://www.instagram.com/mulheresemconvergencia/' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/mulheres-em-convergencia/' },
    { name: 'Pinterest', url: 'https://br.pinterest.com/mulheresemconvergencia/' },
    { name: 'Facebook', url: 'https://www.facebook.com/mulheresemconvergencia/' },
  ];

  // Processa links de redes sociais das configurações
  const socialLinks = settings?.social_links 
    ? Object.entries(settings.social_links)
        .filter(([_, url]) => url && url.trim() !== '')
        .map(([network, url]) => ({
          name: network.charAt(0).toUpperCase() + network.slice(1),
          url: url as string,
        }))
    : defaultSocialLinks;

  const footerText = settings?.footer_text || `© ${currentYear} Mulheres em Convergência. Todos os direitos reservados.`;

  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <LogoComponent variant="horizontal" size="md" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Espaço criado para educar, conectar e impulsionar mulheres 
              por meio do empreendedorismo e do fortalecimento de redes de apoio,
              gerando impacto social, autonomia financeira e transformação de comunidades.
            </p>
          </div>

          {/* Links de Navegação - Agora dinâmicos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Navegação</h3>
            <nav className="flex flex-col space-y-2">
              {footerNavigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Redes Sociais e Tags */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Siga-nos</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = getSocialIcon(social.name);
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-background rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-tertiary transition-all duration-200"
                      aria-label={`Visite nosso ${social.name}`}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            </div>
            
            {/* Tag Cloud */}
            <TagCloud limit={12} />
          </div>
        </div>

        {/* Linha de Copyright */}
        <div className="border-t border-border mt-8 pt-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              {footerText}
            </p>
            <p className="text-muted-foreground text-sm flex items-center">
              Feito com <Heart size={16} className="mx-1 text-primary" /> para empoderar mulheres
            </p>
          </div>
          
          {/* Links Jurídicos - Agora dinâmicos */}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            {footerLegal.map((link, index) => (
              <span key={link.href} className="flex items-center">
                <Link
                  to={link.href}
                  className="hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
                {index < footerLegal.length - 1 && (
                  <span className="mx-2 text-border">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;