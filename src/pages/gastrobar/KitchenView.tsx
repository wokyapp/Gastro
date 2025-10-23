import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClockIcon,
  ChefHatIcon,
  CheckCircleIcon,
  BellIcon,
  PrinterIcon,
  InfoIcon,
  SearchIcon
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const LS_KITCHEN = 'woky.kitchenOrders';
const LS_RUNTIME = 'woky.tables.runtime';
const LS_CASH = 'woky.cash.tickets';
const LS_GLOBAL_NOTIFS = 'woky.notifications'; // canal global para notificar a todos los roles

interface OrderItem {
  id: string | number;
  name: string;
  quantity: number;
  notes?: string;
  category: string;
  preparationTime: number;
  price?: number;
}

interface KitchenOrder {
  id: string;
  tableNumber: string; // ej: "12" o "Llevar"
  tableId?: string | number;
  items: OrderItem[];
  status: 'new' | 'preparing' | 'ready';
  waiter: string;
  createdAt: string;
  priority: 'normal' | 'high';
  notes?: string;
  timeElapsed: number; // minutos
}

// Cash types (compatibles con Caja)
type TicketItem = { id: number; name: string; price: number; quantity: number; batch?: number };
type Ticket = {
  id: string; // eg. T001
  table: number; // número de mesa (0 para llevar)
  items: TicketItem[];
  status: 'active' | 'paid';
  waiter: string;
  customerName?: string;
  created: string;
  // metadatos para agregados
  batches?: number;
  updated?: string;
  lastAppendAt?: string;
};

const STATUS_LABEL: Record<KitchenOrder['status'], string> = {
  new: 'Orden',
  preparing: 'Preparación',
  ready: 'Lista'
};

const KitchenView: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // ======== NUEVO (Mobile) =========
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<KitchenOrder['status']>('new');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ==== Persistencia ====
  const load = (): KitchenOrder[] => {
    try {
      const raw = localStorage.getItem(LS_KITCHEN);
      const parsed: KitchenOrder[] = raw ? JSON.parse(raw) : [];
      // Sanitiza: elimina órdenes vacías
      const sanitized = parsed.filter((o) => Array.isArray(o.items) && o.items.length > 0);
      if (sanitized.length !== parsed.length) {
        save(sanitized);
      }
      return sanitized.map((o) => ({
        ...o,
        timeElapsed: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)
      }));
    } catch {
      return [];
    }
  };

  const save = (list: KitchenOrder[]) => {
    localStorage.setItem(LS_KITCHEN, JSON.stringify(list));
    window.dispatchEvent(new StorageEvent('storage', { key: LS_KITCHEN, newValue: JSON.stringify(list) }));
  };

  // Runtime helpers
  const getRuntime = (): Record<string, any> => {
    try {
      const raw = localStorage.getItem(LS_RUNTIME);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const setRuntime = (next: Record<string, any>) => {
    localStorage.setItem(LS_RUNTIME, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent('storage', { key: LS_RUNTIME, newValue: JSON.stringify(next) }));
  };

  // Cash helpers
  const getCashTickets = (): Ticket[] => {
    try {
      const raw = localStorage.getItem(LS_CASH);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const setCashTickets = (list: Ticket[]) => {
    localStorage.setItem(LS_CASH, JSON.stringify(list));
    window.dispatchEvent(new StorageEvent('storage', { key: LS_CASH, newValue: JSON.stringify(list) }));
  };

  // ==== Notificación global (para todos los roles) ====
  const pushGlobalNotification = (payload: { id: string | number; title: string; message: string; ts?: string }) => {
    try {
      const raw = localStorage.getItem(LS_GLOBAL_NOTIFS);
      const prev = raw ? JSON.parse(raw) : [];
      const next = [{ ...payload, read: false }, ...prev];
      localStorage.setItem(LS_GLOBAL_NOTIFS, JSON.stringify(next));
      // Lanzamos StorageEvent para que otras pestañas/layouts lo capten
      window.dispatchEvent(new StorageEvent('storage', { key: LS_GLOBAL_NOTIFS, newValue: JSON.stringify(next) }));
    } catch {
      // noop
    }
  };

  useEffect(() => {
    setOrders(load());
    setLoading(false);

    const timer = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          timeElapsed: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)
        }))
      );
    }, 60000);

    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KITCHEN) setOrders(load());
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ===== Filtros / Búsqueda =====
  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = term
      ? orders.filter(
          (order) =>
            order.id.toLowerCase().includes(term) ||
            order.tableNumber.toLowerCase().includes(term) ||
            order.items.some((i) => i.name.toLowerCase().includes(term))
        )
      : orders;

    // Mobile: mostrar solo la pestaña activa
    return isMobile ? base.filter((o) => o.status === activeTab) : base;
  }, [orders, searchTerm, isMobile, activeTab]);

  const getOrdersByStatus = (status: 'new' | 'preparing' | 'ready') =>
    filteredOrders.filter((o) => o.status === status);

  const setAndPersist = (next: KitchenOrder[]) => {
    setOrders(next);
    save(next);
  };

  const getStatusLabel = (s: KitchenOrder['status']) => STATUS_LABEL[s];

  const moveOrder = (orderId: string, newStatus: KitchenOrder['status']) => {
    const next = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    setAndPersist(next);

    // Sincroniza runtime con estado de cocina
    const ord = next.find((o) => o.id === orderId);
    if (ord?.tableId != null) {
      const rt = getRuntime();
      const key = String(ord.tableId);
      const prev = rt[key] || { tableId: ord.tableId };

      rt[key] = {
        ...prev,
        kitchenStatus: newStatus,
        occupiedSince: prev.occupiedSince || new Date().toISOString()
      };
      setRuntime(rt);
    }

    // Si pasa a "ready", enviar notificación global
    if (newStatus === 'ready') {
      const when = new Date().toISOString();
      pushGlobalNotification({
        id: `kready-${orderId}-${when}`,
        title: 'Orden lista',
        message: `Orden ${orderId} está lista para entregar.`,
        ts: when
      });
    }

    showToast('success', `Orden ${orderId} movida a ${getStatusLabel(newStatus)}`);
  };

  const togglePriority = (orderId: string) => {
    const next = orders.map((o) => (o.id === orderId ? { ...o, priority: o.priority === 'normal' ? 'high' : 'normal' } : o));
    setAndPersist(next);
    const changed = next.find((o) => o.id === orderId);
    if (changed)
      showToast('info', `Prioridad de orden ${orderId} cambiada a ${changed.priority === 'high' ? 'alta' : 'normal'}`);
  };

  const printOrder = (orderId: string) => {
    showToast('info', `Imprimiendo orden ${orderId}...`);
  };

  const viewOrderDetails = (order: KitchenOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // === ENTREGAR: actualiza runtime + caja y retira de cocina ===
  const deliverOrder = (order: KitchenOrder) => {
    // 1) Retirar de cocina
    const next = orders.filter((o) => o.id !== order.id);
    setAndPersist(next);

    // 2) Runtime: acumular entregado y marcar delivered
    if (order.tableId != null) {
      const rt = getRuntime();
      const key = String(order.tableId);
      const prev = rt[key] || { tableId: order.tableId };

      const deliveredItems = prev.items ? [...prev.items] : [];
      for (const it of order.items) {
        const price = typeof it.price === 'number' ? it.price : 0;
        deliveredItems.push({ id: it.id, name: it.name, price, quantity: it.quantity });
      }
      const itemsCount = deliveredItems.reduce((s: any, it: any) => s + it.quantity, 0);
      const total = deliveredItems.reduce((s: any, it: any) => s + it.price * it.quantity, 0);

      rt[key] = {
        ...prev,
        kitchenStatus: 'delivered',
        deliveredAt: new Date().toISOString(),
        items: deliveredItems,
        itemsCount,
        total
      };
      setRuntime(rt);
    }

    // 3) Caja: upsert ticket
    const tableNum = Number(order.tableNumber.replace(/\D/g, '') || 0) || 0;
    const tickets = getCashTickets();
    const existing = tickets.find((t) => t.status === 'active' && t.table === tableNum);

    const nowIso = new Date().toISOString();

    if (existing) {
      const nextBatch = (existing as any).batches ? (existing as any).batches + 1 : 2;
      const toPush: TicketItem[] = order.items.map((it, idx) => ({
        id: Date.now() + idx,
        name: it.name,
        price: typeof it.price === 'number' ? it.price : 0,
        quantity: it.quantity,
        batch: nextBatch
      }));

      existing.items = [...existing.items, ...toPush];
      (existing as any).batches = nextBatch;
      (existing as any).updated = nowIso;
      (existing as any).lastAppendAt = nowIso;
    } else {
      const toPush: TicketItem[] = order.items.map((it, idx) => ({
        id: Date.now() + idx,
        name: it.name,
        price: typeof it.price === 'number' ? it.price : 0,
        quantity: it.quantity,
        batch: 1
      }));
      const newId = `T${String(tickets.length + 1).padStart(3, '0')}`;
      tickets.unshift({
        id: newId,
        table: tableNum,
        items: toPush,
        status: 'active',
        waiter: order.waiter || '—',
        customerName: undefined,
        created: nowIso,
        batches: 1,
        updated: nowIso,
        lastAppendAt: nowIso
      } as any);
    }

    setCashTickets(tickets);
    showToast('success', `Orden ${order.id} entregada`);
  };

  // =========================
  // RENDER: Tarjeta de orden
  // =========================

  // Gestos simples para Mobile: deslizar para avanzar / retroceder
  const touchRef = useRef<{ startX: number; moved: boolean; id?: string | null }>({ startX: 0, moved: false, id: null });

  const onTouchStart = (e: React.TouchEvent, id: string) => {
    touchRef.current = { startX: e.changedTouches[0].clientX, moved: false, id };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    if (Math.abs(dx) > 8) touchRef.current.moved = true;
  };
  const onTouchEnd = (order: KitchenOrder, e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    if (!touchRef.current.moved) return;

    // Umbral de gesto
    if (dx > 60) {
      // swipe → derecha: retroceder estado
      const prevState = order.status === 'ready' ? 'preparing' : order.status === 'preparing' ? 'new' : 'new';
      if (prevState !== order.status) moveOrder(order.id, prevState);
    } else if (dx < -60) {
      // swipe ← izquierda: avanzar estado
      const nextState = order.status === 'new' ? 'preparing' : order.status === 'preparing' ? 'ready' : 'ready';
      if (nextState !== order.status) {
        if (nextState === 'ready') moveOrder(order.id, 'ready');
        else moveOrder(order.id, nextState);
      }
    }
  };

  const renderOrderCard = (order: KitchenOrder) => {
    const maxPrep = order.items.reduce((m, it) => Math.max(m, it.preparationTime), 0);
    const overdue =
      (order.status === 'new' && order.timeElapsed > 5) ||
      (order.status === 'preparing' && order.timeElapsed > maxPrep);

    const bgByState =
      order.priority === 'high'
        ? 'border-red-400 bg-red-50'
        : overdue
        ? 'border-amber-400 bg-amber-50'
        : 'border-gray-200 bg-white';

    const statusAction =
      order.status === 'new'
        ? { label: 'Preparar', icon: <ChefHatIcon size={16} className="mr-1" />, onClick: () => moveOrder(order.id, 'preparing'), color: 'bg-indigo-600 hover:bg-indigo-700' }
        : order.status === 'preparing'
        ? { label: 'Lista', icon: <CheckCircleIcon size={16} className="mr-1" />, onClick: () => moveOrder(order.id, 'ready'), color: 'bg-green-600 hover:bg-green-700' }
        : { label: 'Entregar', icon: null, onClick: () => deliverOrder(order), color: 'bg-purple-600 hover:bg-purple-700' };

    return (
      <div
        key={order.id}
        className={`border rounded-xl shadow-sm overflow-hidden ${bgByState}`}
        onTouchStart={(e) => onTouchStart(e, order.id)}
        onTouchMove={onTouchMove}
        onTouchEnd={(e) => onTouchEnd(order, e)}
      >
        <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{order.id}</span>
            <span className="text-gray-400" aria-hidden>•</span>
            <span className="text-gray-700">
              {order.tableNumber?.toLowerCase() === 'llevar' ? 'Para llevar' : `Mesa ${order.tableNumber}`}
            </span>
            {order.waiter ? (
              <>
                <span className="text-gray-400" aria-hidden>•</span>
                <span className="text-gray-600">Mesero: {order.waiter}</span>
              </>
            ) : null}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => togglePriority(order.id)}
              className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                order.priority === 'high' ? 'text-red-600 bg-red-100' : 'text-gray-500 hover:bg-gray-100'
              }`}
              aria-label="Cambiar prioridad"
              title="Cambiar prioridad"
            >
              <BellIcon size={18} aria-hidden />
            </button>
            <button
              onClick={() => printOrder(order.id)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              aria-label="Imprimir orden"
              title="Imprimir orden"
            >
              <PrinterIcon size={18} aria-hidden />
            </button>
            <button
              onClick={() => viewOrderDetails(order)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              aria-label="Ver detalles"
              title="Ver detalles"
            >
              <InfoIcon size={18} aria-hidden />
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className="space-y-2 mb-3">
            {order.items.map((it) => (
              <div key={String(it.id)} className="flex justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-medium text-gray-900">{it.quantity}×</span>{' '}
                  <span className="text-gray-800">{it.name}</span>
                  {it.notes && <p className="text-xs text-gray-500 truncate">{it.notes}</p>}
                </div>
                <span className="shrink-0 text-[11px] bg-indigo-100 text-indigo-800 py-0.5 px-2 rounded-full self-start">
                  {it.category}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center text-gray-600">
              <ClockIcon size={16} className="mr-1" aria-hidden />
              <span aria-live="polite">
                {order.timeElapsed} {order.timeElapsed === 1 ? 'min' : 'mins'}
              </span>
            </div>

            {/* Botón de acción principal (tamaño táctil >=44px) */}
            <button
              onClick={statusAction.onClick}
              className={`${statusAction.color} text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center min-h-[44px] min-w-[44px]`}
            >
              {statusAction.icon}
              <span className="font-medium">{statusAction.label}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================
  // Modal Detalles
  // =========================
  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;
    const o = selectedOrder;
    const getStatusLabelLocal = (s: KitchenOrder['status']) => (s === 'new' ? 'Orden' : s === 'preparing' ? 'Preparación' : 'Lista');
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="kitchen-order-title">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 id="kitchen-order-title" className="text-lg font-semibold text-gray-900">
                Detalles de Orden
              </h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                aria-label="Cerrar detalles"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Orden ID</p>
                <p className="font-medium">{o.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Mesa</p>
                <p className="font-medium">
                  {o.tableNumber?.toLowerCase() === 'llevar' ? 'Para llevar' : o.tableNumber}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Mesero</p>
                <p className="font-medium">{o.waiter || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Hora</p>
                <p className="font-medium">
                  {new Date(o.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Estado</p>
                <p className="font-medium">{getStatusLabelLocal(o.status)}</p>
              </div>
              <div>
                <p className="text-gray-500">Prioridad</p>
                <p className={`font-medium ${o.priority === 'high' ? 'text-red-600' : 'text-gray-900'}`}>
                  {o.priority === 'high' ? 'Alta' : 'Normal'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Ítems</p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {o.items.map((it) => (
                  <div key={String(it.id)} className="p-3">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">
                        {it.quantity}x {it.name}
                      </div>
                      <div className="text-xs bg-indigo-100 text-indigo-800 py-0.5 px-2 rounded-full">{it.category}</div>
                    </div>
                    {it.notes && <p className="text-sm text-gray-600">{it.notes}</p>}
                    <p className="text-xs text-gray-400 mt-1">Tiempo estimado: {it.preparationTime} minutos</p>
                  </div>
                ))}
              </div>
            </div>
            {o.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notas generales</p>
                <p className="text-sm border border-gray-200 rounded-lg p-3">{o.notes}</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 flex gap-2 justify-end">
            <button
              onClick={() => setShowOrderDetails(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                printOrder(o.id);
                setShowOrderDetails(false);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 flex items-center"
            >
              <PrinterIcon size={16} className="mr-1" aria-hidden />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================
  // UI: Header + Toolbars
  // =========================

  const counts = useMemo(
    () => ({
      new: orders.filter((o) => o.status === 'new').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length
    }),
    [orders]
  );

  const SegmentedTab: React.FC<{
    value: KitchenOrder['status'];
    onChange: (v: KitchenOrder['status']) => void;
    counts: { new: number; preparing: number; ready: number };
  }> = ({ value, onChange, counts }) => {
    const base =
      'flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600';
    return (
      <div role="tablist" aria-label="Estados cocina" className="grid grid-cols-3 gap-2 w-full">
        <button
          role="tab"
          aria-selected={value === 'new'}
          onClick={() => onChange('new')}
          className={`${base} ${value === 'new' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
        >
          Orden <span className="ml-2 text-xs rounded-full bg-white/20 px-2 py-0.5">{counts.new}</span>
        </button>
        <button
          role="tab"
          aria-selected={value === 'preparing'}
          onClick={() => onChange('preparing')}
          className={`${base} ${
            value === 'preparing' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Prep <span className="ml-2 text-xs rounded-full bg-white/20 px-2 py-0.5">{counts.preparing}</span>
        </button>
        <button
          role="tab"
          aria-selected={value === 'ready'}
          onClick={() => onChange('ready')}
          className={`${base} ${value === 'ready' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
        >
          Lista <span className="ml-2 text-xs rounded-full bg-white/20 px-2 py-0.5">{counts.ready}</span>
        </button>
      </div>
    );
  };

  // =========================
  // Empty / Loading
  // =========================

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );

  // =========================
  // RENDER
  // =========================

  // MOBILE-ONLY VIEW (md:hidden)
  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="px-4 pt-3 pb-2 bg-white border-b border-gray-200 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-gray-900">Cocina</h1>

          {/* Búsqueda compacta */}
          <div className="mt-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={16} className="text-gray-400" aria-hidden />
            </div>
            <input
              ref={searchInputRef}
              type="search"
              inputMode="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Buscar orden o producto…"
              aria-label="Buscar orden o producto"
            />
          </div>

          {/* Tabs de estado (Segmented Control) */}
          <div className="mt-3">
            <SegmentedTab value={activeTab} onChange={setActiveTab} counts={counts} />
          </div>
        </header>

        {/* Lista (cards) */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(renderOrderCard)
          ) : (
            <div className="text-gray-500 text-center py-16">
              <div className="mx-auto mb-2 flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                {activeTab === 'new' ? (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ) : activeTab === 'preparing' ? (
                  <ChefHatIcon size={24} className="text-gray-400" aria-hidden />
                ) : (
                  <CheckCircleIcon size={24} className="text-gray-400" aria-hidden />
                )}
              </div>
              <p className="font-medium">No hay órdenes en “{getStatusLabel(activeTab)}”.</p>
              <p className="text-sm">Cuando lleguen, aparecerán aquí automáticamente.</p>
            </div>
          )}
        </main>

        {/* Footer tip (accesible) */}
        <footer className="px-4 pb-4 pt-2 bg-white border-t border-gray-200 text-xs text-gray-500">
          <p className="leading-relaxed">
            Sugerencia: desliza la tarjeta a la izquierda para avanzar de estado, o a la derecha para retroceder.
          </p>
        </footer>

        {showOrderDetails && renderOrderDetailsModal()}
      </div>
    );
  }

  // DESKTOP / TABLET: Mantener layout existente (3 columnas)
  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cocina</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={16} className="text-gray-400" aria-hidden />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block rounded-lg border border-gray-300 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              placeholder="Buscar orden..."
              aria-label="Buscar orden"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="bg-white rounded-xl shadow-sm p-4 h-[calc(100vh-160px)] overflow-y-auto" aria-labelledby="col-new">
          <div className="flex items-center justify-between mb-4">
            <h2 id="col-new" className="font-semibold text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2" aria-hidden />
              Orden
            </h2>
            <span className="text-sm bg-indigo-100 text-indigo-800 py-0.5 px-2 rounded-full">{getOrdersByStatus('new').length}</span>
          </div>
          {getOrdersByStatus('new').length > 0 ? (
            getOrdersByStatus('new').map(renderOrderCard)
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No hay órdenes nuevas</p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-4 h-[calc(100vh-160px)] overflow-y-auto" aria-labelledby="col-prep">
          <div className="flex items-center justify-between mb-4">
            <h2 id="col-prep" className="font-semibold text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2" aria-hidden />
              Preparación
            </h2>
            <span className="text-sm bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">
              {getOrdersByStatus('preparing').length}
            </span>
          </div>
          {getOrdersByStatus('preparing').length > 0 ? (
            getOrdersByStatus('preparing').map(renderOrderCard)
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <ChefHatIcon size={40} className="mb-2" aria-hidden />
              <p>No hay órdenes en preparación</p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-4 h-[calc(100vh-160px)] overflow-y-auto" aria-labelledby="col-ready">
          <div className="flex items-center justify-between mb-4">
            <h2 id="col-ready" className="font-semibold text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2" aria-hidden />
              Lista
            </h2>
            <span className="text-sm bg-green-100 text-green-800 py-0.5 px-2 rounded-full">{getOrdersByStatus('ready').length}</span>
          </div>
          {getOrdersByStatus('ready').length > 0 ? (
            getOrdersByStatus('ready').map(renderOrderCard)
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <CheckCircleIcon size={40} className="mb-2" aria-hidden />
              <p>No hay órdenes listas</p>
            </div>
          )}
        </section>
      </div>

      {showOrderDetails && renderOrderDetailsModal()}
    </div>
  );
};

export default KitchenView;
