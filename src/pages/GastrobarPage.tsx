import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardIcon, UtensilsIcon, CalendarIcon, GlassWaterIcon, ClockIcon, PlusIcon, CheckIcon, AlertCircleIcon, MoreHorizontalIcon, UserIcon, SearchIcon, FilterIcon, BellIcon, XIcon, EditIcon, TrashIcon, SaveIcon, CoffeeIcon, PizzaIcon, BeerIcon, CakeIcon, SaladIcon, PackageIcon, DollarSignIcon, PrinterIcon, UsersIcon, SettingsIcon, TruckIcon, BarChartIcon, SmartphoneIcon, ArchiveIcon, ChevronDownIcon, RefreshCcwIcon, WifiOffIcon, AlertTriangleIcon } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
// Tipo para mesas
type Table = {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  occupiedSince?: string;
  bill?: number;
  guests?: number;
};
// Tipo para órdenes
type Order = {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  status: 'pending' | 'in-progress' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  waiter?: string;
  splitBill?: boolean;
};
// Tipo para ítems de orden
type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: 'pending' | 'in-progress' | 'ready' | 'delivered' | 'cancelled';
  notes?: string;
  category: 'food' | 'drink';
  menuItemId: string;
};
// Tipo para reservaciones
type Reservation = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  tableId: string;
  tableNumber: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
};
// Tipo para ítems del menú
type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: 'food' | 'drink';
  available: boolean;
  image?: string;
  preparationTime?: number;
  stock?: number;
  stockAlert?: number;
  isCombo?: boolean;
  comboItems?: string[];
};
// Tipo para categorías del menú
type MenuCategory = {
  id: string;
  name: string;
  type: 'food' | 'drink';
  order: number;
};
// Tipo para inventario
type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  lastUpdated: string;
  warehouse: string;
};
// Datos de ejemplo para mesas
const mockTables: Table[] = [{
  id: 't1',
  number: 1,
  capacity: 4,
  status: 'available'
}, {
  id: 't2',
  number: 2,
  capacity: 2,
  status: 'occupied',
  occupiedSince: new Date(Date.now() - 45 * 60000).toISOString(),
  bill: 78500,
  guests: 2
}, {
  id: 't3',
  number: 3,
  capacity: 6,
  status: 'occupied',
  occupiedSince: new Date(Date.now() - 30 * 60000).toISOString(),
  bill: 124600,
  guests: 5
}, {
  id: 't4',
  number: 4,
  capacity: 4,
  status: 'reserved'
}, {
  id: 't5',
  number: 5,
  capacity: 2,
  status: 'cleaning'
}, {
  id: 't6',
  number: 6,
  capacity: 8,
  status: 'available'
}, {
  id: 't7',
  number: 7,
  capacity: 4,
  status: 'available'
}, {
  id: 't8',
  number: 8,
  capacity: 2,
  status: 'available'
}];
// Datos de ejemplo para categorías del menú
const mockMenuCategories: MenuCategory[] = [{
  id: 'cat-1',
  name: 'Entradas',
  type: 'food',
  order: 1
}, {
  id: 'cat-2',
  name: 'Platos Fuertes',
  type: 'food',
  order: 2
}, {
  id: 'cat-3',
  name: 'Postres',
  type: 'food',
  order: 3
}, {
  id: 'cat-4',
  name: 'Bebidas Frías',
  type: 'drink',
  order: 1
}, {
  id: 'cat-5',
  name: 'Bebidas Calientes',
  type: 'drink',
  order: 2
}, {
  id: 'cat-6',
  name: 'Cervezas',
  type: 'drink',
  order: 3
}, {
  id: 'cat-7',
  name: 'Vinos',
  type: 'drink',
  order: 4
}];
// Datos de ejemplo para ítems del menú
const mockMenuItems: MenuItem[] = [{
  id: 'item-1',
  name: 'Nachos con Guacamole',
  description: 'Nachos crujientes con guacamole fresco',
  price: 18000,
  category: 'cat-1',
  type: 'food',
  available: true,
  preparationTime: 10,
  stock: 15,
  stockAlert: 5
}, {
  id: 'item-2',
  name: 'Alitas BBQ',
  description: 'Alitas de pollo bañadas en salsa BBQ',
  price: 22000,
  category: 'cat-1',
  type: 'food',
  available: true,
  preparationTime: 15,
  stock: 20,
  stockAlert: 7
}, {
  id: 'item-3',
  name: 'Hamburguesa Clásica',
  description: 'Carne de res, queso, lechuga, tomate y cebolla',
  price: 25000,
  category: 'cat-2',
  type: 'food',
  available: true,
  preparationTime: 20,
  stock: 18,
  stockAlert: 5
}, {
  id: 'item-4',
  name: 'Pizza Familiar',
  description: 'Pizza grande con queso y pepperoni',
  price: 45000,
  category: 'cat-2',
  type: 'food',
  available: true,
  preparationTime: 25,
  stock: 8,
  stockAlert: 3
}, {
  id: 'item-5',
  name: 'Ensalada César',
  description: 'Lechuga romana, crutones, pollo y aderezo césar',
  price: 18000,
  category: 'cat-2',
  type: 'food',
  available: true,
  preparationTime: 10,
  stock: 12,
  stockAlert: 4
}, {
  id: 'item-6',
  name: 'Cheesecake',
  description: 'Tarta de queso con salsa de frutos rojos',
  price: 12000,
  category: 'cat-3',
  type: 'food',
  available: true,
  preparationTime: 5,
  stock: 6,
  stockAlert: 3
}, {
  id: 'item-7',
  name: 'Limonada',
  description: 'Limonada natural con menta',
  price: 8000,
  category: 'cat-4',
  type: 'drink',
  available: true,
  preparationTime: 5,
  stock: 25,
  stockAlert: 8
}, {
  id: 'item-8',
  name: 'Cerveza Artesanal',
  description: 'Cerveza artesanal local',
  price: 12000,
  category: 'cat-6',
  type: 'drink',
  available: true,
  stock: 30,
  stockAlert: 10
}, {
  id: 'item-9',
  name: 'Café Americano',
  description: 'Café americano recién preparado',
  price: 5000,
  category: 'cat-5',
  type: 'drink',
  available: true,
  stock: 50,
  stockAlert: 15
}, {
  id: 'item-10',
  name: 'Botella Vino Tinto',
  description: 'Vino tinto reserva',
  price: 65000,
  category: 'cat-7',
  type: 'drink',
  available: true,
  stock: 8,
  stockAlert: 2
}, {
  id: 'item-11',
  name: 'Papas Fritas',
  description: 'Papas fritas con sal',
  price: 8000,
  category: 'cat-1',
  type: 'food',
  available: true,
  preparationTime: 10,
  stock: 22,
  stockAlert: 8
}, {
  id: 'item-12',
  name: 'Combo Hamburguesa Especial',
  description: 'Hamburguesa + Papas + Bebida',
  price: 32000,
  category: 'cat-2',
  type: 'food',
  available: true,
  preparationTime: 20,
  stock: 15,
  stockAlert: 5,
  isCombo: true,
  comboItems: ['item-3', 'item-11', 'item-7']
}];
// Datos de ejemplo para órdenes
const mockOrders: Order[] = [{
  id: 'o1',
  tableId: 't2',
  tableNumber: 2,
  items: [{
    id: 'i1',
    menuItemId: 'item-3',
    name: 'Hamburguesa Clásica',
    quantity: 2,
    price: 25000,
    status: 'in-progress',
    category: 'food'
  }, {
    id: 'i2',
    menuItemId: 'item-8',
    name: 'Cerveza Artesanal',
    quantity: 2,
    price: 12000,
    status: 'delivered',
    category: 'drink'
  }, {
    id: 'i3',
    menuItemId: 'item-11',
    name: 'Papas Fritas',
    quantity: 1,
    price: 8000,
    status: 'pending',
    category: 'food'
  }],
  status: 'in-progress',
  createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  totalAmount: 82000,
  waiter: 'Carlos Ramírez'
}, {
  id: 'o2',
  tableId: 't3',
  tableNumber: 3,
  items: [{
    id: 'i4',
    menuItemId: 'item-4',
    name: 'Pizza Familiar',
    quantity: 1,
    price: 45000,
    status: 'ready',
    category: 'food'
  }, {
    id: 'i5',
    menuItemId: 'item-5',
    name: 'Ensalada César',
    quantity: 2,
    price: 18000,
    status: 'delivered',
    category: 'food'
  }, {
    id: 'i6',
    menuItemId: 'item-10',
    name: 'Botella Vino Tinto',
    quantity: 1,
    price: 65000,
    status: 'delivered',
    category: 'drink'
  }],
  status: 'in-progress',
  createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  totalAmount: 146000,
  waiter: 'Ana Martínez',
  splitBill: true
}];
// Datos de ejemplo para reservaciones
const mockReservations: Reservation[] = [{
  id: 'r1',
  name: 'Carlos Rodríguez',
  phone: '3001234567',
  date: new Date().toISOString().split('T')[0],
  time: '19:00',
  guests: 4,
  tableId: 't4',
  tableNumber: 4,
  status: 'confirmed'
}, {
  id: 'r2',
  name: 'María López',
  phone: '3109876543',
  date: new Date().toISOString().split('T')[0],
  time: '20:30',
  guests: 2,
  tableId: '',
  tableNumber: 0,
  status: 'pending',
  notes: 'Prefiere mesa cerca de la ventana'
}, {
  id: 'r3',
  name: 'Juan Pérez',
  phone: '3201234567',
  date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  time: '19:30',
  guests: 6,
  tableId: 't6',
  tableNumber: 6,
  status: 'confirmed'
}];
// Datos de ejemplo para inventario
const mockInventory: InventoryItem[] = [{
  id: 'inv-1',
  name: 'Carne para hamburguesa',
  stock: 25,
  unit: 'unidades',
  minStock: 10,
  lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  warehouse: 'Principal'
}, {
  id: 'inv-2',
  name: 'Queso cheddar',
  stock: 8,
  unit: 'kg',
  minStock: 5,
  lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  warehouse: 'Principal'
}, {
  id: 'inv-3',
  name: 'Cerveza artesanal',
  stock: 30,
  unit: 'botellas',
  minStock: 15,
  lastUpdated: new Date().toISOString(),
  warehouse: 'Bodega bebidas'
}, {
  id: 'inv-4',
  name: 'Papas congeladas',
  stock: 4,
  unit: 'bolsas',
  minStock: 5,
  lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  warehouse: 'Congelador'
}, {
  id: 'inv-5',
  name: 'Vino tinto',
  stock: 12,
  unit: 'botellas',
  minStock: 6,
  lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  warehouse: 'Cava'
}];
// Helper para botones soft
const softBtn = (tone: 'green' | 'red' | 'blue' | 'amber' | 'gray' = 'gray') => {
  const baseClasses = 'border transition-colors rounded-full px-3 py-2 text-sm inline-flex items-center justify-center hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed';
  const toneClasses = {
    green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
  };
  return `${baseClasses} ${toneClasses[tone]}`;
};
// Helper para botones CTA con gradiente
const ctaGrad = (enabled: boolean = true) => {
  if (enabled) {
    return 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none active:scale-[0.99]';
  } else {
    return 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-300 shadow-none cursor-not-allowed opacity-80';
  }
};
// Helper para botones de estilo móvil/cashish
const mobileCashishBtn = (tone: 'blue' | 'green' | 'amber' | 'gray' = 'blue') => {
  const baseContainerClasses = 'flex min-w-0 flex-1 items-center justify-center md:h-10 md:rounded-full md:border md:bg-white md:border-gray-200 md:shadow-sm md:px-2 md:pr-3';
  const bubbleBaseClasses = 'rounded-full bg-gradient-to-r text-white flex items-center justify-center shadow h-7 w-7';
  const webBubbleClasses = `${bubbleBaseClasses} mr-2`;
  const mobileBubbleClasses = `${bubbleBaseClasses} mb-1`;
  const bubbleGradients = {
    blue: 'from-blue-600 to-indigo-600',
    green: 'from-emerald-600 to-green-600',
    amber: 'from-amber-500 to-orange-500',
    gray: 'from-gray-500 to-gray-700'
  };
  const webTextClasses = 'text-[11px] sm:text-xs font-medium text-gray-800 truncate';
  const mobileTextClasses = 'text-[10px] leading-tight font-medium text-gray-800';
  return {
    container: baseContainerClasses,
    webBubble: `${webBubbleClasses} ${bubbleGradients[tone]}`,
    mobileBubble: `${mobileBubbleClasses} ${bubbleGradients[tone]}`,
    webText: webTextClasses,
    mobileText: mobileTextClasses
  };
};
const GastrobarPage: React.FC = () => {
  const {
    showToast
  } = useToast();
  const [activeTab, setActiveTab] = useState<'tables' | 'orders' | 'menu' | 'reservations' | 'inventory' | 'reports' | 'settings'>('tables');
  const [tables, setTables] = useState<Table[]>(mockTables);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(mockMenuCategories);
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showTableDetailsModal, setShowTableDetailsModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [showPrintCommandModal, setShowPrintCommandModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(true);
  const [menuFilter, setMenuFilter] = useState<'all' | 'food' | 'drink'>('all');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('all');
  // Estados para nueva orden
  const [newOrderItems, setNewOrderItems] = useState<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[]>([]);
  const [newOrderGuests, setNewOrderGuests] = useState(1);
  // Filtros
  const [tableFilter, setTableFilter] = useState<'all' | 'available' | 'occupied' | 'reserved'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'in-progress' | 'ready'>('all');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'normal'>('all');
  // Simular eventos de conexión
  useEffect(() => {
    const toggleOffline = () => {
      const newState = !isOffline;
      setIsOffline(newState);
      if (newState) {
        showToast('warning', 'Modo offline activado. Los cambios se sincronizarán cuando vuelva la conexión.');
      } else {
        showToast('success', 'Conexión restablecida. Todos los cambios han sido sincronizados.');
      }
    };
    // Simulamos un evento aleatorio de desconexión cada 2-5 minutos
    const timer = setTimeout(() => {
      toggleOffline();
      // Volvemos a conectar después de 10 segundos
      setTimeout(() => toggleOffline(), 10000);
    }, Math.random() * (300000 - 120000) + 120000);
    return () => clearTimeout(timer);
  }, []);
  // Manejar cambio de estado de mesa
  const handleTableStatusChange = (tableId: string, newStatus: Table['status']) => {
    setTables(prevTables => prevTables.map(table => table.id === tableId ? {
      ...table,
      status: newStatus,
      ...(newStatus === 'occupied' ? {
        occupiedSince: new Date().toISOString(),
        guests: 0,
        bill: 0
      } : {}),
      ...(newStatus === 'available' ? {
        occupiedSince: undefined,
        guests: undefined,
        bill: undefined
      } : {})
    } : table));
    showToast('success', `Mesa ${tables.find(t => t.id === tableId)?.number} marcada como ${newStatus === 'available' ? 'disponible' : newStatus === 'occupied' ? 'ocupada' : newStatus === 'reserved' ? 'reservada' : 'en limpieza'}`);
  };
  // Crear nueva orden para una mesa
  const createNewOrder = (tableId: string) => {
    if (newOrderItems.length === 0) {
      showToast('error', 'Debe agregar al menos un producto a la orden');
      return;
    }
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    // Crear los items de la orden
    const orderItems: OrderItem[] = newOrderItems.map((item, index) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      if (!menuItem) throw new Error('Producto no encontrado');
      return {
        id: `new-item-${index}`,
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        status: 'pending',
        category: menuItem.type,
        notes: item.notes
      };
    });
    // Calcular el total
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // Crear la nueva orden
    const newOrder: Order = {
      id: `o${orders.length + 1}`,
      tableId,
      tableNumber: table.number,
      items: orderItems,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount,
      waiter: 'Carlos Ramírez'
    };
    // Actualizar inventario
    updateInventoryFromOrder(orderItems);
    // Actualizar las órdenes y el estado de la mesa
    setOrders([...orders, newOrder]);
    handleTableStatusChange(tableId, 'occupied');
    // Actualizar la cuenta de la mesa
    setTables(prevTables => prevTables.map(t => t.id === tableId ? {
      ...t,
      guests: newOrderGuests,
      bill: totalAmount
    } : t));
    // Limpiar y cerrar
    setNewOrderItems([]);
    setNewOrderGuests(1);
    setShowNewOrderModal(false);
    showToast('success', `Nueva orden creada para mesa ${table.number}`);
    // Mostrar modal para imprimir comanda
    setSelectedOrder(newOrder);
    setShowPrintCommandModal(true);
  };
  // Actualizar inventario basado en una orden
  const updateInventoryFromOrder = (orderItems: OrderItem[]) => {
    // Simulamos actualización de inventario
    setInventory(prevInventory => {
      return prevInventory.map(item => {
        // Simulamos una reducción aleatoria del stock basada en los productos ordenados
        if (Math.random() > 0.7) {
          const reduction = Math.floor(Math.random() * 3) + 1;
          return {
            ...item,
            stock: Math.max(0, item.stock - reduction),
            lastUpdated: new Date().toISOString()
          };
        }
        return item;
      });
    });
  };
  // Editar orden existente
  const updateOrder = (updatedOrder: Order) => {
    setOrders(prevOrders => prevOrders.map(order => order.id === updatedOrder.id ? updatedOrder : order));
    // Actualizar la cuenta de la mesa
    setTables(prevTables => prevTables.map(table => table.id === updatedOrder.tableId ? {
      ...table,
      bill: updatedOrder.totalAmount
    } : table));
    setSelectedOrder(null);
    setShowEditOrderModal(false);
    showToast('success', `Orden actualizada para mesa ${updatedOrder.tableNumber}`);
  };
  // Agregar item al menú
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `item-${menuItems.length + 1}`
    };
    setMenuItems([...menuItems, newItem]);
    setSelectedMenuItem(null);
    setShowMenuItemModal(false);
    showToast('success', `Producto "${item.name}" agregado al menú`);
  };
  // Editar item del menú
  const updateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
    setSelectedMenuItem(null);
    setShowMenuItemModal(false);
    showToast('success', `Producto "${updatedItem.name}" actualizado`);
  };
  // Eliminar item del menú
  const deleteMenuItem = (itemId: string) => {
    setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
    showToast('success', 'Producto eliminado del menú');
  };
  // Manejar pago de cuenta
  const handlePayBill = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.bill) return;
    setSelectedTable(table);
    setShowInvoiceModal(true);
  };
  // Finalizar pago y generar factura
  const finalizeBill = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    showToast('success', `Factura electrónica generada para mesa ${table.number}`);
    handleTableStatusChange(tableId, 'cleaning');
    setShowInvoiceModal(false);
  };
  // Formatear tiempo transcurrido
  const formatElapsedTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const start = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  // Agregar item a la orden en creación
  const addItemToNewOrder = (menuItemId: string, quantity: number = 1, notes?: string) => {
    const existingItem = newOrderItems.find(item => item.menuItemId === menuItemId);
    if (existingItem) {
      setNewOrderItems(prevItems => prevItems.map(item => item.menuItemId === menuItemId ? {
        ...item,
        quantity: item.quantity + quantity,
        notes: notes || item.notes
      } : item));
    } else {
      setNewOrderItems([...newOrderItems, {
        menuItemId,
        quantity,
        notes
      }]);
    }
  };
  // Remover item de la orden en creación
  const removeItemFromNewOrder = (menuItemId: string) => {
    setNewOrderItems(prevItems => prevItems.filter(item => item.menuItemId !== menuItemId));
  };
  // Calcular total de la nueva orden
  const calculateNewOrderTotal = () => {
    return newOrderItems.reduce((sum, item) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return sum + (menuItem?.price || 0) * item.quantity;
    }, 0);
  };
  // Filtrar items del menú
  const filteredMenuItems = menuItems.filter(item => {
    // Filtro por tipo (comida o bebida)
    const typeMatch = menuFilter === 'all' || item.type === menuFilter;
    // Filtro por categoría
    const categoryMatch = menuCategoryFilter === 'all' || item.category === menuCategoryFilter;
    // Filtro por búsqueda
    const searchMatch = menuSearchTerm === '' || item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) || item.description.toLowerCase().includes(menuSearchTerm.toLowerCase());
    return typeMatch && categoryMatch && searchMatch;
  });
  // Filtrar inventario
  const filteredInventory = inventory.filter(item => {
    if (inventoryFilter === 'all') return true;
    if (inventoryFilter === 'low') return item.stock <= item.minStock;
    return item.stock > item.minStock;
  });
  // Ordenar categorías
  const sortedCategories = [...menuCategories].sort((a, b) => a.order - b.order);
  // Categorías filtradas por tipo
  const filteredCategories = sortedCategories.filter(cat => menuFilter === 'all' || cat.type === menuFilter);
  return <div className="h-full space-y-4">
      {/* Banner de estado */}
      {isOffline && <div className="bg-amber-100 text-amber-800 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center">
            <WifiOffIcon size={18} className="mr-2" />
            <span className="font-medium">Modo sin conexión</span>
            <span className="ml-2 text-sm">
              Los cambios se sincronizarán automáticamente cuando vuelva la
              conexión
            </span>
          </div>
          <button className={softBtn('amber')} onClick={() => setIsOffline(false)}>
            <RefreshCcwIcon size={16} className="mr-1" />
            Intentar reconectar
          </button>
        </div>}
      {!isCashRegisterOpen && <div className="bg-red-100 text-red-800 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangleIcon size={18} className="mr-2" />
            <span className="font-medium">Caja cerrada</span>
            <span className="ml-2 text-sm">
              Debe abrir la caja para registrar ventas
            </span>
          </div>
          <button className={ctaGrad()} onClick={() => {
        setIsCashRegisterOpen(true);
        showToast('success', 'Caja abierta correctamente');
      }}>
            <DollarSignIcon size={16} className="mr-1" />
            Abrir caja
          </button>
        </div>}
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-violet-50 to-pink-50 p-4 rounded-3xl shadow-sm border border-white/60">
        <div className="bg-white/60 p-3 rounded-2xl">
          <h1 className="text-2xl font-bold text-gray-800">Gastrobar</h1>
          <p className="text-sm text-gray-600">
            Sistema de gestión para restaurantes y bares
          </p>
        </div>
      </div>
      {/* Tabs de navegación */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto">
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium flex items-center ${activeTab === 'tables' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('tables')}>
            <ClipboardIcon size={16} className="mr-1.5" />
            Mesas
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium flex items-center ${activeTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('orders')}>
            <UtensilsIcon size={16} className="mr-1.5" />
            Órdenes
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium flex items-center ${activeTab === 'menu' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('menu')}>
            <GlassWaterIcon size={16} className="mr-1.5" />
            Menú
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium flex items-center ${activeTab === 'reservations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('reservations')}>
            <CalendarIcon size={16} className="mr-1.5" />
            Reservaciones
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium flex items-center ${activeTab === 'inventory' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('inventory')}>
            <PackageIcon size={16} className="mr-1.5" />
            Inventario
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium flex items-center ${activeTab === 'reports' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('reports')}>
            <BarChartIcon size={16} className="mr-1.5" />
            Reportes
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium flex items-center ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('settings')}>
            <SettingsIcon size={16} className="mr-1.5" />
            Ajustes
          </button>
        </div>
        {/* Contenido de las tabs */}
        <div className="p-4">
          {/* Vista de mesas */}
          {activeTab === 'tables' && <div>
              {/* Filtros y acciones */}
              <div className="flex justify-between mb-4">
                <div className="flex space-x-2">
                  <button className={softBtn(tableFilter === 'all' ? 'blue' : 'gray')} onClick={() => setTableFilter('all')}>
                    Todas
                  </button>
                  <button className={softBtn(tableFilter === 'available' ? 'green' : 'gray')} onClick={() => setTableFilter('available')}>
                    Disponibles
                  </button>
                  <button className={softBtn(tableFilter === 'occupied' ? 'red' : 'gray')} onClick={() => setTableFilter('occupied')}>
                    Ocupadas
                  </button>
                  <button className={softBtn(tableFilter === 'reserved' ? 'amber' : 'gray')} onClick={() => setTableFilter('reserved')}>
                    Reservadas
                  </button>
                </div>
                <button className={ctaGrad()} onClick={() => showToast('info', 'Función de añadir mesa en desarrollo')}>
                  <PlusIcon size={16} className="mr-1" />
                  Añadir mesa
                </button>
              </div>
              {/* Grid de mesas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tables.filter(table => tableFilter === 'all' || table.status === tableFilter).map(table => <div key={table.id} onClick={() => {
              setSelectedTable(table);
              setShowTableDetailsModal(true);
            }} className={`
                        border rounded-2xl p-4 cursor-pointer transition-all shadow-sm hover:shadow
                        ${table.status === 'available' ? 'bg-green-50 border-green-200' : ''}
                        ${table.status === 'occupied' ? 'bg-red-50 border-red-200' : ''}
                        ${table.status === 'reserved' ? 'bg-amber-50 border-amber-200' : ''}
                        ${table.status === 'cleaning' ? 'bg-gray-50 border-gray-200' : ''}
                      `}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Mesa {table.number}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {table.capacity} personas
                          </p>
                        </div>
                        <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium
                            ${table.status === 'available' ? 'bg-green-100 text-green-800' : ''}
                            ${table.status === 'occupied' ? 'bg-red-100 text-red-800' : ''}
                            ${table.status === 'reserved' ? 'bg-amber-100 text-amber-800' : ''}
                            ${table.status === 'cleaning' ? 'bg-gray-100 text-gray-800' : ''}
                          `}>
                          {table.status === 'available' ? 'Disponible' : ''}
                          {table.status === 'occupied' ? 'Ocupada' : ''}
                          {table.status === 'reserved' ? 'Reservada' : ''}
                          {table.status === 'cleaning' ? 'Limpieza' : ''}
                        </span>
                      </div>
                      {table.status === 'occupied' && <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tiempo:</span>
                            <span className="font-medium">
                              {formatElapsedTime(table.occupiedSince)}
                            </span>
                          </div>
                          {table.guests && <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Clientes:</span>
                              <span>{table.guests}</span>
                            </div>}
                          {table.bill && <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Cuenta:</span>
                              <span className="font-medium">
                                {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0
                    }).format(table.bill)}
                              </span>
                            </div>}
                        </div>}
                      {table.status === 'available' && <button onClick={e => {
                e.stopPropagation();
                setSelectedTable(table);
                setNewOrderItems([]);
                setNewOrderGuests(1);
                setShowNewOrderModal(true);
              }} className={ctaGrad(isCashRegisterOpen)} disabled={!isCashRegisterOpen}>
                          <UtensilsIcon size={16} className="mr-1" />
                          Nueva orden
                        </button>}
                      {table.status === 'occupied' && <div className="mt-3 flex space-x-2">
                          <button onClick={e => {
                  e.stopPropagation();
                  const order = orders.find(o => o.tableId === table.id);
                  if (order) {
                    setSelectedOrder(order);
                    setShowEditOrderModal(true);
                  } else {
                    showToast('error', 'No se encontró la orden para esta mesa');
                  }
                }} className={softBtn('blue')}>
                            <EditIcon size={16} className="mr-1" />
                            Editar
                          </button>
                          <button onClick={e => {
                  e.stopPropagation();
                  handlePayBill(table.id);
                }} className={ctaGrad()}>
                            <DollarSignIcon size={16} className="mr-1" />
                            Cobrar
                          </button>
                        </div>}
                      {table.status === 'cleaning' && <button onClick={e => {
                e.stopPropagation();
                handleTableStatusChange(table.id, 'available');
              }} className={softBtn('gray')}>
                          <CheckIcon size={16} className="mr-1" />
                          Disponible
                        </button>}
                    </div>)}
              </div>
            </div>}
          {/* Vista de órdenes */}
          {activeTab === 'orders' && <div>
              {/* Filtros y acciones */}
              <div className="flex justify-between mb-4">
                <div className="flex space-x-2">
                  <button className={softBtn(orderFilter === 'all' ? 'blue' : 'gray')} onClick={() => setOrderFilter('all')}>
                    Todas
                  </button>
                  <button className={softBtn(orderFilter === 'pending' ? 'amber' : 'gray')} onClick={() => setOrderFilter('pending')}>
                    Pendientes
                  </button>
                  <button className={softBtn(orderFilter === 'in-progress' ? 'blue' : 'gray')} onClick={() => setOrderFilter('in-progress')}>
                    En proceso
                  </button>
                  <button className={softBtn(orderFilter === 'ready' ? 'green' : 'gray')} onClick={() => setOrderFilter('ready')}>
                    Listas
                  </button>
                </div>
              </div>
              {/* Lista de órdenes */}
              <div className="space-y-4">
                {orders.filter(order => orderFilter === 'all' || order.status === orderFilter).map(order => <div key={order.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                      <div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">
                            Mesa {order.tableNumber}
                          </h3>
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon size={12} className="mr-1" />
                            {formatElapsedTime(order.createdAt)} atrás
                            {order.waiter && <>
                                <span className="mx-1">•</span>
                                <UserIcon size={12} className="mr-1" />
                                {order.waiter}
                              </>}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`
                              px-2 py-0.5 rounded-full text-xs font-medium mr-2
                              ${order.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                              ${order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                              ${order.status === 'ready' ? 'bg-green-100 text-green-800' : ''}
                              ${order.status === 'delivered' ? 'bg-purple-100 text-purple-800' : ''}
                              ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                            {order.status === 'pending' ? 'Pendiente' : ''}
                            {order.status === 'in-progress' ? 'En proceso' : ''}
                            {order.status === 'ready' ? 'Lista' : ''}
                            {order.status === 'delivered' ? 'Entregada' : ''}
                            {order.status === 'cancelled' ? 'Cancelada' : ''}
                          </span>
                          <button className="text-gray-400 hover:text-gray-600" onClick={() => {
                    setSelectedOrder(order);
                    setShowEditOrderModal(true);
                  }}>
                            <EditIcon size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="space-y-2 mb-3">
                          {order.items.map(item => <div key={item.id} className="flex justify-between items-center">
                              <div className="flex items-start">
                                <div className={`
                                    w-1.5 h-1.5 rounded-full mt-2 mr-2
                                    ${item.status === 'pending' ? 'bg-amber-500' : ''}
                                    ${item.status === 'in-progress' ? 'bg-blue-500' : ''}
                                    ${item.status === 'ready' ? 'bg-green-500' : ''}
                                    ${item.status === 'delivered' ? 'bg-purple-500' : ''}
                                    ${item.status === 'cancelled' ? 'bg-red-500' : ''}
                                  `}></div>
                                <div>
                                  <div className="flex items-center">
                                    <span className="font-medium">
                                      {item.name}
                                    </span>
                                    <span className="ml-2 text-sm text-gray-500">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-xs text-gray-500">
                                    {item.category === 'food' ? <UtensilsIcon size={12} className="mr-1" /> : <GlassWaterIcon size={12} className="mr-1" />}
                                    <span>
                                      {item.category === 'food' ? 'Comida' : 'Bebida'}
                                    </span>
                                  </div>
                                  {item.notes && <div className="text-xs italic text-gray-500">
                                      {item.notes}
                                    </div>}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0
                        }).format(item.price * item.quantity)}
                                </div>
                                <span className={`
                                    text-xs px-1.5 py-0.5 rounded
                                    ${item.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                                    ${item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                                    ${item.status === 'ready' ? 'bg-green-100 text-green-800' : ''}
                                    ${item.status === 'delivered' ? 'bg-purple-100 text-purple-800' : ''}
                                    ${item.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                                  `}>
                                  {item.status === 'pending' ? 'Pendiente' : ''}
                                  {item.status === 'in-progress' ? 'Preparando' : ''}
                                  {item.status === 'ready' ? 'Listo' : ''}
                                  {item.status === 'delivered' ? 'Entregado' : ''}
                                  {item.status === 'cancelled' ? 'Cancelado' : ''}
                                </span>
                              </div>
                            </div>)}
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                          <div className="font-medium text-gray-800">
                            Total:{' '}
                            {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0
                    }).format(order.totalAmount)}
                          </div>
                          <div className="flex space-x-2">
                            <button className={softBtn('blue')} onClick={() => {
                      setSelectedOrder(order);
                      setShowPrintCommandModal(true);
                    }}>
                              <PrinterIcon size={16} className="mr-1" />
                              Comanda
                            </button>
                            {order.splitBill ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center">
                                <CheckIcon size={12} className="mr-1" />
                                Cuenta dividida
                              </span> : <button className={softBtn('amber')} onClick={() => {
                      setSelectedOrder(order);
                      setShowSplitBillModal(true);
                    }}>
                                <UsersIcon size={16} className="mr-1" />
                                Dividir
                              </button>}
                            <button className={ctaGrad()} onClick={() => {
                      const updatedOrder = {
                        ...order,
                        status: 'delivered',
                        items: order.items.map(item => ({
                          ...item,
                          status: 'delivered'
                        })),
                        updatedAt: new Date().toISOString()
                      };
                      updateOrder(updatedOrder);
                      showToast('success', 'Orden marcada como entregada');
                    }}>
                              <CheckIcon size={16} className="mr-1" />
                              Entregada
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>)}
                {orders.filter(order => orderFilter === 'all' || order.status === orderFilter).length === 0 && <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <UtensilsIcon size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">
                      No hay órdenes{' '}
                      {orderFilter !== 'all' ? 'con este estado' : ''}
                    </p>
                  </div>}
              </div>
            </div>}
          {/* Vista de menú */}
          {activeTab === 'menu' && <div>
              {/* Filtros y acciones */}
              <div className="mb-4">
                <div className="flex justify-between mb-3">
                  <div className="flex space-x-2">
                    <button className={softBtn(menuFilter === 'all' ? 'blue' : 'gray')} onClick={() => setMenuFilter('all')}>
                      Todos
                    </button>
                    <button className={softBtn(menuFilter === 'food' ? 'amber' : 'gray')} onClick={() => {
                  setMenuFilter('food');
                  setMenuCategoryFilter('all');
                }}>
                      <UtensilsIcon size={14} className="mr-1" /> Comidas
                    </button>
                    <button className={softBtn(menuFilter === 'drink' ? 'blue' : 'gray')} onClick={() => {
                  setMenuFilter('drink');
                  setMenuCategoryFilter('all');
                }}>
                      <GlassWaterIcon size={14} className="mr-1" /> Bebidas
                    </button>
                  </div>
                  <button className={ctaGrad()} onClick={() => {
                setSelectedMenuItem(null);
                setShowMenuItemModal(true);
              }}>
                    <PlusIcon size={16} className="mr-1" />
                    Nuevo producto
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button className={`px-2 py-1 rounded text-xs font-medium ${menuCategoryFilter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'}`} onClick={() => setMenuCategoryFilter('all')}>
                    Todas las categorías
                  </button>
                  {filteredCategories.map(category => <button key={category.id} className={`px-2 py-1 rounded text-xs font-medium ${menuCategoryFilter === category.id ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'}`} onClick={() => setMenuCategoryFilter(category.id)}>
                      {category.name}
                    </button>)}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon size={16} className="text-gray-400" />
                  </div>
                  <input type="text" className="pl-10 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Buscar en el menú..." value={menuSearchTerm} onChange={e => setMenuSearchTerm(e.target.value)} />
                </div>
              </div>
              {/* Lista de productos del menú */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenuItems.map(item => <div key={item.id} className="border border-gray-100 rounded-2xl p-4 hover:border-blue-300 transition-colors bg-white shadow-sm">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-lg">{item.name}</h3>
                          {item.isCombo && <span className="bg-blue-50 text-blue-800 text-xs px-2 py-0.5 rounded-full ml-2">
                              Combo
                            </span>}
                          {item.stock !== undefined && item.stock <= item.stockAlert! && <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full ml-2">
                                Stock bajo
                              </span>}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                        <div className="flex items-center mt-2">
                          {item.type === 'food' ? <UtensilsIcon size={16} className="text-amber-500 mr-1.5" /> : <GlassWaterIcon size={16} className="text-blue-500 mr-1.5" />}
                          <span className="text-sm text-gray-500">
                            {menuCategories.find(c => c.id === item.category)?.name}
                          </span>
                          {item.preparationTime && <>
                              <span className="mx-1.5 text-gray-300">•</span>
                              <ClockIcon size={14} className="text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">
                                {item.preparationTime} min
                              </span>
                            </>}
                          {item.stock !== undefined && <>
                              <span className="mx-1.5 text-gray-300">•</span>
                              <PackageIcon size={14} className="text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">
                                {item.stock} en stock
                              </span>
                            </>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0
                    }).format(item.price)}
                        </div>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.available ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end space-x-2">
                      <button className={softBtn('blue')} onClick={() => {
                  setSelectedMenuItem(item);
                  setShowMenuItemModal(true);
                }}>
                        <EditIcon size={16} className="mr-1" />
                        Editar
                      </button>
                      <button className={softBtn('red')} onClick={() => {
                  if (confirm(`¿Está seguro de eliminar "${item.name}" del menú?`)) {
                    deleteMenuItem(item.id);
                  }
                }}>
                        <TrashIcon size={16} className="mr-1" />
                        Eliminar
                      </button>
                    </div>
                  </div>)}
                {filteredMenuItems.length === 0 && <div className="text-center py-8 col-span-1 md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <GlassWaterIcon size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">
                      No hay productos que coincidan con los filtros
                      seleccionados
                    </p>
                  </div>}
              </div>
            </div>}
          {/* Vista de reservaciones */}
          {activeTab === 'reservations' && <div>
              {/* Acciones */}
              <div className="flex justify-between mb-4">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon size={16} className="text-gray-400" />
                  </div>
                  <input type="text" className="pl-10 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Buscar reservación" />
                </div>
                <button className={ctaGrad()} onClick={() => setShowReservationModal(true)}>
                  <PlusIcon size={16} className="mr-1" />
                  Nueva reservación
                </button>
              </div>
              {/* Lista de reservaciones */}
              <div className="space-y-4">
                {reservations.map(reservation => <div key={reservation.id} className="border border-gray-100 rounded-2xl p-4 hover:border-blue-300 transition-colors bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-full mr-3 text-white shadow">
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <h3 className="font-medium">{reservation.name}</h3>
                          <p className="text-sm text-gray-600">
                            {reservation.phone}
                          </p>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <CalendarIcon size={14} className="mr-1" />
                            {new Date(reservation.date).toLocaleDateString('es-CO')}{' '}
                            - {reservation.time}
                          </div>
                          <div className="flex items-center mt-1 text-sm">
                            <UserIcon size={14} className="mr-1 text-gray-500" />
                            <span className="text-gray-500">
                              {reservation.guests} personas
                            </span>
                            {reservation.tableNumber > 0 && <>
                                <span className="mx-1 text-gray-500">•</span>
                                <span className="text-gray-500">
                                  Mesa {reservation.tableNumber}
                                </span>
                              </>}
                          </div>
                          {reservation.notes && <p className="text-xs text-gray-500 mt-1 italic">
                              {reservation.notes}
                            </p>}
                        </div>
                      </div>
                      <span className={`
                          px-2 py-0.5 rounded-full text-xs font-medium
                          ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                          ${reservation.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                          ${reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                          ${reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
                        `}>
                        {reservation.status === 'confirmed' ? 'Confirmada' : ''}
                        {reservation.status === 'pending' ? 'Pendiente' : ''}
                        {reservation.status === 'cancelled' ? 'Cancelada' : ''}
                        {reservation.status === 'completed' ? 'Completada' : ''}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end space-x-2">
                      {reservation.status === 'pending' && <button className={softBtn('green')} onClick={() => showToast('success', 'Reservación confirmada')}>
                          <CheckIcon size={16} className="mr-1" />
                          Confirmar
                        </button>}
                      {(reservation.status === 'confirmed' || reservation.status === 'pending') && <button className={softBtn('red')} onClick={() => showToast('info', 'Reservación cancelada')}>
                          <XIcon size={16} className="mr-1" />
                          Cancelar
                        </button>}
                      {reservation.status === 'confirmed' && new Date(reservation.date).toDateString() === new Date().toDateString() && <button className={ctaGrad()} onClick={() => {
                  showToast('success', 'Cliente registrado, mesa asignada');
                  // Actualizar el estado de la mesa
                  if (reservation.tableId) {
                    handleTableStatusChange(reservation.tableId, 'occupied');
                  }
                }}>
                            <UserIcon size={16} className="mr-1" />
                            Registrar llegada
                          </button>}
                    </div>
                  </div>)}
                {reservations.length === 0 && <div className="text-center py-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <CalendarIcon size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">
                      No hay reservaciones programadas
                    </p>
                  </div>}
              </div>
            </div>}
          {/* Vista de inventario */}
          {activeTab === 'inventory' && <div>
              {/* Filtros y acciones */}
              <div className="flex justify-between mb-4">
                <div className="flex space-x-2">
                  <button className={softBtn(inventoryFilter === 'all' ? 'blue' : 'gray')} onClick={() => setInventoryFilter('all')}>
                    Todos
                  </button>
                  <button className={softBtn(inventoryFilter === 'low' ? 'amber' : 'gray')} onClick={() => setInventoryFilter('low')}>
                    <AlertCircleIcon size={14} className="mr-1" /> Stock bajo
                  </button>
                  <button className={softBtn(inventoryFilter === 'normal' ? 'green' : 'gray')} onClick={() => setInventoryFilter('normal')}>
                    <CheckIcon size={14} className="mr-1" /> Stock normal
                  </button>
                </div>
                <button className={ctaGrad()} onClick={() => showToast('info', 'Función en desarrollo')}>
                  <PlusIcon size={16} className="mr-1" />
                  Nuevo producto
                </button>
              </div>
              {/* Tabla de inventario */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bodega
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Última actualización
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInventory.map(item => <tr key={item.id} className={item.stock <= item.minStock ? 'bg-amber-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${item.stock <= item.minStock ? 'text-amber-700' : 'text-gray-900'}`}>
                              {item.stock}
                              {item.stock <= item.minStock && <span className="ml-2 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                                  Stock bajo
                                </span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.warehouse}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.lastUpdated).toLocaleDateString('es-CO')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className={softBtn('blue')} onClick={() => showToast('info', 'Función en desarrollo')}>
                              <EditIcon size={14} className="mr-1" />
                              Editar
                            </button>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
                {filteredInventory.length === 0 && <div className="text-center py-8">
                    <PackageIcon size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">
                      No hay productos de inventario que coincidan con el filtro
                    </p>
                  </div>}
              </div>
            </div>}
          {/* Vista de reportes */}
          {activeTab === 'reports' && <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3">
                    Ventas por categoría
                  </h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChartIcon size={40} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Distribución de ventas por categoría de producto
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3">Ventas por hora</h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChartIcon size={40} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Análisis de ventas por hora del día
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3">
                    Productos más vendidos
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">Pizza Familiar</span>
                      <span className="text-gray-600">45 unidades</span>
                    </li>
                    <li className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">Cerveza Artesanal</span>
                      <span className="text-gray-600">38 unidades</span>
                    </li>
                    <li className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">Hamburguesa Clásica</span>
                      <span className="text-gray-600">32 unidades</span>
                    </li>
                    <li className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">Papas Fritas</span>
                      <span className="text-gray-600">29 unidades</span>
                    </li>
                    <li className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">Limonada</span>
                      <span className="text-gray-600">27 unidades</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3">Métodos de pago</h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChartIcon size={40} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Distribución de ventas por método de pago
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-lg font-medium mb-3">Resumen de ventas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="text-sm text-blue-800 font-medium mb-1">
                      Ventas del día
                    </h4>
                    <p className="text-2xl font-bold text-blue-800">
                      $1,245,000
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      +12% respecto a ayer
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <h4 className="text-sm text-green-800 font-medium mb-1">
                      Ventas del mes
                    </h4>
                    <p className="text-2xl font-bold text-green-800">
                      $24,680,000
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      +8% respecto al mes anterior
                    </p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl">
                    <h4 className="text-sm text-amber-800 font-medium mb-1">
                      Ticket promedio
                    </h4>
                    <p className="text-2xl font-bold text-amber-800">$45,200</p>
                    <p className="text-xs text-amber-600 mt-1">
                      +5% respecto al mes anterior
                    </p>
                  </div>
                </div>
              </div>
            </div>}
          {/* Vista de ajustes */}
          {activeTab === 'settings' && <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <UsersIcon size={18} className="mr-2 text-blue-600" />
                    Gestión de usuarios
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure los usuarios y roles del sistema
                  </p>
                  <button className={softBtn('blue')} onClick={() => showToast('info', 'Función en desarrollo')}>
                    Administrar usuarios
                  </button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <PrinterIcon size={18} className="mr-2 text-blue-600" />
                    Configuración de impresión
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure las impresoras y formatos de impresión
                  </p>
                  <button className={softBtn('blue')} onClick={() => showToast('info', 'Función en desarrollo')}>
                    Configurar impresoras
                  </button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <DollarSignIcon size={18} className="mr-2 text-blue-600" />
                    Facturación electrónica
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure los parámetros de facturación electrónica DIAN
                  </p>
                  <button className={softBtn('blue')} onClick={() => showToast('info', 'Función en desarrollo')}>
                    Configurar facturación
                  </button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <SmartphoneIcon size={18} className="mr-2 text-blue-600" />
                    App móvil para meseros
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure y administre la app móvil para meseros
                  </p>
                  <button className={softBtn('blue')} onClick={() => showToast('info', 'Función en desarrollo')}>
                    Administrar dispositivos
                  </button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <TruckIcon size={18} className="mr-2 text-blue-600" />
                    Configuración de domicilios
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure la integración con plataformas de domicilios
                  </p>
                  <button className={softBtn('blue')} onClick={() => showToast('info', 'Función en desarrollo')}>
                    Configurar domicilios
                  </button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <ArchiveIcon size={18} className="mr-2 text-blue-600" />
                    Gestión de bodegas
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure las bodegas y almacenes del sistema
                  </p>
                  <button className={softBtn('blue')} onClick={() => showToast('info', 'Función en desarrollo')}>
                    Administrar bodegas
                  </button>
                </div>
              </div>
            </div>}
        </div>
      </div>
      {/* Modal de nueva orden con selección de menú */}
      {showNewOrderModal && selectedTable && <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Nueva orden - Mesa {selectedTable.number}
              </h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowNewOrderModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de clientes
                </label>
                <input type="number" min="1" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ingrese cantidad" value={newOrderGuests} onChange={e => setNewOrderGuests(parseInt(e.target.value) || 1)} />
              </div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Productos seleccionados</h4>
                <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                  {newOrderItems.length}{' '}
                  {newOrderItems.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
              {newOrderItems.length > 0 ? <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                  {newOrderItems.map(item => {
              const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
              if (!menuItem) return null;
              return <div key={item.menuItemId} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {menuItem.type === 'food' ? <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow h-7 w-7">
                                <UtensilsIcon size={14} />
                              </div> : <div className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow h-7 w-7">
                                <GlassWaterIcon size={14} />
                              </div>}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {menuItem.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0
                      }).format(menuItem.price)}{' '}
                              × {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="font-medium mr-3">
                            {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0
                    }).format(menuItem.price * item.quantity)}
                          </div>
                          <button className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded" onClick={() => removeItemFromNewOrder(item.menuItemId)}>
                            <XIcon size={16} />
                          </button>
                        </div>
                      </div>;
            })}
                </div> : <div className="text-center py-4 bg-gray-50 rounded mb-3">
                  <UtensilsIcon size={24} className="mx-auto text-gray-300 mb-1" />
                  <p className="text-sm text-gray-500">
                    No hay productos seleccionados
                  </p>
                </div>}
              <div className="flex justify-between items-center font-medium text-lg">
                <span>Total:</span>
                <span>
                  {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
              }).format(calculateNewOrderTotal())}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Seleccionar productos</h4>
                <div className="flex space-x-2 mb-3">
                  <button className={softBtn(menuFilter === 'all' ? 'blue' : 'gray')} onClick={() => setMenuFilter('all')}>
                    Todos
                  </button>
                  <button className={softBtn(menuFilter === 'food' ? 'amber' : 'gray')} onClick={() => setMenuFilter('food')}>
                    <UtensilsIcon size={12} className="mr-1" /> Comidas
                  </button>
                  <button className={softBtn(menuFilter === 'drink' ? 'blue' : 'gray')} onClick={() => setMenuFilter('drink')}>
                    <GlassWaterIcon size={12} className="mr-1" /> Bebidas
                  </button>
                </div>
                <div className="space-y-3">
                  {filteredCategories.map(category => <div key={category.id}>
                      <h5 className="font-medium text-sm text-gray-700 mb-2">
                        {category.name}
                      </h5>
                      <div className="grid grid-cols-1 gap-2">
                        {menuItems.filter(item => item.available && item.category === category.id).map(item => <div key={item.id} className="flex justify-between items-center p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-500">
                                  {item.description}
                                </div>
                                <div className="text-sm font-medium">
                                  {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0
                        }).format(item.price)}
                                </div>
                              </div>
                              <button className={ctaGrad()} onClick={() => addItemToNewOrder(item.id, 1)}>
                                <PlusIcon size={14} className="mr-1" />
                                Agregar
                              </button>
                            </div>)}
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button className={softBtn('gray')} onClick={() => setShowNewOrderModal(false)}>
                Cancelar
              </button>
              <button className={ctaGrad(newOrderItems.length > 0 && isCashRegisterOpen)} onClick={() => createNewOrder(selectedTable.id)} disabled={newOrderItems.length === 0 || !isCashRegisterOpen}>
                <CheckIcon size={16} className="mr-1" />
                Crear orden
              </button>
            </div>
          </div>
        </div>}
      {/* Modal de editar orden */}
      {showEditOrderModal && selectedOrder && <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Editar orden - Mesa {selectedOrder.tableNumber}
              </h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowEditOrderModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-sm text-gray-500">Creada:</span>
                  <span className="ml-1">
                    {new Date(selectedOrder.createdAt).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                  </span>
                </div>
                <div>
                  <span className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${selectedOrder.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                      ${selectedOrder.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                      ${selectedOrder.status === 'ready' ? 'bg-green-100 text-green-800' : ''}
                      ${selectedOrder.status === 'delivered' ? 'bg-purple-100 text-purple-800' : ''}
                      ${selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                    {selectedOrder.status === 'pending' ? 'Pendiente' : ''}
                    {selectedOrder.status === 'in-progress' ? 'En proceso' : ''}
                    {selectedOrder.status === 'ready' ? 'Lista' : ''}
                    {selectedOrder.status === 'delivered' ? 'Entregada' : ''}
                    {selectedOrder.status === 'cancelled' ? 'Cancelada' : ''}
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedOrder.items.map(item => <div key={item.id} className="border border-gray-100 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <span>{item.quantity} unidades</span>
                          <span className="mx-1">•</span>
                          {item.category === 'food' ? <UtensilsIcon size={14} className="mr-1 text-amber-500" /> : <GlassWaterIcon size={14} className="mr-1 text-blue-500" />}
                          <span>
                            {item.category === 'food' ? 'Comida' : 'Bebida'}
                          </span>
                        </div>
                        {item.notes && <div className="text-xs italic text-gray-500 mt-1">
                            {item.notes}
                          </div>}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0
                    }).format(item.price * item.quantity)}
                        </div>
                        <div className="mt-1">
                          <select className="text-xs border rounded px-1 py-0.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={item.status} onChange={e => {
                      const newStatus = e.target.value as OrderItem['status'];
                      const updatedOrder = {
                        ...selectedOrder,
                        items: selectedOrder.items.map(i => i.id === item.id ? {
                          ...i,
                          status: newStatus
                        } : i),
                        updatedAt: new Date().toISOString()
                      };
                      setSelectedOrder(updatedOrder);
                    }}>
                            <option value="pending">Pendiente</option>
                            <option value="in-progress">Preparando</option>
                            <option value="ready">Listo</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button className={softBtn('red')} onClick={() => {
                  const updatedOrder = {
                    ...selectedOrder,
                    items: selectedOrder.items.filter(i => i.id !== item.id),
                    totalAmount: selectedOrder.totalAmount - item.price * item.quantity,
                    updatedAt: new Date().toISOString()
                  };
                  setSelectedOrder(updatedOrder);
                }}>
                        <TrashIcon size={14} className="mr-1" />
                        Eliminar
                      </button>
                    </div>
                  </div>)}
              </div>
              <div className="mt-4 flex justify-between items-center font-medium text-lg">
                <span>Total:</span>
                <span>
                  {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
              }).format(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <div>
                <button className={softBtn('red')} onClick={() => {
              if (confirm('¿Está seguro de cancelar esta orden?')) {
                const updatedOrder = {
                  ...selectedOrder,
                  status: 'cancelled' as const,
                  updatedAt: new Date().toISOString()
                };
                updateOrder(updatedOrder);
                showToast('info', 'Orden cancelada');
              }
            }}>
                  <XIcon size={16} className="mr-1" />
                  Cancelar orden
                </button>
              </div>
              <div className="flex space-x-2">
                <button className={softBtn('gray')} onClick={() => setShowEditOrderModal(false)}>
                  Cerrar
                </button>
                <button className={ctaGrad()} onClick={() => {
              // Actualizar el estado de la orden basado en los ítems
              let newStatus = selectedOrder.status;
              const allDelivered = selectedOrder.items.every(item => item.status === 'delivered');
              const allCancelled = selectedOrder.items.every(item => item.status === 'cancelled');
              const anyReady = selectedOrder.items.some(item => item.status === 'ready');
              const anyInProgress = selectedOrder.items.some(item => item.status === 'in-progress');
              if (allDelivered) {
                newStatus = 'delivered';
              } else if (allCancelled) {
                newStatus = 'cancelled';
              } else if (anyReady) {
                newStatus = 'ready';
              } else if (anyInProgress) {
                newStatus = 'in-progress';
              }
              const updatedOrder = {
                ...selectedOrder,
                status: newStatus,
                updatedAt: new Date().toISOString()
              };
              updateOrder(updatedOrder);
            }}>
                  <SaveIcon size={16} className="mr-1" />
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>}
      {/* Modal de detalles de mesa */}
      {showTableDetailsModal && selectedTable && <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Mesa {selectedTable.number}
              </h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowTableDetailsModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${selectedTable.status === 'available' ? 'bg-green-100 text-green-800' : ''}
                      ${selectedTable.status === 'occupied' ? 'bg-red-100 text-red-800' : ''}
                      ${selectedTable.status === 'reserved' ? 'bg-amber-100 text-amber-800' : ''}
                      ${selectedTable.status === 'cleaning' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                    {selectedTable.status === 'available' ? 'Disponible' : ''}
                    {selectedTable.status === 'occupied' ? 'Ocupada' : ''}
                    {selectedTable.status === 'reserved' ? 'Reservada' : ''}
                    {selectedTable.status === 'cleaning' ? 'Limpieza' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacidad:</span>
                  <span>{selectedTable.capacity} personas</span>
                </div>
                {selectedTable.status === 'occupied' && <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiempo:</span>
                      <span>
                        {formatElapsedTime(selectedTable.occupiedSince)}
                      </span>
                    </div>
                    {selectedTable.guests && <div className="flex justify-between">
                        <span className="text-gray-600">Clientes:</span>
                        <span>{selectedTable.guests}</span>
                      </div>}
                    {selectedTable.bill && <div className="flex justify-between">
                        <span className="text-gray-600">Cuenta:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(selectedTable.bill)}
                        </span>
                      </div>}
                    <div className="pt-2 space-y-2">
                      <button className={ctaGrad()} onClick={() => {
                  handlePayBill(selectedTable.id);
                  setShowTableDetailsModal(false);
                }}>
                        <DollarSignIcon size={16} className="mr-1" />
                        Cobrar cuenta
                      </button>
                      <button className={softBtn('blue')} onClick={() => {
                  const order = orders.find(o => o.tableId === selectedTable.id);
                  if (order) {
                    setSelectedOrder(order);
                    setShowEditOrderModal(true);
                    setShowTableDetailsModal(false);
                  } else {
                    showToast('error', 'No se encontró la orden para esta mesa');
                  }
                }}>
                        <EditIcon size={16} className="mr-1" />
                        Editar orden
                      </button>
                    </div>
                  </>}
                {selectedTable.status === 'available' && <div className="pt-2 space-y-2">
                    <button className={ctaGrad(isCashRegisterOpen)} disabled={!isCashRegisterOpen} onClick={() => {
                setShowTableDetailsModal(false);
                setNewOrderItems([]);
                setNewOrderGuests(1);
                setShowNewOrderModal(true);
              }}>
                      <UtensilsIcon size={16} className="mr-1" />
                      Nueva orden
                    </button>
                    <button className={softBtn('amber')} onClick={() => {
                handleTableStatusChange(selectedTable.id, 'reserved');
                setShowTableDetailsModal(false);
                setShowReservationModal(true);
              }}>
                      <CalendarIcon size={16} className="mr-1" />
                      Reservar mesa
                    </button>
                  </div>}
                {selectedTable.status === 'cleaning' && <div className="pt-2">
                    <button className={softBtn('green')} onClick={() => {
                handleTableStatusChange(selectedTable.id, 'available');
                setShowTableDetailsModal(false);
              }}>
                      <CheckIcon size={16} className="mr-1" />
                      Marcar como disponible
                    </button>
                  </div>}
                {selectedTable.status === 'reserved' && <div className="pt-2 space-y-2">
                    <button className={ctaGrad()} onClick={() => {
                handleTableStatusChange(selectedTable.id, 'occupied');
                setShowTableDetailsModal(false);
              }}>
                      <UserIcon size={16} className="mr-1" />
                      Registrar llegada
                    </button>
                    <button className={softBtn('red')} onClick={() => {
                handleTableStatusChange(selectedTable.id, 'available');
                setShowTableDetailsModal(false);
              }}>
                      <XIcon size={16} className="mr-1" />
                      Cancelar reserva
                    </button>
                  </div>}
              </div>
            </div>
          </div>
        </div>}
      {/* Modal de nueva reservación */}
      {showReservationModal && <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Nueva reservación</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowReservationModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del cliente
                  </label>
                  <input type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input type="tel" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Número de contacto" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <input type="date" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora
                    </label>
                    <input type="time" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue="19:00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personas
                    </label>
                    <input type="number" min="1" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Cantidad" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mesa
                    </label>
                    <select className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Asignar después</option>
                      {tables.filter(t => t.status === 'available').map(table => <option key={table.id} value={table.id}>
                            Mesa {table.number} ({table.capacity} pers.)
                          </option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Preferencias o solicitudes especiales" rows={2}></textarea>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button className={softBtn('gray')} onClick={() => setShowReservationModal(false)}>
                Cancelar
              </button>
              <button className={ctaGrad()} onClick={() => {
            showToast('success', 'Reservación creada correctamente');
            setShowReservationModal(false);
          }}>
                <CheckIcon size={16} className="mr-1" />
                Guardar reservación
              </button>
            </div>
          </div>
        </div>}
      {/* Modal de item de menú */}
      {showMenuItemModal && <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {selectedMenuItem ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowMenuItemModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del producto
                  </label>
                  <input type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nombre del producto" defaultValue={selectedMenuItem?.name} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Descripción breve del producto" rows={2} defaultValue={selectedMenuItem?.description}></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio
                    </label>
                    <input type="number" min="0" step="100" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Precio en COP" defaultValue={selectedMenuItem?.price} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo de preparación (min)
                    </label>
                    <input type="number" min="0" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Minutos" defaultValue={selectedMenuItem?.preparationTime} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue={selectedMenuItem?.type || 'food'}>
                      <option value="food">Comida</option>
                      <option value="drink">Bebida</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue={selectedMenuItem?.category}>
                      {menuCategories.map(category => <option key={category.id} value={category.id}>
                          {category.name}
                        </option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock actual
                    </label>
                    <input type="number" min="0" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Cantidad en stock" defaultValue={selectedMenuItem?.stock} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alerta stock mínimo
                    </label>
                    <input type="number" min="0" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Stock mínimo" defaultValue={selectedMenuItem?.stockAlert} />
                  </div>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="available" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked={selectedMenuItem?.available !== false} />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                    Disponible para la venta
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="isCombo" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked={selectedMenuItem?.isCombo === true} />
                  <label htmlFor="isCombo" className="ml-2 block text-sm text-gray-900">
                    Es un combo o promoción
                  </label>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button className={softBtn('gray')} onClick={() => setShowMenuItemModal(false)}>
                Cancelar
              </button>
              <button className={ctaGrad()} onClick={() => {
            // En una implementación real, aquí se tomarían los valores de los inputs
            // Por ahora, simulamos la acción
            if (selectedMenuItem) {
              updateMenuItem({
                ...selectedMenuItem,
                name: selectedMenuItem.name + ' (Actualizado)',
                price: selectedMenuItem.price + 1000
              });
            } else {
              addMenuItem({
                name: 'Nuevo producto',
                description: 'Descripción del nuevo producto',
                price: 15000,
                category: 'cat-1',
                type: 'food',
                available: true,
                preparationTime: 15,
                stock: 20,
                stockAlert: 5
              });
            }
          }}>
                <SaveIcon size={16} className="mr-1" />
                {selectedMenuItem ? 'Actualizar producto' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>}
      {/* Modal de impresión de comanda */}
      {showPrintCommandModal && selectedOrder && <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Imprimir Comanda</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowPrintCommandModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                <div className="text-center mb-3">
                  <h4 className="font-bold">COMANDA</h4>
                  <p className="text-sm">Mesa: {selectedOrder.tableNumber}</p>
                  <p className="text-sm">
                    Mesero: {selectedOrder.waiter || 'Sin asignar'}
                  </p>
                  <p className="text-sm">
                    Fecha:{' '}
                    {new Date(selectedOrder.createdAt).toLocaleString('es-CO')}
                  </p>
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left pb-1">Producto</th>
                        <th className="text-center pb-1">Cant</th>
                        <th className="text-right pb-1">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map(item => <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-1">{item.name}</td>
                          <td className="py-1 text-center">{item.quantity}</td>
                          <td className="py-1 text-right text-xs italic">
                            {item.notes || '-'}
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destino
                  </label>
                  <select className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">Todas las impresoras</option>
                    <option value="kitchen">Solo cocina</option>
                    <option value="bar">Solo bar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones adicionales
                  </label>
                  <textarea className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Observaciones para cocina o bar" rows={2}></textarea>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button className={softBtn('gray')} onClick={() => setShowPrintCommandModal(false)}>
                Cerrar
              </button>
              <button className={ctaGrad()} onClick={() => {
            showToast('success', 'Comanda enviada a impresión');
            setShowPrintCommandModal(false);
          }}>
                <PrinterIcon size={16} className="mr-1" />
                Imprimir
              </button>
            </div>
          </div>
        </div>}
      {/* Modal de división de cuenta */}
      {showSplitBillModal && selectedOrder && <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Dividir Cuenta - Mesa {selectedOrder.tableNumber}
              </h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowSplitBillModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de división
                </label>
                <select className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="equal">Partes iguales</option>
                  <option value="items">Por productos</option>
                  <option value="custom">Monto personalizado</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de partes
                </label>
                <input type="number" min="2" max="10" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Cantidad de personas" defaultValue="2" />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <h4 className="text-blue-800 font-medium mb-2">
                  Previsualización
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border border-blue-100">
                    <h5 className="font-medium text-sm mb-1">Cuenta 1</h5>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(selectedOrder.totalAmount / 2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.ceil(selectedOrder.items.length / 2)} productos
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-100">
                    <h5 className="font-medium text-sm mb-1">Cuenta 2</h5>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(selectedOrder.totalAmount / 2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.floor(selectedOrder.items.length / 2)} productos
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button className={softBtn('gray')} onClick={() => setShowSplitBillModal(false)}>
                Cancelar
              </button>
              <button className={ctaGrad()} onClick={() => {
            // Actualizar la orden para marcarla como cuenta dividida
            const updatedOrder = {
              ...selectedOrder,
              splitBill: true,
              updatedAt: new Date().toISOString()
            };
            updateOrder(updatedOrder);
            showToast('success', 'Cuenta dividida correctamente');
            setShowSplitBillModal(false);
          }}>
                <CheckIcon size={16} className="mr-1" />
                Dividir cuenta
              </button>
            </div>
          </div>
        </div>}
      {/* Modal de facturación */}
      {showInvoiceModal && selectedTable && <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Generar Factura - Mesa {selectedTable.number}
              </h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => setShowInvoiceModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                <div className="text-center mb-3">
                  <h4 className="font-bold">FACTURA ELECTRÓNICA</h4>
                  <p className="text-sm">Restaurante Woky</p>
                  <p className="text-sm">NIT: 900.123.456-7</p>
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Mesa:</span>
                    <span className="text-sm">{selectedTable.number}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Fecha:</span>
                    <span className="text-sm">
                      {new Date().toLocaleDateString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Hora:</span>
                    <span className="text-sm">
                      {new Date().toLocaleTimeString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">CUFE:</span>
                    <span className="text-sm">
                      F7C2E5A9-8B31-4D6F-9E8C-1A3B2C4D5E6F
                    </span>
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left pb-1">Producto</th>
                          <th className="text-center pb-1">Cant</th>
                          <th className="text-right pb-1">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.find(o => o.tableId === selectedTable.id)?.items.map(item => <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-1">{item.name}</td>
                              <td className="py-1 text-center">
                                {item.quantity}
                              </td>
                              <td className="py-1 text-right">
                                {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0
                        }).format(item.price * item.quantity)}
                              </td>
                            </tr>)}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} className="pt-2 text-right font-medium">
                            Subtotal:
                          </td>
                          <td className="pt-2 text-right">
                            {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0
                        }).format(selectedTable.bill! * 0.81)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="text-right font-medium">
                            IVA (19%):
                          </td>
                          <td className="text-right">
                            {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0
                        }).format(selectedTable.bill! * 0.19)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="text-right font-bold">
                            TOTAL:
                          </td>
                          <td className="text-right font-bold">
                            {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0
                        }).format(selectedTable.bill!)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de pago
                  </label>
                  <select className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="cash">Efectivo</option>
                    <option value="credit">Tarjeta de crédito</option>
                    <option value="debit">Tarjeta débito</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datos del cliente (opcional)
                  </label>
                  <input type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2" placeholder="Nombre del cliente" />
                  <input type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="NIT o Cédula" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button className={softBtn('gray')} onClick={() => setShowInvoiceModal(false)}>
                Cancelar
              </button>
              <button className={ctaGrad()} onClick={() => finalizeBill(selectedTable.id)}>
                <PrinterIcon size={16} className="mr-1" />
                Generar factura
              </button>
            </div>
          </div>
        </div>}
    </div>;
};
export default GastrobarPage;