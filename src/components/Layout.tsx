import React, { useEffect, useState, useRef, cloneElement, Component } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, ReceiptIcon, DollarSignIcon, BarChartIcon, SettingsIcon, LogOutIcon, MenuIcon, ChevronDownIcon, BellIcon, CheckIcon, AlertCircleIcon, InfoIcon, ShieldIcon, ClockIcon, XIcon, UtensilsIcon, BookOpenIcon, TableIcon, CalendarIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
// Mock notifications data - solo relacionadas con gastrobar
const mockNotifications = [{
  id: 'notif-1',
  title: 'Mesa lista',
  message: 'La mesa 5 está lista para ser atendida',
  type: 'info',
  read: false,
  timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  link: '/mesas'
}, {
  id: 'notif-2',
  title: 'Orden lista',
  message: 'La orden #1234 está lista para ser servida',
  type: 'info',
  read: false,
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  link: '/ordenes'
}, {
  id: 'notif-3',
  title: 'Cierre de caja',
  message: 'Recuerda cerrar la caja al finalizar tu turno',
  type: 'info',
  read: true,
  timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  link: '/caja'
}, {
  id: 'notif-4',
  title: 'Nueva reservación',
  message: 'Se ha registrado una nueva reservación para hoy a las 8:00 PM',
  type: 'system',
  read: true,
  timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  link: '/reservaciones'
}, {
  id: 'notif-5',
  title: 'Producto agotado',
  message: 'El plato "Lomo Saltado" se ha agotado',
  type: 'warning',
  read: false,
  timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  link: '/menu'
}];
const Layout: React.FC = () => {
  const {
    user,
    logout
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  // State to track if mobile sidebar is open
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? {
      ...notification,
      read: true
    } : notification));
  };
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
  };
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  const handleNotificationClick = notification => {
    markNotificationAsRead(notification.id);
    setShowNotifications(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };
  // Close notifications when clicking outside
  const notificationRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationRef]);
  // Determinar qué elementos del menú mostrar según el rol
  const showReports = user?.role === 'admin';
  const showSettings = user?.role === 'admin';
  // Get active section for highlighting in mobile menu
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('dashboard') || path === '/') return 'dashboard';
    if (path.includes('ordenes')) return 'ordenes';
    if (path.includes('caja')) return 'caja';
    if (path.includes('menu')) return 'menu';
    if (path.includes('mesas')) return 'mesas';
    if (path.includes('reservaciones')) return 'reservaciones';
    if (path.includes('metricas')) return 'metricas';
    if (path.includes('cocina')) return 'cocina';
    if (path.includes('configurar')) return 'configurar';
    return '';
  };
  return <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Header - Improved with shadow and user menu */}
      <header className="bg-blue-600 text-white p-3 shadow-lg sticky top-0 z-10 w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button className="p-1.5 rounded-full hover:bg-blue-700 transition-colors md:hidden mr-2" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
              <MenuIcon size={20} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">GastroBar</h1>
            <span className="bg-blue-500 text-xs px-2 py-0.5 rounded-full ml-2 hidden sm:inline-block">
              v1.0
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button className="p-1.5 rounded-full hover:bg-blue-700 transition-colors" onClick={() => setShowNotifications(!showNotifications)}>
                <BellIcon size={20} />
                {unreadNotificationsCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadNotificationsCount}
                  </span>}
              </button>
              {/* Notifications dropdown */}
              {showNotifications && <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg overflow-hidden z-20">
                  <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">
                      Notificaciones
                    </h3>
                    {unreadNotificationsCount > 0 && <button className="text-xs text-blue-600 hover:text-blue-800" onClick={markAllNotificationsAsRead}>
                        Marcar todas como leídas
                      </button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? <div className="divide-y divide-gray-100">
                        {notifications.map(notification => <div key={notification.id} className={`p-3 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}>
                            <div className="flex justify-between">
                              <div className="flex-1 pr-2" onClick={() => handleNotificationClick(notification)}>
                                <div className="flex items-start">
                                  <div className="mt-0.5 mr-2">
                                    {notification.type === 'warning' && <AlertCircleIcon size={16} className="text-amber-500" />}
                                    {notification.type === 'info' && <InfoIcon size={16} className="text-blue-500" />}
                                    {notification.type === 'error' && <AlertCircleIcon size={16} className="text-red-500" />}
                                    {notification.type === 'system' && <ShieldIcon size={16} className="text-purple-500" />}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center">
                                      <ClockIcon size={12} className="mr-1" />
                                      {formatNotificationTime(notification.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <button className="text-gray-400 hover:text-gray-600" onClick={() => deleteNotification(notification.id)}>
                                <XIcon size={14} />
                              </button>
                            </div>
                          </div>)}
                      </div> : <div className="p-4 text-center text-gray-500">
                        No hay notificaciones
                      </div>}
                  </div>
                </div>}
            </div>
            {/* User menu */}
            <div className="relative group">
              <button className="flex items-center space-x-1 p-1.5 rounded-full hover:bg-blue-700 transition-colors">
                <div className="w-7 h-7 bg-blue-300 rounded-full flex items-center justify-center text-blue-800 font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm hidden sm:inline-block max-w-[100px] truncate">
                  {user?.name}
                </span>
                <ChevronDownIcon size={14} className="hidden sm:block" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 hidden group-hover:block z-20">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'admin' ? 'Administrador' : user?.role === 'supervisor' ? 'Supervisor' : user?.role === 'cashier' || user?.role === 'cajero' ? 'Cajero' : user?.role === 'waiter' || user?.role === 'mesero' ? 'Mesero' : user?.role === 'cook' || user?.role === 'cocinero' ? 'Cocinero' : 'Usuario'}
                  </p>
                </div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <LogOutIcon size={16} className="mr-2" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Mobile Sidebar */}
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Menú</h2>
              <button className="p-1 rounded-full hover:bg-gray-100" onClick={() => setMobileSidebarOpen(false)}>
                <XIcon size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-1">
              <MobileSidebarItem to="/dashboard" icon={<HomeIcon size={20} />} label="Inicio" active={getActiveSection() === 'dashboard'} onClick={() => setMobileSidebarOpen(false)} />
              <MobileSidebarItem to="/mesas" icon={<TableIcon size={20} />} label="Mesas" active={getActiveSection() === 'mesas'} onClick={() => setMobileSidebarOpen(false)} />
              <MobileSidebarItem to="/ordenes" icon={<ReceiptIcon size={20} />} label="Órdenes" active={getActiveSection() === 'ordenes'} onClick={() => setMobileSidebarOpen(false)} />
              <MobileSidebarItem to="/caja" icon={<DollarSignIcon size={20} />} label="Caja" active={getActiveSection() === 'caja'} onClick={() => setMobileSidebarOpen(false)} />
              <MobileSidebarItem to="/menu" icon={<BookOpenIcon size={20} />} label="Menú" active={getActiveSection() === 'menu'} onClick={() => setMobileSidebarOpen(false)} />
              <MobileSidebarItem to="/cocina" icon={<UtensilsIcon size={20} />} label="Cocina" active={getActiveSection() === 'cocina'} onClick={() => setMobileSidebarOpen(false)} />
              <MobileSidebarItem to="/reservaciones" icon={<CalendarIcon size={20} />} label="Reservaciones" active={getActiveSection() === 'reservaciones'} onClick={() => setMobileSidebarOpen(false)} />
              {user?.role === 'admin' && <MobileSidebarItem to="/metricas" icon={<BarChartIcon size={20} />} label="Métricas" active={getActiveSection() === 'metricas'} onClick={() => setMobileSidebarOpen(false)} />}
              {showSettings && <MobileSidebarItem to="/configurar" icon={<SettingsIcon size={20} />} label="Configuración" active={getActiveSection() === 'configurar'} onClick={() => setMobileSidebarOpen(false)} />}
            </div>
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors">
                <LogOutIcon size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>}
      {/* Main content - Added padding and max width for better readability */}
      <main className="flex-1 overflow-auto p-3 sm:p-4 mx-auto w-full max-w-6xl bg-white">
        <div className="bg-white w-full h-full">
          <Outlet />
        </div>
      </main>
      {/* Bottom navigation - Improved with active indicators and transitions */}
      <nav className="bg-white border-t border-gray-200 overflow-x-auto shadow-[0_-2px_10px_rgba(0,0,0,0.05)] sticky bottom-0 w-full">
        <div className="flex justify-around min-w-max">
          <NavItem to="/dashboard" icon={<HomeIcon size={20} />} label="Inicio" active={location.pathname === '/dashboard'} />
          <NavItem to="/mesas" icon={<TableIcon size={20} />} label="Mesas" active={location.pathname === '/mesas'} />
          <NavItem to="/ordenes" icon={<ReceiptIcon size={20} />} label="Órdenes" active={location.pathname === '/ordenes'} />
          <NavItem to="/caja" icon={<DollarSignIcon size={20} />} label="Caja" active={location.pathname === '/caja'} />
          <NavItem to="/menu" icon={<BookOpenIcon size={20} />} label="Menú" active={location.pathname === '/menu'} />
          <NavItem to="/cocina" icon={<UtensilsIcon size={20} />} label="Cocina" active={location.pathname === '/cocina'} />
          <NavItem to="/reservaciones" icon={<CalendarIcon size={20} />} label="Reservaciones" active={location.pathname === '/reservaciones'} />
          {user?.role === 'admin' && <NavItem to="/metricas" icon={<BarChartIcon size={20} />} label="Métricas" active={location.pathname === '/metricas'} />}
          {showSettings && <NavItem to="/configurar" icon={<SettingsIcon size={20} />} label="Ajustes" active={location.pathname === '/configurar'} />}
        </div>
      </nav>
    </div>;
};
// Mobile Sidebar Item component
const MobileSidebarItem = ({
  to,
  icon,
  label,
  active,
  onClick
}) => <Link to={to} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={onClick}>
    {cloneElement(icon, {
    size: 20
  })}
    <span className="font-medium">{label}</span>
  </Link>;
// Format notification time to relative time (e.g., "2 hours ago")
const formatNotificationTime = (timestamp: string) => {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffMs = now.getTime() - notificationTime.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffSecs < 60) {
    return 'Justo ahora';
  } else if (diffMins < 60) {
    return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffDays < 7) {
    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  } else {
    return notificationTime.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }
};
// Componente para los items de navegación - Enhanced with better visual feedback
const NavItem = ({
  to,
  icon,
  label,
  active
}) => <Link to={to} className={`flex flex-col items-center py-2 px-4 relative transition-colors ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
    <div className={`p-1.5 rounded-full ${active ? 'bg-blue-100' : ''}`}>
      {cloneElement(icon, {
      size: 20
    })}
    </div>
    <span className="text-xs mt-1 font-medium whitespace-nowrap">{label}</span>
    {active && <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-t-full" />}
  </Link>;
export default Layout;