import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2Icon,
  ClockIcon,
  UserIcon,
  UtensilsIcon,
  AlertTriangleIcon,
  PlusIcon,
  ChefHatIcon,
  CheckCircleIcon,
  RefreshCcwIcon,
  MapPinIcon,
  TagIcon
} from 'lucide-react';

const LS_TABLES = 'woky.tables';
const LS_RUNTIME = 'woky.tables.runtime';

type ConfigStatus = 'libre' | 'ocupada' | 'reservada' | 'fuera_de_servicio';
type Status = 'available' | 'occupied' | 'reserved' | 'disabled';

type ConfigTable = {
  id: string;
  number: number;
  alias?: string;
  zone?: string;
  capacity?: number;
  active: boolean;
  status?: ConfigStatus;
  waiter?: string | null;
};

type KitchenStatus = 'new' | 'preparing' | 'ready' | 'delivered';

type Runtime = {
  tableId: string | number;
  orderId?: string;
  waiter?: string;
  customerName?: string;
  items?: { id: number | string; name: string; price: number; quantity: number }[];
  itemsCount?: number;
  total?: number;
  kitchenStatus?: KitchenStatus;
  occupiedSince?: string;
  deliveredAt?: string;
};

type TableCard = {
  id: string | number;
  number: number;
  name: string;
  status: Status;
  zone?: string;
  capacity?: number;
  waiter?: string | null;
  hasHistory: boolean;
  deliveredAt?: string;
  itemsCount?: number;
  total?: number;
  kitchenStatus?: KitchenStatus;
  occupiedSince?: string;
};

const mapStatus = (s?: ConfigStatus, active = true): Status =>
  !active
    ? 'disabled'
    : s === 'ocupada'
    ? 'occupied'
    : s === 'reservada'
    ? 'reserved'
    : s === 'fuera_de_servicio'
    ? 'disabled'
    : 'available';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(n));

/**
 * Bloqueo de edición:
 * - Se bloquea SOLO cuando cocina marca "ready" (LISTA).
 * - Si está "delivered" (entregada) se permite volver a agregar una nueva orden.
 */
const isLocked = (t: TableCard) => t.kitchenStatus === 'ready';

// === NUEVO: Stepper visual de estados de cocina ===
const steps = [
  { key: 'new',        label: 'Orden',       icon: ClockIcon,        color: 'text-blue-600',   dot: 'bg-blue-600' },
  { key: 'preparing',  label: 'Preparación', icon: ChefHatIcon,      color: 'text-amber-600',  dot: 'bg-amber-600' },
  { key: 'ready',      label: 'Lista',       icon: CheckCircleIcon,  color: 'text-green-600',  dot: 'bg-green-600' },
  { key: 'delivered',  label: 'Entregado',   icon: CheckCircleIcon,  color: 'text-purple-700', dot: 'bg-purple-700' },
] as const;

const statusIndex = (s?: KitchenStatus) =>
  s === 'new' ? 0 : s === 'preparing' ? 1 : s === 'ready' ? 2 : s === 'delivered' ? 3 : -1;

const timeFrom = (iso?: string) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return '0m';
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}h ${mm}m` : `${m}m`;
};

const KitchenStepper: React.FC<{ status?: KitchenStatus; since?: string; deliveredAt?: string; }> = ({ status, since, deliveredAt }) => {
  const idx = statusIndex(status);
  return (
    <div className="mt-2">
      <div className="flex items-center">
        {steps.map((st, i) => {
          const active = idx >= i && idx !== -1;
          const Icon = st.icon;
          return (
            <div key={st.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center w-full">
                <div className={`flex items-center justify-center rounded-full h-6 w-6 ${active ? st.dot + ' text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <Icon size={14} />
                </div>
                <div className={`text-[11px] mt-1 ${active ? st.color : 'text-gray-500'}`}>{st.label}</div>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 mx-1 flex-1 ${idx > i ? 'bg-gray-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
        <div className="truncate">Desde ocupada: <span className="font-medium">{timeFrom(since) ?? '—'}</span></div>
        <div className="truncate text-right">Desde entregado: <span className="font-medium">{timeFrom(deliveredAt) ?? '—'}</span></div>
      </div>
    </div>
  );
};

const TablesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableCard[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const [loading, setLoading] = useState<boolean>(false);

  const load = () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(LS_TABLES);
      const cfg: ConfigTable[] = raw ? JSON.parse(raw) : [];
      const rraw = localStorage.getItem(LS_RUNTIME);
      const rt: Record<string, Runtime> = rraw ? JSON.parse(rraw) : {};

      const mapped: TableCard[] = cfg
        .filter((t) => t.active === true)
        .map((t) => {
          const status = mapStatus(t.status, t.active);
          const r = rt[String(t.id)];
          const hasHistory = !!r;
          return {
            id: t.id,
            number: t.number,
            name: t.alias ? `Mesa ${t.number} · ${t.alias}` : `Mesa ${t.number}`,
            zone: t.zone,
            capacity: t.capacity ?? 4,
            status,
            waiter: r?.waiter ?? t.waiter ?? null,
            hasHistory,
            deliveredAt: r?.deliveredAt,
            itemsCount: r?.itemsCount,
            total: r?.total,
            kitchenStatus: r?.kitchenStatus,
            occupiedSince: r?.occupiedSince
          };
        })
        .sort((a, b) => (a.number ?? 9999) - (b.number ?? 9999));

      setTables(mapped);
    } catch {
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_TABLES || e.key === LS_RUNTIME) load();
    };
    window.addEventListener('storage', onStorage);

    const onTablesUpdated = () => load();
    window.addEventListener('woky:tables-updated', onTablesUpdated as EventListener);

    const t = setInterval(() => setNow(Date.now()), 1000 * 30);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('woky:tables-updated', onTablesUpdated as EventListener);
      clearInterval(t);
    };
  }, []);

  const groups = useMemo(() => {
    return {
      available: tables.filter((t) => t.status === 'available'),
      occupied: tables.filter((t) => t.status === 'occupied'),
      reserved: tables.filter((t) => t.status === 'reserved'),
      disabled: tables.filter((t) => t.status === 'disabled')
    };
  }, [tables, now]);

  // RUTAS CORRECTAS: /ordenes (no /orden)
  const goNewOrder = (t: TableCard) => navigate(`/ordenes?new=true&table=${t.id}`);
  const goToOrder = (t: TableCard) => navigate(`/ordenes?table=${t.id}`);
  const goToConfigTables = () => navigate('/configuracion?tab=tables');

  const cardBase = 'rounded-xl border shadow-sm p-3 transition-colors';

  // Badge de estado de cocina (rápido)
  const KitchenBadge: React.FC<{ status?: KitchenStatus }> = ({ status }) => {
    if (!status) return null;
    const map = {
      new: { text: 'Orden', className: 'bg-blue-100 text-blue-800', Icon: ClockIcon },
      preparing: { text: 'Preparación', className: 'bg-amber-100 text-amber-800', Icon: ChefHatIcon },
      ready: { text: 'Lista', className: 'bg-green-100 text-green-800', Icon: CheckCircleIcon },
      delivered: { text: 'Entregado', className: 'bg-purple-100 text-purple-800', Icon: CheckCircleIcon }
    } as const;
    const conf = map[status];
    const Ico = conf.Icon;
    return (
      <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full ${conf.className}`}>
        <Ico size={12} className="mr-1" /> {conf.text}
      </span>
    );
  };

  // Empty state
  const EmptyState = () => (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
      <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
        <TableIcon size={18} className="text-indigo-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">Aún no hay mesas activas</h3>
      <p className="text-sm text-gray-600 mt-1">
        Configura tus mesas en <span className="font-medium">Configuración &gt; Mesas</span>. Solo se muestran las mesas marcadas como <em>activas</em>.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
        <button
          onClick={goToConfigTables}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Ir a configurar mesas
        </button>
        <button
          onClick={load}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <RefreshCcwIcon size={16} className="mr-2" />
          Recargar
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mesas</h1>
          <p className="text-gray-600">Estado general del salón (según Configuración &gt; Mesas)</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-sm"
          aria-label="Recargar listado"
        >
          <RefreshCcwIcon size={16} className="mr-1" /> Recargar
        </button>
      </div>

      {tables.length === 0 && !loading ? <EmptyState /> : null}

      {loading && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-3">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-2" />
                <div className="h-8 w-full bg-gray-200 rounded animate-pulse mt-3" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISPONIBLES */}
      {groups.available.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center text-green-800">
            <CheckCircle2Icon size={18} className="mr-2" /> Disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.available.map((t) => (
              <div key={t.id} className={`${cardBase} border-green-200 bg-green-50`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-green-900">{t.name}</div>
                  <span className="text-xs text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                    Libre
                  </span>
                </div>

                <div className="text-xs text-green-900/70 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center">
                    <UtensilsIcon size={12} className="mr-1" /> Capacidad: {t.capacity}
                  </span>
                  {t.zone ? (
                    <span className="inline-flex items-center">
                      <MapPinIcon size={12} className="mr-1" /> {t.zone}
                    </span>
                  ) : null}
                </div>

                <button
                  onClick={() => goNewOrder(t)}
                  className="w-full mt-3 inline-flex items-center justify-center text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <PlusIcon size={14} className="mr-1" /> Nueva orden
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* OCUPADAS / HISTORIAL */}
      {groups.occupied.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center text-amber-800">
            <ClockIcon size={18} className="mr-2" /> En curso / con historial
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.occupied.map((t) => {
              const locked = isLocked(t);
              const cardCls = locked
                ? `${cardBase} text-left border-gray-200 bg-gray-50 cursor-not-allowed opacity-75`
                : `${cardBase} text-left border-amber-200 bg-amber-50 hover:border-amber-300`;

              return (
                <div
                  key={t.id}
                  className={cardCls}
                  role={locked ? 'group' : 'button'}
                  onClick={() => {
                    if (!locked) goToOrder(t);
                  }}
                  tabIndex={locked ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!locked && (e.key === 'Enter' || e.key === ' ')) goToOrder(t);
                  }}
                  aria-disabled={locked}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-amber-900">{t.name}</div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        locked ? 'text-gray-700 bg-gray-200' : 'text-amber-800 bg-amber-100'
                      }`}
                    >
                      {locked ? 'Bloqueada (Lista)' : 'Ocupada'}
                    </span>
                  </div>

                  {/* Estado de cocina (badge + stepper) */}
                  <div className="mt-1 flex items-center gap-2">
                    <KitchenBadge status={t.kitchenStatus} />
                  </div>

                  {/* NUEVO: flujo visual */}
                  <KitchenStepper status={t.kitchenStatus} since={t.occupiedSince} deliveredAt={t.deliveredAt} />

                  <div className="text-xs text-amber-900/70 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center">
                      <UserIcon size={12} className="mr-1" /> Mesero: {t.waiter || '—'}
                    </span>
                    {t.zone ? (
                      <span className="inline-flex items-center">
                        <TagIcon size={12} className="mr-1" /> {t.zone}
                      </span>
                    ) : null}
                  </div>

                  {t.itemsCount ? (
                    <div className="text-xs text-amber-900/70 mt-1">
                      Entregado: {t.itemsCount} ítems • ${fmt(t.total || 0)}
                    </div>
                  ) : null}

                  <div className="mt-2 text-[11px] text-amber-900/70">
                    {locked
                      ? 'Vista bloqueada: ya está LISTA en cocina'
                      : 'Clic para EDITAR si está en Orden o Preparación, o agregar más productos'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* RESERVADAS */}
      {groups.reserved.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center text-blue-800">
            <ClockIcon size={18} className="mr-2" /> Reservadas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.reserved.map((t) => (
              <div key={t.id} className={`${cardBase} border-blue-200 bg-blue-50`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-blue-900">{t.name}</div>
                  <span className="text-xs text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                    Reservada
                  </span>
                </div>
                <div className="text-xs text-blue-900/70 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center">
                    <UtensilsIcon size={12} className="mr-1" /> Capacidad: {t.capacity}
                  </span>
                  {t.zone ? (
                    <span className="inline-flex items-center">
                      <MapPinIcon size={12} className="mr-1" /> {t.zone}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FUERA DE SERVICIO */}
      {groups.disabled.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2 flex items-center text-gray-700">
            <AlertTriangleIcon size={18} className="mr-2" /> Fuera de servicio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.disabled.map((t) => (
              <div key={t.id} className={`${cardBase} border-gray-200 bg-gray-50`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">{t.name}</div>
                  <span className="text-xs text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full">
                    Inhabilitada
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Ícono utilizado en el EmptyState
const TableIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 10h18" />
    <path d="M4 10l2 10" />
    <path d="M20 10l-2 10" />
    <path d="M12 10v10" />
    <path d="M3 6h18v4H3z" />
  </svg>
);

export default TablesPage;
