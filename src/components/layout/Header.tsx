import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Linkedin, Facebook, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import LogoComponent from './LogoComponent';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, isAdmin, canEditBlog, hasBusiness } = useAuth();
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

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-base font-medium transition-colors hover:text-primary ${
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
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
                  {hasBusiness && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Meus Acessos
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard-empresa" className="flex items-center">
                          <span>💼 Dashboard Empresa</span>
                        </Link>
                      </DropdownMenuItem>
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
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};