import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboardIcon, UsersIcon, DollarSignIcon, BookOpenIcon, TrendingUpIcon, CalendarIcon, UtensilsIcon } from 'lucide-react';
const DashboardPage = () => {
  const {
    user
  } = useAuth();
  const isAdmin = user?.role === 'admin';
  return <div className="w-full h-full bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, {user?.name || 'Usuario'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? 'Panel de control administrativo' : user?.role === 'cashier' || user?.role === 'cajero' ? 'Panel de caja' : user?.role === 'waiter' || user?.role === 'mesero' ? 'Panel de mesero' : user?.role === 'cook' || user?.role === 'cocinero' ? 'Panel de cocina' : 'Panel de usuario'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Quick access cards */}
        <QuickAccessCard title="Órdenes" description="Gestionar órdenes activas" icon={<UtensilsIcon size={24} />} color="blue" link="/ordenes" />
        <QuickAccessCard title="Caja" description="Gestión de caja y pagos" icon={<DollarSignIcon size={24} />} color="green" link="/caja" />
        <QuickAccessCard title="Menú" description="Gestionar productos y categorías" icon={<BookOpenIcon size={24} />} color="amber" link="/menu" />
        {isAdmin && <>
            <QuickAccessCard title="Métricas" description="Estadísticas y reportes" icon={<TrendingUpIcon size={24} />} color="purple" link="/metricas" />
            <QuickAccessCard title="Configuración" description="Ajustes del sistema" icon={<LayoutDashboardIcon size={24} />} color="gray" link="/configurar" />
          </>}
        <QuickAccessCard title="Reservaciones" description="Gestionar reservas" icon={<CalendarIcon size={24} />} color="indigo" link="/reservaciones" />
      </div>

      {/* Status Summary */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Resumen del día
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard title="Órdenes hoy" value="12" trend="+3" />
          <StatusCard title="Ventas" value="$285,400" trend="+15%" />
          <StatusCard title="Mesas ocupadas" value="4/12" trend="33%" />
        </div>
      </div>
    </div>;
};
const QuickAccessCard = ({
  title,
  description,
  icon,
  color,
  link
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };
  return <a href={link} className={`block p-4 rounded-lg border ${colorClasses[color] || colorClasses.gray} hover:shadow-md transition-shadow`}>
      <div className="flex items-start">
        <div className={`p-2 rounded-lg ${color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : color === 'amber' ? 'bg-amber-100' : color === 'purple' ? 'bg-purple-100' : color === 'indigo' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </a>;
};
const StatusCard = ({
  title,
  value,
  trend
}) => {
  const isPositive = trend.startsWith('+');
  return <div className="bg-white p-3 rounded-md shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="flex items-end justify-between mt-1">
        <p className="text-xl font-bold text-gray-800">{value}</p>
        <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </p>
      </div>
    </div>;
};
export default DashboardPage;