import React, { useState, useEffect } from 'react';
import { FiClock, FiRefreshCw } from 'react-icons/fi';
import '../styles/UpdateTimer.scss';

interface UpdateTimerProps {
  lastUpdateTime: number;
  onRefresh: () => void;
}

const UpdateTimer: React.FC<UpdateTimerProps> = ({ lastUpdateTime, onRefresh }) => {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  useEffect(() => {
    // Функция для обновления времени
    const updateTimeAgo = () => {
      const now = Date.now();
      const diffInSeconds = Math.floor((now - lastUpdateTime) / 1000);
      
      if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds} сек назад`);
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setTimeAgo(`${minutes} мин назад`);
      } else {
        const hours = Math.floor(diffInSeconds / 3600);
        setTimeAgo(`${hours} ч назад`);
      }
    };
    
    // Сразу обновляем время
    updateTimeAgo();
    
    // Устанавливаем интервал для обновления времени каждую секунду
    const intervalId = setInterval(updateTimeAgo, 1000);
    
    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [lastUpdateTime]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    
    // Добавляем небольшую задержку, чтобы анимация была заметна
    setTimeout(() => setIsRefreshing(false), 800);
  };
  
  return (
    <div className="update-timer">
      <div className="update-timer__time">
        <FiClock className="update-timer__icon" />
        <span>Последнее обновление: <span className="update-timer__value">{timeAgo}</span></span>
      </div>
      <button 
        className={`update-timer__button ${isRefreshing ? 'update-timer__button--refreshing' : ''}`} 
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <FiRefreshCw className="update-timer__button-icon" />
        <span>Обновить</span>
      </button>
    </div>
  );
};

export default UpdateTimer; 