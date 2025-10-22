import React, { useEffect, useState, createContext, useContext } from 'react';
type CashRegisterContextType = {
  isCashClosed: boolean;
  closeCashRegister: () => void;
  openCashRegister: () => void;
};
const CashRegisterContext = createContext<CashRegisterContextType | undefined>(undefined);
export const CashRegisterProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [isCashClosed, setIsCashClosed] = useState<boolean>(() => {
    const stored = localStorage.getItem('cashRegisterClosed');
    return stored ? JSON.parse(stored) : false;
  });
  useEffect(() => {
    localStorage.setItem('cashRegisterClosed', JSON.stringify(isCashClosed));
  }, [isCashClosed]);
  const closeCashRegister = () => {
    setIsCashClosed(true);
  };
  const openCashRegister = () => {
    setIsCashClosed(false);
  };
  return <CashRegisterContext.Provider value={{
    isCashClosed,
    closeCashRegister,
    openCashRegister
  }}>
      {children}
    </CashRegisterContext.Provider>;
};
export const useCashRegister = (): CashRegisterContextType => {
  const context = useContext(CashRegisterContext);
  if (context === undefined) {
    throw new Error('useCashRegister must be used within a CashRegisterProvider');
  }
  return context;
};