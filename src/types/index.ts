export interface Currency {
  code: string;
  name: string;
  value: number;
  previous?: number;
  change?: number;
  changePercent?: number;
  countryCode?: string;
  amount?: number;
}

export interface CurrencyData {
  date: string;
  currencies: Currency[];
  timestamp: number;
} 