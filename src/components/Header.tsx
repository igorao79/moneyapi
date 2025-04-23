import React from 'react';
import { FaChartLine, FaRubleSign, FaSync } from 'react-icons/fa';
import '../styles/Header.scss';

// Добавляем интерфейс для пропсов компонента Header
interface HeaderProps {
  onRefresh?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  return (
    <header className="header">
      <div className="header__logo">
        <div className="header__currency-symbol">
          <FaRubleSign />
        </div>
        <h1 className="header__title">Курсы валют</h1>
      </div>
      <div className="header__content">
        <p className="header__description">
          <FaChartLine className="header__icon" />
          Актуальные курсы популярных валют к российскому рублю
        </p>
        {onRefresh && (
          <button 
            className="header__refresh-btn" 
            onClick={onRefresh}
            title="Обновить данные"
          >
            <FaSync />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header; 