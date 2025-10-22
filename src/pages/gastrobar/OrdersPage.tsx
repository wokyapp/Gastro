// src/pages/OrdersPage.tsx
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  SearchIcon,
  UtensilsIcon,
  GlassWaterIcon,
  TagIcon,
  LayersIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClockIcon,
  PackageIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UnlockIcon,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const LS_TABLES = 'woky.tables';
const LS_KITCHEN = 'woky.kitchenOrders';
const LS_RUNTIME = 'woky.tables.runtime';
const LS_WAITERS = 'woky.waiters';

type Status = 'available' | 'occupied' | 'reserved' | 'disabled';
type ConfigStatus = 'libre' | 'ocupada' | 'reservada' | 'fuera_de_servicio';

type ConfigTable = {
  id: string | number;
  number: number;
  alias?: string;
  zone?: string;
  capacity?: number;
  active: boolean;
  status?: ConfigStatus;
  waiter?: string | null;
};

const mapConfigToUiStatus = (s?: ConfigStatus, active = true): Status =>
  !active
    ? 'disabled'
    : s === 'ocupada'
    ? 'occupied'
    : s === 'reservada'
    ? 'reserved'
    : s === 'fuera_de_servicio'
    ? 'disabled'
    : 'available';

type OrderType = 'mesa' | 'llevar';
type OrderStatus = 'borrador' | 'enviada' | 'preparando' | 'lista' | 'facturada' | 'pagada' | 'cancelada';

type Waiter = { id: number; name: string; active: boolean };

interface Order {
  id: string;
  type: OrderType;
  tableId?: number | string;
  tableName?: string;
  customerName?: string;
  customerPhone?: string;
  pickupTime?: string;
  items: any[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  waiter?: Waiter;
}

interface Table {
  id: number | string;
  name: string;
  seats: number;
  status: Status;
  waiter?: { id?: number | string; name: string } | null;
  order?: Order | null;
  zone?: string;
  number?: number;
  active?: boolean;
}

// Menú
type ProductType = { id: string; name: string; icon: string; color: string };
type MenuCategory = { id: string; name: string; type: string; order: number };

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  type?: string;
  description?: string;
  image?: string;
  preparationTime?: number;
  available?: boolean;
  isCombo?: boolean;
  comboItems?: string[];
}

// Cocina
type KitchenStatus = 'new' | 'preparing' | 'ready';

interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  category: string;
  preparationTime: number;
  price?: number;
}

interface KitchenOrder {
  id: string;
  tableNumber: string;
  tableId?: string | number;
  items: KitchenOrderItem[];
  status: KitchenStatus;
  waiter: string;
  createdAt: string;
  priority: 'normal' | 'high';
  notes?: string;
  timeElapsed: number;
}

// Runtime mesa
type Runtime = {
  tableId: string | number;
  orderId?: string;
  waiter?: string;
  customerName?: string;
  items?: { id: number | string; name: string; price: number; quantity: number }[];
  itemsCount?: number;
  total?: number;
  kitchenStatus?: 'new' | 'preparing' | 'ready' | 'delivered';
  occupiedSince?: string;
  deliveredAt?: string;
};

const OrdersPage: React.FC = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const tableIdParam = queryParams.get('table');
  const isNewOrder = queryParams.get('new') === 'true';

  // Estado UI/Orden
  const [orderType, setOrderType] = useState<OrderType>(tableIdParam ? 'mesa' : 'llevar');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<(MenuItem & { quantity: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);

  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [allCategoriesExpanded, setAllCategoriesExpanded] = useState(true);

  // Header bloqueable solo para el nombre del cliente
  const [lockHeaderInfo, setLockHeaderInfo] = useState(false);

  // Mostrar histórico entregado cuando corresponda
  const [deliveredItems, setDeliveredItems] = useState<{ name: string; quantity: number; price: number }[]>([]);
  const [deliveredMeta, setDeliveredMeta] = useState<{ itemsCount: number; total: number } | null>(null);

  /**
   * Bloqueo de edición:
   * - Permitido editar mientras esté "new" o "preparing".
   * - Bloqueado cuando cocina marca "ready" (LISTA).
   * - Una vez "delivered", se vuelve a permitir agregar una NUEVA orden (mostrando lo entregado).
   */
  const [isEditLocked, setIsEditLocked] = useState(false);

  // ID de la orden de cocina actualmente editable (si existe)
  const [currentKitchenOrderId, setCurrentKitchenOrderId] = useState<string | null>(null);

  // ====== MESEROS: Cargar de Configuración (localStorage) ======
  const [waiters, setWaiters] = useState<Waiter[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_WAITERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const onlyActiveWaiters: Waiter[] = parsed
            .filter((u: any) => u.role === 'waiter' && u.active)
            .map((u: any) => ({
              id: Number(u.id) || Math.floor(Math.random() * 100000),
              name: u.name,
              active: true,
            }));
          setWaiters(onlyActiveWaiters);
          if (onlyActiveWaiters.length === 0) {
            setWaiters([
              { id: 101, name: 'Mesero 1', active: true },
              { id: 102, name: 'Mesero 2', active: true },
            ]);
          }
          return;
        }
      }
      setWaiters([
        { id: 101, name: 'Mesero 1', active: true },
        { id: 102, name: 'Mesero 2', active: true },
      ]);
    } catch {
      setWaiters([
        { id: 101, name: 'Mesero 1', active: true },
        { id: 102, name: 'Mesero 2', active: true },
      ]);
    }
  }, []);

  const [productTypes] = useState<ProductType[]>([
    { id: 'food', name: 'Comidas', icon: 'UtensilsIcon', color: 'amber' },
    { id: 'drink', name: 'Bebidas', icon: 'GlassWaterIcon', color: 'blue' },
    { id: 'dessert', name: 'Postres', icon: 'CakeIcon', color: 'pink' },
  ]);

  const [menuCategories] = useState<MenuCategory[]>([
    { id: 'cat-1', name: 'Entradas', type: 'food', order: 1 },
    { id: 'cat-2', name: 'Platos Fuertes', type: 'food', order: 2 },
    { id: 'cat-3', name: 'Postres', type: 'food', order: 3 },
    { id: 'cat-4', name: 'Bebidas Frías', type: 'drink', order: 1 },
    { id: 'cat-5', name: 'Bebidas Calientes', type: 'drink', order: 2 },
    { id: 'cat-6', name: 'Cervezas', type: 'drink', order: 3 },
    { id: 'cat-7', name: 'Vinos', type: 'drink', order: 4 },
  ]);

  // Helpers: tablas de configuración
  const loadConfigTables = useCallback((): Table[] => {
    try {
      const raw = localStorage.getItem(LS_TABLES);
      if (!raw) return [];
      const cfg: ConfigTable[] = JSON.parse(raw);
      const mapped: Table[] = cfg.map((t) => ({
        id: t.id,
        name: t.alias ? `Mesa ${t.number} · ${t.alias}` : `Mesa ${t.number}`,
        seats: t.capacity ?? 4,
        status: mapConfigToUiStatus(t.status, t.active),
        waiter: t.waiter ? { name: t.waiter } : null,
        order: null,
        zone: t.zone,
        number: t.number,
        active: t.active,
      }));
      return mapped.filter((m) => m.active !== false);
    } catch {
      return [];
    }
  }, []);

  const setConfigTableStatus = useCallback((tableId: string | number, newStatus: ConfigStatus) => {
    try {
      const raw = localStorage.getItem(LS_TABLES);
      if (!raw) return;
      const cfg: ConfigTable[] = JSON.parse(raw);
      const updated = cfg.map((t) => (String(t.id) === String(tableId) ? { ...t, status: newStatus } : t));
      localStorage.setItem(LS_TABLES, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  }, []);

  // === util: KITCHEN ===
  const loadKitchen = (): KitchenOrder[] => {
    try {
      return JSON.parse(localStorage.getItem(LS_KITCHEN) || '[]');
    } catch {
      return [];
    }
  };
  const saveKitchen = (list: KitchenOrder[]) => {
    localStorage.setItem(LS_KITCHEN, JSON.stringify(list));
    window.dispatchEvent(new StorageEvent('storage', { key: LS_KITCHEN, newValue: JSON.stringify(list) }));
  };

  // === Runtime helpers ===
  const getRuntime = (): Record<string, Runtime> => {
    try {
      return JSON.parse(localStorage.getItem(LS_RUNTIME) || '{}');
    } catch {
      return {};
    }
  };
  const setRuntime = (next: Record<string, Runtime>) => {
    localStorage.setItem(LS_RUNTIME, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent('storage', { key: LS_RUNTIME, newValue: JSON.stringify(next) }));
  };

  // === Cancelar orden de cocina actual y liberar mesa ===
  const cancelKitchenOrderAndFreeTable = (table: Table, kitchenOrderId: string) => {
    const list = loadKitchen().filter(o => o.id !== kitchenOrderId);
    saveKitchen(list);

    const rt = getRuntime();
    const key = String(table.id);
    delete rt[key];
    setRuntime(rt);

    setConfigTableStatus(table.id, 'libre');

    showToast('success', `Orden cancelada y ${table.name} liberada`);
  };

  // Carga inicial + precarga runtime/kitchen
  useEffect(() => {
    const loadData = async () => {
      await new Promise((r) => setTimeout(r, 150));
      const baseTables = loadConfigTables();
      baseTables.sort((a, b) => (a.number ?? 9999) - (b.number ?? 9999));
      setAvailableTables(baseTables);

      // Menú mock
      const mockMenu: MenuItem[] = [
        { id: 1, name: 'Hamburguesa Clásica', price: 18000, category: 'cat-2', type: 'food', description: 'Carne de res, queso, lechuga, tomate y cebolla', preparationTime: 20 },
        { id: 2, name: 'Papas Fritas', price: 8000, category: 'cat-1', type: 'food', description: 'Papas fritas con sal', preparationTime: 10 },
        { id: 3, name: 'Cerveza Artesanal', price: 12000, category: 'cat-6', type: 'drink', description: 'Cerveza artesanal local' },
        { id: 4, name: 'Ensalada César', price: 15000, category: 'cat-1', type: 'food', description: 'Lechuga romana, crutones, pollo y aderezo césar', preparationTime: 10 },
        { id: 5, name: 'Agua Mineral', price: 5000, category: 'cat-4', type: 'drink', description: 'Agua mineral natural' },
        { id: 6, name: 'Café Americano', price: 6000, category: 'cat-5', type: 'drink', description: 'Café americano recién preparado' },
        { id: 7, name: 'Postre del Día', price: 9000, category: 'cat-3', type: 'dessert', description: 'Postre especial del chef' },
        { id: 8, name: 'Pizza Margarita', price: 22000, category: 'cat-2', type: 'food', description: 'Pizza con salsa de tomate, queso mozzarella y albahaca', preparationTime: 25 },
        { id: 9, name: 'Sopa del Día', price: 10000, category: 'cat-1', type: 'food', description: 'Sopa casera del día', preparationTime: 15 },
        { id: 10, name: 'Vino Tinto', price: 15000, category: 'cat-7', type: 'drink', description: 'Copa de vino tinto de la casa' },
        { id: 11, name: 'Nachos con Guacamole', price: 18000, category: 'cat-1', type: 'food', description: 'Nachos crujientes con guacamole fresco', preparationTime: 10 },
        { id: 12, name: 'Combo Hamburguesa', price: 32000, category: 'cat-2', type: 'food', description: 'Hamburguesa + Papas + Bebida', preparationTime: 20, isCombo: true, comboItems: ['1', '2', '5'] },
      ];
      setMenuItems(mockMenu);

      const initialExpanded: Record<string, boolean> = {};
      menuCategories.forEach((cat) => { initialExpanded[cat.id] = true; });
      setExpandedCategories(initialExpanded);

      if (tableIdParam) {
        const table = baseTables.find((t) => String(t.id) === String(tableIdParam));
        if (table) {
          if (isNewOrder && table.status !== 'available') {
            showToast('error', `${table.name} no está disponible`);
          } else {
            setSelectedTable(table);

            if (table.waiter?.name && !selectedWaiter) {
              const match = waiters.find(w => w.name === table.waiter!.name) || null;
              setSelectedWaiter(match ?? { id: 100000 + Math.floor(Math.random()*9999), name: table.waiter!.name, active: true });
            }
          }
        }

        try {
          const raw = localStorage.getItem(LS_RUNTIME);
          if (raw) {
            const rt: Record<string, Runtime> = JSON.parse(raw);
            const rec = rt[String(tableIdParam)];
            if (rec) {
              if (rec.customerName) setCustomerName(rec.customerName);
              if (rec.waiter) {
                const match = waiters.find((w) => w.name === rec.waiter) || null;
                setSelectedWaiter(match ?? { id: 9999, name: rec.waiter, active: true });
              }

              if (rec.items && rec.items.length > 0) {
                setDeliveredItems(rec.items.map((x) => ({ name: x.name, quantity: x.quantity, price: x.price })));
                setDeliveredMeta({
                  itemsCount: rec.itemsCount ?? rec.items.reduce((s, it) => s + it.quantity, 0),
                  total: rec.total ?? rec.items.reduce((s, it) => s + it.price * it.quantity, 0),
                });
              }

              const kst = rec.kitchenStatus;
              const locked = kst === 'ready';
              setIsEditLocked(!!locked);
              setLockHeaderInfo(!!locked);
            }
          }
        } catch {
          /* ignore */
        }

        try {
          const list = loadKitchen();
          const editable = list.find(
            (o) => String(o.tableId || '') === String(tableIdParam) && (o.status === 'new' || o.status === 'preparing')
          );
          if (editable) {
            setCurrentKitchenOrderId(editable.id);
            const toSelected = editable.items.map((it) => {
              const ref = mockMenu.find((m) => String(m.id) === String(it.id));
              return {
                id: Number(it.id),
                name: it.name,
                price: typeof it.price === 'number' ? it.price : ref?.price ?? 0,
                category: ref?.category || 'cat-1',
                type: ref?.type,
                description: ref?.description,
                preparationTime: ref?.preparationTime,
                quantity: it.quantity,
              } as MenuItem & { quantity: number };
            });
            setSelectedItems(toSelected);
            setIsEditLocked(false);
          } else {
            setCurrentKitchenOrderId(null);
          }
        } catch {
          /* ignore */
        }
      }

      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableIdParam, isNewOrder, loadConfigTables, menuCategories, showToast, waiters.length]);

  // Refresca mesas/meseros si cambian en otra pestaña
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_TABLES || e.key === LS_RUNTIME) {
        setAvailableTables(loadConfigTables());
      }
      if (e.key === LS_WAITERS) {
        try {
          const parsed = JSON.parse(e.newValue || '[]');
          const onlyActiveWaiters: Waiter[] = parsed
            .filter((u: any) => u.role === 'waiter' && u.active)
            .map((u: any) => ({
              id: Number(u.id) || Math.floor(Math.random() * 100000),
              name: u.name,
              active: true,
            }));
          setWaiters(onlyActiveWaiters);
        } catch {
          /* ignore */
        }
      }
      if (e.key === LS_KITCHEN && selectedTable) {
        try {
          const list = JSON.parse(e.newValue || '[]');
          const editable = list.find(
            (o: KitchenOrder) => String(o.tableId || '') === String(selectedTable.id) && (o.status === 'new' || o.status === 'preparing')
          );
          setCurrentKitchenOrderId(editable ? editable.id : null);
        } catch {/* ignore */}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadConfigTables, selectedTable]);

  // Escucha específica de runtime
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_RUNTIME && selectedTable) {
        try {
          const rt = JSON.parse(e.newValue || '{}');
          const rec = rt[String(selectedTable.id)];
          const locked = rec && rec.kitchenStatus === 'ready';
          setIsEditLocked(!!locked);
          if (locked) setLockHeaderInfo(true);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [selectedTable]);

  // Al cambiar el tipo, limpiar/ajustar cosas necesarias
  useEffect(() => {
    if (orderType === 'llevar') {
      setSelectedTable(null);
    }
  }, [orderType]);

  const availableTablesForSelection = useMemo(() => {
    const list = availableTables.filter((t) => t.status === 'available');
    if (!isNewOrder && tableIdParam) {
      const current = availableTables.find((t) => String(t.id) === String(tableIdParam));
      if (current && !list.some((t) => String(t.id) === String(current.id))) list.unshift(current);
    }
    return list;
  }, [availableTables, isNewOrder, tableIdParam]);

  // Menú helpers
  const productTypesMap: Record<string, JSX.Element> = {
    UtensilsIcon: <UtensilsIcon size={14} className="mr-1" />,
    GlassWaterIcon: <GlassWaterIcon size={14} className="mr-1" />,
    CakeIcon: <LayersIcon size={14} className="mr-1" />,
  };

  const getIconByName = (iconName: string) => productTypesMap[iconName] ?? <TagIcon size={14} className="mr-1" />;

  const filteredMenuItems = menuItems.filter((item) => {
    const q = menuSearchTerm.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const filteredCategories = menuCategories
    .filter((cat) => selectedType === 'all' || cat.type === selectedType)
    .sort((a, b) => a.order - b.order);

  const groupedMenuItems: Record<string, MenuItem[]> = useMemo(() => {
    const g: Record<string, MenuItem[]> = {};
    filteredMenuItems.forEach((item) => {
      if (!g[item.category]) g[item.category] = [];
      g[item.category].push(item);
    });
    return g;
  }, [filteredMenuItems]);

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const toggleAllCategories = () => {
    const newState = !allCategoriesExpanded;
    setAllCategoriesExpanded(newState);
    const updated: Record<string, boolean> = {};
    filteredCategories.forEach((cat) => {
      updated[cat.id] = newState;
    });
    setExpandedCategories(updated);
  };

  // Acciones sobre items (bloqueadas si isEditLocked)
  const addItemToOrder = (item: MenuItem) => {
    if (isEditLocked) {
      showToast('error', 'La orden está LISTA en cocina. Espera la entrega o agrega una nueva luego.');
      return;
    }
    const existing = selectedItems.find((i) => i.id === item.id);
    if (existing) setSelectedItems(selectedItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    else setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
  };

  const removeItemFromOrder = (itemId: number) => {
    if (isEditLocked) {
      showToast('error', 'La orden está LISTA en cocina.');
      return;
    }
    setSelectedItems(selectedItems.filter((item) => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: number, quantity: number) => {
    if (isEditLocked) {
      showToast('error', 'La orden está LISTA en cocina.');
      return;
    }
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }
    setSelectedItems(selectedItems.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
  };

  const calculateTotal = () => selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Selección mesa
  const selectTable = (table: Table) => {
    if (isNewOrder && table.status !== 'available') {
      showToast('error', `${table.name} no está disponible`);
      return;
    }
    setSelectedTable(table);

    // Autoselección de mesero por defecto si la mesa lo tiene
    if (table.waiter?.name && !selectedWaiter) {
      const match = waiters.find(w => w.name === table.waiter!.name) || null;
      setSelectedWaiter(match ?? { id: 100000 + Math.floor(Math.random()*9999), name: table.waiter!.name, active: true });
    }
  };

  // Cocina: persistir NUEVA
  const pushToKitchen = (payload: KitchenOrder) => {
    try {
      const raw = localStorage.getItem(LS_KITCHEN);
      const list: KitchenOrder[] = raw ? JSON.parse(raw) : [];
      list.unshift(payload);
      saveKitchen(list);
    } catch {
      /* ignore */
    }
  };

  // === Enviar / Actualizar orden en cocina ===
  const handleSubmitOrder = () => {
    if (isEditLocked) {
      showToast('error', 'La orden está LISTA en cocina');
      return;
    }

    // ➜ Si estamos editando una orden de cocina y no hay ítems, CANCELAR y LIBERAR mesa
    if (orderType === 'mesa' && selectedTable && currentKitchenOrderId && selectedItems.length === 0) {
      cancelKitchenOrderAndFreeTable(selectedTable, currentKitchenOrderId);
      setSelectedItems([]);
      setCurrentKitchenOrderId(null);
      navigate('/mesas');
      return;
    }

    if (selectedItems.length === 0) {
      showToast('error', 'La orden debe tener al menos un producto');
      return;
    }
    if (orderType === 'mesa' && !selectedTable) {
      showToast('error', 'Debes seleccionar una mesa');
      return;
    }
    if (!selectedWaiter) {
      showToast('error', 'Selecciona el mesero responsable');
      return;
    }
    // Requerimos nombre del cliente para ambos tipos (mesa y llevar)
    if (!customerName.trim()) {
      showToast('error', 'Ingresa el nombre del cliente');
      return;
    }

    // Si hay una orden de cocina editable (new/preparing), ACTUALIZAR en vez de crear
    if (orderType === 'mesa' && selectedTable && currentKitchenOrderId) {
      const list = loadKitchen();
      const idx = list.findIndex((o) => o.id === currentKitchenOrderId);
      if (idx >= 0) {
        const defaultPrep = (it: MenuItem) => {
          if (typeof it.preparationTime === 'number') return it.preparationTime;
          if (it.type === 'drink') return 5;
          if (it.type === 'dessert') return 10;
          return 12;
        };
        const nextItems: KitchenOrderItem[] = selectedItems.map((it) => ({
          id: String(it.id),
          name: it.name,
          quantity: it.quantity,
          category: menuCategories.find((c) => c.id === it.category)?.name || it.category,
          preparationTime: defaultPrep(it),
          price: it.price,
        }));

        list[idx] = {
          ...list[idx],
          items: nextItems,
          waiter: selectedWaiter?.name || list[idx].waiter,
        };
        saveKitchen(list);

        const rt = getRuntime();
        const key = String(selectedTable.id);
        const prev = rt[key] || { tableId: selectedTable.id };
        rt[key] = { ...prev, waiter: selectedWaiter?.name, customerName, kitchenStatus: list[idx].status };
        setRuntime(rt);

        showToast('success', `Orden de ${selectedTable.name} actualizada en cocina`);
        navigate('/cocina');
        return;
      }
    }

    // Si NO hay orden editable, crear una NUEVA
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
      type: orderType,
      items: [...selectedItems],
      total: calculateTotal(),
      status: 'enviada',
      createdAt: new Date(),
      updatedAt: new Date(),
      waiter: selectedWaiter || undefined,
      customerName,
    };

    if (orderType === 'mesa' && selectedTable) {
      newOrder.tableId = selectedTable.id;
      newOrder.tableName = selectedTable.name;
    } else {
      newOrder.customerPhone = customerPhone.trim() || undefined;
      newOrder.pickupTime = pickupTime.trim() || undefined;
    }

    const defaultPrep = (it: MenuItem) => {
      if (typeof it.preparationTime === 'number') return it.preparationTime;
      if (it.type === 'drink') return 5;
      if (it.type === 'dessert') return 10;
      return 12;
    };

    const kitchenItems: KitchenOrderItem[] = selectedItems.map((it) => ({
      id: String(it.id),
      name: it.name,
      quantity: it.quantity,
      category: menuCategories.find((c) => c.id === it.category)?.name || it.category,
      preparationTime: defaultPrep(it),
      price: it.price,
    }));

    const tableLabel =
      orderType === 'mesa'
        ? selectedTable?.number
          ? String(selectedTable.number)
          : selectedTable?.name || 'Mesa'
        : 'Llevar';

    const kitchenPayload: KitchenOrder = {
      id: newOrder.id,
      tableNumber: tableLabel,
      tableId: selectedTable?.id,
      items: kitchenItems,
      status: 'new',
      waiter: selectedWaiter?.name || '—',
      createdAt: new Date().toISOString(),
      priority: 'normal',
      timeElapsed: 0,
    };

    pushToKitchen(kitchenPayload);
    setActiveOrders((prev) => [...prev, newOrder]);

    if (orderType === 'mesa' && selectedTable) {
      const rt = getRuntime();
      const key = String(selectedTable.id);
      const prev = rt[key] || { tableId: selectedTable.id };
      const occupiedSince = prev.occupiedSince || new Date().toISOString();

      rt[key] = {
        ...prev,
        tableId: selectedTable.id,
        orderId: newOrder.id,
        waiter: selectedWaiter?.name,
        customerName,
        kitchenStatus: 'new',
        occupiedSince,
        deliveredAt: undefined,
      };

      setRuntime(rt);
      setConfigTableStatus(selectedTable.id, 'ocupada');
      showToast('success', `Orden enviada a cocina para ${selectedTable.name} (Cliente: ${customerName})`);
    } else {
      showToast('success', `Orden para llevar enviada a cocina${customerName ? ` para ${customerName}` : ''}`);
    }

    setSelectedItems([]);
    navigate('/cocina');
  };

  const softBtn = (color: string) => {
    const map: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
      amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
      red: 'bg-red-50 text-red-700 hover:bg-red-100',
      green: 'bg-green-50 text-green-700 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      pink: 'bg-pink-50 text-pink-700 hover:bg-pink-100',
    };
    return `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${map[color] || map.gray}`;
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl mb-3 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {currentKitchenOrderId
                ? 'Editar Orden (Cocina)'
                : existingOrder
                ? 'Editar Orden'
                : orderType === 'mesa'
                ? 'Nueva Orden (Mesa)'
                : 'Nueva Orden (Para llevar)'}
            </h1>
            {currentKitchenOrderId && (
              <p className="text-sm text-blue-100 mt-1">Estás editando la orden en cocina (estado: Orden/Preparación).</p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-400 flex items-center"
              onClick={() => navigate('/cocina')}
            >
              <UtensilsIcon size={16} className="mr-1" />
              Ir a Cocina
            </button>
          </div>
        </div>

        {/* Selector tipo de orden */}
        <div className="mt-3 inline-flex rounded-lg overflow-hidden border border-white/30">
          <button
            className={`px-3 py-1.5 text-sm font-medium ${orderType === 'mesa' ? 'bg-white text-blue-700' : 'bg-white/10 text-white hover:bg-white/20'}`}
            onClick={() => setOrderType('mesa')}
            disabled={isEditLocked}
          >
            Mesa
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium ${orderType === 'llevar' ? 'bg-white text-blue-700' : 'bg-white/10 text-white hover:bg-white/20'}`}
            onClick={() => setOrderType('llevar')}
            disabled={isEditLocked}
          >
            Para llevar
          </button>
        </div>
      </div>

      {/* Aviso de bloqueo (solo cuando está LISTA en cocina) */}
      {isEditLocked && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 text-green-900 p-3 text-sm">
          Esta orden está <strong>LISTA en cocina</strong>. Edición y cancelación deshabilitadas hasta que sea entregada.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center my-8" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel izquierdo */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
              {/* Cliente */}
              <div className="mt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="customerName">
                    Nombre del Cliente
                  </label>
                  <button
                    type="button"
                    onClick={() => setLockHeaderInfo((v) => !v)}
                    className={`text-xs inline-flex items-center px-2 py-0.5 rounded ${
                      lockHeaderInfo ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                    }`}
                    title={lockHeaderInfo ? 'Desbloquear edición' : 'Bloquear edición'}
                    disabled={isEditLocked}
                  >
                    {lockHeaderInfo ? (
                      <>
                        <LockIcon size={12} className="mr-1" />
                        Bloqueado
                      </>
                    ) : (
                      <>
                        <UnlockIcon size={12} className="mr-1" />
                        Editable
                      </>
                    )}
                  </button>
                </div>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                  placeholder="Nombre del cliente"
                  disabled={lockHeaderInfo || isEditLocked}
                />
              </div>

              {/* Campos extra para 'Para llevar' */}
              {orderType === 'llevar' && (
                <div className="grid grid-cols-1 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="customerPhone">
                      Teléfono de contacto
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="3001234567"
                      disabled={isEditLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="pickupTime">
                      Hora de recogida
                    </label>
                    <input
                      id="pickupTime"
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={isEditLocked}
                    />
                  </div>
                </div>
              )}

              {/* Mesero (desde Configuración) */}
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="waiterSelect">
                    Mesero Asignado
                  </label>
                  <span className="text-[11px] text-gray-500">{isEditLocked ? 'Bloqueado (LISTA en cocina)' : 'Editable'}</span>
                </div>
                <select
                  id="waiterSelect"
                  className="w-full p-1.5 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
                  value={selectedWaiter ? selectedWaiter.id : ''}
                  onChange={(e) => {
                    const waiterId = Number(e.target.value);
                    const waiter = waiters.find((w) => w.id === waiterId) || null;
                    setSelectedWaiter(waiter);
                  }}
                  disabled={isEditLocked}
                >
                  <option value="">-- Seleccionar mesero --</option>
                  {waiters
                    .filter((w) => w.active)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  {selectedWaiter && !waiters.some((w) => w.id === selectedWaiter.id) && (
                    <option value={selectedWaiter.id}>{selectedWaiter.name}</option>
                  )}
                </select>
              </div>

              {/* Mesa: solo si tipo = mesa */}
              {orderType === 'mesa' ? (
                <div className="mt-4">
                  {selectedTable ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{selectedTable.name}</h3>
                        {!existingOrder && !isEditLocked && !currentKitchenOrderId && (
                          <button
                            onClick={() => setSelectedTable(null)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Cambiar Mesa
                          </button>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <UtensilsIcon size={14} className="mr-1" />
                        <p>
                          Capacidad: <span className="font-medium">{selectedTable.seats} personas</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Selecciona una mesa:</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableTablesForSelection.map((table) => (
                          <button
                            key={table.id}
                            onClick={() => selectTable(table)}
                            className="p-2 rounded-md text-center transition-colors border border-green-300 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label={`Seleccionar ${table.name}`}
                            disabled={isEditLocked}
                          >
                            <div className="font-medium text-sm">{table.name}</div>
                            <div className="flex justify-center items-center text-xs space-x-1 mt-1">
                              <UtensilsIcon size={12} />
                              <span>{table.seats} personas</span>
                            </div>
                            <div className="text-xs mt-1">✓ Disponible</div>
                          </button>
                        ))}
                        {availableTablesForSelection.length === 0 && (
                          <div className="col-span-2 text-xs text-gray-500 text-center py-2">No hay mesas disponibles por ahora.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Resumen (incluye entregado previo) */}
            <div className="bg-white rounded-xl shadow p-4">
              {deliveredItems.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-1">Entregado</h3>
                  <div className="border border-green-200 rounded-lg bg-green-50 p-2 max-h-40 overflow-auto">
                    {deliveredItems.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-700">
                        <span className="truncate">
                          {it.quantity}x {it.name}
                        </span>
                        <span className="whitespace-nowrap">
                          ${new Intl.NumberFormat('es-CO').format(it.price * it.quantity)}
                        </span>
                      </div>
                    ))}
                    {deliveredMeta && (
                      <div className="border-t border-green-200 mt-2 pt-1 flex justify-between text-xs font-medium text-green-800">
                        <span>{deliveredMeta.itemsCount} ítems</span>
                        <span>${new Intl.NumberFormat('es-CO').format(deliveredMeta.total)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <h3 className="font-medium text-lg mb-3">Resumen de Orden</h3>
              {selectedItems.length === 0 ? (
                <p className="text-sm text-gray-500 my-4">No hay productos seleccionados</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex-1 text-left">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">${new Intl.NumberFormat('es-CO').format(item.price)}</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className={`px-2 py-1 rounded-l ${
                            isEditLocked ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          aria-label={`Disminuir ${item.name}`}
                          disabled={isEditLocked}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 bg-gray-100" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className={`px-2 py-1 rounded-r ${
                            isEditLocked ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          aria-label={`Aumentar ${item.name}`}
                          disabled={isEditLocked}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItemFromOrder(item.id)}
                          className={`ml-2 p-1 rounded ${
                            isEditLocked ? 'text-red-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'
                          }`}
                          aria-label={`Eliminar ${item.name}`}
                          disabled={isEditLocked}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${new Intl.NumberFormat('es-CO').format(calculateTotal())}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/mesas')}
                  className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Volver a Mesas
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={
                    isEditLocked ||
                    (selectedItems.length === 0 && !currentKitchenOrderId) ||
                    (orderType === 'mesa' && !selectedTable) ||
                    !selectedWaiter ||
                    !customerName.trim()
                  }
                  className={`py-2 px-4 rounded-lg text-white text-sm font-medium flex items-center justify-center ${
                    isEditLocked ||
                    (selectedItems.length === 0 && !currentKitchenOrderId) ||
                    (orderType === 'mesa' && !selectedTable) ||
                    !selectedWaiter ||
                    !customerName.trim()
                      ? 'bg-gray-400'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  <CheckIcon size={16} className="mr-1" />
                  {currentKitchenOrderId
                    ? selectedItems.length === 0
                      ? 'Cancelar y Liberar'
                      : 'Actualizar en Cocina'
                    : isEditLocked
                    ? 'Bloqueada (Lista en cocina)'
                    : 'Enviar a Cocina'}
                </button>
              </div>
            </div>
          </div>

          {/* Panel derecho: Menú */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-lg">Menú</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAllCategories}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                      allCategoriesExpanded ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {allCategoriesExpanded ? (
                      <>
                        <EyeOffIcon size={16} className="mr-1" />
                        Colapsar todo
                      </>
                    ) : (
                      <>
                        <EyeIcon size={16} className="mr-1" />
                        Expandir todo
                      </>
                    )}
                  </button>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64"
                      aria-label="Buscar productos"
                    />
                  </div>
                </div>
              </div>

              {/* Filtros tipo */}
              <div className="flex overflow-x-auto pb-2 mb-4 space-x-2">
                <button
                  className={softBtn(selectedType === 'all' ? 'blue' : 'gray')}
                  onClick={() => {
                    setSelectedType('all');
                    setSelectedCategory('');
                  }}
                >
                  Todos
                </button>
                {productTypes.map((type) => (
                  <button
                    key={type.id}
                    className={softBtn(selectedType === type.id ? type.color : 'gray')}
                    onClick={() => {
                      setSelectedType(type.id);
                      setSelectedCategory('');
                    }}
                  >
                    {getIconByName(type.icon)} {type.name}
                  </button>
                ))}
              </div>

              {filteredMenuItems.length === 0 ? (
                <p className="text-gray-500 my-8 text-center">No se encontraron productos</p>
              ) : (
                <div className="space-y-4">
                  {filteredCategories.map((category) => {
                    const categoryItems = groupedMenuItems[category.id] || [];
                    if (categoryItems.length === 0) return null;
                    return (
                      <div key={category.id}>
                        <div
                          className="flex items-center justify-between cursor-pointer mb-2 bg-gray-50 p-2 rounded-lg"
                          onClick={() => toggleCategoryExpansion(category.id)}
                        >
                          <h4 className="font-medium text-gray-700">{category.name}</h4>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">{categoryItems.length} productos</span>
                            {expandedCategories[category.id] ? (
                              <ChevronDownIcon size={16} className="text-gray-500" />
                            ) : (
                              <ChevronRightIcon size={16} className="text-gray-500" />
                            )}
                          </div>
                        </div>

                        {expandedCategories[category.id] && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                            {categoryItems.map((item) => (
                              <button
                                key={item.id}
                                className={`text-left p-3 border rounded-lg transition-colors focus:outline-none ${
                                  isEditLocked
                                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                    : 'border-gray-200 hover:bg-blue-50 hover:border-blue-200 focus:ring-2 focus:ring-indigo-500'
                                }`}
                                onClick={() => !isEditLocked && addItemToOrder(item)}
                                disabled={isEditLocked}
                                aria-label={`Agregar ${item.name}`}
                              >
                                <div className="flex justify-between">
                                  <h5 className="font-medium">{item.name}</h5>
                                  <div className="flex items-center">
                                    <span className="text-gray-600 mr-2">
                                      ${new Intl.NumberFormat('es-CO').format(item.price)}
                                    </span>
                                    <PlusIcon size={18} className={isEditLocked ? 'text-gray-300' : 'text-blue-600'} />
                                  </div>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                                )}
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  {typeof item.preparationTime === 'number' && (
                                    <span className="flex items-center mr-2">
                                      <ClockIcon size={12} className="mr-1" />
                                      {item.preparationTime} min
                                    </span>
                                  )}
                                  {item.isCombo && (
                                    <span className="flex items-center text-blue-600">
                                      <PackageIcon size={12} className="mr-1" />
                                      Combo
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
