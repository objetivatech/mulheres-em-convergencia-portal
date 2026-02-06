import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  community_name?: string;
  city: string;
  state: string;
  logo_url: string;
  cover_image_url: string;
  slug: string;
  subscription_plan: string;
  views_count: number;
  reviews_count: number;
  average_rating: number;
}

interface BusinessShowcaseProps {
  title: string;
  subtitle?: string;
  featured?: boolean;
  className?: string;
}

const BusinessShowcase: React.FC<BusinessShowcaseProps> = ({ 
  title, 
  subtitle, 
  featured = false, 
  className = '' 
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const rpcName = featured ? 'get_featured_businesses' : 'get_random_businesses';
        const { data, error } = await supabase.rpc(rpcName, { limit_count: 5 });
        
        if (error) {
          console.error('Error fetching businesses:', error);
          return;
        }
        
        setBusinesses((data || []).map(b => ({ 
          ...b, 
          average_rating: Number(b.average_rating) || 0,
          views_count: 0,
          reviews_count: Number(b.reviews_count) || 0
        })));
      } catch (error) {
        console.error('Error fetching businesses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [featured]);

  if (loading) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">{title}</h2>
            {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return null;
  }

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {businesses.map((business) => (
            <Link 
              key={business.id} 
              to={`/diretorio/${business.slug}`}
              className="group block"
            >
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                {/* Business Image */}
                <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                  {business.cover_image_url || business.logo_url ? (
                    <img
                      src={business.cover_image_url || business.logo_url}
                      alt={business.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                      <span className="text-2xl font-bold text-primary">
                        {business.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Plan Badge */}
                  {featured && business.subscription_plan && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 bg-primary text-primary-foreground"
                    >
                      {business.subscription_plan === 'master' ? 'Master' : 'Premium'}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 flex-1 flex flex-col">
                  {/* Business Name */}
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {business.name}
                  </h3>
                  
                  {/* Category */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge variant="outline" className="w-fit text-xs">
                      {business.category}
                    </Badge>
                    {business.community_name && (
                      <Badge variant="default" className="w-fit text-xs bg-purple-600 hover:bg-purple-700">
                        {business.community_name}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Description */}
                  {business.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
                      {business.description}
                    </p>
                  )}
                  
                  {/* Location */}
                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{business.city}, {business.state}</span>
                  </div>
                  
                  {/* Metrics */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{business.views_count} visualizações</span>
                    <div className="flex items-center space-x-1">
                      <span>⭐ {Number(business.average_rating || 0).toFixed(1)}</span>
                      <span>({business.reviews_count})</span>
                    </div>
                  </div>
                  
                  {/* Visit Link */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Ver negócio</span>
                    <ExternalLink className="w-3 h-3 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        {/* View All Link */}
        <div className="text-center mt-8">
          <Link 
            to="/diretorio" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Ver todos os negócios
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BusinessShowcase;