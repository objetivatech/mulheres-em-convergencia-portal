
import React, { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

const getStoragePublicUrl = (path: string) => {
  const { data } = supabase.storage.from('branding').getPublicUrl(path);
  return data.publicUrl;
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
        storage: getStoragePublicUrl('logo-horizontal.png'),
        local: logoHorizontalLocal,
        alt: 'Mulheres em Convergência - Logo horizontal',
      },
      circular: {
        storage: getStoragePublicUrl('logo-circular.png'),
        local: logoCircularLocal,
        alt: 'Mulheres em Convergência - Símbolo',
      },
      vertical: {
        storage: getStoragePublicUrl('logo-vertical.png'),
        local: logoVerticalLocal,
        alt: 'Mulheres em Convergência - Logo vertical',
      },
    } as const;

    const item = mapping[variant];
    const shouldFallback = useFallback[variant];
    return {
      src: shouldFallback ? item.local : item.storage,
      alt: item.alt,
    };
  }, [variant, useFallback]);

  const onError = () => {
    // Se a imagem do Storage não existir, cai para o arquivo local do projeto
    setUseFallback(prev => ({ ...prev, [variant]: true }));
  };

  // Aplica tamanho de altura e mantém proporção
  const sizeClass = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={src}
        alt={alt}
        onError={onError}
        className={`${sizeClass} w-auto object-contain`}
        loading="lazy"
      />
    </div>
  );
};

export default LogoComponent;
