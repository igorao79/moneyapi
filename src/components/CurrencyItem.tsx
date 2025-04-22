import React, { useState, ReactElement, useContext, useMemo, memo, useRef, useLayoutEffect } from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { 
  FaRubleSign, 
  FaEuroSign, 
  FaDollarSign, 
  FaPoundSign, 
  FaYenSign, 
  FaRupeeSign,
  FaLiraSign,
  FaShekelSign,
  FaHryvnia,
  FaWonSign,
  FaCoins
} from 'react-icons/fa';
import { CurrencyActionsContext } from '../App';
import '../styles/CurrencyItem.scss';
import { Currency } from '../types';
import { BiX } from 'react-icons/bi';

interface CurrencyItemProps {
  currency: Currency;
  isBase?: boolean;
  onChange?: (value: string) => void;
  deleteCurrency?: (code: string) => void;
}

// Global WebP support detection - do this once for the entire app
const supportsWebP = (() => {
  try {
    const elem = document.createElement('canvas');
    return elem.getContext && elem.getContext('2d') && 
      elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
})();

// Global cache for flag URLs to prevent re-renders during search
const flagUrlCache: Record<string, string> = {};

// Соответствие кодов валют кодам стран для получения фона
const COUNTRY_CODES: Record<string, string> = {
  USD: 'us',   // США
  EUR: 'eu',   // Евросоюз
  GBP: 'gb',   // Великобритания
  JPY: 'jp',   // Япония
  CNY: 'cn',   // Китай
  RUB: 'ru',   // Россия
  INR: 'in',   // Индия
  TRY: 'tr',   // Турция
  ILS: 'il',   // Израиль
  UAH: 'ua',   // Украина
  KRW: 'kr',   // Южная Корея
  AUD: 'au',   // Австралия
  CAD: 'ca',   // Канада
  NZD: 'nz',   // Новая Зеландия
  SGD: 'sg',   // Сингапур
  HKD: 'hk',   // Гонконг
  TWD: 'tw',   // Тайвань
  CHF: 'ch',   // Швейцария
  SEK: 'se',   // Швеция
  NOK: 'no',   // Норвегия
  DKK: 'dk',   // Дания
  CZK: 'cz',   // Чехия
  PLN: 'pl',   // Польша
  BRL: 'br',   // Бразилия
  ZAR: 'za',   // ЮАР
  MXN: 'mx',   // Мексика
  AED: 'ae',   // ОАЭ
  BYN: 'by',   // Беларусь
  KZT: 'kz',   // Казахстан
}; 

// Объект с символами различных валют для более точного отображения
const CURRENCY_SYMBOLS: Record<string, ReactElement> = {
  USD: <FaDollarSign />,        // Доллар США
  EUR: <FaEuroSign />,          // Евро
  GBP: <FaPoundSign />,         // Фунт стерлингов
  JPY: <FaYenSign />,           // Японская иена
  CNY: <FaYenSign />,           // Китайский юань
  RUB: <FaRubleSign />,         // Российский рубль
  INR: <FaRupeeSign />,         // Индийская рупия
  TRY: <FaLiraSign />,          // Турецкая лира
  ILS: <FaShekelSign />,        // Израильский шекель
  UAH: <FaHryvnia />,           // Украинская гривна
  KRW: <FaWonSign />,           // Южнокорейская вона
  KPW: <FaWonSign />,           // Северокорейская вона
  
  // Все остальные валюты на основе доллара используют символ доллара
  AUD: <FaDollarSign />,        // Австралийский доллар
  CAD: <FaDollarSign />,        // Канадский доллар
  NZD: <FaDollarSign />,        // Новозеландский доллар
  SGD: <FaDollarSign />,        // Сингапурский доллар
  HKD: <FaDollarSign />,        // Гонконгский доллар
  TWD: <FaDollarSign />,        // Тайваньский доллар
  
  // Валюты на основе франка используют символ монеты
  CHF: <FaCoins />,             // Швейцарский франк
  
  // Валюты на основе кроны используют символ монеты
  SEK: <FaCoins />,             // Шведская крона
  NOK: <FaCoins />,             // Норвежская крона
  DKK: <FaCoins />,             // Датская крона
  CZK: <FaCoins />,             // Чешская крона
  ISK: <FaCoins />,             // Исландская крона
};

// Function to get flag URL with caching
const getGlobalFlagUrl = (code: string, countryCode?: string): string => {
  const cacheKey = code;
  
  if (flagUrlCache[cacheKey]) {
    return flagUrlCache[cacheKey];
  }
  
  const resolvedCountryCode = countryCode?.toLowerCase() || COUNTRY_CODES[code]?.toLowerCase() || '';
  if (!resolvedCountryCode) return '';
  
  // Use WebP if supported, otherwise PNG, with higher resolution
  const url = `https://flagcdn.com/w80/${resolvedCountryCode}.${supportsWebP ? 'webp' : 'png'}`;
  
  // Cache the result
  flagUrlCache[cacheKey] = url;
  return url;
};

// Enhanced global flag preloader that guarantees no re-renders
const preloadedFlags: Record<string, HTMLDivElement> = {};

// Function to create a static DOM element for the flag background
const createFlagElement = (code: string) => {
  if (preloadedFlags[code]) {
    return preloadedFlags[code];
  }
  
  const countryCode = COUNTRY_CODES[code]?.toLowerCase() || '';
  if (!countryCode) return null;
  
  // Create actual DOM element for the flag
  const flagDiv = document.createElement('div');
  flagDiv.className = "currency-item__background";
  flagDiv.style.backgroundImage = `url(https://flagcdn.com/w80/${countryCode}.${supportsWebP ? 'webp' : 'png'})`;
  flagDiv.style.backgroundSize = 'cover';
  flagDiv.style.backgroundPosition = 'center';
  flagDiv.style.backgroundRepeat = 'no-repeat';
  flagDiv.style.opacity = '0.5';
  flagDiv.style.position = 'absolute';
  flagDiv.style.top = '0';
  flagDiv.style.left = '0';
  flagDiv.style.width = '100%';
  flagDiv.style.height = '100%';
  flagDiv.style.zIndex = '0';
  
  // Store in cache
  preloadedFlags[code] = flagDiv;
  return flagDiv;
};

// Changing to memo component to prevent unnecessary re-renders
const CurrencyItem: React.FC<CurrencyItemProps> = memo(
  ({ 
    currency, 
    isBase = false, 
    onChange,
    deleteCurrency 
  }) => {
    const [amount, setAmount] = useState<string>(currency.amount?.toString() || '1');
    const actionsContext = useContext(CurrencyActionsContext);
    const [isHovered, setIsHovered] = useState(false);
    
    // Create a ref for the flag container
    const flagContainerRef = useRef<HTMLDivElement>(null);
    
    // Use useLayoutEffect to add the flag to the DOM directly, bypassing React's virtual DOM
    useLayoutEffect(() => {
      const flagContainer = flagContainerRef.current;
      if (!flagContainer) return;
      
      // Clear existing content
      while (flagContainer.firstChild) {
        flagContainer.removeChild(flagContainer.firstChild);
      }
      
      // Insert the cached flag element
      const flagElement = createFlagElement(currency.code);
      if (flagElement) {
        // Clone the element to avoid DOM hierarchy issues
        const clonedFlag = flagElement.cloneNode(true) as HTMLDivElement;
        flagContainer.appendChild(clonedFlag);
      }
    }, [currency.code]); // Only run on code change, never on filtering/search
    
    // Определяем, растет ли курс или падает
    const isPositive = currency.change !== undefined && currency.change > 0;
    const isNegative = currency.change !== undefined && currency.change < 0;
    const directionClass = isPositive 
      ? 'currency-item__change--up' 
      : isNegative 
        ? 'currency-item__change--down' 
        : '';
    
    // Получаем иконку для валюты из предопределенного набора
    const getCurrencyIcon = () => {
      return CURRENCY_SYMBOLS[currency.code] || <FaCoins />;
    };

    // Обработчик удаления валюты
    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation(); // Предотвращаем всплытие события
      if (deleteCurrency) {
        deleteCurrency(currency.code);
      } else if (actionsContext) {
        actionsContext.deleteCurrency(currency.code);
      }
    };
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setAmount(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };
    
    return (
      <div 
        className={`currency-item ${isHovered ? 'currency-item--hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Flag container that will be populated by useLayoutEffect */}
        <div ref={flagContainerRef} className="currency-item__flag-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        
        {(deleteCurrency || actionsContext) && (
          <button 
            className="currency-item__delete" 
            onClick={handleDelete}
            aria-label="Удалить валюту"
          >
            <BiX />
          </button>
        )}
        
        <div className="currency-item__highlight-bar"></div>
        <div className="currency-item__overlay"></div>
        
        <div className="currency-item__header">
          <div className="currency-item__icon">
            {getCurrencyIcon()}
          </div>
          <div className="currency-item__details">
            <div className="currency-item__code">{currency.code}</div>
            <div className="currency-item__name">{currency.name}</div>
          </div>
        </div>
        
        <div className="currency-item__value">
          {isBase ? (
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="currency-item__input"
            />
          ) : (
            <span>{currency.value !== undefined ? currency.value.toFixed(2) : '-'} ₽</span>
          )}
        </div>
        
        {currency.change !== undefined && currency.changePercent !== undefined && (
          <div className={`currency-item__change ${directionClass}`}>
            <div className="currency-item__change-indicator">
              {isPositive && <FiArrowUp className="currency-item__arrow" />}
              {isNegative && <FiArrowDown className="currency-item__arrow" />}
            </div>
            
            <div className="currency-item__change-details">
              <span className="currency-item__change-value">
                {isPositive ? '+' : ''}{currency.change.toFixed(2)} ₽
              </span>
              <span className="currency-item__change-percent">
                ({isPositive ? '+' : ''}{currency.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if any of these have changed
    return (
      prevProps.currency.code === nextProps.currency.code &&
      prevProps.currency.value === nextProps.currency.value &&
      prevProps.currency.change === nextProps.currency.change &&
      prevProps.currency.changePercent === nextProps.currency.changePercent &&
      prevProps.isBase === nextProps.isBase &&
      prevProps.deleteCurrency === nextProps.deleteCurrency
    );
  }
);

export default CurrencyItem; 