import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  { code: 'RUB', name: 'Российский рубль', country: 'ru' },
  { code: 'MXN', name: 'Мексиканское песо', country: 'mx' },
  { code: 'ILS', name: 'Израильский шекель', country: 'il' },
  { code: 'KRW', name: 'Южнокорейская вона', country: 'kr' },
  { code: 'CZK', name: 'Чешская крона', country: 'cz' },
  { code: 'HUF', name: 'Венгерский форинт', country: 'hu' },
  { code: 'RON', name: 'Румынский лей', country: 'ro' },
  { code: 'BGN', name: 'Болгарский лев', country: 'bg' }
];

interface CurrencySearchProps {
  activeCurrencies: Currency[];
  onAddCurrency: (code: string) => void;
}

interface CurrencyItemWithFlag {
  code: string;
  name: string;
  country: string;
}

const CurrencySearch: React.FC<CurrencySearchProps> = ({ activeCurrencies, onAddCurrency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CurrencyItemWithFlag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cachedResultsRef = useRef<{[key: string]: CurrencyItemWithFlag[]}>({});
  
  // Кэшируем активные коды валют для минимизации пересчетов
  const activeCodes = useMemo(() => 
    activeCurrencies.map(c => c.code),
    [activeCurrencies]
  );
  
  // Получаем доступные валюты (не активные) - этот список меняется только при изменении activeCurrencies
  const availableCurrencies = useMemo(() => 
    ALL_CURRENCIES.filter(currency => !activeCodes.includes(currency.code)),
    [activeCodes]
  );

  // Фильтрация валют по поисковому запросу или вывод всех доступных валют
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Показываем все доступные валюты из кэша или вычисляем их
      setSearchResults(availableCurrencies);
    } else {
      // Проверяем, есть ли результаты в кэше для данного поискового запроса
      const cacheKey = `${searchTerm}-${activeCodes.join(',')}`;
      
      if (cachedResultsRef.current[cacheKey]) {
        setSearchResults(cachedResultsRef.current[cacheKey]);
      } else {
        // Если нет, фильтруем и сохраняем в кэш
        const filteredResults = ALL_CURRENCIES.filter(currency => {
          const matchesSearch = 
            currency.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
            currency.name.toLowerCase().includes(searchTerm.toLowerCase());
          
          return matchesSearch && !activeCodes.includes(currency.code);
        });

        cachedResultsRef.current[cacheKey] = filteredResults;
        setSearchResults(filteredResults);
      }
    }
  }, [searchTerm, activeCodes, availableCurrencies]);

  // Очищаем кэш при изменении активных валют
  useEffect(() => {
    cachedResultsRef.current = {};
  }, [activeCurrencies]);

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
  }, [wrapperRef]);

  // Обработчик для добавления валюты
  const handleAddCurrency = (code: string) => {
    onAddCurrency(code);
    setSearchTerm('');
    setShowDropdown(false);
  };

  return (
    <div className="currency-search" ref={wrapperRef}>
      <div className="currency-search__input-container">
        <FiSearch className="currency-search__icon" />
        <input
          type="text"
          className="currency-search__input"
          placeholder="Поиск валюты по названию или коду..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onClick={() => setShowDropdown(true)}
        />
      </div>
      
      {showDropdown && searchResults.length > 0 && (
        <div className="currency-search__dropdown">
          {searchResults.map((currency) => (
            <div 
              key={currency.code} 
              className="currency-search__item"
              onClick={() => handleAddCurrency(currency.code)}
            >
              <div className="currency-search__item-info">
                <div className="currency-search__item-flag">
                  <OptimizedImage
                    src={`https://flagcdn.com/24x18/${currency.country}.png`} 
                    alt={`Флаг ${currency.name}`}
                    width={24}
                    height={18}
                    countryCode={currency.country}
                    loading="lazy"
                  />
                </div>
                <div className="currency-search__item-text">
                  <span className="currency-search__item-code">{currency.code}</span>
                  <span className="currency-search__item-name">{currency.name}</span>
                </div>
              </div>
              <FiPlus className="currency-search__item-add" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySearch; 