import React, { useState, createContext, useContext } from 'react';
type ToastType = 'success' | 'error' | 'info' | 'warning';
type Toast = {
  id: number;
  type: ToastType;
  message: string;
};
type ToastContextType = {
  toasts: Toast[];
  showToast: (type: ToastType, message: string) => void;
  hideToast: (id: number) => void;
};
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const ToastProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nextId, setNextId] = useState(1);
  const showToast = (type: ToastType, message: string) => {
    const id = nextId;
    setNextId(nextId + 1);
    setToasts(prev => [...prev, {
      id,
      type,
      message
    }]);
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      hideToast(id);
    }, 5000);
  };
  const hideToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  return <ToastContext.Provider value={{
    toasts,
    showToast,
    hideToast
  }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        {toasts.map(toast => <div key={toast.id} className={`px-4 py-2 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] max-w-md transform transition-all duration-300 ease-in-out ${toast.type === 'success' ? 'bg-green-100 text-green-800' : toast.type === 'error' ? 'bg-red-100 text-red-800' : toast.type === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
            <span>{toast.message}</span>
            <button onClick={() => hideToast(toast.id)} className="ml-4 text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>)}
      </div>
    </ToastContext.Provider>;
};
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};