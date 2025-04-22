import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl, getOptimalImageUrls } from '../services/imageService';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  countryCode?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Компонент для отображения оптимизированных изображений
 * Автоматически использует наилучший формат (WebP или PNG) и кэширует результаты
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  countryCode,
  loading = 'lazy'
}) => {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Если задан код страны, используем оптимальные URL для разных форматов
    if (countryCode) {
      const baseUrl = src.substring(0, src.lastIndexOf('/'));
      const urls = getOptimalImageUrls(baseUrl, countryCode);
      
      if (isMounted) {
        setOptimizedSrc(urls.optimal);
        setIsLoading(false);
      }
      
      return;
    }

    // Иначе загружаем и оптимизируем изображение
    const optimizeImage = async () => {
      try {
        setIsLoading(true);
        const optimizedUrl = await getOptimizedImageUrl(src);
        
        if (isMounted) {
          setOptimizedSrc(optimizedUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Ошибка при оптимизации изображения:', err);
        
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    optimizeImage();

    return () => {
      isMounted = false;
    };
  }, [src, countryCode]);

  // Обработка ошибок загрузки изображения
  const handleImageError = () => {
    setError(true);
    // Если произошла ошибка при загрузке WebP, используем PNG
    if (optimizedSrc.endsWith('.webp')) {
      const pngUrl = optimizedSrc.replace('.webp', '.png');
      setOptimizedSrc(pngUrl);
    }
  };

  return (
    <img
      src={error ? src : optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s ease' }}
      onLoad={() => setIsLoading(false)}
      onError={handleImageError}
    />
  );
};

export default OptimizedImage; 