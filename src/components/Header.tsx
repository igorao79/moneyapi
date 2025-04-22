import React from 'react';
import { FaChartLine, FaRubleSign } from 'react-icons/fa';
import '../styles/Header.scss';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header__logo">
        <div className="header__currency-symbol">
          <FaRubleSign />
        </div>
        <h1 className="header__title">Курсы валют</h1>
      </div>
      <p className="header__description">
        <FaChartLine className="header__icon" />
        Актуальные курсы популярных валют к российскому рублю
      </p>
    </header>
  );
};

export default Header; 