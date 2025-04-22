import React, { useEffect, useRef } from 'react';
import '../styles/CoinBackground.scss';

// Количество монеток на фоне
const COIN_COUNT = 25;

// Компонент анимированного фона с падающими монетками
const CoinBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Функция для создания одной монетки
    const createCoin = () => {
      const coin = document.createElement('div');
      coin.className = 'coin';
      
      // Варьируем размер монетки
      const size = Math.random() * 30 + 10; // от 10px до 40px
      coin.style.width = `${size}px`;
      coin.style.height = `${size}px`;
      
      // Случайная начальная позиция по горизонтали
      const startPositionX = Math.random() * 100;
      coin.style.left = `${startPositionX}%`;
      
      // Случайная задержка анимации
      const delay = Math.random() * 5;
      coin.style.animationDelay = `${delay}s`;
      
      // Случайная продолжительность анимации
      const duration = Math.random() * 5 + 5; // от 5 до 10 секунд
      coin.style.animationDuration = `${duration}s`;
      
      // Создаем внутреннюю структуру монетки (лицевая сторона)
      const coinFront = document.createElement('div');
      coinFront.className = 'coin-front';
      coin.appendChild(coinFront);
      
      // Добавляем монетку в контейнер
      container.appendChild(coin);
      
      // Удаляем монетку после завершения анимации и создаем новую
      setTimeout(() => {
        container.removeChild(coin);
        createCoin();
      }, duration * 1000);
    };
    
    // Создаем начальный набор монеток
    for (let i = 0; i < COIN_COUNT; i++) {
      setTimeout(() => createCoin(), Math.random() * 2000);
    }
    
    // Очистка при размонтировании компонента
    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);
  
  return (
    <div className="coin-background" ref={containerRef}>
      <div className="coin-pile"></div>
    </div>
  );
};

export default CoinBackground; 