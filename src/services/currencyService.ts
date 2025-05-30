import axios from 'axios';
import { Currency, CurrencyData } from '../types';

// Базовый URL для ЦБ РФ API
const API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

interface ApiCurrencyData {
  Name: string;
  Value: number;
  Previous: number;
  [key: string]: any;
}

// Исправления названий валют для корректного отображения
const CURRENCY_NAME_FIXES: Record<string, string> = {
  'UAH': 'Украинская гривна',    // вместо "гривен"
  'HUF': 'Венгерский форинт',    // вместо "форинтов"
  'MXN': 'Мексиканское песо',    // использовать то же самое название
  'ILS': 'Израильский шекель'    // использовать то же самое название
};

// Получение данных о нескольких валютах
export const fetchCurrencyData = async (currencyCodes: string[] = []): Promise<CurrencyData> => {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;
    
    // Используем только переданные коды валют
    const codesToFetch = currencyCodes;
    
    // Форматируем данные в наш формат
    const currencies: Currency[] = [];
    
    for (const code of codesToFetch) {
      const currencyData: ApiCurrencyData = data.Valute[code];
      if (!currencyData) continue;
      
      currencies.push({
        code,
        // Используем исправленное название из нашего словаря, если оно там есть
        name: CURRENCY_NAME_FIXES[code] || currencyData.Name,
        value: currencyData.Value,
        previous: currencyData.Previous,
        change: currencyData.Value - currencyData.Previous,
        changePercent: ((currencyData.Value - currencyData.Previous) / currencyData.Previous) * 100
      });
    }

    return {
      date: data.Date,
      currencies,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Ошибка при получении данных о валютах:', error);
    throw error;
  }
};

// Получение данных по одной валюте
export const fetchSingleCurrency = async (currencyCode: string): Promise<Currency | null> => {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;
    
    const currencyData: ApiCurrencyData = data.Valute[currencyCode];
    if (!currencyData) return null;
    
    return {
      code: currencyCode,
      // Используем исправленное название из нашего словаря, если оно там есть
      name: CURRENCY_NAME_FIXES[currencyCode] || currencyData.Name,
      value: currencyData.Value,
      previous: currencyData.Previous,
      change: currencyData.Value - currencyData.Previous,
      changePercent: ((currencyData.Value - currencyData.Previous) / currencyData.Previous) * 100
    };
  } catch (error) {
    console.error(`Ошибка при получении данных о валюте ${currencyCode}:`, error);
    throw error;
  }
}; 