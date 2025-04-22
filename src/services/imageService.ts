/**
 * Сервис для оптимизации изображений
 * Обрабатывает изображения из внешних API и конвертирует их в оптимальные форматы
 */

// Хранилище оптимизированных изображений в памяти
interface ImageCache {
  [url: string]: {
    blob?: Blob;
    objectUrl: string;
    timestamp: number;
  };
}

// Время жизни кэша (1 час)
const CACHE_TTL = 60 * 60 * 1000;

// Кэш изображений
const imageCache: ImageCache = {};

// Флаги поддержки форматов изображений в браузере (ленивая инициализация)
let formatSupport: { webp: boolean } | null = null;

/**
 * Проверяет поддержку форматов изображений браузером
 */
export const checkImageFormatsSupport = (): { webp: boolean } => {
  if (formatSupport) return formatSupport;

  let webpSupport = false;

  // Определяем поддержку WebP
  const webpCanvas = document.createElement('canvas');
  if (webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    webpSupport = true;
  }

  formatSupport = { webp: webpSupport };
  return formatSupport;
};

/**
 * Получает изображение из внешнего API и кэширует его
 * @param url URL изображения
 * @returns Promise с URL оптимизированного изображения
 */
export const getOptimizedImageUrl = async (url: string): Promise<string> => {
  // Сразу заменяем AVIF на WebP или PNG, т.к. AVIF не поддерживается на flagcdn.com
  if (url.endsWith('.avif')) {
    const webpOrPngUrl = url.replace('.avif', checkImageFormatsSupport().webp ? '.webp' : '.png');
    return getOptimizedImageUrl(webpOrPngUrl);
  }

  // Если изображение уже есть в кэше и не устарело, возвращаем его
  if (imageCache[url] && Date.now() - imageCache[url].timestamp < CACHE_TTL) {
    return imageCache[url].objectUrl;
  }

  try {
    // Для WebP проверяем поддержку браузера
    if (url.endsWith('.webp') && !checkImageFormatsSupport().webp) {
      // Заменяем на PNG, если WebP не поддерживается
      const pngUrl = url.replace('.webp', '.png');
      return getOptimizedImageUrl(pngUrl);
    }

    // Создаем объект Image вместо использования fetch
    // Это предотвращает проблемы с CORS
    const img = new Image();
    const imagePromise = new Promise<string>((resolve, reject) => {
      img.onload = () => {
        // Для изображений просто запоминаем URL
        imageCache[url] = {
          objectUrl: url,
          timestamp: Date.now()
        };
        resolve(url);
      };
      img.onerror = () => {
        console.error(`Ошибка загрузки изображения: ${url}`);
        
        // Если не удалось загрузить WebP, пробуем PNG
        if (url.endsWith('.webp')) {
          const pngUrl = url.replace('.webp', '.png');
          resolve(getOptimizedImageUrl(pngUrl));
        } else {
          // Не можем загрузить даже PNG
          reject(new Error(`Не удалось загрузить изображение: ${url}`));
        }
      };
    });

    img.src = url;
    return imagePromise;
  } catch (error) {
    console.error('Ошибка при оптимизации изображения:', error);
    return url; // В случае ошибки возвращаем исходный URL
  }
};

/**
 * Возвращает URL оптимального формата изображения в зависимости от поддержки браузера
 * @param baseUrl Базовый URL изображения без расширения
 * @param countryCode Код страны для флага
 * @returns Объект с URL разных форматов изображения
 */
export const getOptimalImageUrls = (baseUrl: string, countryCode: string) => {
  const { webp } = checkImageFormatsSupport();
  
  const urls = {
    optimal: `${baseUrl}/${countryCode}.png`, // По умолчанию PNG
    png: `${baseUrl}/${countryCode}.png`,
    webp: `${baseUrl}/${countryCode}.webp`
  };

  // Определяем оптимальный формат с учетом поддержки браузера
  if (webp) {
    urls.optimal = urls.webp;
  }

  return urls;
};

/**
 * Очищает кэш устаревших изображений
 */
export const cleanupImageCache = () => {
  const now = Date.now();
  
  Object.keys(imageCache).forEach(url => {
    if (now - imageCache[url].timestamp > CACHE_TTL) {
      // Освобождаем память для объектов URL, которые мы создали
      if (imageCache[url].blob) {
        URL.revokeObjectURL(imageCache[url].objectUrl);
      }
      delete imageCache[url];
    }
  });
};

// Запускаем очистку кэша каждый час
setInterval(cleanupImageCache, CACHE_TTL); 