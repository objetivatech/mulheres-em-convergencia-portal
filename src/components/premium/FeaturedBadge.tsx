import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap } from 'lucide-react';

interface FeaturedBadgeProps {
  type: 'featured_listing' | 'premium_badge' | 'homepage_spotlight';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FeaturedBadge: React.FC<FeaturedBadgeProps> = ({ type, size = 'md', className = '' }) => {
  const badgeConfig = {
    featured_listing: {
      icon: Star,
      label: 'Destaque',
      className: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
    },
    premium_badge: {
      icon: Zap,
      label: 'Premium',
      className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
    },
    homepage_spotlight: {
      icon: Crown,
      label: 'Spotlight',
      className: 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
    }
  };

  const config = badgeConfig[type];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      className={`
        flex items-center space-x-1 font-semibold shadow-lg
        ${config.className} 
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </Badge>
  );
};

export default FeaturedBadge;