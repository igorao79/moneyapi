import { useState, useEffect, useCallback, createContext, useMemo } from 'react';
import { CurrencyData } from './types';
import { fetchCurrencyData, fetchSingleCurrency } from './services/currencyService';
import Header from './components/Header';
import UpdateTimer from './components/UpdateTimer';
import CurrencyList from './components/CurrencyList';
import CurrencySearch from './components/CurrencySearch';
import Footer from './components/Footer';
import CoinBackground from './components/CoinBackground';
import './styles/App.scss';
import { FaReact } from 'react-icons/fa';

// Интервал автоматического обновления данных (в мс)
const AUTO_UPDATE_INTERVAL = 60000; // 1 минута

// Ключ для хранения выбранных валют в localStorage
const SELECTED_CURRENCIES_KEY = 'selected_currencies';

// Валюты по умолчанию для нового пользователя
const DEFAULT_CURRENCIES = ['USD', 'EUR'];

// Создаем контекст для передачи функций без ререндеринга родительских компонентов
export interface CurrencyActionsContextType {
  deleteCurrency: (code: string) => void;
  addCurrency: (code: string) => void;
}

export const CurrencyActionsContext = createContext<CurrencyActionsContextType | null>(null);

function App() {
  // Состояние для хранения данных о валютах
  const [currencyData, setCurrencyData] = useState<CurrencyData | null>(null);
  // Состояние загрузки
  const [loading, setLoading] = useState<boolean>(true);
  // Состояние ошибки
  const [error, setError] = useState<string | null>(null);
  // Состояние для хранения списка выбранных валют
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(() => {
    const saved = localStorage.getItem(SELECTED_CURRENCIES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CURRENCIES;
  });
  // Состояние для отслеживания валют в процессе добавления
  const [loadingCurrencies, setLoadingCurrencies] = useState<string[]>([]);
  // Состояние для хранения недавно найденных валют
  const [recentlySearched, setRecentlySearched] = useState<string[]>([]);
  // Состояние для отслеживания времени последнего обновления (выделено в отдельное состояние)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Сохранение выбранных валют в localStorage
  useEffect(() => {
    localStorage.setItem(SELECTED_CURRENCIES_KEY, JSON.stringify(selectedCurrencies));
  }, [selectedCurrencies]);

  // Функция для загрузки данных
  const loadCurrencyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем данные для всех выбранных валют
      let data = await fetchCurrencyData(selectedCurrencies);
      
      // Сортируем валюты в том же порядке, что и в selectedCurrencies
      const sortedCurrencies = [...data.currencies];
      
      sortedCurrencies.sort((a, b) => {
        const indexA = selectedCurrencies.indexOf(a.code);
        const indexB = selectedCurrencies.indexOf(b.code);
        return indexA - indexB;
      });
      
      data.currencies = sortedCurrencies;
      
      // Обновляем время последнего обновления и данные
      setLastUpdateTime(Date.now());
      setCurrencyData(data);
      
      // Очищаем список загружаемых валют, так как все загрузились
      setLoadingCurrencies([]);
      
    } catch (err) {
      setError('Не удалось загрузить данные о курсах валют');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCurrencies]);

  // Загружаем данные при первом рендере и при изменении выбранных валют
  useEffect(() => {
    loadCurrencyData();

    // Устанавливаем интервал для автоматического обновления данных
    const intervalId = setInterval(() => {
      console.log('Автоматическое обновление данных...');
      loadCurrencyData();
    }, AUTO_UPDATE_INTERVAL);

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [loadCurrencyData]);

  // Функция для добавления новой валюты
  const handleAddCurrency = useCallback((currencyCode: string) => {
    // Если валюта уже выбрана или в процессе добавления, игнорируем
    if (selectedCurrencies.includes(currencyCode) || loadingCurrencies.includes(currencyCode)) {
      // Если валюта уже в списке, просто обновляем список недавно найденных
      if (selectedCurrencies.includes(currencyCode)) {
        setRecentlySearched(prev => {
          const updated = prev.filter(code => code !== currencyCode);
          return [currencyCode, ...updated].slice(0, 5);
        });
      }
      return;
    }
    
    console.log(`Добавление валюты ${currencyCode}`);
    
    // Добавляем валюту в список загружаемых
    setLoadingCurrencies(prev => [...prev, currencyCode]);
    
    // Устанавливаем состояние загрузки сразу, чтобы UI отреагировал
    setLoading(true);
    
    // Добавляем новую валюту в список выбранных
    setSelectedCurrencies(prev => [currencyCode, ...prev]);
    
    // Добавляем валюту в список недавно найденных
    setRecentlySearched(prev => {
      const updated = prev.filter(code => code !== currencyCode);
      return [currencyCode, ...updated].slice(0, 5);
    });
    
    // Получаем данные о новой валюте и обновляем список
    fetchSingleCurrency(currencyCode)
      .then(newCurrency => {
        if (newCurrency && currencyData) {
          console.log(`Получены данные для ${currencyCode}:`, newCurrency);
          
          // Добавляем новую валюту в текущие данные
          const updatedCurrencies = [newCurrency, ...currencyData.currencies];
          
          // Обновляем данные сразу
          setCurrencyData(prevData => {
            if (!prevData) return null;
            
            return {
              ...prevData,
              currencies: updatedCurrencies
            };
          });
          
          // Обновляем время обновления
          setLastUpdateTime(Date.now());
        }
      })
      .catch(err => {
        console.error(`Ошибка при получении данных для валюты ${currencyCode}:`, err);
      })
      .finally(() => {
        // Убираем валюту из списка загружаемых
        setLoadingCurrencies(prev => prev.filter(code => code !== currencyCode));
        
        // Устанавливаем флаг окончания загрузки
        setLoading(false);
      });
    
  }, [selectedCurrencies, currencyData, loadingCurrencies]);

  // Функция для удаления валюты
  const handleDeleteCurrency = useCallback((currencyCode: string) => {
    // Удаляем валюту из списка выбранных
    setSelectedCurrencies(prev => prev.filter(code => code !== currencyCode));
    
    // Удаляем валюту из списка недавно найденных, если она там есть
    if (recentlySearched.includes(currencyCode)) {
      setRecentlySearched(prev => prev.filter(code => code !== currencyCode));
    }
    
    // Удаляем валюту из текущих данных
    if (currencyData) {
      const updatedCurrencies = currencyData.currencies.filter(
        currency => currency.code !== currencyCode
      );
      
      setCurrencyData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currencies: updatedCurrencies
        };
      });
    }
  }, [currencyData, recentlySearched]);

  // Создаем объект контекста для действий с валютами
  const currencyActions = useMemo(() => ({
    deleteCurrency: handleDeleteCurrency,
    addCurrency: handleAddCurrency
  }), [handleDeleteCurrency, handleAddCurrency]);

  // Компонент таймера обернут в функцию для предотвращения ререндеринга
  const renderTimer = () => (
    <UpdateTimer 
      key="update-timer"
      lastUpdateTime={lastUpdateTime} 
      onRefresh={loadCurrencyData} 
    />
  );

  // Информация о валютах для передачи в CurrencySearch
  const currencyInfo = useMemo(() => {
    return {
      active: currencyData?.currencies || [],
      selected: selectedCurrencies,
      loading: loadingCurrencies
    };
  }, [currencyData, selectedCurrencies, loadingCurrencies]);

  // Компонент списка валют обернут в провайдер контекста
  const renderCurrencyList = () => {
    return (
      <CurrencyActionsContext.Provider value={currencyActions}>
        <CurrencySearch 
          activeCurrencies={currencyInfo.active}
          selectedCurrencies={selectedCurrencies}
          selectedButNotLoaded={loadingCurrencies}
          onAddCurrency={handleAddCurrency}
        />
        
        <CurrencyList 
          currencies={currencyData?.currencies || []} 
          loading={loading}
        />
      </CurrencyActionsContext.Provider>
    );
  };

  return (
    <div className="app">
      <CoinBackground />
      <div className="app__container">
        <div className="app__react-icon">
          <FaReact className="app__react-icon-svg" />
        </div>
        
        <Header />
        
        {error && (
          <div className="app__error">
            {error}
            <button onClick={loadCurrencyData}>Попробовать снова</button>
          </div>
        )}
        
        {!error && (
          <>
            {renderTimer()}
            {renderCurrencyList()}
          </>
        )}
        
        <Footer />
      </div>
    </div>
  );
}

export default App;
