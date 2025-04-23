import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { Currency } from '../types';
import '../styles/CurrencySearch.scss';
import { FiSearch, FiPlus } from 'react-icons/fi';
import OptimizedImage from './OptimizedImage';

// Модифицированный список валют с кодами стран для флагов
const ALL_CURRENCIES = [
  { code: 'USD', name: 'Доллар США', country: 'us' },
  { code: 'EUR', name: 'Евро', country: 'eu' },
  { code: 'GBP', name: 'Фунт стерлингов', country: 'gb' },
  { code: 'JPY', name: 'Японская иена', country: 'jp' },
  { code: 'CHF', name: 'Швейцарский франк', country: 'ch' },
  { code: 'CNY', name: 'Китайский юань', country: 'cn' },
  { code: 'AUD', name: 'Австралийский доллар', country: 'au' },
  { code: 'CAD', name: 'Канадский доллар', country: 'ca' },
  { code: 'HKD', name: 'Гонконгский доллар', country: 'hk' },
  { code: 'SGD', name: 'Сингапурский доллар', country: 'sg' },
  { code: 'SEK', name: 'Шведская крона', country: 'se' },
  { code: 'NOK', name: 'Норвежская крона', country: 'no' },
  { code: 'DKK', name: 'Датская крона', country: 'dk' },
  { code: 'PLN', name: 'Польский злотый', country: 'pl' },
  { code: 'TRY', name: 'Турецкая лира', country: 'tr' },
  { code: 'KZT', name: 'Казахстанский тенге', country: 'kz' },
  { code: 'BYN', name: 'Белорусский рубль', country: 'by' },
  { code: 'UAH', name: 'Украинская гривна', country: 'ua' },
  { code: 'INR', name: 'Индийская рупия', country: 'in' },
  { code: 'AED', name: 'Дирхам ОАЭ', country: 'ae' },
  { code: 'BRL', name: 'Бразильский реал', country: 'br' },
  { code: 'ZAR', name: 'Южноафриканский рэнд', country: 'za' },
  { code: 'KRW', name: 'Южнокорейская вона', country: 'kr' },
  { code: 'CZK', name: 'Чешская крона', country: 'cz' },
  { code: 'HUF', name: 'Венгерский форинт', country: 'hu' },
  { code: 'RON', name: 'Румынский лей', country: 'ro' },
  { code: 'BGN', name: 'Болгарский лев', country: 'bg' }
];

interface CurrencySearchProps {
  activeCurrencies: Currency[];  // Используется для отладки, можно удалить
  selectedCurrencies: string[];
  selectedButNotLoaded?: string[];
  onAddCurrency: (code: string) => void;
}

interface CurrencyItemWithFlag {
  code: string;
  name: string;
  country: string;
}

// Мемоизированный компонент для флага, который не будет перерисовываться
const MemoizedFlag = memo(({ country, name }: { country: string; name: string }) => {
  // Используем useMemo для создания единственного инстанса компонента флага для каждой страны
  return useMemo(() => {
    return (
      <OptimizedImage
        src={`https://flagcdn.com/w40/${country}.png`} 
        alt={`Флаг ${name}`}
        width={24}
        height={18}
        countryCode={country}
        loading="lazy"
      />
    );
  }, [country]); // Зависимость только от кода страны
}, (prevProps, nextProps) => {
  // Перерисовывать только если изменился код страны
  return prevProps.country === nextProps.country;
});

// Мемоизированный компонент элемента результатов поиска
const MemoizedSearchItem = memo(({ 
  currency, 
  onSelect,
  isLoading
}: { 
  currency: CurrencyItemWithFlag; 
  onSelect: (code: string) => void;
  isLoading?: boolean;
}) => {
  // Мемоизируем обработчик клика
  const handleClick = useCallback(() => {
    if (!isLoading) {
      onSelect(currency.code);
    }
  }, [currency.code, onSelect, isLoading]);

  // Используем useMemo для рендеринга содержимого элемента
  const itemContent = useMemo(() => (
    <>
      <div className="currency-search__item-info">
        <div className="currency-search__item-flag">
          <MemoizedFlag 
            country={currency.country} 
            name={currency.name} 
          />
        </div>
        <div className="currency-search__item-text">
          <span className="currency-search__item-code">{currency.code}</span>
          <span className="currency-search__item-name">{currency.name}</span>
        </div>
      </div>
      {isLoading ? (
        <span className="currency-search__item-loading">Добавление...</span>
      ) : (
        <FiPlus className="currency-search__item-add" />
      )}
    </>
  ), [currency, isLoading]);

  return (
    <div 
      className={`currency-search__item ${isLoading ? 'currency-search__item--loading' : ''}`}
      onClick={handleClick}
    >
      {itemContent}
    </div>
  );
}, (prevProps, nextProps) => {
  // Перерисовывать только если изменился код валюты или состояние загрузки
  return prevProps.currency.code === nextProps.currency.code && 
         prevProps.isLoading === nextProps.isLoading;
});

const CurrencySearch: React.FC<CurrencySearchProps> = memo(({ 
  selectedCurrencies,
  selectedButNotLoaded = [],
  onAddCurrency 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CurrencyItemWithFlag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cachedResultsRef = useRef<{[key: string]: CurrencyItemWithFlag[]}>({});
  
  // Дебаунс для поискового запроса
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);
  
  // Создаем объединенный список валют, которые уже добавлены или в процессе добавления
  const allSelectedCodes = useMemo(() => {
    const uniqueCodes = new Set([...selectedCurrencies, ...selectedButNotLoaded]);
    return Array.from(uniqueCodes);
  }, [selectedCurrencies, selectedButNotLoaded]);
  
  // Получаем доступные валюты (не активные)
  const availableCurrencies = useMemo(() => 
    ALL_CURRENCIES.filter(currency => !allSelectedCodes.includes(currency.code)),
    [allSelectedCodes]
  );
  
  // Определяем, остались ли еще валюты для добавления
  const hasAvailableCurrenciesToAdd = useMemo(() => 
    availableCurrencies.length > 0,
    [availableCurrencies]
  );

  // Фильтрация валют по поисковому запросу или вывод всех доступных валют
  useEffect(() => {
    if (debouncedSearchTerm.trim() === '') {
      // Показываем все доступные валюты
      setSearchResults(availableCurrencies);
    } else {
      // Проверяем, есть ли результаты в кэше для данного поискового запроса
      const cacheKey = `${debouncedSearchTerm}-${allSelectedCodes.join(',')}`;
      
      if (cachedResultsRef.current[cacheKey]) {
        setSearchResults(cachedResultsRef.current[cacheKey]);
      } else {
        // Если нет, фильтруем и сохраняем в кэш
        const filteredResults = availableCurrencies.filter(currency => {
          return currency.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                 currency.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        });

        cachedResultsRef.current[cacheKey] = filteredResults;
        setSearchResults(filteredResults);
      }
    }
  }, [debouncedSearchTerm, allSelectedCodes, availableCurrencies]);

  // Очищаем кэш при изменении доступных валют
  useEffect(() => {
    cachedResultsRef.current = {};
  }, [availableCurrencies]);

  // Обработчик для закрытия выпадающего списка при клике снаружи
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Обработчик для закрытия выпадающего списка при клике на кнопку Esc
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Мемоизированный обработчик для добавления валюты
  const handleAddCurrency = useCallback((code: string) => {
    // Проверяем, не выбрана ли уже валюта
    if (allSelectedCodes.includes(code)) {
      return;
    }
    
    // Немедленно обновляем результаты поиска, чтобы скрыть добавленную валюту
    setSearchResults(prev => prev.filter(currency => currency.code !== code));
    
    // Вызываем функцию добавления валюты
    onAddCurrency(code);
    
    // Закрываем выпадающий список после добавления валюты
    setShowDropdown(false);
    
    // Очищаем поле поиска
    setSearchTerm('');
  }, [onAddCurrency, allSelectedCodes]);

  // Мемоизированный обработчик изменения поля ввода
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  }, []);

  // Мемоизированный список результатов поиска
  const searchResultsList = useMemo(() => {
    if (!showDropdown) return null;
    
    // Проверяем, если нет доступных валют для добавления
    if (!hasAvailableCurrenciesToAdd) {
      return (
        <div className="currency-search__dropdown">
          <div className="currency-search__no-results">
            Вы добавили все доступные валюты
          </div>
        </div>
      );
    }
    
    // Показываем сообщение, если нет результатов поиска
    if (searchResults.length === 0) {
      return (
        <div className="currency-search__dropdown">
          <div className="currency-search__no-results">
            Ничего не найдено
          </div>
        </div>
      );
    }
    
    return (
      <div className="currency-search__dropdown">
        {searchResults.map((currency) => (
          <MemoizedSearchItem 
            key={currency.code} 
            currency={currency} 
            onSelect={handleAddCurrency}
            isLoading={selectedButNotLoaded.includes(currency.code)}
          />
        ))}
      </div>
    );
  }, [searchResults, showDropdown, handleAddCurrency, hasAvailableCurrenciesToAdd, selectedButNotLoaded]);

  return (
    <div className="currency-search" ref={wrapperRef}>
      <div className="currency-search__input-container">
        <FiSearch className="currency-search__icon" />
        <input
          type="text"
          className="currency-search__input"
          placeholder="Поиск валюты по названию или коду..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
        />
      </div>
      
      {searchResultsList}
    </div>
  );
});

export default CurrencySearch; 