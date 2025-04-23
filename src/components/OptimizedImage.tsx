import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { getOptimizedImageUrl } from '../services/imageService';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  countryCode?: string;
  loading?: 'lazy' | 'eager';
}

// Глобальный кэш для хранения состояния загрузки изображений
const globalImageCache: Record<string, { loaded: boolean; url: string }> = {};

// Специальный кэш для компонентов флагов, чтобы избежать ререндеринга
const FLAG_COMPONENT_CACHE: Record<string, React.ReactElement> = {};

// Настраиваем параметры для флагов с нестандартными пропорциями
const SPECIAL_FLAG_PARAMS: Record<string, { width: number; height: number }> = {
  'hu': { width: 24, height: 12 }, // Венгрия (прямоугольный флаг)
  'ro': { width: 24, height: 16 }, // Румыния (прямоугольный флаг)
  'cz': { width: 24, height: 16 }, // Чехия (прямоугольный флаг)
  'pl': { width: 24, height: 15 }  // Польша (прямоугольный флаг)
};

/**
 * Создает кэшированный флаг-компонент для избежания ререндеринга
 */
const getCachedFlagComponent = (
  countryCode: string,
  alt: string,
  width?: number | string,
  height?: number | string,
  className?: string
): React.ReactElement => {
  const cacheKey = `flag-${countryCode}-${width}-${height}`;
  
  // Если компонент уже есть в кэше, возвращаем его
  if (FLAG_COMPONENT_CACHE[cacheKey]) {
    return FLAG_COMPONENT_CACHE[cacheKey];
  }
  
  // Применяем специальные параметры для некоторых флагов
  let flagWidth = width;
  let flagHeight = height;
  
  if (SPECIAL_FLAG_PARAMS[countryCode]) {
    flagWidth = SPECIAL_FLAG_PARAMS[countryCode].width;
    flagHeight = SPECIAL_FLAG_PARAMS[countryCode].height;
  }
  
  // Формируем URL напрямую, чтобы избежать лишних вызовов
  const flagUrl = `https://flagcdn.com/${countryCode}.svg`;
  
  // Создаем и кэшируем компонент
  const flagComponent = (
    <img
      src={flagUrl}
      alt={alt}
      width={flagWidth}
      height={flagHeight}
      className={className}
      loading="lazy"
      style={{ opacity: 1 }}
    />
  );
  
  FLAG_COMPONENT_CACHE[cacheKey] = flagComponent;
  return flagComponent;
};

/**
 * Мемоизированный компонент для отображения оптимизированных изображений
 * Автоматически использует наилучший формат (WebP или PNG) и кэширует результаты
 */
const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className,
  countryCode,
  loading = 'lazy'
}) => {
  // Для флагов стран используем специальный кэш компонентов
  if (countryCode) {
    return useMemo(() => 
      getCachedFlagComponent(countryCode, alt, width, height, className),
      [countryCode, width, height, className, alt]
    );
  }
  
  // Для обычных изображений используем стандартную логику
  // Использование ref для отслеживания монтирования компонента
  const isMounted = useRef(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Используем ключ для кэширования, включающий и src, и код страны
  const cacheKey = src;
  
  // Состояния из кэша или начальные значения
  const [optimizedSrc, setOptimizedSrc] = useState<string>(() => 
    globalImageCache[cacheKey]?.url || src
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => 
    !globalImageCache[cacheKey]?.loaded
  );
  const [error, setError] = useState<boolean>(false);

  // Настройка обсервера для ленивой загрузки
  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement) return;
    
    // Создаем обсервер только если loading='lazy'
    if (loading === 'lazy') {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          // Прекращаем наблюдение, как только элемент стал видимым
          if (observerRef.current && imgElement) {
            observerRef.current.unobserve(imgElement);
            observerRef.current.disconnect();
            observerRef.current = null;
          }
          
          // Загружаем изображение, только когда оно видимо
          loadImage();
        }
      }, {
        rootMargin: '200px', // Предзагрузка, когда до элемента 200px
        threshold: 0.01
      });
      
      observerRef.current.observe(imgElement);
    } else {
      // Если loading не 'lazy', загружаем сразу
      loadImage();
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      isMounted.current = false;
    };
  }, [cacheKey]); // Пересоздаем обсервер только при изменении ключа кэша

  // Функция загрузки изображения
  const loadImage = async () => {
    // Если изображение уже загружено в глобальный кэш, просто используем его
    if (globalImageCache[cacheKey]?.loaded) {
      setOptimizedSrc(globalImageCache[cacheKey].url);
      setIsLoading(false);
      return;
    }

    try {
      // Загружаем и оптимизируем изображение
      const optimizedUrl = await getOptimizedImageUrl(src);
      
      // Обновляем глобальный кэш
      globalImageCache[cacheKey] = {
        loaded: true,
        url: optimizedUrl
      };
      
      // Обновляем состояние только если компонент все еще смонтирован
      if (isMounted.current) {
        setOptimizedSrc(optimizedUrl);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Ошибка при оптимизации изображения:', err);
      
      if (isMounted.current) {
        setError(true);
        setIsLoading(false);
      }
    }
  };

  // Обработка ошибок загрузки изображения
  const handleImageError = () => {
    setError(true);
    // Если произошла ошибка при загрузке WebP, используем PNG
    if (optimizedSrc.endsWith('.webp')) {
      const pngUrl = optimizedSrc.replace('.webp', '.png');
      setOptimizedSrc(pngUrl);
      
      // Обновляем глобальный кэш
      globalImageCache[cacheKey] = {
        loaded: true,
        url: pngUrl
      };
    }
  };

  // Обработчик успешной загрузки изображения
  const handleImageLoad = () => {
    setIsLoading(false);
    
    // Обновляем глобальный кэш
    globalImageCache[cacheKey] = {
      loaded: true,
      url: optimizedSrc
    };
  };

  return (
    <img
      ref={imgRef}
      src={error ? src : optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s ease' }}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
}, (prevProps, nextProps) => {
  // Мемоизация: перерендеринг только если изменились ключевые параметры
  return prevProps.src === nextProps.src && 
         prevProps.countryCode === nextProps.countryCode &&
         prevProps.width === nextProps.width &&
         prevProps.height === nextProps.height;
});

export default OptimizedImage; 