// src/contexts/ToastContext.tsx
import React, { useRef, useState, createContext, useContext, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ShowToastOptions = {
  /** Duración en milisegundos (override). Ej: 1500 */
  duration?: number;
  /** Forzar un id (rara vez necesario) */
  id?: string;
};

type ToastContextType = {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, opts?: ShowToastOptions) => void;
  hideToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Duración por defecto más corta
const DEFAULT_DURATION = 2200;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Contador incremental para combinar con timestamp y evitar colisiones
  const counterRef = useRef(1);
  // Guardamos timers para poder limpiarlos si se cierra manualmente
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Limpieza de timers al desmontar
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, []);

  const makeId = () => {
    const id = `${Date.now()}-${counterRef.current++}`;
    return id;
  };

  const hideToast = (id: string) => {
    // Limpiar timer si existe
    const t = timersRef.current[id];
    if (t) {
      clearTimeout(t);
      delete timersRef.current[id];
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showToast = (type: ToastType, message: string, opts?: ShowToastOptions) => {
    const id = opts?.id ?? makeId();
    const duration = Math.max(800, Math.floor(opts?.duration ?? DEFAULT_DURATION)); // piso mínimo 800ms

    // Añadir toast
    setToasts(prev => [...prev, { id, type, message }]);

    // Auto-hide
    const timer = setTimeout(() => hideToast(id), duration);
    timersRef.current[id] = timer;
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}

      {/* Contenedor de toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={[
              'px-4 py-2 rounded-lg shadow-lg flex items-center justify-between',
              'min-w-[260px] max-w-md transform transition-all duration-200 ease-out',
              toast.type === 'success'
                ? 'bg-green-100 text-green-800'
                : toast.type === 'error'
                ? 'bg-red-100 text-red-800'
                : toast.type === 'warning'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-blue-100 text-blue-800',
            ].join(' ')}
          >
            <span className="pr-3">{toast.message}</span>
            <button
              onClick={() => hideToast(toast.id)}
              className="ml-2 px-2 text-gray-600 hover:text-gray-800 focus:outline-none"
              aria-label="Cerrar notificación"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
