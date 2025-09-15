
import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Facebook, Heart } from 'lucide-react';
import LogoComponent from './LogoComponent';
import { TagCloud } from '@/components/blog/TagCloud';

// Pinterest icon component (since it's not in lucide-react)
const PinterestIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.484c0-1.391.806-2.428 1.81-2.428.853 0 1.265.641 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.807 1.481 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.744 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.334.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.967-.527-2.292-1.226l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Instagram', href: 'https://www.instagram.com/mulheresemconvergencia/', icon: Instagram },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/mulheres-em-convergencia/', icon: Linkedin },
    { name: 'Pinterest', href: 'https://br.pinterest.com/mulheresemconvergencia/', icon: PinterestIcon },
    { name: 'Facebook', href: 'https://www.facebook.com/mulheresemconvergencia/', icon: Facebook },
  ];

  const footerNavigation = [
    { name: 'Sobre', href: '/sobre' },
    { name: 'Convergindo', href: '/convergindo' },
    { name: 'Contato', href: '/contato' },
  ];

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

          {/* Links de Navegação */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Navegação</h3>
            <nav className="flex flex-col space-y-2">
              {footerNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  {item.name}
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
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-background rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-tertiary transition-all duration-200"
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
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-muted-foreground text-sm">
            © {currentYear} Mulheres em Convergência. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground text-sm flex items-center mt-2 md:mt-0">
            Feito com <Heart size={16} className="mx-1 text-primary" /> para empoderar mulheres
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
