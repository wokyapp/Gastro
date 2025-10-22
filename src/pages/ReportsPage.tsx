import React, { useEffect, useState, createElement } from 'react';
import { useToast } from '../contexts/ToastContext';
import { BarChartIcon, LineChartIcon, ArrowUpIcon, ArrowDownIcon, RefreshCcwIcon, DownloadIcon, CalendarIcon, FilterIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
// Datos de muestra más completos para los reportes
const mockSales = [{
  id: 'SALE-001',
  date: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString(),
  items: [{
    productId: '1',
    quantity: 2,
    price: 5600,
    taxRate: 0.05
  }, {
    productId: '4',
    quantity: 1,
    price: 3800,
    taxRate: 0
  }],
  subtotal: 15000,
  taxes: 560,
  total: 15560,
  paymentMethod: 'efectivo',
  cashierId: '1',
  posId: 'POS-001',
  invoiceRequested: false
}, {
  id: 'SALE-002',
  date: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString(),
  items: [{
    productId: '2',
    quantity: 1,
    price: 8900,
    taxRate: 0.19
  }, {
    productId: '5',
    quantity: 2,
    price: 12500,
    taxRate: 0.19
  }],
  subtotal: 33900,
  taxes: 6441,
  total: 40341,
  paymentMethod: 'tarjeta',
  cashierId: '2',
  posId: 'POS-001',
  invoiceRequested: true
}, {
  id: 'SALE-003',
  date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
  items: [{
    productId: '3',
    quantity: 3,
    price: 4200,
    taxRate: 0.05
  }, {
    productId: '1',
    quantity: 1,
    price: 5600,
    taxRate: 0.05
  }],
  subtotal: 18200,
  taxes: 910,
  total: 19110,
  paymentMethod: 'efectivo',
  cashierId: '1',
  posId: 'POS-002',
  invoiceRequested: false
}, {
  id: 'SALE-004',
  date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
  items: [{
    productId: '5',
    quantity: 1,
    price: 12500,
    taxRate: 0.19
  }, {
    productId: '2',
    quantity: 2,
    price: 8900,
    taxRate: 0.19
  }],
  subtotal: 30300,
  taxes: 5757,
  total: 36057,
  paymentMethod: 'tarjeta',
  cashierId: '2',
  posId: 'POS-002',
  invoiceRequested: true
}, {
  id: 'SALE-005',
  date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
  items: [{
    productId: '1',
    quantity: 2,
    price: 5600,
    taxRate: 0.05
  }, {
    productId: '3',
    quantity: 1,
    price: 4200,
    taxRate: 0.05
  }, {
    productId: '4',
    quantity: 3,
    price: 3800,
    taxRate: 0
  }],
  subtotal: 26800,
  taxes: 770,
  total: 27570,
  paymentMethod: 'efectivo',
  cashierId: '1',
  posId: 'POS-001',
  invoiceRequested: false
}, {
  id: 'SALE-006',
  date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
  items: [{
    productId: '2',
    quantity: 1,
    price: 8900,
    taxRate: 0.19
  }, {
    productId: '5',
    quantity: 1,
    price: 12500,
    taxRate: 0.19
  }],
  subtotal: 21400,
  taxes: 4066,
  total: 25466,
  paymentMethod: 'tarjeta',
  cashierId: '1',
  posId: 'POS-002',
  invoiceRequested: false
}, {
  id: 'SALE-007',
  date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  items: [{
    productId: '4',
    quantity: 2,
    price: 3800,
    taxRate: 0
  }, {
    productId: '1',
    quantity: 1,
    price: 5600,
    taxRate: 0.05
  }, {
    productId: '3',
    quantity: 2,
    price: 4200,
    taxRate: 0.05
  }],
  subtotal: 21600,
  taxes: 700,
  total: 22300,
  paymentMethod: 'efectivo',
  cashierId: '2',
  posId: 'POS-001',
  invoiceRequested: false
}, {
  id: 'SALE-008',
  date: new Date().toISOString(),
  items: [{
    productId: '5',
    quantity: 1,
    price: 12500,
    taxRate: 0.19
  }, {
    productId: '2',
    quantity: 1,
    price: 8900,
    taxRate: 0.19
  }, {
    productId: '1',
    quantity: 2,
    price: 5600,
    taxRate: 0.05
  }],
  subtotal: 32600,
  taxes: 4081,
  total: 36681,
  paymentMethod: 'tarjeta',
  cashierId: '1',
  posId: 'POS-002',
  invoiceRequested: true
}, {
  id: 'SALE-009',
  date: new Date().toISOString(),
  items: [{
    productId: '3',
    quantity: 3,
    price: 4200,
    taxRate: 0.05
  }, {
    productId: '4',
    quantity: 2,
    price: 3800,
    taxRate: 0
  }],
  subtotal: 20200,
  taxes: 630,
  total: 20830,
  paymentMethod: 'efectivo',
  cashierId: '2',
  posId: 'POS-001',
  invoiceRequested: false
}, {
  id: 'SALE-010',
  date: new Date().toISOString(),
  items: [{
    productId: '5',
    quantity: 2,
    price: 12500,
    taxRate: 0.19
  }],
  subtotal: 25000,
  taxes: 4750,
  total: 29750,
  paymentMethod: 'tarjeta',
  cashierId: '1',
  posId: 'POS-002',
  invoiceRequested: true
}];
const mockRefunds = [{
  id: 'REF-001',
  date: new Date(new Date().setDate(new Date().getDate() - 13)).toISOString(),
  saleId: 'SALE-001',
  amount: 5600,
  reason: 'Producto defectuoso',
  status: 'success',
  cashierId: '2',
  posId: 'POS-001'
}, {
  id: 'REF-002',
  date: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(),
  saleId: 'SALE-002',
  amount: 12500,
  reason: 'Cliente insatisfecho',
  status: 'success',
  cashierId: '1',
  posId: 'POS-001'
}, {
  id: 'REF-003',
  date: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
  saleId: 'SALE-003',
  amount: 4200,
  reason: 'Error en cobro',
  status: 'pending',
  cashierId: '2',
  posId: 'POS-002'
}, {
  id: 'REF-004',
  date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
  saleId: 'SALE-005',
  amount: 3800,
  reason: 'Producto equivocado',
  status: 'failed',
  cashierId: '1',
  posId: 'POS-001'
}, {
  id: 'REF-005',
  date: new Date().toISOString(),
  saleId: 'SALE-008',
  amount: 8900,
  reason: 'Devolución cliente',
  status: 'success',
  cashierId: '2',
  posId: 'POS-002'
}];
const ReportsPage: React.FC = () => {
  const {
    showToast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0] // hoy
  });
  const [activeTab, setActiveTab] = useState<'sales' | 'refunds'>('sales');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  // Colores para gráficos
  const COLORS = ['#2563EB', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSales(mockSales);
      setRefunds(mockRefunds);
      setLoading(false);
    };
    loadData();
  }, []);
  // Filtrar ventas por fecha y método de pago
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.date).toISOString().split('T')[0];
    const dateMatch = saleDate >= dateRange.start && saleDate <= dateRange.end;
    const paymentMatch = paymentMethodFilter === 'all' || sale.paymentMethod === paymentMethodFilter;
    return dateMatch && paymentMatch;
  });
  // Filtrar reembolsos por fecha
  const filteredRefunds = refunds.filter(refund => {
    const refundDate = new Date(refund.date).toISOString().split('T')[0];
    return refundDate >= dateRange.start && refundDate <= dateRange.end;
  });
  // Calcular KPIs
  const calculateKPIs = () => {
    // Ventas del día de hoy
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => new Date(sale.date).toISOString().split('T')[0] === today);
    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    // Ticket promedio
    const avgTicket = filteredSales.length > 0 ? filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length : 0;
    // Porcentaje reembolsado
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalRefunds = filteredRefunds.reduce((sum, refund) => sum + refund.amount, 0);
    const refundPercent = totalSales > 0 ? totalRefunds / totalSales * 100 : 0;
    // Ventas por método de pago
    const cashSales = filteredSales.filter(sale => sale.paymentMethod === 'efectivo').reduce((sum, sale) => sum + sale.total, 0);
    const cardSales = filteredSales.filter(sale => sale.paymentMethod === 'tarjeta').reduce((sum, sale) => sum + sale.total, 0);
    // Total de ventas en el período seleccionado
    const periodTotal = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    // Total de transacciones en el período
    const transactionCount = filteredSales.length;
    return {
      todayTotal,
      avgTicket,
      refundPercent,
      cashSales,
      cardSales,
      periodTotal,
      transactionCount
    };
  };
  // Preparar datos para gráficos
  const prepareChartData = () => {
    // Ventas por día
    const salesByDay = {};
    filteredSales.forEach(sale => {
      const date = new Date(sale.date).toISOString().split('T')[0];
      if (!salesByDay[date]) {
        salesByDay[date] = 0;
      }
      salesByDay[date] += sale.total;
    });
    const dailySalesData = Object.keys(salesByDay).sort().map(date => ({
      date: new Date(date).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit'
      }),
      ventas: salesByDay[date]
    }));
    // Ventas por hora (hoy)
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => new Date(sale.date).toISOString().split('T')[0] === today);
    const salesByHour = {};
    for (let i = 8; i <= 20; i++) {
      salesByHour[i] = 0;
    }
    todaySales.forEach(sale => {
      const hour = new Date(sale.date).getHours();
      if (salesByHour[hour] !== undefined) {
        salesByHour[hour] += sale.total;
      }
    });
    const hourlySalesData = Object.keys(salesByHour).map(hour => ({
      hora: `${hour}:00`,
      ventas: salesByHour[hour]
    }));
    // Ventas por método de pago (para gráfico circular)
    const salesByMethod = [{
      name: 'Efectivo',
      value: filteredSales.filter(sale => sale.paymentMethod === 'efectivo').reduce((sum, sale) => sum + sale.total, 0)
    }, {
      name: 'Tarjeta',
      value: filteredSales.filter(sale => sale.paymentMethod === 'tarjeta').reduce((sum, sale) => sum + sale.total, 0)
    }, {
      name: 'Nequi',
      value: filteredSales.filter(sale => sale.paymentMethod === 'nequi').reduce((sum, sale) => sum + sale.total, 0) + 45000 // Simulado
    }, {
      name: 'Daviplata',
      value: filteredSales.filter(sale => sale.paymentMethod === 'daviplata').reduce((sum, sale) => sum + sale.total, 0) + 30000 // Simulado
    }, {
      name: 'Otros digital',
      value: filteredSales.filter(sale => sale.paymentMethod !== 'efectivo' && sale.paymentMethod !== 'tarjeta' && sale.paymentMethod !== 'nequi' && sale.paymentMethod !== 'daviplata').reduce((sum, sale) => sum + sale.total, 0) + 10000 // Simulado
    }];
    // Productos más vendidos
    const productSales = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            id: item.productId,
            name: `Producto ${item.productId}`,
            quantity: 0,
            total: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].total += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a: any, b: any) => b.total - a.total).slice(0, 5);
    return {
      dailySalesData,
      hourlySalesData,
      salesByMethod,
      topProducts
    };
  };
  const kpis = calculateKPIs();
  const chartData = prepareChartData();
  // Ver detalle de venta
  const handleViewSale = (sale: any) => {
    setSelectedSale(sale);
    setShowSaleModal(true);
  };
  // Exportar datos
  const handleExport = (type: 'sales' | 'refunds') => {
    showToast('info', `Exportando ${type === 'sales' ? 'ventas' : 'reembolsos'}...`);
    // Simulación de exportación
    setTimeout(() => {
      // Crear un CSV básico para la descarga
      const dataToExport = type === 'sales' ? filteredSales : filteredRefunds;
      let csvContent = 'data:text/csv;charset=utf-8,';
      // Encabezados
      if (type === 'sales') {
        csvContent += 'ID,Fecha,Total,Método,Cajero,POS\n';
        // Datos
        dataToExport.forEach(item => {
          csvContent += `${item.id},${new Date(item.date).toLocaleDateString()},${item.total},${item.paymentMethod},${item.cashierId},${item.posId}\n`;
        });
      } else {
        csvContent += 'ID,Fecha,Venta,Monto,Estado\n';
        // Datos
        dataToExport.forEach(item => {
          csvContent += `${item.id},${new Date(item.date).toLocaleDateString()},${item.saleId},${item.amount},${item.status}\n`;
        });
      }
      // Crear y simular clic en enlace de descarga
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${type === 'sales' ? 'ventas' : 'reembolsos'}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', `${type === 'sales' ? 'Ventas' : 'Reembolsos'} exportados correctamente`);
    }, 1500);
  };
  // Renderizar contenido
  const renderContent = () => {
    if (loading) {
      return <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton height={100} className="rounded-xl" count={4} />
          </div>
          <Skeleton height={300} className="rounded-xl" />
          <Skeleton height={300} className="rounded-xl" />
        </div>;
    }
    return <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Ventas hoy</p>
            <p className="text-xl font-semibold text-gray-800">
              {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP'
            }).format(kpis.todayTotal)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Ventas período</p>
            <p className="text-xl font-semibold text-gray-800">
              {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP'
            }).format(kpis.periodTotal)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Ticket promedio</p>
            <p className="text-xl font-semibold text-gray-800">
              {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP'
            }).format(kpis.avgTicket)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {kpis.transactionCount} transacciones
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500 mb-1">% Reembolsado</p>
            <p className="text-xl font-semibold text-gray-800">
              {kpis.refundPercent.toFixed(2)}%
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="h-3 bg-blue-500 rounded-full" style={{
              width: `${100 - kpis.refundPercent}%`
            }}></div>
              <div className="h-3 bg-red-500 rounded-full" style={{
              width: `${kpis.refundPercent}%`
            }}></div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ventas por día */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <LineChartIcon size={20} className="mr-2 text-blue-600" />
              Ventas por día
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.dailySalesData} margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={value => new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP'
                }).format(value as number)} />
                  <Line type="monotone" dataKey="ventas" stroke="#2563EB" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ventas por hora */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChartIcon size={20} className="mr-2 text-blue-600" />
              Ventas por hora (hoy)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.hourlySalesData} margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip formatter={value => new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP'
                }).format(value as number)} />
                  <Bar dataKey="ventas" fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChartIcon size={20} className="mr-2 text-blue-600" />
              Ventas por método de pago
            </h3>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.salesByMethod} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({
                  name,
                  percent
                }) => {
                  // Only show percentage in the pie segments to avoid overlap
                  return `${(percent * 100).toFixed(0)}%`;
                }} paddingAngle={2}>
                    {chartData.salesByMethod.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{
                  paddingLeft: '20px',
                  fontSize: '12px'
                }} formatter={(value, entry, index) => {
                  // Format the legend text to show name and percentage
                  const item = chartData.salesByMethod[index];
                  const total = chartData.salesByMethod.reduce((sum, item) => sum + item.value, 0);
                  const percent = total > 0 ? (item.value / total * 100).toFixed(1) : 0;
                  return <span className="text-xs">
                          {value}: {percent}%
                        </span>;
                }} />
                  <Tooltip formatter={value => new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP'
                }).format(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Productos más vendidos */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChartIcon size={20} className="mr-2 text-blue-600" />
              Productos más vendidos
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.topProducts} layout="vertical" margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip formatter={value => new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP'
                }).format(value as number)} />
                  <Bar dataKey="total" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabs para ventas y reembolsos */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'sales' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('sales')}>
              Ventas
            </button>
            <button className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'refunds' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('refunds')}>
              Reembolsos
            </button>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <div className="flex space-x-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon size={16} className="text-gray-400" />
                  </div>
                  <input type="date" value={dateRange.start} onChange={e => setDateRange({
                  ...dateRange,
                  start: e.target.value
                })} className="pl-10 py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon size={16} className="text-gray-400" />
                  </div>
                  <input type="date" value={dateRange.end} onChange={e => setDateRange({
                  ...dateRange,
                  end: e.target.value
                })} className="pl-10 py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              {activeTab === 'sales' && <div className="flex items-center">
                  <label htmlFor="paymentMethod" className="mr-2 text-sm text-gray-600">
                    Método de pago:
                  </label>
                  <select id="paymentMethod" value={paymentMethodFilter} onChange={e => setPaymentMethodFilter(e.target.value)} className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">Todos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="digital">Otros digital</option>
                  </select>
                </div>}
            </div>
            {activeTab === 'sales' && <div className="overflow-x-auto -mx-4 px-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cajero
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.length > 0 ? filteredSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(sale.date).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sale.paymentMethod === 'efectivo' ? 'bg-green-100 text-green-800' : sale.paymentMethod === 'tarjeta' ? 'bg-purple-100 text-purple-800' : sale.paymentMethod === 'nequi' ? 'bg-pink-100 text-pink-800' : sale.paymentMethod === 'daviplata' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {sale.paymentMethod === 'efectivo' ? 'Efectivo' : sale.paymentMethod === 'tarjeta' ? 'Tarjeta' : sale.paymentMethod === 'nequi' ? 'Nequi' : sale.paymentMethod === 'daviplata' ? 'Daviplata' : 'Digital'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.cashierId === '1' ? 'Cajero Demo' : 'Supervisor Demo'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                              {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(sale.total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => handleViewSale(sale)} className="text-blue-600 hover:text-blue-900">
                                Ver
                              </button>
                            </td>
                          </tr>) : <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                          No hay ventas en el período seleccionado
                          {paymentMethodFilter !== 'all' && ` con método de pago ${paymentMethodFilter}`}
                        </td>
                      </tr>}
                  </tbody>
                </table>
              </div>}
            {activeTab === 'refunds' && <div className="overflow-x-auto -mx-4 px-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Venta
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRefunds.length > 0 ? filteredRefunds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(refund => <tr key={refund.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(refund.date).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {refund.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {refund.saleId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${refund.status === 'success' ? 'bg-green-100 text-green-800' : refund.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                {refund.status === 'success' ? 'Exitoso' : refund.status === 'pending' ? 'Pendiente' : 'Fallido'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                              {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(refund.amount)}
                            </td>
                          </tr>) : <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                          No hay reembolsos en el período seleccionado
                        </td>
                      </tr>}
                  </tbody>
                </table>
              </div>}
          </div>
        </div>
      </div>;
  };
  return <div className="h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Reportes</h1>
      {renderContent()}
      {/* Modal para ver detalles de venta */}
      <SaleDetailModal isOpen={showSaleModal} onClose={() => setShowSaleModal(false)} sale={selectedSale} />
    </div>;
};
// Modal para ver detalles de venta
const SaleDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}> = ({
  isOpen,
  onClose,
  sale
}) => {
  const {
    showToast
  } = useToast();
  if (!sale) return null;
  const handleRefund = () => {
    showToast('info', 'Redirigiendo al flujo de reembolso...');
    onClose();
    // En un caso real, aquí se redireccionaría a la página de reembolso
    setTimeout(() => {
      window.location.href = `/reembolso/${sale.id}`;
    }, 1000);
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={`Detalle de venta: ${sale.id}`} footer={<div className="flex justify-end space-x-2">
          <button type="button" onClick={handleRefund} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center">
            <RefreshCcwIcon size={16} className="mr-1" />
            Reembolsar
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Cerrar
          </button>
        </div>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="font-medium">
              {new Date(sale.date).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">POS ID</p>
            <p className="font-medium">{sale.posId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Método de pago</p>
            <p className="font-medium capitalize">
              {sale.paymentMethod === 'efectivo' ? 'Efectivo' : sale.paymentMethod === 'tarjeta' ? 'Tarjeta' : sale.paymentMethod === 'nequi' ? 'Nequi' : sale.paymentMethod === 'daviplata' ? 'Daviplata' : 'Digital'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cajero</p>
            <p className="font-medium">
              {sale.cashierId === '1' ? 'Cajero Demo' : 'Supervisor Demo'}
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-800 mb-2">Productos</h4>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cant.
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IVA
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sale.items.map((item, index) => {
                const productTotal = item.price * item.quantity;
                const productTax = productTotal * item.taxRate;
                return <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Producto {item.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {(item.taxRate * 100).toFixed(0)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(productTotal)}
                      </td>
                    </tr>;
              })}
              </tbody>
              <tfoot className="border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                    Subtotal:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                  }).format(sale.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                    IVA:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                  }).format(sale.taxes)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                  }).format(sale.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        {sale.invoiceRequested && <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-800 mb-2">
              Datos de facturación
            </h4>
            <p className="text-sm">
              <span className="text-gray-500">Documento: </span>
              {sale.documentType} {sale.documentNumber}
            </p>
          </div>}
      </div>
    </Modal>;
};
export default ReportsPage;