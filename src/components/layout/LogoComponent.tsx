import React from 'react';

interface LogoComponentProps {
  variant?: 'horizontal' | 'circular' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LogoComponent: React.FC<LogoComponentProps> = ({ 
  variant = 'horizontal', 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  // Temporário: logo em texto até as imagens serem adicionadas
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClasses[size]} flex items-center`}>
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          {variant !== 'circular' && (
            <div className="flex flex-col">
              <span className="text-secondary font-semibold text-lg leading-tight">
                Mulheres em
              </span>
              <span className="text-primary font-bold text-xl leading-tight">
                Convergência
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoComponent;