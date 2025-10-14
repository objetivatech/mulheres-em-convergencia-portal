import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, Calendar, Instagram, Linkedin, Facebook } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  description: string;
  partnership_type?: string;
  start_date?: string;
  contact_email?: string;
  social_links?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  };
}

interface PartnerModalProps {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PartnerModal = ({ partner, open, onOpenChange }: PartnerModalProps) => {
  if (!partner) return null;

  const socialLinks = partner.social_links || {};
  const hasSocialLinks = socialLinks.instagram || socialLinks.linkedin || socialLinks.facebook;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <img
              src={partner.logo_url}
              alt={partner.name}
              className="w-20 h-20 object-contain rounded-lg border border-border"
            />
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{partner.name}</DialogTitle>
              {partner.partnership_type && (
                <Badge variant="secondary" className="mb-2">
                  {partner.partnership_type}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Descrição */}
          <div>
            <h4 className="font-semibold mb-2">Sobre a Parceria</h4>
            <p className="text-muted-foreground leading-relaxed">
              {partner.description}
            </p>
          </div>

          {/* Data de início */}
          {partner.start_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Parceiros desde {format(new Date(partner.start_date), "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          )}

          {/* Links e contatos */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {partner.website_url && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visitar Site
                </a>
              </Button>
            )}

            {partner.contact_email && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={`mailto:${partner.contact_email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Entrar em Contato
                </a>
              </Button>
            )}
          </div>

          {/* Redes sociais */}
          {hasSocialLinks && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Redes Sociais</h4>
              <div className="flex gap-2">
                {socialLinks.instagram && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {socialLinks.linkedin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {socialLinks.facebook && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook className="w-5 h-5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
