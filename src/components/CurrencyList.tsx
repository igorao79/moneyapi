import React, { useContext } from 'react';
import { Currency } from '../types';
import CurrencyItem from './CurrencyItem';
import '../styles/CurrencyList.scss';
import { CurrencyActionsContext } from '../App';

interface CurrencyListProps {
  currencies: Currency[];
  loading: boolean;
}

const CurrencyList: React.FC<CurrencyListProps> = ({ currencies, loading }) => {
  const actionsContext = useContext(CurrencyActionsContext);
  
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
        <CurrencyItem 
          key={currency.code} 
          currency={currency} 
          deleteCurrency={actionsContext?.deleteCurrency}
        />
      ))}
    </div>
  );
};

export default CurrencyList; 