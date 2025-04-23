import React, { useContext, useMemo, memo } from 'react';
import { Currency } from '../types';
import CurrencyItem from './CurrencyItem';
import '../styles/CurrencyList.scss';
import { CurrencyActionsContext } from '../App';

interface CurrencyListProps {
  currencies: Currency[];
  loading: boolean;
}

// Create a memoized list item to prevent re-renders when parent re-renders
const MemoizedCurrencyItem = memo(
  ({ currency, deleteCurrency }: { currency: Currency; deleteCurrency: (code: string) => void }) => (
    <CurrencyItem 
      key={currency.code} 
      currency={currency} 
      deleteCurrency={deleteCurrency}
    />
  ),
  (prevProps, nextProps) => {
    // Only re-render if the currency data changes
    return prevProps.currency.code === nextProps.currency.code &&
           prevProps.currency.value === nextProps.currency.value &&
           prevProps.currency.change === nextProps.currency.change &&
           prevProps.currency.changePercent === nextProps.currency.changePercent;
  }
);

// Memoize the entire CurrencyList component
const CurrencyList: React.FC<CurrencyListProps> = memo(({ currencies, loading }) => {
  const actionsContext = useContext(CurrencyActionsContext);
  
  // Memoize the delete handler so it doesn't change on re-renders
  const deleteCurrency = useMemo(() => 
    actionsContext?.deleteCurrency || (() => {}),
    [actionsContext]
  );
  
  if (loading && currencies.length === 0) {
    return (
      <div className="currency-list__loading">
        <div className="currency-list__loader"></div>
        <p>Загрузка курсов валют...</p>
      </div>
    );
  }

  if (!currencies.length) {
    return (
      <div className="currency-list__empty">
        <p>Нет данных о курсах валют</p>
      </div>
    );
  }

  return (
    <div className="currency-list">
      {currencies.map((currency) => (
        <MemoizedCurrencyItem 
          key={currency.code} 
          currency={currency} 
          deleteCurrency={deleteCurrency}
        />
      ))}
    </div>
  );
});

export default CurrencyList; 