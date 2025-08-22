import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Instagram, Linkedin, Facebook, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// Pinterest icon component (since it's not in lucide-react)
const PinterestIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.484c0-1.391.806-2.428 1.81-2.428.853 0 1.265.641 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.807 1.481 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.744 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.334.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.967-.527-2.292-1.226l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
  </svg>
);

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, isAdmin, canEditBlog } = useAuth();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Sobre', href: '/sobre' },
    { name: 'Convergindo', href: '/convergindo' },
    { name: 'Contato', href: '/contato' },
  ];

  const socialLinks = [
    { name: 'Instagram', href: 'https://www.instagram.com/mulheresemconvergencia/', icon: Instagram },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/mulheres-em-convergencia/', icon: Linkedin },
    { name: 'Pinterest', href: 'https://br.pinterest.com/mulheresemconvergencia/', icon: PinterestIcon },
    { name: 'Facebook', href: 'https://www.facebook.com/mulheresemconvergencia/', icon: Facebook },
  ];

  return (
    <header className="bg-background shadow-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="w-48 h-12 bg-tertiary rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-lg">MEC</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Social Links & User Menu */}
          <div className="flex items-center space-x-4">
            {/* Social Links - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
            
            {/* Divider */}
            <div className="h-6 w-px bg-border hidden md:block" />
            
            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Olá, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  {(isAdmin || canEditBlog) && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={signOut}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-foreground hover:text-primary transition-colors font-medium px-2 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            
            {/* Mobile User Menu */}
            <div className="mt-4 pt-4 border-t border-border">
              {user ? (
                <div className="flex flex-col space-y-3">
                  <span className="text-sm text-muted-foreground px-2">
                    Olá, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <div className="flex items-center space-x-2">
                    {(isAdmin || canEditBlog) && (
                      <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm">
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="mx-2">
                    <User className="h-4 w-4 mr-2" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Mobile Social Links */}
            <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-border">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;