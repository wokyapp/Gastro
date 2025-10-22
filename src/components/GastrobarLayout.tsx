import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon,
  BellIcon,
  UtensilsIcon,
  ClipboardListIcon,
  BookOpenIcon,
  CalendarIcon,
  DollarSignIcon,
  TrendingUpIcon,
  ChefHatIcon,
  WrenchIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const GastrobarLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Stock bajo', message: '3 productos con stock bajo', time: '10 min', read: false },
    { id: 2, title: 'Nuevo pedido', message: 'Mesa 5 - Orden #1234', time: '15 min', read: false },
    { id: 3, title: 'Reservación confirmada', message: 'Reserva para 4 personas - 8:00 PM', time: '2 horas', read: true }
  ]);

  // ===== Redirecciones de inicio de sesión / página inicial =====
  // 1) Si la URL es raíz "/", llevar a /login.
  // 2) Si ya hay sesión y se visita /login, llevar a la vista principal (Mesas por defecto).
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

  // ==== Sesión ====
  const handleLogout = () => {
    logout();
    showToast('success', '¡Sesión cerrada correctamente!');
    navigate('/login');
  };

  // ==== Notificaciones ====
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  // ==== Navegación (filtrada por rol) ====
  const getNavigation = () => {
    const baseNavigation = [
      // 🔒 Ocultos de momento, se mantienen comentados para referencia.
      /*
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboardIcon,
        roles: ['admin']
      },
      {
        name: 'Métricas',
        href: '/metricas',
        icon: TrendingUpIcon,
        roles: ['admin']
      },
      */
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

    return baseNavigation.filter(item => item.roles.includes(user?.role) || user?.role === 'admin');
  };

  const navigation = getNavigation();

  // ==== Activo ====
  const isActive = (href: string) => location.pathname === href;

  // ==== Utilidades de botones ====
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
  const findItem = (name: string) => navigation.find(n => n.name === name);

  // Ítems principales visibles en la barra inferior (orden solicitado)
  const primaryNames = ['Mesas', 'Órdenes', 'Caja', 'Cocina'] as const;
  const primaryItems = primaryNames
    .map(n => findItem(n))
    .filter(Boolean) as Array<NonNullable<ReturnType<typeof findItem>>>;

  // Ítems que van en el menú de 3 puntos
  const overflowNames = ['Reservas', 'Menú', 'Ajustes'] as const;
  const overflowItems = overflowNames
    .map(n => findItem(n))
    .filter(Boolean) as Array<NonNullable<ReturnType<typeof findItem>>>;

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
              <UtensilsIcon size={20} aria-hidden="true" />
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
                <BellIcon size={20} aria-hidden="true" />
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
                          className={`px-4 py-3 hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
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
                    <button className="text-xs text-blue-600 hover:text-blue-800">
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
                  <UsersIcon size={16} className="text-blue-600" aria-hidden="true" />
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
                  <Link
                    to="/ajustes"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileOpen(false)}
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <SettingsIcon size={16} className="mr-2" aria-hidden="true" />
                      Ajustes
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <LogOutIcon size={16} className="mr-2" aria-hidden="true" />
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
            {primaryItems.map(item => (
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
                  <item.icon size={18} aria-hidden="true" />
                </div>
                <span className="text-xs mt-1 font-medium truncate w-full text-center px-1">
                  {item.name}
                </span>
              </Link>
            ))}

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
                  <MoreHorizontalIcon size={18} aria-hidden="true" />
                </div>
                <span className="text-xs mt-1 font-medium">Más</span>
              </button>

              {/* Menú emergente arriba del botón */}
              {isOverflowOpen && (
                <div
                  role="menu"
                  className="absolute bottom-16 right-1 min-w-[12rem] bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20"
                >
                  {overflowItems.map(ov => (
                    <Link
                      key={ov.name}
                      to={ov.href}
                      onClick={() => setIsOverflowOpen(false)}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      role="menuitem"
                    >
                      <ov.icon size={16} className="mr-2" aria-hidden="true" />
                      <span>{ov.name}</span>
                    </Link>
                  ))}
                  {/* Nota: Dashboard y Métricas permanecen ocultos; se dejan comentados en la definición. */}
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
