import React, { useEffect, useRef } from 'react';
import '../styles/CoinBackground.scss';

// Интервал между появлением монет (в мс)
const COIN_INTERVAL = 400;

// Компонент анимированного фона с падающими монетками
const CoinBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const coinElements: HTMLDivElement[] = [];
    let coinIntervalId: number | null = null;
    
    // Функция для создания одной монетки
    const createCoin = () => {
      const coin = document.createElement('div');
      coin.className = 'coin';
      
      // Варьируем размер монетки
      const size = Math.random() * 25 + 10; // от 10px до 35px
      coin.style.width = `${size}px`;
      coin.style.height = `${size}px`;
      
      // Случайная начальная позиция по горизонтали
      const startPositionX = Math.random() * 100;
      coin.style.left = `${startPositionX}%`;
      
      // Создаем внутреннюю структуру монетки (лицевая сторона)
      const coinFront = document.createElement('div');
      coinFront.className = 'coin-front';
      coin.appendChild(coinFront);
      
      // Установка времени анимации
      const baseAnimationDuration = 9; // базовое время в секундах
      const variation = Math.random() * 2 - 1; // от -1 до +1 секунды
      const animationDuration = baseAnimationDuration + variation;
      coin.style.setProperty('--fall-duration', `${animationDuration}s`);
      
      // Установка небольшой случайной задержки
      const animationDelay = Math.random() * 1;
      coin.style.setProperty('--fall-delay', `${animationDelay}s`);
      
      // Добавляем монетку в контейнер
      container.appendChild(coin);
      coinElements.push(coin);
      
      // Запускаем анимацию в следующем кадре
      requestAnimationFrame(() => {
        coin.classList.add('active-coin');
      });
      
      // Удаляем монетку после завершения анимации
      setTimeout(() => {
        if (container.contains(coin)) {
          container.removeChild(coin);
          const index = coinElements.indexOf(coin);
          if (index > -1) {
            coinElements.splice(index, 1);
          }
        }
      }, (animationDuration + animationDelay + 0.5) * 1000);
    };
    
    // Создаем монетки через равные интервалы времени
    const startCoinGeneration = () => {
      // Создаем сразу несколько монеток с разными задержками
      for (let i = 0; i < 10; i++) {
        setTimeout(createCoin, i * 200);
      }
      
      // Запускаем регулярное создание монет через равные интервалы
      coinIntervalId = window.setInterval(createCoin, COIN_INTERVAL);
    };
    
    // Запускаем генерацию монет
    startCoinGeneration();
    
    // Очистка при размонтировании компонента
    return () => {
      // Останавливаем интервал
      if (coinIntervalId !== null) {
        clearInterval(coinIntervalId);
      }
      
      // Очищаем падающие монетки
      coinElements.forEach(coin => {
        if (container.contains(coin)) {
          container.removeChild(coin);
        }
      });
    };
  }, []);
  
  return (
    <div className="coin-background" ref={containerRef}></div>
  );
};

export default CoinBackground; 