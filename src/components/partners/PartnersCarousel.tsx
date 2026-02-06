import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { PartnerModal } from './PartnerModal';
import type { Database } from '@/integrations/supabase/types';

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

interface PartnersCarouselProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export const PartnersCarousel = ({ 
  title = "Nossos Parceiros",
  subtitle,
  className = ""
}: PartnersCarouselProps) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredPartnerId, setHoveredPartnerId] = useState<string | null>(null);

  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: 2500, stopOnInteraction: false, stopOnMouseEnter: true }),
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: true },
    [autoplayPlugin]
  );

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners' as any)
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPartners((data as any) || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-8">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-24"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (partners.length === 0) {
    return null;
  }

  return (
    <>
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {partners.map((partner) => {
                const isHovered = hoveredPartnerId === partner.id;
                const isSelected = selectedPartner?.id === partner.id;
                const isActive = isHovered || isSelected;
                
                return (
                  <div
                    key={partner.id}
                    className="flex-[0_0_28%] sm:flex-[0_0_22%] md:flex-[0_0_16%] lg:flex-[0_0_12%] min-w-0"
                  >
                    <button
                      onClick={() => handlePartnerClick(partner)}
                      onMouseEnter={() => setHoveredPartnerId(partner.id)}
                      onMouseLeave={() => setHoveredPartnerId(null)}
                      className="w-full h-20 md:h-24 bg-card border border-border rounded-lg p-3 md:p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className={`w-full h-full object-contain transition-all duration-300 ${
                          isActive ? '' : 'grayscale opacity-70'
                        }`}
                        loading="lazy"
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Clique em um logo para saber mais sobre a parceria
          </p>
        </div>
      </section>

      <PartnerModal
        partner={selectedPartner}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};
