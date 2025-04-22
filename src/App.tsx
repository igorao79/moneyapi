import { useState, useEffect, useCallback, createContext } from 'react';
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
      const data = await fetchCurrencyData(selectedCurrencies);
      
      // Гарантируем, что валюты отображаются в том же порядке, что и в selectedCurrencies
      // Это обеспечит, что последние добавленные валюты будут в начале списка
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
    } catch (err) {
      setError('Не удалось загрузить данные о курсах валют');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCurrencies, recentlySearched]);

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

  // Функция для добавления новой валюты (через контекст)
  const handleAddCurrency = async (currencyCode: string) => {
    try {
      // Если валюта уже выбрана, просто поднимаем ее в поиске
      if (selectedCurrencies.includes(currencyCode)) {
        setRecentlySearched(prev => {
          const updated = prev.filter(code => code !== currencyCode);
          return [currencyCode, ...updated].slice(0, 5); // Сохраняем только 5 последних
        });
        return;
      }
      
      setLoading(true);
      
      // Получаем данные о новой валюте
      const newCurrency = await fetchSingleCurrency(currencyCode);
      
      if (newCurrency) {
        // Добавляем код валюты в начало списка выбранных
        setSelectedCurrencies(prev => [currencyCode, ...prev]);
        
        // Добавляем валюту в список недавно найденных
        setRecentlySearched(prev => {
          const updated = prev.filter(code => code !== currencyCode);
          return [currencyCode, ...updated].slice(0, 5); // Сохраняем только 5 последних
        });
        
        // Добавляем новую валюту к текущим данным в начало списка
        if (currencyData) {
          setCurrencyData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              currencies: [newCurrency, ...prev.currencies]
            };
          });
        }
      }
    } catch (err) {
      setError(`Не удалось добавить валюту ${currencyCode}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Функция для удаления валюты (через контекст)
  const handleDeleteCurrency = (currencyCode: string) => {
    // Удаляем валюту из списка выбранных (для следующего обновления)
    setSelectedCurrencies(prev => {
      const newSelected = prev.filter(code => code !== currencyCode);
      localStorage.setItem(SELECTED_CURRENCIES_KEY, JSON.stringify(newSelected));
      return newSelected;
    });
    
    // Удаляем валюту из списка недавно найденных, если она там есть
    if (recentlySearched.includes(currencyCode)) {
      setRecentlySearched(prev => prev.filter(code => code !== currencyCode));
    }
    
    // Удаляем валюту из текущих данных
    if (currencyData) {
      // Создаем локальную копию для изменения
      const updatedCurrencies = currencyData.currencies.filter(
        currency => currency.code !== currencyCode
      );
      
      // Обновляем состояние через функцию, чтобы не вызывать лишних перерисовок
      setCurrencyData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currencies: updatedCurrencies
        };
      });
    }
  };

  // Создаем объект контекста для действий с валютами
  const currencyActions: CurrencyActionsContextType = {
    deleteCurrency: handleDeleteCurrency,
    addCurrency: handleAddCurrency
  };

  // Компонент таймера обернут в функцию для предотвращения ререндеринга
  const renderTimer = () => (
    <UpdateTimer 
      key="update-timer"
      lastUpdateTime={lastUpdateTime} 
      onRefresh={loadCurrencyData} 
    />
  );

  // Компонент списка валют обернут в провайдер контекста
  const renderCurrencyList = () => (
    <CurrencyActionsContext.Provider value={currencyActions}>
      <CurrencySearch 
        activeCurrencies={currencyData?.currencies || []}
        onAddCurrency={handleAddCurrency}
      />
      
      <CurrencyList 
        currencies={currencyData?.currencies || []} 
        loading={loading}
      />
    </CurrencyActionsContext.Provider>
  );

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
