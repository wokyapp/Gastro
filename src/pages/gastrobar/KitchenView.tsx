import React, { useEffect, useState } from 'react';
import { ClockIcon, ChefHatIcon, CheckCircleIcon, BellIcon, PrinterIcon, InfoIcon, SearchIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const LS_KITCHEN = 'woky.kitchenOrders';
const LS_RUNTIME = 'woky.tables.runtime';
const LS_CASH = 'woky.cash.tickets';
const LS_GLOBAL_NOTIFS = 'woky.notifications'; // canal global para notificar a todos los roles

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  category: string;
  preparationTime: number;
  price?: number; // ← llega desde OrdersPage
}
interface KitchenOrder {
  id: string;
  tableNumber: string;
  tableId?: string | number;
  items: OrderItem[];
  status: 'new' | 'preparing' | 'ready';
  waiter: string;
  createdAt: string;
  priority: 'normal' | 'high';
  notes?: string;
  timeElapsed: number;
}

// Cash types (compatibles con Caja)
type TicketItem = { id:number; name:string; price:number; quantity:number; batch?: number };
type Ticket = {
  id: string;         // eg. T001
  table: number;      // número de mesa
  items: TicketItem[];
  status: 'active'|'paid';
  waiter: string;
  customerName?: string;
  created: string;
  // metadatos para agregados
  batches?: number;
  updated?: string;
  lastAppendAt?: string;
};

const KitchenView: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // ==== Persistencia ====
  const load = (): KitchenOrder[] => {
    try {
      const raw = localStorage.getItem(LS_KITCHEN);
      const parsed: KitchenOrder[] = raw ? JSON.parse(raw) : [];
      // Sanitiza: elimina órdenes vacías (defensa adicional)
      const sanitized = parsed.filter(o => Array.isArray(o.items) && o.items.length > 0);
      if (sanitized.length !== parsed.length) {
        save(sanitized);
      }
      return sanitized.map(o => ({
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
    } catch { return {}; }
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
    } catch { return []; }
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
      const next = [
        { ...payload, read: false },
        ...prev
      ];
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
      setOrders(prev => prev.map(o => ({
        ...o,
        timeElapsed: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)
      })));
    }, 60000);

    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KITCHEN) setOrders(load());
    };
    window.addEventListener('storage', onStorage);

    return () => { clearInterval(timer); window.removeEventListener('storage', onStorage); };
  }, []);

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tableNumber.includes(searchTerm) ||
    order.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getOrdersByStatus = (status: 'new'|'preparing'|'ready') =>
    filteredOrders.filter(o => o.status === status);

  const setAndPersist = (next: KitchenOrder[]) => { setOrders(next); save(next); };

  const moveOrder = (orderId: string, newStatus: 'new'|'preparing'|'ready') => {
    const next = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setAndPersist(next);

    // Sincroniza runtime con estado de cocina
    const ord = next.find(o => o.id === orderId);
    if (ord?.tableId != null) {
      const rt = getRuntime();
      const key = String(ord.tableId);
      const prev = rt[key] || { tableId: ord.tableId };

      rt[key] = {
        ...prev,
        kitchenStatus: newStatus,
        occupiedSince: prev.occupiedSince || new Date().toISOString(),
      };
      setRuntime(rt);
    }

    // >>> NUEVO: si pasa a "ready", enviar notificación global <<<
    if (newStatus === 'ready' && ord) {
      const when = new Date().toISOString();
      pushGlobalNotification({
        id: `kready-${ord.id}-${when}`,
        title: 'Orden lista',
        message: `Orden ${ord.id} de Mesa ${ord.tableNumber} está lista para entregar.`,
        ts: when
      });
    }

    showToast('success', `Orden ${orderId} movida a ${getStatusLabel(newStatus)}`);
  };

  const togglePriority = (orderId: string) => {
    const next = orders.map(o => o.id === orderId ? { ...o, priority: o.priority==='normal'?'high':'normal' } : o);
    setAndPersist(next);
    const changed = next.find(o => o.id === orderId);
    if (changed) showToast('info', `Prioridad de orden ${orderId} cambiada a ${changed.priority==='high'?'alta':'normal'}`);
  };

  const printOrder = (orderId: string) => {
    showToast('info', `Imprimiendo orden ${orderId}...`);
  };

  const viewOrderDetails = (order: KitchenOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const getStatusLabel = (s: 'new'|'preparing'|'ready') =>
    s==='new' ? 'Orden' : s==='preparing' ? 'Preparación' : 'Lista';

  // === ENTREGAR: actualiza runtime + caja y retira de cocina ===
  const deliverOrder = (order: KitchenOrder) => {
    // 1) Retirar de cocina
    const next = orders.filter(o => o.id !== order.id);
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
      const itemsCount = deliveredItems.reduce((s:any,it:any)=>s+it.quantity,0);
      const total = deliveredItems.reduce((s:any,it:any)=>s+it.price*it.quantity,0);

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
    const tableNum = Number(order.tableNumber.replace(/\D/g,'') || 0) || 0;
    const tickets = getCashTickets();
    const existing = tickets.find(t => t.status === 'active' && t.table === tableNum);

    const nowIso = new Date().toISOString();

    if (existing) {
      const nextBatch = (existing as any).batches ? (existing as any).batches + 1 : 2;
      const toPush: TicketItem[] = order.items.map((it, idx) => ({
        id: Date.now() + idx,
        name: it.name,
        price: typeof it.price === 'number' ? it.price : 0,
        quantity: it.quantity,
        batch: nextBatch,
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
        batch: 1,
      }));
      const newId = `T${String((tickets.length + 1)).padStart(3,'0')}`;
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
        lastAppendAt: nowIso,
      } as any);
    }

    setCashTickets(tickets);

    showToast('success', `Orden ${order.id} entregada`);
  };

  const renderOrderCard = (order: KitchenOrder) => {
    const maxPrep = order.items.reduce((m, it) => Math.max(m, it.preparationTime), 0);
    const overdue = (order.status==='new' && order.timeElapsed>5) || (order.status==='preparing' && order.timeElapsed>maxPrep);
    return (
      <div key={order.id} className={`border rounded-lg shadow-sm mb-3 overflow-hidden ${order.priority==='high'?'border-red-400 bg-red-50': overdue?'border-amber-400 bg-amber-50':'border-gray-200 bg-white'}`}>
        <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center">
            <span className="font-medium text-gray-800">{order.id}</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-gray-600">Mesa {order.tableNumber}</span>
            {order.waiter ? <><span className="mx-2 text-gray-400">•</span><span className="text-gray-600">Mesero: {order.waiter}</span></> : null}
          </div>
          <div className="flex space-x-1">
            <button onClick={()=>togglePriority(order.id)} className={`p-1 rounded-full ${order.priority==='high'?'text-red-600 bg-red-100':'text-gray-400 hover:bg-gray-100'}`} title="Cambiar prioridad">
              <BellIcon size={16}/>
            </button>
            <button onClick={()=>printOrder(order.id)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100" title="Imprimir orden">
              <PrinterIcon size={16}/>
            </button>
            <button onClick={()=>viewOrderDetails(order)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100" title="Ver detalles">
              <InfoIcon size={16}/>
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="space-y-2 mb-3">
            {order.items.map(it=>(
              <div key={it.id} className="flex justify-between">
                <div>
                  <span className="font-medium text-gray-800">{it.quantity}x</span>{' '}<span>{it.name}</span>
                  {it.notes && <p className="text-xs text-gray-500">{it.notes}</p>}
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">{it.category}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center text-gray-500">
              <ClockIcon size={14} className="mr-1" />
              <span>{order.timeElapsed} {order.timeElapsed===1?'minuto':'minutos'}</span>
            </div>
            <div className="flex space-x-1">
              {order.status==='new' && (
                <button onClick={()=>moveOrder(order.id,'preparing')} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex items-center">
                  <ChefHatIcon size={12} className="mr-1" /> Preparar
                </button>
              )}
              {order.status==='preparing' && (
                <button onClick={()=>moveOrder(order.id,'ready')} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center">
                  <CheckCircleIcon size={12} className="mr-1" /> Lista
                </button>
              )}
              {order.status==='ready' && (
                <button onClick={()=>deliverOrder(order)} className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs flex items-center">
                  Entregar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;
    const o = selectedOrder;
    const getStatusLabel = (s: 'new'|'preparing'|'ready') => s==='new'?'Orden':s==='preparing'?'Preparación':'Lista';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Detalles de Orden</h3>
              <button onClick={()=>setShowOrderDetails(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Orden ID</p><p className="font-medium">{o.id}</p></div>
              <div><p className="text-sm text-gray-500">Mesa</p><p className="font-medium">{o.tableNumber}</p></div>
              <div><p className="text-sm text-gray-500">Mesero</p><p className="font-medium">{o.waiter}</p></div>
              <div><p className="text-sm text-gray-500">Hora</p><p className="font-medium">{new Date(o.createdAt).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</p></div>
              <div><p className="text-sm text-gray-500">Estado</p><p className="font-medium">{getStatusLabel(o.status)}</p></div>
              <div><p className="text-sm text-gray-500">Prioridad</p><p className={`font-medium ${o.priority==='high'?'text-red-600':'text-gray-900'}`}>{o.priority==='high'?'Alta':'Normal'}</p></div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Ítems</p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {o.items.map(it=>(
                  <div key={it.id} className="p-3">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{it.quantity}x {it.name}</div>
                      <div className="text-xs bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">{it.category}</div>
                    </div>
                    {it.notes && <p className="text-sm text-gray-500">{it.notes}</p>}
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
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
            <button onClick={()=>setShowOrderDetails(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cerrar</button>
            <button onClick={()=>{ printOrder(o.id); setShowOrderDetails(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <PrinterIcon size={16} className="mr-1"/> Imprimir
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"/>
    </div>
  );

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cocina</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={16} className="text-gray-400"/>
            </div>
            <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                   className="pl-10 block rounded-lg border border-gray-300 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   placeholder="Buscar orden..." />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 h-[calc(100vh-160px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Orden</h2>
            <span className="text-sm bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">{getOrdersByStatus('new').length}</span>
          </div>
          {getOrdersByStatus('new').length>0 ? getOrdersByStatus('new').map(renderOrderCard) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p>No hay órdenes nuevas</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 h-[calc(100vh-160px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>Preparación</h2>
            <span className="text-sm bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">{getOrdersByStatus('preparing').length}</span>
          </div>
          {getOrdersByStatus('preparing').length>0 ? getOrdersByStatus('preparing').map(renderOrderCard) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <ChefHatIcon size={40} className="mb-2" />
              <p>No hay órdenes en preparación</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 h-[calc(100vh-160px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Lista</h2>
            <span className="text-sm bg-green-100 text-green-800 py-0.5 px-2 rounded-full">{getOrdersByStatus('ready').length}</span>
          </div>
          {getOrdersByStatus('ready').length>0 ? getOrdersByStatus('ready').map(renderOrderCard) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <CheckCircleIcon size={40} className="mb-2" />
              <p>No hay órdenes listas</p>
            </div>
          )}
        </div>
      </div>

      {showOrderDetails && renderOrderDetailsModal()}
    </div>
  );
};

export default KitchenView;
