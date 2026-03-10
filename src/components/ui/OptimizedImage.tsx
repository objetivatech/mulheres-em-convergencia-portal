import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Set to true for above-the-fold images to use eager loading and high fetchpriority */
  priority?: boolean;
  /** Additional responsive sizes for srcset (e.g., [400, 800, 1200]) */
  responsiveSizes?: number[];
  /** The sizes attribute for responsive images */
  sizes?: string;
  fallbackSrc?: string;
}

/**
 * Performance-optimized image component.
 * - Adds explicit width/height to prevent CLS
 * - Uses loading="lazy" by default, eager for priority images
 * - Supports fetchpriority for LCP images
 * - Provides error fallback
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  responsiveSizes,
  sizes,
  fallbackSrc,
  className = '',
  style,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  const imgSrc = hasError && fallbackSrc ? fallbackSrc : src;

  // Build srcset from R2/external URLs that support width params
  const srcSet = responsiveSizes && !hasError
    ? responsiveSizes
        .map(w => {
          // For URLs with query params, append width
          const separator = src.includes('?') ? '&' : '?';
          return `${src}${separator}w=${w} ${w}w`;
        })
        .join(', ')
    : undefined;

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      {...(priority ? { fetchPriority: 'high' } as any : {})}
      srcSet={srcSet}
      sizes={sizes}
      className={className}
      style={style}
      onError={() => {
        if (!hasError && fallbackSrc) {
          setHasError(true);
        }
      }}
      {...rest}
    />
  );
};

export default OptimizedImage;
