import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUpIcon, DollarSignIcon, UsersIcon, ShoppingBagIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
// Mock data for charts
const weeklyData = [{
  name: 'Lun',
  ventas: 12000,
  ordenes: 24
}, {
  name: 'Mar',
  ventas: 19000,
  ordenes: 32
}, {
  name: 'Mié',
  ventas: 15000,
  ordenes: 28
}, {
  name: 'Jue',
  ventas: 22000,
  ordenes: 38
}, {
  name: 'Vie',
  ventas: 32000,
  ordenes: 42
}, {
  name: 'Sáb',
  ventas: 38000,
  ordenes: 48
}, {
  name: 'Dom',
  ventas: 25000,
  ordenes: 36
}];
const monthlyData = [{
  name: 'Ene',
  ventas: 250000
}, {
  name: 'Feb',
  ventas: 300000
}, {
  name: 'Mar',
  ventas: 280000
}, {
  name: 'Abr',
  ventas: 320000
}, {
  name: 'May',
  ventas: 340000
}, {
  name: 'Jun',
  ventas: 380000
}];
const topProducts = [{
  name: 'Hamburguesa Clásica',
  cantidad: 48,
  total: 576000
}, {
  name: 'Pizza Margarita',
  cantidad: 36,
  total: 468000
}, {
  name: 'Cerveza Artesanal',
  cantidad: 124,
  total: 372000
}, {
  name: 'Ensalada César',
  cantidad: 28,
  total: 252000
}, {
  name: 'Pasta Carbonara',
  cantidad: 22,
  total: 242000
}];
const AnalyticsDashboardPage = () => {
  return <div className="w-full bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Métricas y Análisis
        </h1>
        <p className="text-gray-600 mt-1">
          Visualiza el rendimiento de tu negocio
        </p>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Ventas Hoy" value="$285,400" change="+15.3%" isPositive={true} icon={<DollarSignIcon size={20} />} color="blue" />
        <KpiCard title="Órdenes" value="42" change="+8.1%" isPositive={true} icon={<ShoppingBagIcon size={20} />} color="green" />
        <KpiCard title="Ticket Promedio" value="$6,795" change="+2.5%" isPositive={true} icon={<TrendingUpIcon size={20} />} color="amber" />
        <KpiCard title="Clientes Nuevos" value="8" change="-3.2%" isPositive={false} icon={<UsersIcon size={20} />} color="indigo" />
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Ventas de la Semana
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={value => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="ventas" name="Ventas ($)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Tendencia Mensual
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={value => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="ventas" name="Ventas ($)" stroke="#3b82f6" activeDot={{
                r: 8
              }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Top Products Table */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Productos Más Vendidos
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((product, index) => <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.cantidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.total.toLocaleString()}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};
const KpiCard = ({
  title,
  value,
  change,
  isPositive,
  icon,
  color
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };
  return <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-md ${colorClasses[color]}`}>{icon}</div>
        <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpIcon size={14} className="mr-1" /> : <ArrowDownIcon size={14} className="mr-1" />}
          <span>{change}</span>
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>;
};
export default AnalyticsDashboardPage;