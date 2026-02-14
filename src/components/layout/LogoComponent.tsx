
import React, { useMemo, useState } from 'react';
import logoHorizontalLocal from '@/assets/logo-horizontal.png';
import logoCircularLocal from '@/assets/logo-circular.png';
import logoVerticalLocal from '@/assets/logo-vertical.png';

interface LogoComponentProps {
  variant?: 'horizontal' | 'circular' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
};

const LogoComponent: React.FC<LogoComponentProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = ''
}) => {
  const [useFallback, setUseFallback] = useState<{ [k in 'horizontal' | 'circular' | 'vertical']?: boolean }>({});

  const { src, alt } = useMemo(() => {
    const mapping = {
      horizontal: {
        local: logoHorizontalLocal,
        alt: 'Mulheres em Convergência - Logo horizontal',
      },
      circular: {
        local: logoCircularLocal,
        alt: 'Mulheres em Convergência - Símbolo',
      },
      vertical: {
        local: logoVerticalLocal,
        alt: 'Mulheres em Convergência - Logo vertical',
      },
    } as const;

    const item = mapping[variant];
    // Always use local assets for logos — they're small and bundled with the app
    return {
      src: item.local,
      alt: item.alt,
    };
  }, [variant]);

  const sizeClass = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} w-auto object-contain`}
        loading="lazy"
      />
    </div>
  );
};

export default LogoComponent;
