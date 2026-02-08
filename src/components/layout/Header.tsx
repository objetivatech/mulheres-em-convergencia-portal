import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { useAuth } from '@/hooks/useAuth';
import LogoComponent from './LogoComponent';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  active: boolean;
  children?: NavItem[];
}

interface MobileSubmenuProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  onItemClick: () => void;
}

function MobileSubmenu({ item, isActive, onItemClick }: MobileSubmenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <div className="flex items-center">
        <Link
          to={item.href}
          onClick={onItemClick}
          className={cn(
            "flex-1 px-3 py-2 text-base font-medium rounded-l-md transition-colors",
            isActive(item.href)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {item.label}
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-r-md transition-colors"
          )}
          aria-label="Expandir submenu"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-2">
          {item.children?.filter(child => child.active).map((child) => (
            <Link
              key={child.href}
              to={child.href}
              onClick={onItemClick}
              className={cn(
                "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive(child.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, isAdmin, canEditBlog, hasBusiness, isAmbassador } = useAuth();
  const location = useLocation();
  const { navigation, settings } = useSiteSettings();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-background shadow-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div>
            <Link to="/" className="flex items-center">
              <LogoComponent 
                variant="horizontal" 
                size="md" 
              />
            </Link>
          </div>

          {/* Desktop Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navigation.map((item) => (
                <NavigationMenuItem key={item.href || item.label}>
                  {item.children && item.children.length > 0 ? (
                    <>
                      <NavigationMenuTrigger 
                        className={cn(
                          "text-base font-medium bg-transparent gap-1",
                          isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                        )}
                        onClick={(e) => {
                          // Allow click on the text to navigate
                          const target = e.target as HTMLElement;
                          if (!target.closest('svg')) {
                            window.location.href = item.href;
                          }
                        }}
                      >
                        <Link 
                          to={item.href} 
                          className="hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.label}
                        </Link>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="left-0">
                        <ul className="grid w-52 gap-1 p-2">
                          {item.children.filter(child => child.active).map((child) => (
                            <li key={child.href}>
                              <NavigationMenuLink asChild>
                                <Link
                                  to={child.href}
                                  className={cn(
                                    "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                    isActive(child.href) ? 'bg-accent text-primary' : ''
                                  )}
                                >
                                  <span className="text-sm font-medium">{child.label}</span>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <Link to={item.href}>
                      <NavigationMenuLink className={cn(
                        navigationMenuTriggerStyle(),
                        "text-base font-medium bg-transparent",
                        isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {item.label}
                      </NavigationMenuLink>
                    </Link>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right side: Mobile Menu Button + User Menu */}
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border z-50 w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Painel Principal */}
                  <DropdownMenuItem asChild>
                    <Link to="/meu-dashboard" className="flex items-center">
                      <span>🏠 Meu Painel</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Meus Acessos - Condicionais por Role */}
                  {(hasBusiness || isAmbassador) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Meus Acessos
                      </DropdownMenuLabel>
                      {hasBusiness && (
                        <DropdownMenuItem asChild>
                          <Link to="/painel-empresa" className="flex items-center">
                            <span>💼 Painel Empresa</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isAmbassador && (
                        <DropdownMenuItem asChild>
                          <Link to="/painel/embaixadora" className="flex items-center">
                            <span>👑 Painel Embaixadora</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {/* Administração - Apenas para Admins */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Administração
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center font-medium">
                          <span>🛡️ Painel Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/entrar">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {navigation.map((item) => (
                <div key={item.href || item.label}>
                  {item.children && item.children.length > 0 ? (
                    <MobileSubmenu 
                      item={item} 
                      isActive={isActive} 
                      onItemClick={() => setIsMobileMenuOpen(false)} 
                    />
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "block px-3 py-2 text-base font-medium rounded-md transition-colors",
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};