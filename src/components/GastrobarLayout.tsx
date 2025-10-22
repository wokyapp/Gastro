import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  LogOutIcon,
  BellIcon,
  UtensilsIcon,
  ClipboardListIcon,
  BookOpenIcon,
  CalendarIcon,
  DollarSignIcon,
  ChefHatIcon,
  WrenchIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
  roles: string[];
};

type NotificationItem = {
  id: string | number;
  title: string;
  message: string;
  time: string;   // etiqueta legible (ej. "10:15" o "ahora")
  read: boolean;
};

const LS_GLOBAL_NOTIFS = 'woky.notifications'; // canal global de notificaciones (escrito por Cocina)

const GastrobarLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);

  // Solo notificaciones provenientes de Cocina: "Orden lista"
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Guardamos el último id procesado para evitar duplicados innecesarios
  const seenIds = useRef<Set<string | number>>(new Set());

  // ===== Redirecciones de inicio de sesión / página inicial =====
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/login', { replace: true });
      return;
    }
    if (user && location.pathname === '/login') {
      navigate('/mesas', { replace: true });
    }
  }, [location.pathname, user, navigate]);

  // ===== Si estamos en /login, NO renderizamos el layout (solo la página de login) =====
  if (location.pathname.startsWith('/login')) {
    return <Outlet />;
  }

  // ==== Utilidades ====
  const fmtTime = (iso?: string) => {
    try {
      if (!iso) return 'ahora';
      const d = new Date(iso);
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'ahora';
    }
  };

  // Filtro estricto: solo eventos de Cocina "Orden lista"
  const isKitchenReady = (n: { title?: string; message?: string }) =>
    (n.title || '').toLowerCase().trim() === 'orden lista';

  const loadGlobalNotifs = (): NotificationItem[] => {
    try {
      const raw = localStorage.getItem(LS_GLOBAL_NOTIFS);
      const arr: Array<{ id: string | number; title: string; message: string; ts?: string; read?: boolean }> = raw ? JSON.parse(raw) : [];
      return arr
        .filter(isKitchenReady)
        .map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: fmtTime(n.ts),
          read: Boolean(n.read ?? false),
        }));
    } catch {
      return [];
    }
  };

  // Merge inteligente (sin duplicados)
  const mergeNotifs = (base: NotificationItem[], incoming: NotificationItem[]) => {
    const map = new Map<string | number, NotificationItem>();
    for (const n of base) map.set(n.id, n);
    for (const n of incoming) map.set(n.id, n);
    return Array.from(map.values())
      .sort((a, b) => String(b.time).localeCompare(String(a.time))); // aproximación de orden
  };

  // Al montar, cargamos solo notificaciones de cocina "Orden lista"
  useEffect(() => {
    const globals = loadGlobalNotifs();
    if (globals.length) {
      const merged = mergeNotifs([], globals);
      setNotifications(merged);
      for (const n of merged) seenIds.current.add(n.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listener de canal global (cualquier rol recibe notificaciones de Cocina)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_GLOBAL_NOTIFS || !e.newValue) return;
      try {
        const arr = JSON.parse(e.newValue) as Array<{ id: string | number; title: string; message: string; ts?: string; read?: boolean }>;
        if (!Array.isArray(arr) || arr.length === 0) return;

        // Tomamos el último elemento como "nuevo" (push/unshift en Cocina)
        const last = arr[0];
        if (!last || !isKitchenReady(last)) return; // ignorar todo lo que no sea "Orden lista"

        if (!seenIds.current.has(last.id)) {
          const next: NotificationItem = {
            id: last.id,
            title: last.title,
            message: last.message,
            time: fmtTime(last.ts),
            read: Boolean(last.read ?? false)
          };
          setNotifications(prev => [next, ...prev]);
          seenIds.current.add(last.id);
          // Toast opcional
          showToast('info', next.title + ': ' + next.message);
        }
      } catch {
        /* noop */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [showToast]);

  // ==== Sesión ====
  const handleLogout = () => {
    logout();
    showToast('success', '¡Sesión cerrada correctamente!');
    navigate('/login');
  };

  // ==== Notificaciones ====
  const markAsRead = (id: number | string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    // reflejar lectura en LS para persistencia entre pestañas
    try {
      const raw = localStorage.getItem(LS_GLOBAL_NOTIFS);
      const arr: any[] = raw ? JSON.parse(raw) : [];
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) {
        arr[idx].read = true;
        localStorage.setItem(LS_GLOBAL_NOTIFS, JSON.stringify(arr));
        window.dispatchEvent(new StorageEvent('storage', { key: LS_GLOBAL_NOTIFS, newValue: JSON.stringify(arr) }));
      }
    } catch { /* noop */ }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const raw = localStorage.getItem(LS_GLOBAL_NOTIFS);
      const arr: any[] = raw ? JSON.parse(raw) : [];
      const next = arr
        .filter(isKitchenReady)         // mantenemos solo eventos de cocina
        .map(n => ({ ...n, read: true }));
      localStorage.setItem(LS_GLOBAL_NOTIFS, JSON.stringify(next));
      window.dispatchEvent(new StorageEvent('storage', { key: LS_GLOBAL_NOTIFS, newValue: JSON.stringify(next) }));
    } catch { /* noop */ }
  };

  // ==== Navegación (filtrada por rol) ====
  const getNavigation = (): NavItem[] => {
    const baseNavigation: NavItem[] = [
      {
        name: 'Mesas',
        href: '/mesas',
        icon: ClipboardListIcon,
        roles: ['admin', 'waiter', 'mesero', 'cashier', 'cajero']
      },
      {
        name: 'Órdenes',
        href: '/ordenes',
        icon: UtensilsIcon,
        roles: ['admin', 'waiter', 'mesero', 'cashier', 'cajero']
      },
      {
        name: 'Menú',
        href: '/menu',
        icon: BookOpenIcon,
        roles: ['admin', 'cashier', 'cajero']
      },
      {
        name: 'Reservas',
        href: '/reservaciones',
        icon: CalendarIcon,
        roles: ['admin', 'waiter', 'mesero', 'cashier', 'cajero']
      },
      {
        name: 'Cocina',
        href: '/cocina',
        icon: ChefHatIcon,
        roles: ['admin', 'cook', 'cocinero', 'waiter', 'mesero']
      },
      {
        name: 'Caja',
        href: '/caja',
        icon: DollarSignIcon,
        roles: ['admin', 'cashier', 'cajero']
      },
      {
        name: 'Ajustes',
        href: '/configurar',
        icon: WrenchIcon,
        roles: ['admin']
      }
    ];

    return baseNavigation.filter(item => item.roles.includes(user?.role as string) || user?.role === 'admin');
  };

  const navigation = getNavigation();

  // ==== Activo ====
  const isActive = (href: string) => location.pathname === href;

  // ==== Utilidades de botones (expuestas a páginas hijas) ====
  const softBtn = (color: string) => {
    const baseClasses = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200';
    const colorClasses: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      green: 'bg-green-100 text-green-700 hover:bg-green-200',
      amber: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      red: 'bg-red-100 text-red-700 hover:bg-red-200',
      gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    };
    return `${baseClasses} ${colorClasses[color] || colorClasses.gray}`;
  };

  const ctaGrad = () => {
    return 'px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm flex items-center';
  };

  // ==== Helpers para items específicos ====
  const byName = (name: string) => navigation.find(n => n.name === name);

  const primaryItems: NavItem[] = (['Mesas', 'Órdenes', 'Caja', 'Cocina'] as const)
    .map(byName)
    .filter((x): x is NavItem => Boolean(x));

  const overflowItems: NavItem[] = (['Reservas', 'Menú', 'Ajustes'] as const)
    .map(byName)
    .filter((x): x is NavItem => Boolean(x));

  // Cerrar overlays al cambiar de ruta
  useEffect(() => {
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
    setIsOverflowOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* ===== Barra superior ===== */}
      <header className="bg-white shadow-sm z-10 w-full">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <div className="bg-blue-600 text-white p-1.5 rounded">
              <UtensilsIcon size={20} aria-hidden />
            </div>
            <span className="text-lg font-bold text-blue-800 ml-2">Woky | Gastro</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <div className="relative">
              <button
                aria-label="Notificaciones"
                aria-haspopup="menu"
                aria-expanded={isNotificationsOpen}
                className="relative text-gray-500 hover:text-gray-700 p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
              >
                <BellIcon size={20} aria-hidden />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200"
                >
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Notificaciones</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500">{notification.time}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-gray-500">No hay notificaciones</p>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800"
                      onClick={markAllAsRead}
                    >
                      Marcar todas como leídas
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Perfil */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UsersIcon size={16} className="text-blue-600" aria-hidden />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user?.name?.replace(' Demo', '') || 'Usuario'}</p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'admin'
                      ? 'Administrador'
                      : user?.role === 'supervisor'
                      ? 'Supervisor'
                      : user?.role === 'cashier'
                      ? 'Cajero'
                      : user?.role === 'waiter'
                      ? 'Mesero'
                      : user?.role === 'cook'
                      ? 'Cocinero/Bartender'
                      : 'Usuario'}
                  </p>
                </div>
              </button>

              {isProfileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200"
                >
                  {/* Eliminada la opción "Ajustes" del menú de perfil */}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <LogOutIcon size={16} className="mr-2" aria-hidden />
                      Cerrar sesión
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== Contenido ===== */}
      <main className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Outlet
            context={{
              softBtn,
              ctaGrad
            }}
          />
        </div>
      </main>

      {/* ===== Navegación inferior (mobile-first) ===== */}
      <nav className="bg-white border-t border-gray-200 sticky bottom-0 shadow-lg w-full">
        <div className="flex items-center justify-between h-16">
          <div className="relative flex w-full justify-between px-1">
            {/* Ítems principales en orden: Mesas, Órdenes, Caja, Cocina */}
            {primaryItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center justify-center h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50 border-t-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{ flex: '1 1 0', minWidth: '60px', maxWidth: '80px' }}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <div className={`p-1 rounded-full ${isActive(item.href) ? 'bg-blue-100' : ''}`}>
                    <Icon size={18} aria-hidden />
                  </div>
                  <span className="text-xs mt-1 font-medium truncate w-full text-center px-1">{item.name}</span>
                </Link>
              );
            })}

            {/* Botón de 3 puntos (overflow) */}
            <div className="relative" style={{ flex: '0 0 60px' }}>
              <button
                aria-label="Más opciones"
                aria-haspopup="menu"
                aria-expanded={isOverflowOpen}
                className={`w-full h-full flex flex-col items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isOverflowOpen ? 'bg-gray-50' : ''
                }`}
                onClick={() => setIsOverflowOpen(prev => !prev)}
              >
                <div className="p-1 rounded-full">
                  <MoreHorizontalIcon size={18} aria-hidden />
                </div>
                <span className="text-xs mt-1 font-medium">Más</span>
              </button>

              {/* Menú emergente arriba del botón */}
              {isOverflowOpen && (
                <div
                  role="menu"
                  className="absolute bottom-16 right-1 min-w-[12rem] bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20"
                >
                  {overflowItems.map(ov => {
                    const OvIcon = ov.icon;
                    return (
                      <Link
                        key={ov.name}
                        to={ov.href}
                        onClick={() => setIsOverflowOpen(false)}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        role="menuitem"
                      >
                        <OvIcon size={16} className="mr-2" aria-hidden />
                        <span>{ov.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default GastrobarLayout;
