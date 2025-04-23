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

// Словарь уже загруженных URL флагов по коду страны
const FLAG_URL_CACHE: Record<string, string> = {};

/**
 * Проверяет поддержку форматов изображений браузером
 */
export const checkImageFormatsSupport = (): { webp: boolean } => {
  if (formatSupport) return formatSupport;

  // Всегда предпочитаем WebP, если не отладка
  formatSupport = { webp: true };
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
  // Проверяем, есть ли уже кэшированный URL для этого кода страны
  if (FLAG_URL_CACHE[countryCode]) {
    return {
      optimal: FLAG_URL_CACHE[countryCode],
      png: `${baseUrl}/${countryCode}.png`,
      webp: `${baseUrl}/${countryCode}.webp`
    };
  }
  
  // Определяем оптимальный формат с учетом поддержки браузера
  const { webp } = checkImageFormatsSupport();
  
  // Формируем URL для разных форматов
  const urls = {
    png: `${baseUrl}/${countryCode}.png`,
    webp: `${baseUrl}/${countryCode}.webp`,
    optimal: `${baseUrl}/${countryCode}.png` // По умолчанию PNG
  };
  
  // Выбираем WebP, если поддерживается браузером
  if (webp) {
    urls.optimal = urls.webp;
  }
  
  // Кэшируем выбранный URL
  FLAG_URL_CACHE[countryCode] = urls.optimal;
  
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