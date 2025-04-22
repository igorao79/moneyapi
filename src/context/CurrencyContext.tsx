import React, { createContext, useContext } from 'react';

interface CurrencyContextType {
  removeCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const useCurrencyContext = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrencyContext must be used within a CurrencyContextProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: React.ReactNode;
  value: CurrencyContextType;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children, value }) => {
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}; 