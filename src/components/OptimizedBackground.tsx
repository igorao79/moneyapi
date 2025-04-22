import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../services/imageService';

interface OptimizedBackgroundProps {
  url: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Компонент для отображения оптимизированного фонового изображения
 * Автоматически использует WebP, если поддерживается, иначе PNG
 */
const OptimizedBackground: React.FC<OptimizedBackgroundProps> = ({
  url,
  className,
  style
}) => {
  const [optimizedUrl, setOptimizedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const optimizeImage = async () => {
      if (!url) return;
      
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Используем сервис оптимизации изображений, который автоматически
        // выбирает между WebP и PNG в зависимости от поддержки браузера
        const optimized = await getOptimizedImageUrl(url);
        
        if (isMounted) {
          setOptimizedUrl(optimized);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Ошибка при оптимизации фонового изображения:', err);
        
        if (isMounted) {
          setHasError(true);
          setOptimizedUrl(url); // Используем исходный URL в случае ошибки
          setIsLoading(false);
        }
      }
    };

    optimizeImage();

    return () => {
      isMounted = false;
    };
  }, [url]);

  // Если произошла ошибка с WebP форматом, переключаемся на PNG
  useEffect(() => {
    if (hasError && optimizedUrl && optimizedUrl.endsWith('.webp')) {
      const pngUrl = optimizedUrl.replace('.webp', '.png');
      setOptimizedUrl(pngUrl);
    }
  }, [hasError, optimizedUrl]);

  return (
    <div
      className={className}
      style={{
        ...style,
        backgroundImage: `url(${optimizedUrl || url})`,
        opacity: isLoading ? 0 : style?.opacity || 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
};

export default OptimizedBackground; 