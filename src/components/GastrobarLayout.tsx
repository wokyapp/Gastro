import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboardIcon, UsersIcon, SettingsIcon, LogOutIcon, BellIcon, UtensilsIcon, ClipboardListIcon, BookOpenIcon, CalendarIcon, PackageIcon, CoffeeIcon, DollarSignIcon, TrendingUpIcon, FileTextIcon, SlidersIcon, ChefHatIcon, WrenchIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
const GastrobarLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout
  } = useAuth();
  const {
    showToast
  } = useToast();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([{
    id: 1,
    title: 'Stock bajo',
    message: '3 productos con stock bajo',
    time: '10 min',
    read: false
  }, {
    id: 2,
    title: 'Nuevo pedido',
    message: 'Mesa 5 - Orden #1234',
    time: '15 min',
    read: false
  }, {
    id: 3,
    title: 'Reservación confirmada',
    message: 'Reserva para 4 personas - 8:00 PM',
    time: '2 horas',
    read: true
  }]);
  // Función para manejar cierre de sesión
  const handleLogout = () => {
    logout();
    showToast('success', '¡Sesión cerrada correctamente!');
    navigate('/login');
  };
  // Marcar notificación como leída
  const markAsRead = id => {
    setNotifications(notifications.map(notification => notification.id === id ? {
      ...notification,
      read: true
    } : notification));
  };
  // Navegar a la página correspondiente según el rol
  const getNavigation = () => {
    const baseNavigation = [{
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboardIcon,
      roles: ['admin']
    }, {
      name: 'Métricas',
      href: '/metricas',
      icon: TrendingUpIcon,
      roles: ['admin']
    }, {
      name: 'Mesas',
      href: '/mesas',
      icon: ClipboardListIcon,
      roles: ['admin', 'waiter', 'mesero', 'cashier', 'cajero']
    }, {
      name: 'Órdenes',
      href: '/ordenes',
      icon: UtensilsIcon,
      roles: ['admin', 'waiter', 'mesero', 'cashier', 'cajero']
    }, {
      name: 'Menú',
      href: '/menu',
      icon: BookOpenIcon,
      roles: ['admin', 'cashier', 'cajero']
    }, {
      name: 'Reservas',
      href: '/reservaciones',
      icon: CalendarIcon,
      roles: ['admin', 'waiter', 'mesero', 'cashier', 'cajero']
    }, {
      name: 'Cocina',
      href: '/cocina',
      icon: ChefHatIcon,
      roles: ['admin', 'cook', 'cocinero', 'waiter', 'mesero']
    }, {
      name: 'Caja',
      href: '/caja',
      icon: DollarSignIcon,
      roles: ['admin', 'cashier', 'cajero']
    }, {
      name: 'Ajustes',
      href: '/configurar',
      icon: WrenchIcon,
      roles: ['admin']
    }];
    // Filtrar navegación según el rol del usuario
    return baseNavigation.filter(item => item.roles.includes(user?.role) || user?.role === 'admin');
  };
  // Obtener navegación filtrada
  const navigation = getNavigation();
  // Verificar si una ruta está activa
  const isActive = href => {
    return location.pathname === href;
  };
  // Utility function for soft buttons
  const softBtn = (color: string) => {
    const baseClasses = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200';
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      green: 'bg-green-100 text-green-700 hover:bg-green-200',
      amber: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      red: 'bg-red-100 text-red-700 hover:bg-red-200',
      gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    };
    return `${baseClasses} ${colorClasses[color] || colorClasses.gray}`;
  };
  // Utility function for gradient CTA buttons
  const ctaGrad = () => {
    return 'px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm flex items-center';
  };
  // Renderizar el layout
  return <div className="flex flex-col h-screen w-full bg-white">
      {/* Barra superior */}
      <header className="bg-white shadow-sm z-10 w-full">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <div className="bg-blue-600 text-white p-1.5 rounded">
              <UtensilsIcon size={20} />
            </div>
            <span className="text-lg font-bold text-blue-800 ml-2">
              Gastrobar POS
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <div className="relative">
              <button className="relative text-gray-500 hover:text-gray-700 p-1" onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}>
                <BellIcon size={20} />
                {notifications.some(n => !n.read) && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
              {isNotificationsOpen && <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Notificaciones
                    </h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(notification => <div key={notification.id} className={`px-4 py-3 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`} onClick={() => markAsRead(notification.id)}>
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {notification.time}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.message}
                          </p>
                        </div>) : <p className="px-4 py-3 text-sm text-gray-500">
                        No hay notificaciones
                      </p>}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      Marcar todas como leídas
                    </button>
                  </div>
                </div>}
            </div>
            {/* Perfil de usuario */}
            <div className="relative">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900" onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UsersIcon size={16} className="text-blue-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">
                    {user?.name?.replace(' Demo', '') || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'admin' ? 'Administrador' : user?.role === 'supervisor' ? 'Supervisor' : user?.role === 'cashier' ? 'Cajero' : user?.role === 'waiter' ? 'Mesero' : user?.role === 'cook' ? 'Cocinero/Bartender' : 'Usuario'}
                  </p>
                </div>
              </button>
              {isProfileOpen && <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200">
                  <Link to="/ajustes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsProfileOpen(false)}>
                    <div className="flex items-center">
                      <SettingsIcon size={16} className="mr-2" />
                      Ajustes
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <div className="flex items-center">
                      <LogOutIcon size={16} className="mr-2" />
                      Cerrar sesión
                    </div>
                  </button>
                </div>}
            </div>
          </div>
        </div>
      </header>
      {/* Área de contenido - Corregido para asegurar que el contenido sea visible */}
      <main className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Outlet context={{
          softBtn,
          ctaGrad
        }} />
        </div>
      </main>
      {/* Navegación inferior - Mejorada para distribución uniforme */}
      <nav className="bg-white border-t border-gray-200 sticky bottom-0 shadow-lg w-full">
        <div className="flex items-center justify-between h-16">
          {/* Menú principal con distribución uniforme */}
          <div className="flex w-full justify-between px-1">
            {navigation.map(item => <Link key={item.name} to={item.href} className={`flex flex-col items-center justify-center h-full ${isActive(item.href) ? 'text-blue-600 bg-blue-50 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} style={{
            flex: '1 1 0',
            minWidth: '60px',
            maxWidth: '80px'
          }}>
                <div className={`p-1 rounded-full ${isActive(item.href) ? 'bg-blue-100' : ''}`}>
                  <item.icon size={18} />
                </div>
                <span className="text-xs mt-1 font-medium truncate w-full text-center px-1">
                  {item.name}
                </span>
              </Link>)}
          </div>
        </div>
      </nav>
    </div>;
};
export default GastrobarLayout;