import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

import {
  BarChartIcon,
  LineChartIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCcwIcon,
  DownloadIcon,
  CalendarIcon,
  SearchIcon,
  PrinterIcon,
  UtensilsIcon,
  GlassWaterIcon,
  UserIcon,
  TableIcon,
  DollarSignIcon,
  XIcon
} from 'lucide-react';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// =======================
// Tipos
// =======================
type PaymentMeta = {
  cardType?: 'credito' | 'debito';
  surchargePct?: number;
  surchargeAmount?: number;
  authCode?: string;
  last4?: string;
  txnCode?: string; // nequi/daviplata/transfer/other
};

type Sale = {
  id: string;
  date: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    taxRate: number;
    name?: string;
    category?: 'food' | 'drink';
  }[];
  subtotal: number;
  taxes: number;
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'nequi' | 'daviplata' | 'transfer' | 'other';
  cashierId: string;
  posId: string;
  invoiceRequested: boolean;
  tableNumber?: number;
  waiter?: string;
  documentType?: string;
  documentNumber?: string;
  paymentMeta?: PaymentMeta; // <- NUEVO opcional
};

// =======================
// Mock data (se conserva)
// =======================
const mockSales: Sale[] = [
  {
    id: 'SALE-001',
    date: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString(),
    items: [
      { productId: '1', quantity: 2, price: 5600, taxRate: 0.05, name: 'Arroz con Pollo', category: 'food' },
      { productId: '4', quantity: 1, price: 3800, taxRate: 0, name: 'Limonada Natural', category: 'drink' }
    ],
    subtotal: 15000,
    taxes: 560,
    total: 15560,
    paymentMethod: 'efectivo',
    cashierId: '1',
    posId: 'POS-001',
    invoiceRequested: false,
    tableNumber: 3,
    waiter: 'Carlos Ramírez'
  },
  {
    id: 'SALE-002',
    date: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString(),
    items: [
      { productId: '2', quantity: 1, price: 8900, taxRate: 0.19, name: 'Bandeja Paisa', category: 'food' },
      { productId: '5', quantity: 2, price: 12500, taxRate: 0.19, name: 'Cerveza Artesanal', category: 'drink' }
    ],
    subtotal: 33900,
    taxes: 6441,
    total: 40341,
    paymentMethod: 'tarjeta',
    cashierId: '2',
    posId: 'POS-001',
    invoiceRequested: true,
    tableNumber: 5,
    waiter: 'Ana Martínez',
    documentType: 'CC',
    documentNumber: '1020304050'
  },
  {
    id: 'SALE-003',
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    items: [
      { productId: '3', quantity: 3, price: 4200, taxRate: 0.05, name: 'Papas Fritas', category: 'food' },
      { productId: '1', quantity: 1, price: 5600, taxRate: 0.05, name: 'Arroz con Pollo', category: 'food' }
    ],
    subtotal: 18200,
    taxes: 910,
    total: 19110,
    paymentMethod: 'efectivo',
    cashierId: '1',
    posId: 'POS-002',
    invoiceRequested: false,
    tableNumber: 2,
    waiter: 'Diego López'
  },
  {
    id: 'SALE-004',
    date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    items: [
      { productId: '5', quantity: 1, price: 12500, taxRate: 0.19, name: 'Cerveza Artesanal', category: 'drink' },
      { productId: '2', quantity: 2, price: 8900, taxRate: 0.19, name: 'Bandeja Paisa', category: 'food' }
    ],
    subtotal: 30300,
    taxes: 5757,
    total: 36057,
    paymentMethod: 'tarjeta',
    cashierId: '2',
    posId: 'POS-002',
    invoiceRequested: true,
    tableNumber: 7,
    waiter: 'Ana Martínez',
    documentType: 'NIT',
    documentNumber: '9001234567'
  },
  {
    id: 'SALE-005',
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    items: [
      { productId: '1', quantity: 2, price: 5600, taxRate: 0.05, name: 'Arroz con Pollo', category: 'food' },
      { productId: '3', quantity: 1, price: 4200, taxRate: 0.05, name: 'Papas Fritas', category: 'food' },
      { productId: '4', quantity: 3, price: 3800, taxRate: 0, name: 'Limonada Natural', category: 'drink' }
    ],
    subtotal: 26800,
    taxes: 770,
    total: 27570,
    paymentMethod: 'efectivo',
    cashierId: '1',
    posId: 'POS-001',
    invoiceRequested: false,
    tableNumber: 4,
    waiter: 'Carlos Ramírez'
  },
  {
    id: 'SALE-006',
    date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    items: [
      { productId: '2', quantity: 1, price: 8900, taxRate: 0.19, name: 'Bandeja Paisa', category: 'food' },
      { productId: '5', quantity: 1, price: 12500, taxRate: 0.19, name: 'Cerveza Artesanal', category: 'drink' }
    ],
    subtotal: 21400,
    taxes: 4066,
    total: 25466,
    paymentMethod: 'tarjeta',
    cashierId: '1',
    posId: 'POS-002',
    invoiceRequested: false,
    tableNumber: 6,
    waiter: 'Diego López'
  },
  {
    id: 'SALE-007',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    items: [
      { productId: '4', quantity: 2, price: 3800, taxRate: 0, name: 'Limonada Natural', category: 'drink' },
      { productId: '1', quantity: 1, price: 5600, taxRate: 0.05, name: 'Arroz con Pollo', category: 'food' },
      { productId: '3', quantity: 2, price: 4200, taxRate: 0.05, name: 'Papas Fritas', category: 'food' }
    ],
    subtotal: 21600,
    taxes: 700,
    total: 22300,
    paymentMethod: 'efectivo',
    cashierId: '2',
    posId: 'POS-001',
    invoiceRequested: false,
    tableNumber: 1,
    waiter: 'Ana Martínez'
  },
  {
    id: 'SALE-008',
    date: new Date().toISOString(),
    items: [
      { productId: '5', quantity: 1, price: 12500, taxRate: 0.19, name: 'Cerveza Artesanal', category: 'drink' },
      { productId: '2', quantity: 1, price: 8900, taxRate: 0.19, name: 'Bandeja Paisa', category: 'food' },
      { productId: '1', quantity: 2, price: 5600, taxRate: 0.05, name: 'Arroz con Pollo', category: 'food' }
    ],
    subtotal: 32600,
    taxes: 4081,
    total: 36681,
    paymentMethod: 'tarjeta',
    cashierId: '1',
    posId: 'POS-002',
    invoiceRequested: true,
    tableNumber: 8,
    waiter: 'Carlos Ramírez',
    documentType: 'CC',
    documentNumber: '5060708090'
  },
  {
    id: 'SALE-009',
    date: new Date().toISOString(),
    items: [
      { productId: '3', quantity: 3, price: 4200, taxRate: 0.05, name: 'Papas Fritas', category: 'food' },
      { productId: '4', quantity: 2, price: 3800, taxRate: 0, name: 'Limonada Natural', category: 'drink' }
    ],
    subtotal: 20200,
    taxes: 630,
    total: 20830,
    paymentMethod: 'efectivo',
    cashierId: '2',
    posId: 'POS-001',
    invoiceRequested: false,
    tableNumber: 9,
    waiter: 'Diego López'
  },
  {
    id: 'SALE-010',
    date: new Date().toISOString(),
    items: [
      { productId: '5', quantity: 2, price: 12500, taxRate: 0.19, name: 'Cerveza Artesanal', category: 'drink' }
    ],
    subtotal: 25000,
    taxes: 4750,
    total: 29750,
    paymentMethod: 'tarjeta',
    cashierId: '1',
    posId: 'POS-002',
    invoiceRequested: true,
    tableNumber: 10,
    waiter: 'Ana Martínez',
    documentType: 'CE',
    documentNumber: '1234567890'
  },
  {
    id: 'SALE-011',
    date: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(),
    items: [
      { productId: '1', quantity: 3, price: 5600, taxRate: 0.05, name: 'Arroz con Pollo', category: 'food' },
      { productId: '4', quantity: 3, price: 3800, taxRate: 0, name: 'Limonada Natural', category: 'drink' }
    ],
    subtotal: 28200,
    taxes: 840,
    total: 29040,
    paymentMethod: 'efectivo',
    cashierId: '1',
    posId: 'POS-001',
    invoiceRequested: false,
    tableNumber: 2,
    waiter: 'Carlos Ramírez'
  },
  {
    id: 'SALE-012',
    date: new Date(new Date().setDate(new Date().getDate() - 25)).toISOString(),
    items: [
      { productId: '2', quantity: 2, price: 8900, taxRate: 0.19, name: 'Bandeja Paisa', category: 'food' },
      { productId: '5', quantity: 1, price: 12500, taxRate: 0.19, name: 'Cerveza Artesanal', category: 'drink' }
    ],
    subtotal: 30300,
    taxes: 5757,
    total: 36057,
    paymentMethod: 'tarjeta',
    cashierId: '2',
    posId: 'POS-002',
    invoiceRequested: true,
    tableNumber: 5,
    waiter: 'Ana Martínez',
    documentType: 'CC',
    documentNumber: '2030405060'
  }
];

const mockRefunds = [
  {
    id: 'REF-001',
    date: new Date(new Date().setDate(new Date().getDate() - 13)).toISOString(),
    saleId: 'SALE-001',
    amount: 5600,
    reason: 'Producto defectuoso',
    status: 'success',
    cashierId: '2',
    posId: 'POS-001'
  },
  {
    id: 'REF-002',
    date: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(),
    saleId: 'SALE-002',
    amount: 12500,
    reason: 'Cliente insatisfecho',
    status: 'success',
    cashierId: '1',
    posId: 'POS-001'
  },
  {
    id: 'REF-003',
    date: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
    saleId: 'SALE-003',
    amount: 4200,
    reason: 'Error en cobro',
    status: 'pending',
    cashierId: '2',
    posId: 'POS-002'
  },
  {
    id: 'REF-004',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    saleId: 'SALE-005',
    amount: 3800,
    reason: 'Producto equivocado',
    status: 'failed',
    cashierId: '1',
    posId: 'POS-001'
  },
  {
    id: 'REF-005',
    date: new Date().toISOString(),
    saleId: 'SALE-008',
    amount: 8900,
    reason: 'Devolución cliente',
    status: 'success',
    cashierId: '2',
    posId: 'POS-002'
  }
];

// =======================
// Página de reportes
// =======================
const ReportsPage = () => {
  const { showToast } = useToast();
  const { softBtn } = useOutletContext<any>();

  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'refunds' | 'products' | 'waiters'>('dashboard');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSalesTable, setShowSalesTable] = useState(false);
  const [customPeriod, setCustomPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');

  // Colores para gráficos
  const COLORS = ['#2563EB', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  // =======================
  // Cargar datos (mock + historial en localStorage)
  // =======================
  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      let saved: Sale[] = [];
      try {
        const raw = localStorage.getItem('woky.sales');
        saved = raw ? JSON.parse(raw) : [];
      } catch {
        // ignore
      }
      setSales([...mockSales, ...saved]);
      setRefunds(mockRefunds);
      setLoading(false);
    };
    loadData();
  }, []);

  // Cambiar rango según período
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let startDate = today;
    switch (customPeriod) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'custom':
        return;
    }
    setDateRange({ start: startDate, end: today });
  }, [customPeriod]);

  // Filtrar ventas
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.date).toISOString().split('T')[0];
    const dateMatch = saleDate >= dateRange.start && saleDate <= dateRange.end;
    const paymentMatch = paymentMethodFilter === 'all' || sale.paymentMethod === paymentMethodFilter;
    const searchMatch =
      searchTerm === '' ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.waiter && sale.waiter.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.tableNumber && sale.tableNumber.toString().includes(searchTerm)) ||
      sale.items.some(item => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return dateMatch && paymentMatch && searchMatch;
  });

  // Filtrar reembolsos
  const filteredRefunds = refunds.filter((refund: any) => {
    const refundDate = new Date(refund.date).toISOString().split('T')[0];
    return refundDate >= dateRange.start && refundDate <= dateRange.end;
  });

  // KPIs
  const calculateKPIs = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => new Date(sale.date).toISOString().split('T')[0] === today);
    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);

    const avgTicket = filteredSales.length > 0
      ? filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length
      : 0;

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalRefunds = filteredRefunds.reduce((sum: number, refund: any) => sum + refund.amount, 0);
    const refundPercent = totalSales > 0 ? (totalRefunds / totalSales) * 100 : 0;

    const cashSales = filteredSales
      .filter(sale => sale.paymentMethod === 'efectivo')
      .reduce((sum, sale) => sum + sale.total, 0);
    const cardSales = filteredSales
      .filter(sale => sale.paymentMethod === 'tarjeta')
      .reduce((sum, sale) => sum + sale.total, 0);

    const periodTotal = totalSales;
    const transactionCount = filteredSales.length;

    const foodSales = filteredSales.reduce((sum, sale) => {
      const foodItems = sale.items.filter(item => item.category === 'food');
      return sum + foodItems.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
    }, 0);

    const drinkSales = filteredSales.reduce((sum, sale) => {
      const drinkItems = sale.items.filter(item => item.category === 'drink');
      return sum + drinkItems.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
    }, 0);

    const previousPeriodStart = new Date(
      new Date(dateRange.start).getTime() - (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime())
    )
      .toISOString()
      .split('T')[0];

    const previousPeriodSales = sales.filter(sale => {
      const saleDate = new Date(sale.date).toISOString().split('T')[0];
      return saleDate >= previousPeriodStart && saleDate < dateRange.start;
    });

    const previousPeriodTotal = previousPeriodSales.reduce((sum, sale) => sum + sale.total, 0);
    const growthPercent = previousPeriodTotal > 0 ? ((periodTotal - previousPeriodTotal) / previousPeriodTotal) * 100 : 100;

    return {
      todayTotal,
      avgTicket,
      refundPercent,
      cashSales,
      cardSales,
      periodTotal,
      transactionCount,
      foodSales,
      drinkSales,
      growthPercent
    };
  };

  // Datos gráficos
  const prepareChartData = () => {
    const salesByDay: Record<string, number> = {};
    filteredSales.forEach(sale => {
      const date = new Date(sale.date).toISOString().split('T')[0];
      if (!salesByDay[date]) salesByDay[date] = 0;
      salesByDay[date] += sale.total;
    });

    const dailySalesData = Object.keys(salesByDay)
      .sort()
      .map(date => ({
        date: new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }),
        ventas: salesByDay[date]
      }));

    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => new Date(sale.date).toISOString().split('T')[0] === today);
    const salesByHour: Record<number, number> = {};
    for (let i = 8; i <= 23; i++) salesByHour[i] = 0;
    todaySales.forEach(sale => {
      const hour = new Date(sale.date).getHours();
      if (salesByHour[hour] !== undefined) salesByHour[hour] += sale.total;
    });
    const hourlySalesData = Object.keys(salesByHour).map(hour => ({
      hora: `${hour}:00`,
      ventas: salesByHour[Number(hour)]
    }));

    const salesByMethod = [
      { name: 'Efectivo', value: filteredSales.filter(s => s.paymentMethod === 'efectivo').reduce((a, b) => a + b.total, 0) },
      { name: 'Tarjeta', value: filteredSales.filter(s => s.paymentMethod === 'tarjeta').reduce((a, b) => a + b.total, 0) },
      { name: 'Nequi', value: filteredSales.filter(s => s.paymentMethod === 'nequi').reduce((a, b) => a + b.total, 0) },
      { name: 'Daviplata', value: filteredSales.filter(s => s.paymentMethod === 'daviplata').reduce((a, b) => a + b.total, 0) },
      { name: 'Transferencia', value: filteredSales.filter(s => s.paymentMethod === 'transfer').reduce((a, b) => a + b.total, 0) },
      { name: 'Otros', value: filteredSales.filter(s => s.paymentMethod === 'other').reduce((a, b) => a + b.total, 0) }
    ].filter(item => item.value > 0);

    const productSales: Record<
      string,
      { id: string; name: string; quantity: number; total: number; category?: 'food' | 'drink' }
    > = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.productId;
        const productName = item.name || `Producto ${productId}`;
        if (!productSales[productId]) {
          productSales[productId] = { id: productId, name: productName, quantity: 0, total: 0, category: item.category };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].total += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a: any, b: any) => b.total - a.total).slice(0, 5);

    const salesByCategory = [
      {
        name: 'Comidas',
        value: filteredSales.reduce((sum, sale) => {
          return (
            sum +
            sale.items
              .filter(item => item.category === 'food')
              .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0)
          );
        }, 0)
      },
      {
        name: 'Bebidas',
        value: filteredSales.reduce((sum, sale) => {
          return (
            sum +
            sale.items
              .filter(item => item.category === 'drink')
              .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0)
          );
        }, 0)
      }
    ];

    const waiterSales: Record<string, { name: string; sales: number; transactions: number; items: number }> = {};
    filteredSales.forEach(sale => {
      if (sale.waiter) {
        if (!waiterSales[sale.waiter]) {
          waiterSales[sale.waiter] = { name: sale.waiter, sales: 0, transactions: 0, items: 0 };
        }
        waiterSales[sale.waiter].sales += sale.total;
        waiterSales[sale.waiter].transactions += 1;
        waiterSales[sale.waiter].items += sale.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    });
    const waiterSalesData = Object.values(waiterSales).sort((a: any, b: any) => b.sales - a.sales);

    const tableSales: Record<string, { name: string; value: number; count: number }> = {};
    filteredSales.forEach(sale => {
      if (sale.tableNumber) {
        const tableKey = `Mesa ${sale.tableNumber}`;
        if (!tableSales[tableKey]) {
          tableSales[tableKey] = { name: tableKey, value: 0, count: 0 };
        }
        tableSales[tableKey].value += sale.total;
        tableSales[tableKey].count += 1;
      }
    });
    const tableSalesData = Object.values(tableSales).sort((a: any, b: any) => b.value - a.value).slice(0, 10);

    return { dailySalesData, hourlySalesData, salesByMethod, topProducts, salesByCategory, waiterSalesData, tableSalesData };
  };

  const kpis = calculateKPIs();
  const chartData = prepareChartData();

  // Ver detalle
  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  // Export CSV
  const handleExport = (type: 'sales' | 'refunds') => {
    showToast('info', `Exportando ${type === 'sales' ? 'ventas' : 'reembolsos'}...`);
    setTimeout(() => {
      const dataToExport = type === 'sales' ? filteredSales : filteredRefunds;
      let csvContent = 'data:text/csv;charset=utf-8,';
      if (type === 'sales') {
        csvContent += 'ID,Fecha,Mesa,Mesero,Total,Método,Cajero,POS\n';
        dataToExport.forEach((item: any) => {
          csvContent += `${item.id},${new Date(item.date).toLocaleDateString()},${item.tableNumber || ''},${item.waiter || ''},${item.total},${item.paymentMethod},${item.cashierId},${item.posId}\n`;
        });
      } else {
        csvContent += 'ID,Fecha,Venta,Monto,Estado\n';
        dataToExport.forEach((item: any) => {
          csvContent += `${item.id},${new Date(item.date).toLocaleDateString()},${item.saleId},${item.amount},${item.status}\n`;
        });
      }
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `${type === 'sales' ? 'ventas' : 'reembolsos'}_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', `${type === 'sales' ? 'Ventas' : 'Reembolsos'} exportados correctamente`);
    }, 800);
  };

  // Render
  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow h-24 animate-pulse"></div>
            <div className="bg-white rounded-xl shadow h-24 animate-pulse"></div>
            <div className="bg-white rounded-xl shadow h-24 animate-pulse"></div>
            <div className="bg-white rounded-xl shadow h-24 animate-pulse"></div>
          </div>
          <div className="bg-white rounded-xl shadow h-64 animate-pulse"></div>
          <div className="bg-white rounded-xl shadow h-64 animate-pulse"></div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Período y filtros */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Período de análisis</h3>
              <div className="flex flex-wrap gap-2">
                <button className={softBtn(customPeriod === 'today' ? 'blue' : 'gray')} onClick={() => setCustomPeriod('today')}>Hoy</button>
                <button className={softBtn(customPeriod === 'week' ? 'blue' : 'gray')} onClick={() => setCustomPeriod('week')}>Última semana</button>
                <button className={softBtn(customPeriod === 'month' ? 'blue' : 'gray')} onClick={() => setCustomPeriod('month')}>Último mes</button>
                <button className={softBtn(customPeriod === 'custom' ? 'blue' : 'gray')} onClick={() => setCustomPeriod('custom')}>Personalizado</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon size={16} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  className="pl-10 py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={customPeriod !== 'custom'}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon size={16} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  className="pl-10 py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={customPeriod !== 'custom'}
                />
              </div>
              <button className={softBtn('green')} onClick={() => showToast('success', 'Datos actualizados para el período seleccionado')}>
                <RefreshCcwIcon size={16} className="mr-1" />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'sales' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('sales')}
          >
            Ventas
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('products')}
          >
            Productos
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'waiters' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('waiters')}
          >
            Meseros
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'refunds' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('refunds')}
          >
            Reembolsos
          </button>
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-500 mb-1">Ventas en período</p>
                <p className="text-xl font-semibold text-gray-800">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                    kpis.periodTotal
                  )}
                </p>
                <div className="flex items-center mt-1 text-xs">
                  <span className={`flex items-center ${kpis.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.growthPercent >= 0 ? <ArrowUpIcon size={12} className="mr-1" /> : <ArrowDownIcon size={12} className="mr-1" />}
                    {Math.abs(kpis.growthPercent).toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-1">vs. período anterior</span>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-500 mb-1">Ventas hoy</p>
                <p className="text-xl font-semibold text-gray-800">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                    kpis.todayTotal
                  )}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-500 mb-1">Ticket promedio</p>
                <p className="text-xl font-semibold text-gray-800">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                    kpis.avgTicket
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">{kpis.transactionCount} transacciones</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-500 mb-1">% Reembolsado</p>
                <p className="text-xl font-semibold text-gray-800">{kpis.refundPercent.toFixed(2)}%</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="h-3 bg-blue-500 rounded-full" style={{ width: `${100 - kpis.refundPercent}%` }}></div>
                  <div className="h-3 bg-red-500 rounded-full" style={{ width: `${kpis.refundPercent}%`, minWidth: '2px' }}></div>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ventas por día */}
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <LineChartIcon size={20} className="mr-2 text-blue-600" />
                  Ventas por día
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.dailySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            value as number
                          )
                        }
                      />
                      <Line type="monotone" dataKey="ventas" stroke="#2563EB" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por hora */}
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChartIcon size={20} className="mr-2 text-blue-600" />
                  Ventas por hora (hoy)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.hourlySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            value as number
                          )
                        }
                      />
                      <Bar dataKey="ventas" fill="#2563EB" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Método de pago */}
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChartIcon size={20} className="mr-2 text-blue-600" />
                  Ventas por método de pago
                </h3>
                <div className="h-64 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.salesByMethod}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        paddingAngle={2}
                      >
                        {chartData.salesByMethod.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ paddingLeft: '20px', fontSize: '12px' }}
                        formatter={(value: any, _entry: any, index: number) => {
                          const item = chartData.salesByMethod[index];
                          const total = chartData.salesByMethod.reduce((sum: number, it: any) => sum + it.value, 0);
                          const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                          return <span className="text-xs">{value}: {percent}%</span>;
                        }}
                      />
                      <Tooltip
                        formatter={(val: any) =>
                          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            val as number
                          )
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Productos más vendidos */}
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChartIcon size={20} className="mr-2 text-blue-600" />
                  Productos más vendidos
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            value as number
                          )
                        }
                      />
                      <Bar dataKey="total" fill="#8B5CF6">
                        {chartData.topProducts.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.category === 'food' ? '#F59E0B' : '#2563EB'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por categoría */}
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChartIcon size={20} className="mr-2 text-blue-600" />
                  Ventas por categoría
                </h3>
                <div className="h-64 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.salesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        paddingAngle={2}
                      >
                        <Cell fill="#F59E0B" />
                        <Cell fill="#2563EB" />
                      </Pie>
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ paddingLeft: '20px', fontSize: '12px' }}
                        formatter={(value: any, _entry: any, index: number) => {
                          const item = chartData.salesByCategory[index];
                          const total = chartData.salesByCategory.reduce((sum: number, it: any) => sum + it.value, 0);
                          const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                          return (
                            <span className="text-xs flex items-center">
                              {index === 0 ? <UtensilsIcon size={12} className="mr-1 text-amber-500" /> : <GlassWaterIcon size={12} className="mr-1 text-blue-500" />}
                              {value}: {percent}%
                            </span>
                          );
                        }}
                      />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            value as number
                          )
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-2 bg-amber-50 rounded-lg text-center">
                    <div className="text-sm text-gray-600 mb-1 flex justify-center items-center">
                      <UtensilsIcon size={14} className="mr-1 text-amber-500" />
                      Comidas
                    </div>
                    <div className="font-medium">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                        kpis.foodSales
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg text-center">
                    <div className="text-sm text-gray-600 mb-1 flex justify-center items-center">
                      <GlassWaterIcon size={14} className="mr-1 text-blue-500" />
                      Bebidas
                    </div>
                    <div className="font-medium">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                        kpis.drinkSales
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ventas por mesa */}
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <TableIcon size={20} className="mr-2 text-blue-600" />
                  Ventas por mesa
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.tableSalesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={60} />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            value as number
                          )
                        }
                      />
                      <Bar dataKey="value" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tabla resumen de ventas */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <DollarSignIcon size={20} className="mr-2 text-blue-600" />
                  Resumen de ventas
                </h3>
                <div className="flex space-x-2">
                  <button className={softBtn('blue')} onClick={() => setShowSalesTable(!showSalesTable)}>
                    {showSalesTable ? 'Ocultar detalles' : 'Ver detalles'}
                  </button>
                  <button className={softBtn('green')} onClick={() => handleExport('sales')}>
                    <DownloadIcon size={16} className="mr-1" />
                    Exportar
                  </button>
                </div>
              </div>
              {showSalesTable && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesero</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSales
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10)
                        .map(sale => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(sale.date).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.tableNumber ? `Mesa ${sale.tableNumber}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.waiter || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  sale.paymentMethod === 'efectivo'
                                    ? 'bg-green-100 text-green-800'
                                    : sale.paymentMethod === 'tarjeta'
                                    ? 'bg-purple-100 text-purple-800'
                                    : sale.paymentMethod === 'nequi'
                                    ? 'bg-pink-100 text-pink-800'
                                    : sale.paymentMethod === 'daviplata'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {sale.paymentMethod === 'efectivo'
                                  ? 'Efectivo'
                                  : sale.paymentMethod === 'tarjeta'
                                  ? 'Tarjeta'
                                  : sale.paymentMethod === 'nequi'
                                  ? 'Nequi'
                                  : sale.paymentMethod === 'daviplata'
                                  ? 'Daviplata'
                                  : sale.paymentMethod === 'transfer'
                                  ? 'Transferencia'
                                  : 'Otro'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                              {new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                maximumFractionDigits: 0
                              }).format(sale.total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => handleViewSale(sale)} className="text-blue-600 hover:text-blue-900">
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {filteredSales.length > 10 && (
                    <div className="p-3 text-center text-sm text-gray-500">
                      Mostrando 10 de {filteredSales.length} ventas.
                      <button className="ml-1 text-blue-600 hover:text-blue-800" onClick={() => setActiveTab('sales')}>
                        Ver todas
                      </button>
                    </div>
                  )}
                  {filteredSales.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No hay ventas en el período seleccionado</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* VENTAS */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por ID, mesero, mesa o producto..."
                    className="pl-10 py-2 px-3 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <label htmlFor="paymentMethod" className="mr-2 text-sm text-gray-600">
                    Método de pago:
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentMethodFilter}
                    onChange={e => setPaymentMethodFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="transfer">Transferencia</option>
                    <option value="other">Otros</option>
                  </select>
                </div>
                <button className={softBtn('green')} onClick={() => handleExport('sales')}>
                  <DownloadIcon size={16} className="mr-1" />
                  Exportar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesero</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cajero</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.length > 0 ? (
                    filteredSales
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(sale => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(sale.date).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.tableNumber ? `Mesa ${sale.tableNumber}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.waiter || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                sale.paymentMethod === 'efectivo'
                                  ? 'bg-green-100 text-green-800'
                                  : sale.paymentMethod === 'tarjeta'
                                  ? 'bg-purple-100 text-purple-800'
                                  : sale.paymentMethod === 'nequi'
                                  ? 'bg-pink-100 text-pink-800'
                                  : sale.paymentMethod === 'daviplata'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {sale.paymentMethod === 'efectivo'
                                ? 'Efectivo'
                                : sale.paymentMethod === 'tarjeta'
                                ? 'Tarjeta'
                                : sale.paymentMethod === 'nequi'
                                ? 'Nequi'
                                : sale.paymentMethod === 'daviplata'
                                ? 'Daviplata'
                                : sale.paymentMethod === 'transfer'
                                ? 'Transferencia'
                                : 'Otro'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.cashierId === '1' ? 'Cajero Demo' : 'Supervisor Demo'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              maximumFractionDigits: 0
                            }).format(sale.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleViewSale(sale)} className="text-blue-600 hover:text-blue-900">
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                        No hay ventas en el período seleccionado
                        {paymentMethodFilter !== 'all' && ` con método de pago ${paymentMethodFilter}`}
                        {searchTerm && ` que coincidan con "${searchTerm}"`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Mostrando {filteredSales.length} resultados de un total de {sales.length} ventas
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Total:{' '}
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(filteredSales.reduce((sum, sale) => sum + sale.total, 0))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTOS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <UtensilsIcon size={20} className="mr-2 text-amber-600" />
                Productos más vendidos
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% del total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.values(chartData.topProducts).map((product: any) => {
                      const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
                      const percentage = totalSales > 0 ? (product.total / totalSales) * 100 : 0;
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="flex items-center">
                              {product.category === 'food' ? (
                                <>
                                  <UtensilsIcon size={14} className="mr-1 text-amber-500" />
                                  Comida
                                </>
                              ) : (
                                <>
                                  <GlassWaterIcon size={14} className="mr-1 text-blue-500" />
                                  Bebida
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{product.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                              product.total
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{percentage.toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <UtensilsIcon size={20} className="mr-2 text-amber-600" />
                  Ventas por categoría
                </h3>
                <div className="h-64 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.salesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        paddingAngle={2}
                      >
                        <Cell fill="#F59E0B" />
                        <Cell fill="#2563EB" />
                      </Pie>
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ paddingLeft: '20px', fontSize: '12px' }}
                        formatter={(value: any, _entry: any, index: number) => {
                          const item = chartData.salesByCategory[index];
                          const total = chartData.salesByCategory.reduce((sum: number, it: any) => sum + it.value, 0);
                          const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                          return (
                            <span className="text-xs flex items-center">
                              {index === 0 ? <UtensilsIcon size={12} className="mr-1 text-amber-500" /> : <GlassWaterIcon size={12} className="mr-1 text-blue-500" />}
                              {value}: {percent}%
                            </span>
                          );
                        }}
                      />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            value as number
                          )
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-2 bg-amber-50 rounded-lg text-center">
                    <div className="text-sm text-gray-600 mb-1 flex justify-center items-center">
                      <UtensilsIcon size={14} className="mr-1 text-amber-500" />
                      Comidas
                    </div>
                    <div className="font-medium">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                        kpis.foodSales
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg text-center">
                    <div className="text-sm text-gray-600 mb-1 flex justify-center items-center">
                      <GlassWaterIcon size={14} className="mr-1 text-blue-500" />
                      Bebidas
                    </div>
                    <div className="font-medium">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                        kpis.drinkSales
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChartIcon size={20} className="mr-2 text-blue-600" />
                  Productos más vendidos
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            value as number
                          )
                        }
                      />
                      <Bar dataKey="total" fill="#8B5CF6">
                        {chartData.topProducts.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.category === 'food' ? '#F59E0B' : '#2563EB'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MESEROS */}
        {activeTab === 'waiters' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <UserIcon size={20} className="mr-2 text-purple-600" />
                Desempeño de meseros
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesero</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transacciones</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ítems vendidos</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket promedio</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% del total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {chartData.waiterSalesData.map((waiter: any) => {
                      const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
                      const percentage = totalSales > 0 ? (waiter.sales / totalSales) * 100 : 0;
                      const avgTicket = waiter.transactions > 0 ? waiter.sales / waiter.transactions : 0;
                      return (
                        <tr key={waiter.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{waiter.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                              waiter.sales
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{waiter.transactions}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{waiter.items}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                              avgTicket
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{percentage.toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChartIcon size={20} className="mr-2 text-blue-600" />
                  Ventas por mesero
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.waiterSalesData.map((w: any) => ({ name: w.name, sales: w.sales }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip
                        formatter={(value: any) =>
                          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            value as number
                          )
                        }
                      />
                      <Bar dataKey="sales" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChartIcon size={20} className="mr-2 text-blue-600" />
                  Transacciones por mesero
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.waiterSalesData.map((w: any) => ({ name: w.name, transactions: w.transactions }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="transactions" fill="#EC4899" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REEMBOLSOS */}
        {activeTab === 'refunds' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <RefreshCcwIcon size={20} className="mr-2 text-red-600" />
                Reembolsos
              </h3>
              <button className={softBtn('green')} onClick={() => handleExport('refunds')}>
                <DownloadIcon size={16} className="mr-1" />
                Exportar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRefunds.length > 0 ? (
                    filteredRefunds
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((refund: any) => (
                        <tr key={refund.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(refund.date).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{refund.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{refund.saleId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{refund.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                refund.status === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : refund.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {refund.status === 'success' ? 'Exitoso' : refund.status === 'pending' ? 'Pendiente' : 'Fallido'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              maximumFractionDigits: 0
                            }).format(refund.amount)}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        No hay reembolsos en el período seleccionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Mostrando {filteredRefunds.length} resultados de un total de {refunds.length} reembolsos
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Total reembolsado:{' '}
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                    filteredRefunds.reduce((sum: number, refund: any) => sum + refund.amount, 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-3xl shadow-sm border border-white/60">
        <div className="bg-white/60 p-3 rounded-2xl">
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <p className="text-sm text-gray-600">Análisis de ventas y desempeño del negocio</p>
        </div>
      </div>

      {renderContent()}

      {/* Modal Detalle venta */}
      {showSaleModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Detalle de venta: {selectedSale.id}</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowSaleModal(false)}>
                <XIcon size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium">
                    {new Date(selectedSale.date).toLocaleDateString('es-CO', {
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
                  <p className="font-medium">{selectedSale.posId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mesa</p>
                  <p className="font-medium">{selectedSale.tableNumber ? `Mesa ${selectedSale.tableNumber}` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mesero</p>
                  <p className="font-medium">{selectedSale.waiter || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Método de pago</p>
                  <p className="font-medium capitalize">
                    {selectedSale.paymentMethod === 'efectivo'
                      ? 'Efectivo'
                      : selectedSale.paymentMethod === 'tarjeta'
                      ? 'Tarjeta'
                      : selectedSale.paymentMethod === 'nequi'
                      ? 'Nequi'
                      : selectedSale.paymentMethod === 'daviplata'
                      ? 'Daviplata'
                      : selectedSale.paymentMethod === 'transfer'
                      ? 'Transferencia'
                      : 'Otro'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cajero</p>
                  <p className="font-medium">{selectedSale.cashierId === '1' ? 'Cajero Demo' : 'Supervisor Demo'}</p>
                </div>

                {/* Metadatos de pago (opcional) */}
                {selectedSale.paymentMeta && (
                  <div className="col-span-2 grid grid-cols-2 gap-2 mt-2 text-sm">
                    {'cardType' in selectedSale.paymentMeta && (
                      <>
                        <span className="text-gray-500">Tipo tarjeta:</span>
                        <span className="font-medium capitalize">{selectedSale.paymentMeta.cardType}</span>
                      </>
                    )}
                    {'surchargePct' in selectedSale.paymentMeta && typeof selectedSale.paymentMeta.surchargePct === 'number' && (
                      <>
                        <span className="text-gray-500">% Recargo:</span>
                        <span className="font-medium">{selectedSale.paymentMeta.surchargePct}%</span>
                      </>
                    )}
                    {'surchargeAmount' in selectedSale.paymentMeta && typeof selectedSale.paymentMeta.surchargeAmount === 'number' && (
                      <>
                        <span className="text-gray-500">Recargo (valor):</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            selectedSale.paymentMeta.surchargeAmount
                          )}
                        </span>
                      </>
                    )}
                    {'authCode' in selectedSale.paymentMeta && selectedSale.paymentMeta.authCode && (
                      <>
                        <span className="text-gray-500">Autorización:</span>
                        <span className="font-medium">{selectedSale.paymentMeta.authCode}</span>
                      </>
                    )}
                    {'last4' in selectedSale.paymentMeta && selectedSale.paymentMeta.last4 && (
                      <>
                        <span className="text-gray-500">Tarjeta:</span>
                        <span className="font-medium">**** **** **** {selectedSale.paymentMeta.last4}</span>
                      </>
                    )}
                    {'txnCode' in selectedSale.paymentMeta && selectedSale.paymentMeta.txnCode && (
                      <>
                        <span className="text-gray-500">Transacción:</span>
                        <span className="font-medium">{selectedSale.paymentMeta.txnCode}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-800 mb-2">Productos</h4>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items.map((item, index) => {
                        const productTotal = item.price * item.quantity;
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name || `Producto ${item.productId}`}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.category === 'food' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {item.category === 'food' ? (
                                  <>
                                    <UtensilsIcon size={10} className="mr-1" />
                                    Comida
                                  </>
                                ) : (
                                  <>
                                    <GlassWaterIcon size={10} className="mr-1" />
                                    Bebida
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                                item.price
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {(item.taxRate * 100).toFixed(0)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                                productTotal
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t border-gray-200">
                      <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                          Subtotal:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            selectedSale.subtotal
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                          IVA:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            selectedSale.taxes
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                          Total:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                            selectedSale.total
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <button
                className={softBtn('blue')}
                onClick={() => {
                  showToast('info', 'Imprimiendo comprobante...');
                  setTimeout(() => showToast('success', 'Comprobante impreso correctamente'), 1000);
                }}
              >
                <PrinterIcon size={16} className="mr-1" />
                Imprimir
              </button>
              <button className={softBtn('gray')} onClick={() => setShowSaleModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
