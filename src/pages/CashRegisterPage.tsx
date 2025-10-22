import React, { useEffect, useState, useRef, createElement, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSignIcon, ArrowUpIcon, ArrowDownIcon, ReceiptIcon, ClipboardListIcon, CheckIcon, XIcon, SaveIcon, PrinterIcon, DownloadIcon, AlertTriangleIcon, PlusIcon, MinusIcon, FileTextIcon, ClockIcon, EyeIcon, SearchIcon, ShoppingCartIcon, RefreshCcwIcon, CreditCardIcon, SmartphoneIcon, UsersIcon, PercentIcon, ScissorsIcon, DivideIcon, ChevronsUpDownIcon, UserIcon, TableIcon } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import { mockCashMovements, mockSales } from '../utils/mockData';
// Tipos
interface CashMovement {
  id: string;
  type: string;
  amount: number;
  date: string;
  notes: string;
  userId: string;
  relatedId?: string;
}
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  category: string;
}
interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  tipPercentage: number;
  total: number;
  status: 'pending' | 'paid' | 'partial';
  waiter: string;
  createdAt: string;
  updatedAt: string;
}
interface PaymentMethod {
  id: string;
  name: string;
  amount: number;
  type: 'cash' | 'card' | 'digital';
  details?: any;
}
interface Table {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'reserved';
  waiter?: string;
  order?: string;
}
interface Waiter {
  id: string;
  name: string;
  tables: string[];
}
// Componente EmptyState para cuando la caja está cerrada
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}> = ({
  icon,
  title,
  description,
  action
}) => {
  return <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-2xl shadow">
      <div className="bg-blue-100 p-4 rounded-full mb-4">{icon}</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">{description}</p>
      {action}
    </div>;
};
// Componente para las pestañas
const TabButton = ({
  active,
  onClick,
  children,
  icon
}) => {
  return <button onClick={onClick} className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors duration-200`}>
      {icon}
      <span className="ml-2">{children}</span>
    </button>;
};
// Mock data for pending orders
const mockPendingOrders: Order[] = [{
  id: 'ORD-1234',
  tableNumber: '5',
  items: [{
    id: 'ITEM-1',
    name: 'Hamburguesa Clásica',
    quantity: 2,
    price: 15000,
    total: 30000,
    category: 'Hamburguesas'
  }, {
    id: 'ITEM-2',
    name: 'Papas Fritas',
    quantity: 1,
    price: 8000,
    total: 8000,
    category: 'Acompañamientos'
  }, {
    id: 'ITEM-3',
    name: 'Coca-Cola',
    quantity: 2,
    price: 5000,
    total: 10000,
    category: 'Bebidas'
  }],
  subtotal: 48000,
  tax: 4800,
  tip: 4800,
  tipPercentage: 10,
  total: 57600,
  status: 'pending',
  waiter: 'Carlos Rodríguez',
  createdAt: '2023-05-15T18:30:00Z',
  updatedAt: '2023-05-15T19:15:00Z'
}, {
  id: 'ORD-1235',
  tableNumber: '8',
  items: [{
    id: 'ITEM-4',
    name: 'Ensalada César',
    quantity: 1,
    price: 18000,
    total: 18000,
    category: 'Ensaladas'
  }, {
    id: 'ITEM-5',
    name: 'Lomo de Res',
    quantity: 1,
    price: 35000,
    total: 35000,
    category: 'Carnes'
  }, {
    id: 'ITEM-6',
    name: 'Vino Tinto',
    quantity: 1,
    price: 25000,
    total: 25000,
    category: 'Bebidas'
  }],
  subtotal: 78000,
  tax: 7800,
  tip: 7800,
  tipPercentage: 10,
  total: 93600,
  status: 'pending',
  waiter: 'Ana Martínez',
  createdAt: '2023-05-15T19:00:00Z',
  updatedAt: '2023-05-15T20:00:00Z'
}, {
  id: 'ORD-1236',
  tableNumber: '3',
  items: [{
    id: 'ITEM-7',
    name: 'Pizza Margherita',
    quantity: 1,
    price: 28000,
    total: 28000,
    category: 'Pizzas'
  }, {
    id: 'ITEM-8',
    name: 'Cerveza Artesanal',
    quantity: 2,
    price: 12000,
    total: 24000,
    category: 'Bebidas'
  }],
  subtotal: 52000,
  tax: 5200,
  tip: 5200,
  tipPercentage: 10,
  total: 62400,
  status: 'pending',
  waiter: 'Pedro Gómez',
  createdAt: '2023-05-15T19:30:00Z',
  updatedAt: '2023-05-15T20:15:00Z'
}];
// Mock data for tables
const mockTables: Table[] = [{
  id: 'T1',
  number: '1',
  status: 'available'
}, {
  id: 'T2',
  number: '2',
  status: 'available'
}, {
  id: 'T3',
  number: '3',
  status: 'occupied',
  waiter: 'W1',
  order: 'ORD-1236'
}, {
  id: 'T4',
  number: '4',
  status: 'available'
}, {
  id: 'T5',
  number: '5',
  status: 'occupied',
  waiter: 'W2',
  order: 'ORD-1234'
}, {
  id: 'T6',
  number: '6',
  status: 'available'
}, {
  id: 'T7',
  number: '7',
  status: 'reserved'
}, {
  id: 'T8',
  number: '8',
  status: 'occupied',
  waiter: 'W3',
  order: 'ORD-1235'
}, {
  id: 'T9',
  number: '9',
  status: 'available'
}, {
  id: 'T10',
  number: '10',
  status: 'available'
}, {
  id: 'T11',
  number: '11',
  status: 'available'
}, {
  id: 'T12',
  number: '12',
  status: 'available'
}];
// Mock data for waiters
const mockWaiters: Waiter[] = [{
  id: 'W1',
  name: 'Pedro Gómez',
  tables: ['T3']
}, {
  id: 'W2',
  name: 'Carlos Rodríguez',
  tables: ['T5']
}, {
  id: 'W3',
  name: 'Ana Martínez',
  tables: ['T8']
}, {
  id: 'W4',
  name: 'Laura Sánchez',
  tables: []
}];
// Componentes para la página de Caja
const CashRegisterPage: React.FC = () => {
  const {
    showToast
  } = useToast();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cashboxOpen, setCashboxOpen] = useState(true);
  const [initialAmount, setInitialAmount] = useState(100000);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'open' | 'close' | 'withdraw' | 'add' | 'x_cut' | 'audit' | 'view' | 'process_payment' | 'split_bill' | 'assign_waiter'>('open');
  const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMovements, setFilteredMovements] = useState<CashMovement[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'cash' | 'orders' | 'tables'>('cash');
  const [pendingOrders, setPendingOrders] = useState<Order[]>(mockPendingOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const [tables, setTables] = useState<Table[]>(mockTables);
  const [waiters, setWaiters] = useState<Waiter[]>(mockWaiters);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  // Add calculator functions inside the component
  const calculateTotal = () => {
    const bill100 = parseInt(document.getElementById('bill100')?.value || '0') * 100000;
    const bill50 = parseInt(document.getElementById('bill50')?.value || '0') * 50000;
    const bill20 = parseInt(document.getElementById('bill20')?.value || '0') * 20000;
    const bill10 = parseInt(document.getElementById('bill10')?.value || '0') * 10000;
    const bill5 = parseInt(document.getElementById('bill5')?.value || '0') * 5000;
    const bill2 = parseInt(document.getElementById('bill2')?.value || '0') * 2000;
    const coin1000 = parseInt(document.getElementById('coin1000')?.value || '0') * 1000;
    const coin500 = parseInt(document.getElementById('coin500')?.value || '0') * 500;
    const coinOther = parseInt(document.getElementById('coinOther')?.value || '0');
    const total = bill100 + bill50 + bill20 + bill10 + bill5 + bill2 + coin1000 + coin500 + coinOther;
    const systemTotal = 170000;
    const difference = total - systemTotal;
    // Update the displayed values
    const totalElement = document.getElementById('totalCounted');
    if (totalElement) {
      totalElement.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(total);
    }
    const differenceElement = document.getElementById('difference');
    if (differenceElement) {
      differenceElement.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(difference);
      differenceElement.className = difference < 0 ? 'text-sm font-medium text-red-600' : 'text-sm font-medium text-green-600';
    }
    setAmount(total.toString());
  };
  const calculateAuditTotal = () => {
    const bill100 = parseInt(document.getElementById('auditBill100')?.value || '0') * 100000;
    const bill50 = parseInt(document.getElementById('auditBill50')?.value || '0') * 50000;
    const bill20 = parseInt(document.getElementById('auditBill20')?.value || '0') * 20000;
    const bill10 = parseInt(document.getElementById('auditBill10')?.value || '0') * 10000;
    const bill5 = parseInt(document.getElementById('auditBill5')?.value || '0') * 5000;
    const bill2 = parseInt(document.getElementById('auditBill2')?.value || '0') * 2000;
    const coin1000 = parseInt(document.getElementById('auditCoin1000')?.value || '0') * 1000;
    const coin500 = parseInt(document.getElementById('auditCoin500')?.value || '0') * 500;
    const coinOther = parseInt(document.getElementById('auditCoinOther')?.value || '0');
    const total = bill100 + bill50 + bill20 + bill10 + bill5 + bill2 + coin1000 + coin500 + coinOther;
    const systemTotal = 170000;
    const difference = total - systemTotal;
    // Update the displayed values
    const totalElement = document.getElementById('auditTotalCounted');
    if (totalElement) {
      totalElement.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(total);
    }
    const differenceElement = document.getElementById('auditDifference');
    if (differenceElement) {
      differenceElement.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(difference);
      differenceElement.className = difference < 0 ? 'text-sm font-medium text-red-600' : 'text-sm font-medium text-green-600';
    }
    setAmount(total.toString());
  };
  const calculateCloseTotal = () => {
    const bill100 = parseInt(document.getElementById('closeBill100')?.value || '0') * 100000;
    const bill50 = parseInt(document.getElementById('closeBill50')?.value || '0') * 50000;
    const bill20 = parseInt(document.getElementById('closeBill20')?.value || '0') * 20000;
    const bill10 = parseInt(document.getElementById('closeBill10')?.value || '0') * 10000;
    const bill5 = parseInt(document.getElementById('closeBill5')?.value || '0') * 5000;
    const bill2 = parseInt(document.getElementById('closeBill2')?.value || '0') * 2000;
    const coin1000 = parseInt(document.getElementById('closeCoin1000')?.value || '0') * 1000;
    const coin500 = parseInt(document.getElementById('closeCoin500')?.value || '0') * 500;
    const coinOther = parseInt(document.getElementById('closeCoinOther')?.value || '0');
    const total = bill100 + bill50 + bill20 + bill10 + bill5 + bill2 + coin1000 + coin500 + coinOther;
    const systemTotal = 170000;
    const difference = total - systemTotal;
    // Update the displayed values
    const totalElement = document.getElementById('closeTotalCounted');
    if (totalElement) {
      totalElement.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(total);
    }
    const differenceElement = document.getElementById('closeDifference');
    if (differenceElement) {
      differenceElement.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(difference);
      differenceElement.className = difference < 0 ? 'text-sm font-medium text-red-600' : 'text-sm font-medium text-green-600';
    }
    setAmount(total.toString());
  };
  // Handler for bill input changes
  const handleBillInputChange = (type: string) => {
    switch (type) {
      case 'normal':
        calculateTotal();
        break;
      case 'audit':
        calculateAuditTotal();
        break;
      case 'close':
        calculateCloseTotal();
        break;
    }
  };
  // Formatear monto con separadores de miles
  const formatAmount = (value: string) => {
    // Eliminar todo excepto números
    const numericValue = value.replace(/\D/g, '');
    // Convertir a número y formatear
    if (numericValue) {
      const numberValue = parseInt(numericValue);
      return new Intl.NumberFormat('es-CO').format(numberValue);
    }
    return '';
  };
  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setMovements(mockCashMovements);
      setLoading(false);
    };
    loadData();
  }, []);
  // Filtrar movimientos
  useEffect(() => {
    if (searchTerm) {
      const filtered = movements.filter(movement => movement.id.toLowerCase().includes(searchTerm.toLowerCase()) || movement.notes.toLowerCase().includes(searchTerm.toLowerCase()) || movement.type.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredMovements(filtered);
    } else {
      setFilteredMovements(movements);
    }
  }, [searchTerm, movements]);
  // Abrir modal
  const openModal = (type: 'open' | 'close' | 'withdraw' | 'add' | 'x_cut' | 'audit' | 'view' | 'process_payment' | 'split_bill' | 'assign_waiter', data: any = null) => {
    setModalType(type);
    if (type === 'process_payment') {
      setSelectedOrder(data);
      setTipPercentage(data.tipPercentage);
      // Initialize with a single payment method for the full amount
      setPaymentMethods([{
        id: '1',
        name: 'Efectivo',
        amount: data.total,
        type: 'cash'
      }]);
    } else if (type === 'split_bill') {
      setSelectedOrder(data);
      // Initialize with empty payment methods for split
      setPaymentMethods([]);
    } else if (type === 'assign_waiter') {
      setSelectedTable(data);
      setSelectedWaiter(null);
    } else {
      setSelectedMovement(data);
    }
    setAmount('');
    setNotes('');
    setShowModal(true);
  };
  // Manejar cambio de monto
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setAmount(formatted);
  };
  // Registrar movimiento
  const registerMovement = (type: string, amountValue: number, notes: string) => {
    setLoading(true);
    // Simular petición a API
    setTimeout(() => {
      const newMovement: CashMovement = {
        id: `CASH-${Math.floor(Math.random() * 10000)}`,
        type,
        amount: amountValue,
        date: new Date().toISOString(),
        notes,
        userId: user?.id || '1'
      };
      setMovements([newMovement, ...movements]);
      // Actualizar estado de caja
      if (type === 'apertura') {
        setCashboxOpen(true);
        setInitialAmount(amountValue);
      } else if (type === 'cierre_z') {
        setCashboxOpen(false);
      }
      setLoading(false);
      setShowModal(false);
      showToast('success', 'Movimiento registrado correctamente');
    }, 1000);
  };
  // Process payment for an order
  const processPayment = () => {
    if (!selectedOrder) return;
    // Validate payment methods
    const totalPayment = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    const orderTotal = selectedOrder.total;
    if (totalPayment !== orderTotal) {
      showToast('error', `El total de los pagos (${formatCurrency(totalPayment)}) debe ser igual al total de la orden (${formatCurrency(orderTotal)})`);
      return;
    }
    // Process each payment method
    paymentMethods.forEach(method => {
      // Register the payment in cash movements
      const movementType = 'venta';
      const movementNotes = `Pago de orden ${selectedOrder.id} - Mesa ${selectedOrder.tableNumber} - Método: ${method.name}`;
      const newMovement: CashMovement = {
        id: `CASH-${Math.floor(Math.random() * 10000)}`,
        type: movementType,
        amount: method.amount,
        date: new Date().toISOString(),
        notes: movementNotes,
        userId: user?.id || '1',
        relatedId: selectedOrder.id
      };
      setMovements(prev => [newMovement, ...prev]);
    });
    // Update order status
    setPendingOrders(prev => prev.map(order => order.id === selectedOrder.id ? {
      ...order,
      status: 'paid'
    } : order).filter(order => order.id !== selectedOrder.id) // Remove paid orders
    );
    // Update table status if needed
    setTables(prev => prev.map(table => table.order === selectedOrder.id ? {
      ...table,
      status: 'available',
      order: undefined
    } : table));
    showToast('success', 'Pago procesado correctamente');
    setShowModal(false);
  };
  // Assign waiter to table
  const assignWaiterToTable = () => {
    if (!selectedTable || !selectedWaiter) {
      showToast('error', 'Debe seleccionar una mesa y un mesero');
      return;
    }
    // Update tables
    setTables(prev => prev.map(table => table.id === selectedTable.id ? {
      ...table,
      waiter: selectedWaiter.id,
      status: table.status === 'available' ? 'available' : table.status
    } : table));
    // Update waiters
    setWaiters(prev => prev.map(waiter => waiter.id === selectedWaiter.id ? {
      ...waiter,
      tables: [...waiter.tables, selectedTable.id]
    } : waiter.tables.includes(selectedTable.id) ? {
      ...waiter,
      tables: waiter.tables.filter(t => t !== selectedTable.id)
    } : waiter));
    showToast('success', `Mesa ${selectedTable.number} asignada a ${selectedWaiter.name}`);
    setShowModal(false);
  };
  // Add payment method
  const addPaymentMethod = () => {
    if (!selectedOrder) return;
    const newId = (paymentMethods.length + 1).toString();
    const remainingAmount = calculateRemainingAmount();
    if (remainingAmount <= 0) {
      showToast('info', 'El total de la orden ya está cubierto por los métodos de pago');
      return;
    }
    setPaymentMethods([...paymentMethods, {
      id: newId,
      name: 'Efectivo',
      amount: remainingAmount,
      type: 'cash'
    }]);
  };
  // Remove payment method
  const removePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };
  // Update payment method
  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
    setPaymentMethods(paymentMethods.map(method => method.id === id ? {
      ...method,
      ...updates
    } : method));
  };
  // Calculate remaining amount to be paid
  const calculateRemainingAmount = (): number => {
    if (!selectedOrder) return 0;
    const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    return selectedOrder.total - totalPaid;
  };
  // Calculate change for cash payment
  const calculateChange = (paymentMethod: PaymentMethod): number => {
    if (paymentMethod.type !== 'cash' || !paymentMethod.details?.amountGiven) {
      return 0;
    }
    const amountGiven = parseInt(paymentMethod.details.amountGiven.replace(/\D/g, '') || '0');
    return Math.max(0, amountGiven - paymentMethod.amount);
  };
  // Update tip percentage and recalculate totals
  const handleTipPercentageChange = (percentage: number) => {
    if (!selectedOrder) return;
    setTipPercentage(percentage);
    const newTip = Math.round(selectedOrder.subtotal * (percentage / 100));
    const newTotal = selectedOrder.subtotal + selectedOrder.tax + newTip;
    setSelectedOrder({
      ...selectedOrder,
      tip: newTip,
      tipPercentage: percentage,
      total: newTotal
    });
    // If there's only one payment method, update its amount
    if (paymentMethods.length === 1) {
      setPaymentMethods([{
        ...paymentMethods[0],
        amount: newTotal
      }]);
    }
  };
  // Exportar movimientos
  const exportMovements = () => {
    showToast('info', 'Exportando movimientos...');
    setTimeout(() => {
      // Crear datos para exportar
      let csvContent = 'data:text/csv;charset=utf-8,';
      // Encabezados
      csvContent += 'ID,Tipo,Monto,Fecha,Notas,Usuario\n';
      // Datos
      filteredMovements.forEach(movement => {
        const date = new Date(movement.date).toLocaleDateString('es-CO');
        csvContent += `${movement.id},${movement.type},${movement.amount},${date},${movement.notes},${movement.userId}\n`;
      });
      // Crear y simular clic en enlace de descarga
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `movimientos_caja_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', 'Movimientos exportados correctamente');
    }, 1500);
  };
  // Calcular saldo actual
  const calculateCurrentBalance = () => {
    return movements.reduce((balance, movement) => {
      if (movement.type === 'apertura' || movement.type === 'venta' || movement.type === 'ingreso') {
        return balance + movement.amount;
      } else if (movement.type === 'reembolso' || movement.type === 'sangria' || movement.type === 'cierre_z') {
        return balance - movement.amount;
      }
      return balance;
    }, 0);
  };
  // Calcular ventas del día
  const calculateDailySales = () => {
    return movements.filter(movement => movement.type === 'venta' && new Date(movement.date).toDateString() === new Date().toDateString()).reduce((total, movement) => total + movement.amount, 0);
  };
  // Calcular reembolsos del día
  const calculateDailyRefunds = () => {
    return movements.filter(movement => movement.type === 'reembolso' && new Date(movement.date).toDateString() === new Date().toDateString()).reduce((total, movement) => total + movement.amount, 0);
  };
  // Calcular ventas por método de pago
  const calculateSalesByMethod = (method: string) => {
    // Simulación de datos
    if (method === 'efectivo') return 230000;
    if (method === 'tarjeta') return 150000;
    if (method === 'digital') return 85000;
    return 0;
  };
  // Calcular pagos digitales por plataforma
  const calculateDigitalPayments = (platform: string) => {
    // Simulación de datos
    if (platform === 'nequi') return 45000;
    if (platform === 'daviplata') return 30000;
    if (platform === 'otro') return 10000;
    return 0;
  };
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount);
  };
  // Obtener tipo de movimiento en español
  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'apertura':
        return 'Apertura de caja';
      case 'cierre_z':
        return 'Cierre de caja (Z)';
      case 'venta':
        return 'Venta';
      case 'reembolso':
        return 'Reembolso';
      case 'sangria':
        return 'Retiro (Sangría)';
      case 'ingreso':
        return 'Ingreso de efectivo';
      case 'corte_x':
        return 'Corte X';
      case 'arqueo':
        return 'Arqueo sorpresa';
      default:
        return type;
    }
  };
  // Ver detalles de venta relacionada
  const viewRelatedSale = (relatedId?: string) => {
    if (!relatedId) return;
    // Buscar la venta relacionada
    const sale = mockSales.find(s => s.id === relatedId);
    if (sale) {
      // Mostrar modal con detalles de la venta
      setSelectedMovement({
        id: sale.id,
        type: 'venta',
        amount: sale.total,
        date: sale.date,
        notes: `Venta ${sale.id}`,
        userId: sale.cashierId,
        relatedId: sale.id
      });
      setModalType('view');
      setShowModal(true);
    } else {
      showToast('error', 'Venta no encontrada');
    }
  };
  // Get waiter name by ID
  const getWaiterNameById = (id?: string) => {
    if (!id) return 'No asignado';
    const waiter = waiters.find(w => w.id === id);
    return waiter ? waiter.name : 'No asignado';
  };
  // Renderizar pestaña de caja
  const renderCashTab = () => {
    if (loading) {
      return <div className="space-y-4">
          <Skeleton height={100} className="rounded-xl" />
          <Skeleton height={200} className="rounded-xl" />
          <Skeleton height={300} className="rounded-xl" />
        </div>;
    }
    if (!cashboxOpen) {
      return <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-2xl shadow">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <DollarSignIcon size={36} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No hay una caja abierta
          </h2>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            Para comenzar a registrar ventas y movimientos, primero debes abrir
            la caja con un monto inicial.
          </p>
          <button onClick={() => openModal('open')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg flex items-center">
            <DollarSignIcon size={18} className="mr-2" />
            Abrir caja
          </button>
        </div>;
    }
    const summary = calculateSummary();
    return <div className="space-y-6">
        {/* Estado de la caja */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Estado de caja
              </h3>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-green-700 font-medium">Abierta</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600 text-sm">
                  {new Date().toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
                </span>
              </div>
            </div>
            <button onClick={() => openModal('close')} className="flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 p-3 rounded-xl border border-red-200 transition-colors duration-200">
              <XIcon size={20} className="text-red-600 mb-1" />
              <span className="text-sm font-medium text-gray-800">
                Cerrar caja (Z)
              </span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  Efectivo en caja
                </h3>
                <div className="bg-green-100 p-1.5 rounded-full">
                  <DollarSignIcon size={16} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
              }).format(summary.cash)}
              </p>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span>Monto inicial: </span>
                <span className="font-medium ml-1">
                  {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0
                }).format(initialAmount)}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  Ventas del día
                </h3>
                <div className="bg-green-100 p-1.5 rounded-full">
                  <DollarSignIcon size={16} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
              }).format(calculateDailySales())}
              </p>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span className="text-sm text-gray-600">Monto inicial: </span>
                <span className="font-medium ml-1">
                  {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0
                }).format(initialAmount)}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  Ventas por método
                </h3>
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <CreditCardIcon size={16} className="text-blue-600" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Efectivo:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(calculateSalesByMethod('efectivo'))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tarjeta:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(calculateSalesByMethod('tarjeta'))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Digital:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(calculateSalesByMethod('digital'))}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => openModal('withdraw')} className="flex flex-col items-center justify-center bg-amber-50 hover:bg-amber-100 p-3 rounded-xl border border-amber-200 transition-colors duration-200">
              <MinusIcon size={22} className="text-amber-600 mb-1" />
              <span className="text-sm font-medium text-gray-800 text-center">
                Sacar dinero
              </span>
            </button>
            <button onClick={() => openModal('add')} className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 p-3 rounded-xl border border-green-200 transition-colors duration-200">
              <PlusIcon size={22} className="text-green-600 mb-1" />
              <span className="text-sm font-medium text-gray-800 text-center">
                Agregar dinero
              </span>
            </button>
            <button onClick={() => openModal('x_cut')} className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 p-3 rounded-xl border border-blue-200 transition-colors duration-200">
              <ClipboardListIcon size={22} className="text-blue-600 mb-1" />
              <span className="text-sm font-medium text-gray-800 text-center">
                Reporte X
              </span>
            </button>
            <button onClick={() => openModal('audit')} className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 p-3 rounded-xl border border-purple-200 transition-colors duration-200">
              <AlertTriangleIcon size={22} className="text-purple-600 mb-1" />
              <span className="text-sm font-medium text-gray-800 text-center">
                Verificar caja
              </span>
            </button>
          </div>
        </div>
        {/* Movimientos recientes */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Movimientos</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon size={16} className="text-gray-400" />
                </div>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 block rounded-lg border border-gray-300 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Buscar" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMovements.length > 0 ? filteredMovements.map(movement => <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.date).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${movement.type === 'apertura' ? 'bg-green-100 text-green-800' : movement.type === 'cierre_z' ? 'bg-red-100 text-red-800' : movement.type === 'venta' ? 'bg-blue-100 text-blue-800' : movement.type === 'reembolso' ? 'bg-amber-100 text-amber-800' : movement.type === 'sangria' ? 'bg-purple-100 text-purple-800' : movement.type === 'ingreso' ? 'bg-green-100 text-green-800' : movement.type === 'corte_x' ? 'bg-indigo-100 text-indigo-800' : movement.type === 'arqueo' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                          {getMovementTypeLabel(movement.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.notes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <span className={movement.type === 'venta' || movement.type === 'apertura' || movement.type === 'ingreso' ? 'text-green-600' : movement.type === 'reembolso' || movement.type === 'sangria' || movement.type === 'cierre_z' ? 'text-red-600' : 'text-gray-900'}>
                          {movement.type === 'venta' || movement.type === 'apertura' || movement.type === 'ingreso' ? '+' : movement.type === 'reembolso' || movement.type === 'sangria' || movement.type === 'cierre_z' ? '-' : ''}
                          {movement.amount > 0 ? new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(movement.amount) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openModal('view', movement)} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50">
                          <EyeIcon size={16} />
                        </button>
                        {(movement.type === 'corte_x' || movement.type === 'cierre_z' || movement.type === 'arqueo') && <button onClick={() => openModal('view', movement)} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 ml-1">
                            <PrinterIcon size={16} />
                          </button>}
                      </td>
                    </tr>) : <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron movimientos con ese término de búsqueda' : 'No hay movimientos registrados'}
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>;
  };
  // Renderizar pestaña de órdenes pendientes
  const renderOrdersTab = () => {
    return <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Órdenes pendientes de pago
            </h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon size={16} className="text-gray-400" />
                </div>
                <input type="text" className="pl-10 block rounded-lg border border-gray-300 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Buscar orden" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesa
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesero
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
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
                {pendingOrders.length > 0 ? pendingOrders.map(order => <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Mesa {order.tableNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.waiter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-1">
                          <button onClick={() => openModal('process_payment', order)} className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50 flex items-center" title="Procesar pago">
                            <DollarSignIcon size={16} />
                          </button>
                          <button onClick={() => openModal('split_bill', order)} className="text-purple-600 hover:text-purple-900 p-1.5 rounded-full hover:bg-purple-50 flex items-center" title="Dividir cuenta">
                            <ScissorsIcon size={16} />
                          </button>
                          <button onClick={() => openModal('view', {
                      id: order.id,
                      type: 'venta',
                      amount: order.total,
                      date: order.createdAt,
                      notes: `Orden ${order.id} - Mesa ${order.tableNumber}`,
                      userId: '1',
                      relatedId: order.id
                    })} className="text-gray-600 hover:text-gray-900 p-1.5 rounded-full hover:bg-gray-50 flex items-center" title="Ver detalles">
                            <EyeIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>) : <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No hay órdenes pendientes de pago
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>;
  };
  // Renderizar pestaña de asignación de mesas
  const renderTablesTab = () => {
    return <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Asignación de mesas
            </h3>
            <div className="flex items-center space-x-2">
              <select className="block rounded-lg border border-gray-300 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="all">Todas las mesas</option>
                <option value="available">Disponibles</option>
                <option value="occupied">Ocupadas</option>
                <option value="reserved">Reservadas</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map(table => <div key={table.id} className={`rounded-xl border p-3 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow ${table.status === 'available' ? 'bg-green-50 border-green-200' : table.status === 'occupied' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`} onClick={() => openModal('assign_waiter', table)}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${table.status === 'available' ? 'bg-green-100' : table.status === 'occupied' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <TableIcon size={24} className={table.status === 'available' ? 'text-green-600' : table.status === 'occupied' ? 'text-red-600' : 'text-yellow-600'} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">
                    Mesa {table.number}
                  </p>
                  <p className="text-xs text-gray-500">
                    {table.status === 'available' ? 'Disponible' : table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                  </p>
                  <p className="text-xs font-medium mt-1">
                    {getWaiterNameById(table.waiter)}
                  </p>
                </div>
              </div>)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Meseros activos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiters.map(waiter => <div key={waiter.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <UserIcon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{waiter.name}</h4>
                    <p className="text-xs text-gray-500">
                      {waiter.tables.length} mesas asignadas
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {waiter.tables.map(tableId => {
                const table = tables.find(t => t.id === tableId);
                return <span key={tableId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Mesa {table?.number || '?'}
                      </span>;
              })}
                </div>
              </div>)}
          </div>
        </div>
      </div>;
  };
  // Calcular totales para el resumen
  const calculateSummary = () => {
    if (!movements || !movements.length) {
      return {
        cash: initialAmount || 0,
        card: 0,
        expected: initialAmount || 0,
        difference: 0
      };
    }
    const cash = movements.reduce((total: number, mov: any) => {
      if (mov.type === 'venta' || mov.type === 'apertura' || mov.type === 'ingreso') {
        return total + mov.amount;
      } else if (mov.type === 'reembolso' || mov.type === 'sangria' || mov.type === 'cierre_z') {
        return total - mov.amount;
      }
      return total;
    }, initialAmount || 0);
    const card = movements.reduce((total: number, mov: any) => {
      if (mov.type === 'venta' || mov.type === 'apertura' || mov.type === 'ingreso') {
        return total + mov.amount;
      } else if (mov.type === 'reembolso' || mov.type === 'sangria' || mov.type === 'cierre_z') {
        return total - mov.amount;
      }
      return total;
    }, 0);
    const expected = cash;
    const difference = 0; // En un sistema real, esto vendría de un arqueo
    return {
      cash,
      card,
      expected,
      difference
    };
  };
  // Add this new function to generate report content
  const generateReportContent = movement => {
    if (!movement) return '';
    // This is a simplified version - in a real app, you would use a PDF library
    // For now, we'll create a text representation that could be converted to PDF
    let content = '';
    // Header
    content += `REPORTE DE ${getMovementTypeLabel(movement.type).toUpperCase()}\n`;
    content += `ID: ${movement.id}\n`;
    content += `Fecha: ${new Date(movement.date).toLocaleString('es-CO')}\n`;
    content += `Usuario: ${movement.userId}\n\n`;
    // Details
    content += `DETALLES\n`;
    content += `Tipo: ${getMovementTypeLabel(movement.type)}\n`;
    content += `Monto: ${new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(movement.amount)}\n`;
    if (movement.notes) {
      content += `Notas: ${movement.notes}\n\n`;
    }
    // Summary for reports
    if (movement.type === 'corte_x' || movement.type === 'cierre_z' || movement.type === 'arqueo') {
      content += `RESUMEN\n`;
      content += `Ventas en efectivo: $120,000\n`;
      content += `Ventas con tarjeta: $85,000\n`;
      content += `Ventas digitales: $45,000\n`;
      content += `Reembolsos: -$15,000\n`;
      content += `Retiros (Sangrías): -$50,000\n`;
      content += `Ingresos: $30,000\n`;
      content += `Total en caja: $170,000\n\n`;
    }
    // Footer
    content += `Generado el: ${new Date().toLocaleString('es-CO')}\n`;
    content += `MicroPOS v1.0\n`;
    return content;
  };
  // Renderizar el contenido de la pestaña activa
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'cash':
        return renderCashTab();
      case 'orders':
        return renderOrdersTab();
      case 'tables':
        return renderTablesTab();
      default:
        return renderCashTab();
    }
  };
  return <div className="h-full space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Caja</h1>
          <p className="text-gray-600 text-sm">
            Control de dinero y movimientos
          </p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setShowHelp(!showHelp)} className={`${showHelp ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:text-blue-800'} text-sm flex items-center py-2 px-3 rounded-lg`}>
            <AlertTriangleIcon size={16} className="mr-1" />
            Ayuda
          </button>
        </div>
      </div>
      {/* Ayuda sobre términos */}
      {showHelp && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
            <AlertTriangleIcon size={18} className="mr-2" />
            Términos de caja
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="space-y-2">
              <div>
                <strong className="font-medium">Apertura de caja:</strong>
                <p>Iniciar el día con dinero inicial para dar cambio.</p>
              </div>
              <div>
                <strong className="font-medium">Retiro (Sangría):</strong>
                <p>
                  Sacar dinero de la caja para guardarlo en un lugar seguro.
                </p>
              </div>
              <div>
                <strong className="font-medium">Ingreso de efectivo:</strong>
                <p>Agregar dinero a la caja (no por ventas).</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <strong className="font-medium">Verificación de caja:</strong>
                <p>
                  Contar el dinero físico en caja para confirmar que coincide
                  con lo que muestra el sistema.
                </p>
              </div>
              <div>
                <strong className="font-medium">Corte X:</strong>
                <p>
                  Reporte de ventas del día hasta el momento (sin cerrar caja).
                </p>
              </div>
              <div>
                <strong className="font-medium">Cierre de caja (Z):</strong>
                <p>Terminar operaciones del día y cerrar la caja.</p>
              </div>
            </div>
          </div>
        </div>}
      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <TabButton active={activeTab === 'cash'} onClick={() => setActiveTab('cash')} icon={<DollarSignIcon size={16} />}>
          Caja
        </TabButton>
        <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ReceiptIcon size={16} />}>
          Órdenes pendientes
        </TabButton>
        <TabButton active={activeTab === 'tables'} onClick={() => setActiveTab('tables')} icon={<UsersIcon size={16} />}>
          Asignación de mesas
        </TabButton>
      </div>
      {renderActiveTabContent()}
      {/* Modal para acciones de caja */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalType === 'open' ? 'Abrir caja' : modalType === 'close' ? 'Cerrar caja (Z)' : modalType === 'withdraw' ? 'Retiro de efectivo (Sangría)' : modalType === 'add' ? 'Ingreso de efectivo' : modalType === 'x_cut' ? 'Corte X' : modalType === 'audit' ? 'Arqueo sorpresa' : modalType === 'process_payment' ? 'Procesar pago' : modalType === 'split_bill' ? 'Dividir cuenta' : modalType === 'assign_waiter' ? 'Asignar mesero' : 'Detalles del movimiento'} footer={modalType === 'view' ? <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cerrar
              </button>
              <button type="button" onClick={() => {
        // Generate PDF content
        const reportContent = generateReportContent(selectedMovement);
        // Create a Blob with the PDF content
        const blob = new Blob([reportContent], {
          type: 'application/pdf'
        });
        const url = URL.createObjectURL(blob);
        // Create a link to download the PDF
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_${selectedMovement?.type}_${selectedMovement?.id}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }, 100);
        showToast('success', 'Reporte guardado correctamente');
      }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <DownloadIcon size={16} className="mr-1" />
                Guardar reporte
              </button>
            </div> : modalType === 'process_payment' ? <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={processPayment} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <CheckIcon size={16} className="mr-1" />
                Confirmar pago
              </button>
            </div> : modalType === 'split_bill' ? <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={processPayment} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <CheckIcon size={16} className="mr-1" />
                Confirmar división
              </button>
            </div> : modalType === 'assign_waiter' ? <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={assignWaiterToTable} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center" disabled={!selectedWaiter}>
                <CheckIcon size={16} className="mr-1" />
                Asignar mesero
              </button>
            </div> : <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={() => {
        const amountValue = parseInt(amount.replace(/\D/g, '') || '0');
        switch (modalType) {
          case 'open':
            registerMovement('apertura', amountValue, notes);
            break;
          case 'close':
            registerMovement('cierre_z', calculateCurrentBalance(), notes);
            break;
          case 'withdraw':
            registerMovement('sangria', amountValue, notes);
            break;
          case 'add':
            registerMovement('ingreso', amountValue, notes);
            break;
          case 'x_cut':
            registerMovement('corte_x', 0, notes);
            break;
          case 'audit':
            registerMovement('arqueo', amountValue, notes);
            break;
        }
      }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" disabled={modalType !== 'close' && modalType !== 'x_cut' && !amount || modalType === 'withdraw' && parseInt(amount.replace(/\D/g, '') || '0') > calculateCurrentBalance()}>
                {modalType === 'view' ? 'Cerrar' : 'Confirmar'}
              </button>
            </div>}>
        {modalType === 'view' ? <div className="space-y-4">
            {selectedMovement && <>
                {/* Detalles del movimiento */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Tipo</p>
                      <p className="font-medium">
                        {getMovementTypeLabel(selectedMovement.type)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha/Hora</p>
                      <p className="font-medium">
                        {new Date(selectedMovement.date).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monto</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(selectedMovement.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Usuario</p>
                      <p className="font-medium">
                        {selectedMovement.userId === '1' ? 'Cajero Demo' : selectedMovement.userId === '2' ? 'Supervisor Demo' : selectedMovement.userId === '3' ? 'Admin Demo' : selectedMovement.userId}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Notas</p>
                    <p>{selectedMovement.notes}</p>
                  </div>
                </div>
                {/* Si es una venta, mostrar detalles */}
                {selectedMovement.type === 'venta' && selectedMovement.relatedId && <div>
                      <h3 className="font-medium mb-2">Detalles de la venta</h3>
                      {/* Aquí mostrar los detalles de la venta relacionada */}
                      <div className="border border-gray-200 rounded-lg p-3">
                        <p className="text-sm">
                          Venta #{selectedMovement.relatedId}
                        </p>
                        <p className="text-sm text-gray-500">
                          Los detalles completos están disponibles en el ticket
                          de venta.
                        </p>
                      </div>
                    </div>}
                {/* Si es un corte X o Z, mostrar resumen */}
                {(selectedMovement.type === 'corte_x' || selectedMovement.type === 'cierre_z') && <div>
                    <h3 className="font-medium mb-2">Resumen del corte</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Ventas en efectivo:
                        </span>
                        <span className="font-medium">$120,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Ventas con tarjeta:
                        </span>
                        <span className="font-medium">$85,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Ventas digitales:
                        </span>
                        <span className="font-medium">$45,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Reembolsos:
                        </span>
                        <span className="font-medium text-red-600">
                          -$15,000
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Retiros (Sangrías):
                        </span>
                        <span className="font-medium text-red-600">
                          -$50,000
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Ingresos:</span>
                        <span className="font-medium">$30,000</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 flex justify-between">
                        <span className="font-medium">Total en caja:</span>
                        <span className="font-medium">$170,000</span>
                      </div>
                    </div>
                  </div>}
              </>}
          </div> : modalType === 'process_payment' ? <div className="space-y-5">
            {selectedOrder && <>
                {/* Detalles de la orden */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Orden #{selectedOrder.id} - Mesa {selectedOrder.tableNumber}
                  </h4>
                  <div className="mb-3">
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                              Item
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                              Cant.
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                              Precio
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedOrder.items.map(item => <tr key={item.id}>
                              <td className="px-3 py-2 text-sm text-gray-800">
                                {item.name}
                              </td>
                              <td className="px-3 py-2 text-sm text-center text-gray-800">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2 text-sm text-right text-gray-800">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="px-3 py-2 text-sm text-right text-gray-800">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedOrder.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Impoconsumo (8%):
                      </span>
                      <span className="font-medium">
                        {formatCurrency(selectedOrder.tax)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">
                          Propina:
                        </span>
                        <div className="flex space-x-1">
                          {[0, 5, 10, 15].map(percent => <button key={percent} onClick={() => handleTipPercentageChange(percent)} className={`px-2 py-0.5 text-xs rounded ${tipPercentage === percent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                              {percent}%
                            </button>)}
                        </div>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(selectedOrder.tip)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-800">Total:</span>
                      <span className="font-bold text-gray-800">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Métodos de pago */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-800">
                      Método de pago
                    </h4>
                    {paymentMethods.length > 0 && <button onClick={addPaymentMethod} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                        <PlusIcon size={16} className="mr-1" />
                        Agregar método
                      </button>}
                  </div>
                  <div className="space-y-3">
                    {paymentMethods.map((method, index) => <div key={method.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800 mr-2">
                              Método {index + 1}
                            </span>
                            {paymentMethods.length > 1 && <button onClick={() => removePaymentMethod(method.id)} className="text-red-500 hover:text-red-700">
                                <XIcon size={16} />
                              </button>}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(method.amount)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tipo de pago
                            </label>
                            <select className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={method.type} onChange={e => updatePaymentMethod(method.id, {
                      type: e.target.value as 'cash' | 'card' | 'digital',
                      name: e.target.value === 'cash' ? 'Efectivo' : e.target.value === 'card' ? 'Tarjeta' : 'Pago digital'
                    })}>
                              <option value="cash">Efectivo</option>
                              <option value="card">Tarjeta</option>
                              <option value="digital">Pago digital</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Monto
                            </label>
                            <input type="text" className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={formatAmount(method.amount.toString())} onChange={e => {
                      const value = e.target.value.replace(/\D/g, '');
                      updatePaymentMethod(method.id, {
                        amount: parseInt(value || '0')
                      });
                    }} />
                          </div>
                        </div>
                        {/* Campos específicos según el tipo de pago */}
                        {method.type === 'cash' && <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Monto recibido
                            </label>
                            <div className="flex space-x-3">
                              <input type="text" className="flex-1 border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Monto recibido" value={method.details?.amountGiven || ''} onChange={e => {
                      updatePaymentMethod(method.id, {
                        details: {
                          ...method.details,
                          amountGiven: formatAmount(e.target.value)
                        }
                      });
                    }} />
                              <div className="flex-1">
                                <div className="text-sm text-gray-500 mb-1">
                                  Cambio
                                </div>
                                <div className="font-medium">
                                  {formatCurrency(calculateChange(method))}
                                </div>
                              </div>
                            </div>
                          </div>}
                        {method.type === 'card' && <div className="mt-3 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de tarjeta
                              </label>
                              <select className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={method.details?.cardType || 'credit'} onChange={e => {
                      updatePaymentMethod(method.id, {
                        name: `Tarjeta ${e.target.value === 'credit' ? 'Crédito' : 'Débito'}`,
                        details: {
                          ...method.details,
                          cardType: e.target.value
                        }
                      });
                    }}>
                                <option value="credit">Crédito</option>
                                <option value="debit">Débito</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Comisión (%)
                              </label>
                              <select className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={method.details?.feePercentage || '3'} onChange={e => {
                      updatePaymentMethod(method.id, {
                        details: {
                          ...method.details,
                          feePercentage: e.target.value
                        }
                      });
                    }}>
                                <option value="0">0%</option>
                                <option value="2.5">2.5%</option>
                                <option value="3">3%</option>
                                <option value="4">4%</option>
                                <option value="5">5%</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Últimos 4 dígitos
                              </label>
                              <input type="text" maxLength={4} className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Últimos 4 dígitos" value={method.details?.lastFourDigits || ''} onChange={e => {
                      const value = e.target.value.replace(/\D/g, '');
                      updatePaymentMethod(method.id, {
                        details: {
                          ...method.details,
                          lastFourDigits: value
                        }
                      });
                    }} />
                            </div>
                          </div>}
                        {method.type === 'digital' && <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Plataforma
                            </label>
                            <select className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={method.details?.platform || 'nequi'} onChange={e => {
                    updatePaymentMethod(method.id, {
                      name: `Pago ${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)}`,
                      details: {
                        ...method.details,
                        platform: e.target.value
                      }
                    });
                  }}>
                              <option value="nequi">Nequi</option>
                              <option value="daviplata">Daviplata</option>
                              <option value="bancolombia">Bancolombia</option>
                              <option value="otro">Otro</option>
                            </select>
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Referencia de pago
                              </label>
                              <input type="text" className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Referencia de pago" value={method.details?.reference || ''} onChange={e => {
                      updatePaymentMethod(method.id, {
                        details: {
                          ...method.details,
                          reference: e.target.value
                        }
                      });
                    }} />
                            </div>
                          </div>}
                      </div>)}
                    {/* Botón para agregar método de pago si no hay ninguno */}
                    {paymentMethods.length === 0 && <button onClick={addPaymentMethod} className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center">
                        <PlusIcon size={16} className="mr-1" />
                        Agregar método de pago
                      </button>}
                    {/* Totales de pago */}
                    {paymentMethods.length > 0 && <div className="pt-3 border-t border-gray-200 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Total de la orden:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(selectedOrder.total)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Total pagado:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(paymentMethods.reduce((sum, method) => sum + method.amount, 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Pendiente:
                          </span>
                          <span className={`font-medium ${calculateRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(calculateRemainingAmount())}
                          </span>
                        </div>
                      </div>}
                  </div>
                </div>
              </>}
          </div> : modalType === 'split_bill' ? <div className="space-y-5">
            {selectedOrder && <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Dividir cuenta - Orden #{selectedOrder.id} - Mesa{' '}
                    {selectedOrder.tableNumber}
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total a dividir:</span>
                      <span className="font-bold">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de partes iguales
                      </label>
                      <div className="flex space-x-2">
                        {[2, 3, 4, 5].map(num => <button key={num} type="button" className="flex-1 py-2 px-3 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50" onClick={() => {
                    // Dividir en partes iguales
                    const partAmount = Math.round(selectedOrder.total / num);
                    const methods = [];
                    for (let i = 0; i < num; i++) {
                      // El último pago ajusta cualquier diferencia por redondeo
                      const amount = i === num - 1 ? selectedOrder.total - partAmount * (num - 1) : partAmount;
                      methods.push({
                        id: (i + 1).toString(),
                        name: 'Efectivo',
                        amount,
                        type: 'cash' as const
                      });
                    }
                    setPaymentMethods(methods);
                  }}>
                            {num}
                          </button>)}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800">Pagos</h4>
                        <button onClick={addPaymentMethod} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                          <PlusIcon size={16} className="mr-1" />
                          Agregar pago
                        </button>
                      </div>
                      <div className="space-y-3">
                        {paymentMethods.map((method, index) => <div key={method.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-800 mr-2">
                                  Pago {index + 1}
                                </span>
                                <button onClick={() => removePaymentMethod(method.id)} className="text-red-500 hover:text-red-700">
                                  <XIcon size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Tipo de pago
                                </label>
                                <select className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={method.type} onChange={e => updatePaymentMethod(method.id, {
                          type: e.target.value as 'cash' | 'card' | 'digital',
                          name: e.target.value === 'cash' ? 'Efectivo' : e.target.value === 'card' ? 'Tarjeta' : 'Pago digital'
                        })}>
                                  <option value="cash">Efectivo</option>
                                  <option value="card">Tarjeta</option>
                                  <option value="digital">Pago digital</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Monto
                                </label>
                                <input type="text" className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={formatAmount(method.amount.toString())} onChange={e => {
                          const value = e.target.value.replace(/\D/g, '');
                          updatePaymentMethod(method.id, {
                            amount: parseInt(value || '0')
                          });
                        }} />
                              </div>
                            </div>
                            {/* Campos específicos según el tipo de pago */}
                            {method.type === 'cash' && <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Monto recibido
                                </label>
                                <div className="flex space-x-3">
                                  <input type="text" className="flex-1 border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Monto recibido" value={method.details?.amountGiven || ''} onChange={e => {
                          updatePaymentMethod(method.id, {
                            details: {
                              ...method.details,
                              amountGiven: formatAmount(e.target.value)
                            }
                          });
                        }} />
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-500 mb-1">
                                      Cambio
                                    </div>
                                    <div className="font-medium">
                                      {formatCurrency(calculateChange(method))}
                                    </div>
                                  </div>
                                </div>
                              </div>}
                            {method.type === 'card' && <div className="mt-3 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de tarjeta
                                  </label>
                                  <select className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={method.details?.cardType || 'credit'} onChange={e => {
                          updatePaymentMethod(method.id, {
                            name: `Tarjeta ${e.target.value === 'credit' ? 'Crédito' : 'Débito'}`,
                            details: {
                              ...method.details,
                              cardType: e.target.value
                            }
                          });
                        }}>
                                    <option value="credit">Crédito</option>
                                    <option value="debit">Débito</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Últimos 4 dígitos
                                  </label>
                                  <input type="text" maxLength={4} className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Últimos 4 dígitos" value={method.details?.lastFourDigits || ''} onChange={e => {
                          const value = e.target.value.replace(/\D/g, '');
                          updatePaymentMethod(method.id, {
                            details: {
                              ...method.details,
                              lastFourDigits: value
                            }
                          });
                        }} />
                                </div>
                              </div>}
                            {method.type === 'digital' && <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Plataforma
                                </label>
                                <select className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={method.details?.platform || 'nequi'} onChange={e => {
                        updatePaymentMethod(method.id, {
                          name: `Pago ${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)}`,
                          details: {
                            ...method.details,
                            platform: e.target.value
                          }
                        });
                      }}>
                                  <option value="nequi">Nequi</option>
                                  <option value="daviplata">Daviplata</option>
                                  <option value="bancolombia">
                                    Bancolombia
                                  </option>
                                  <option value="otro">Otro</option>
                                </select>
                              </div>}
                          </div>)}
                      </div>
                    </div>
                    {/* Totales de pago */}
                    {paymentMethods.length > 0 && <div className="pt-3 border-t border-gray-200 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Total de la orden:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(selectedOrder.total)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Total pagado:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(paymentMethods.reduce((sum, method) => sum + method.amount, 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Pendiente:
                          </span>
                          <span className={`font-medium ${calculateRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(calculateRemainingAmount())}
                          </span>
                        </div>
                      </div>}
                  </div>
                </div>
              </>}
          </div> : modalType === 'assign_waiter' ? <div className="space-y-4">
            {selectedTable && <>
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Mesa {selectedTable.number}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Estado:{' '}
                    {selectedTable.status === 'available' ? 'Disponible' : selectedTable.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                  </p>
                  {selectedTable.waiter && <p className="text-sm text-gray-600 mt-1">
                      Mesero actual: {getWaiterNameById(selectedTable.waiter)}
                    </p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar mesero
                  </label>
                  <div className="space-y-2">
                    {waiters.map(waiter => <div key={waiter.id} className={`border rounded-lg p-3 flex items-center cursor-pointer ${selectedWaiter?.id === waiter.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`} onClick={() => setSelectedWaiter(waiter)}>
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <UserIcon size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">
                            {waiter.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {waiter.tables.length} mesas asignadas
                          </p>
                        </div>
                        {selectedWaiter?.id === waiter.id && <div className="bg-blue-500 rounded-full p-1">
                            <CheckIcon size={16} className="text-white" />
                          </div>}
                      </div>)}
                  </div>
                </div>
              </>}
          </div> : <div className="space-y-4">
            {modalType === 'close' && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-red-800 flex items-center mb-2">
                  <AlertTriangleIcon size={16} className="mr-2" />
                  Advertencia
                </h3>
                <p className="text-sm text-red-700">
                  Está a punto de cerrar la caja (Z). Esta operación cierra las
                  operaciones del día y no se podrán realizar más ventas hasta
                  abrir la caja nuevamente.
                </p>
              </div>}
            {modalType === 'x_cut' && <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                  <p className="text-sm text-blue-700">
                    El Corte X genera un informe de las operaciones realizadas
                    hasta el momento sin cerrar la caja.
                  </p>
                </div>
                {/* Conteo de dinero para Corte X */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Conteo de efectivo
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $100.000
                        </label>
                        <input type="number" min="0" id="bill100" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('normal')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $50.000
                        </label>
                        <input type="number" min="0" id="bill50" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('normal')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $20.000
                        </label>
                        <input type="number" min="0" id="bill20" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('normal')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $10.000
                        </label>
                        <input type="number" min="0" id="bill10" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('normal')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $5.000
                        </label>
                        <input type="number" min="0" id="bill5" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('normal')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $2.000
                        </label>
                        <input type="number" min="0" id="bill2" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('normal')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Monedas $1.000
                        </label>
                        <input type="number" min="0" id="coin1000" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('normal')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Monedas $500
                        </label>
                        <input type="number" min="0" id="coin500" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('normal')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Otras monedas
                        </label>
                        <input type="number" min="0" id="coinOther" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('normal')} />
                      </div>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm font-medium">
                        Total contado:
                      </span>
                      <span className="text-sm font-medium" id="totalCounted">
                        $0
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-sm font-medium">
                        Total sistema:
                      </span>
                      <span className="text-sm font-medium">$170,000</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-medium">Diferencia:</span>
                      <span className="text-sm font-medium text-red-600" id="difference">
                        -$170,000
                      </span>
                    </div>
                  </div>
                </div>
              </div>}
            {modalType === 'audit' && <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-2">
                  <p className="text-sm text-amber-700">
                    El arqueo permite verificar que el dinero físico en caja
                    coincide con el registro del sistema.
                  </p>
                </div>
                {/* Conteo de dinero para Arqueo */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Conteo de efectivo
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $100.000
                        </label>
                        <input type="number" min="0" id="auditBill100" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('audit')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $50.000
                        </label>
                        <input type="number" min="0" id="auditBill50" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('audit')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $20.000
                        </label>
                        <input type="number" min="0" id="auditBill20" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('audit')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $10.000
                        </label>
                        <input type="number" min="0" id="auditBill10" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('audit')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $5.000
                        </label>
                        <input type="number" min="0" id="auditBill5" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('audit')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $2.000
                        </label>
                        <input type="number" min="0" id="auditBill2" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('audit')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Monedas $1.000
                        </label>
                        <input type="number" min="0" id="auditCoin1000" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('audit')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Monedas $500
                        </label>
                        <input type="number" min="0" id="auditCoin500" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('audit')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Otras monedas
                        </label>
                        <input type="number" min="0" id="auditCoinOther" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('audit')} />
                      </div>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm font-medium">
                        Total contado:
                      </span>
                      <span className="text-sm font-medium">$0</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-sm font-medium">
                        Total sistema:
                      </span>
                      <span className="text-sm font-medium">$170,000</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-medium">Diferencia:</span>
                      <span className="text-sm font-medium text-red-600">
                        -$170,000
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Monto contado en efectivo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input type="text" id="amount" value={amount} onChange={handleAmountChange} className="pl-7 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
                  </div>
                </div>
              </div>}
            {modalType === 'close' && <div className="space-y-4">
                {/* Conteo de dinero para Cierre Z */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Conteo de efectivo
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $100.000
                        </label>
                        <input type="number" min="0" id="closeBill100" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('close')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $50.000
                        </label>
                        <input type="number" min="0" id="closeBill50" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('close')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $20.000
                        </label>
                        <input type="number" min="0" id="closeBill20" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('close')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $10.000
                        </label>
                        <input type="number" min="0" id="closeBill10" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('close')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $5.000
                        </label>
                        <input type="number" min="0" id="closeBill5" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('close')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Billetes $2.000
                        </label>
                        <input type="number" min="0" id="closeBill2" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('close')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Monedas $1.000
                        </label>
                        <input type="number" min="0" id="closeCoin1000" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('close')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Monedas $500
                        </label>
                        <input type="number" min="0" id="closeCoin500" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('close')} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Otras monedas
                        </label>
                        <input type="number" min="0" id="closeCoinOther" className="w-full border border-gray-300 rounded-lg py-1.5 px-2 text-sm" placeholder="0" onChange={() => handleBillInputChange('close')} />
                      </div>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm font-medium">
                        Total contado:
                      </span>
                      <span className="text-sm font-medium" id="closeTotalCounted">
                        $0
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-sm font-medium">
                        Total sistema:
                      </span>
                      <span className="text-sm font-medium">$170,000</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-medium">Diferencia:</span>
                      <span className="text-sm font-medium text-red-600" id="closeDifference">
                        -$170,000
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Monto total en caja
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input type="text" id="amount" value={new Intl.NumberFormat('es-CO').format(calculateCurrentBalance())} readOnly className="pl-7 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3" />
                  </div>
                </div>
              </div>}
            {modalType !== 'close' && modalType !== 'x_cut' && modalType !== 'audit' && <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Monto
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input type="text" id="amount" value={amount} onChange={handleAmountChange} className="pl-7 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
                  </div>
                  {modalType === 'withdraw' && parseInt(amount.replace(/\D/g, '') || '0') > calculateCurrentBalance() && <p className="mt-1 text-sm text-red-600">
                        El monto no puede ser mayor al saldo actual
                      </p>}
                </div>}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Agregar notas (opcional)" />
            </div>
          </div>}
      </Modal>
    </div>;
};
export default CashRegisterPage;