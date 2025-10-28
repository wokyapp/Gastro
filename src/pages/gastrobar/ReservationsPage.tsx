// src/pages/gastrobar/ReservationsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CalendarIcon,
  UserIcon,
  CheckIcon,
  XIcon,
  PlusIcon,
  SearchIcon,
  UserSearchIcon,
  TableIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

/** ===================== Claves de Storage ===================== **/
const LS_TABLES = 'woky.tables';
const LS_RESERVATIONS = 'woky.reservations';
const LS_RUNTIME = 'woky.tables.runtime';
const SS_RES_SESSION = 'woky.reservations.sessionId';

/** ===================== Tipos ===================== **/
type TableItem = {
  id: string;
  number: number;
  alias?: string;
  zone?: string;
  capacity?: number;
  active: boolean;
  status?: 'libre' | 'ocupada' | 'reservada' | 'fuera_de_servicio';
  createdAt?: string;
};

type Reservation = {
  id: string;
  name: string;
  phone: string;
  identification?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  guests: number;
  tableId: string;
  tableNumber: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
  createdAt?: string;
  sessionId?: string;
};

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

/** ===================== Utils fecha ===================== **/
const todayStr = () => new Date().toISOString().split('T')[0];
const isToday = (yyyy_mm_dd: string) => yyyy_mm_dd === todayStr();

/** ===================== Helpers LS ===================== **/
const getTables = (): TableItem[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_TABLES) || '[]');
  } catch {
    return [];
  }
};
const setTables = (list: TableItem[]) => {
  const payload = JSON.stringify(list);
  localStorage.setItem(LS_TABLES, payload);
  try {
    window.dispatchEvent(new StorageEvent('storage', { key: LS_TABLES, newValue: payload }));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('woky:tables-updated'));
  } catch {}
};

const getReservations = (): Reservation[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_RESERVATIONS) || '[]');
  } catch {
    return [];
  }
};
const saveReservations = (list: Reservation[]) => {
  const payload = JSON.stringify(list);
  localStorage.setItem(LS_RESERVATIONS, payload);
  try {
    window.dispatchEvent(new StorageEvent('storage', { key: LS_RESERVATIONS, newValue: payload }));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('woky:reservations-updated'));
  } catch {}
};

const getRuntime = (): Record<string, Runtime> => {
  try {
    return JSON.parse(localStorage.getItem(LS_RUNTIME) || '{}');
  } catch {
    return {};
  }
};
const setRuntime = (rt: Record<string, Runtime>) => {
  const payload = JSON.stringify(rt);
  localStorage.setItem(LS_RUNTIME, payload);
  try {
    window.dispatchEvent(new StorageEvent('storage', { key: LS_RUNTIME, newValue: payload }));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('woky:tables-updated'));
  } catch {}
};

/** ===================== Side-effects Mesas/Runtime desde Reservas ===================== **/
const setTableStatus = (tableId: string, status: TableItem['status']) => {
  const tables = getTables();
  const idx = tables.findIndex((t) => String(t.id) === String(tableId));
  if (idx >= 0) {
    tables[idx] = { ...tables[idx], status };
    setTables(tables);
  }
};
const reserveTableIfToday = (res: Reservation) => {
  if (res.tableId && isToday(res.date) && res.status === 'confirmed') {
    setTableStatus(res.tableId, 'reservada');
  }
};
const freeIfReservedToday = (res: Reservation) => {
  if (res.tableId && isToday(res.date)) {
    const tables = getTables();
    const idx = tables.findIndex((t) => String(t.id) === String(res.tableId));
    if (idx >= 0 && tables[idx].status === 'reservada') {
      tables[idx] = { ...tables[idx], status: 'libre' };
      setTables(tables);
    }
  }
};
const occupyTableForArrival = (tableId: string, customerName: string) => {
  setTableStatus(tableId, 'ocupada');
  const rt = getRuntime();
  const key = String(tableId);
  const prev = rt[key] || { tableId };
  rt[key] = {
    ...prev,
    customerName,
    occupiedSince: prev.occupiedSince || new Date().toISOString(),
    kitchenStatus: prev.kitchenStatus || undefined,
  };
  setRuntime(rt);
};

/** ===================== Página ===================== **/
const ReservationsPage: React.FC = () => {
  const { showToast } = useToast();

  // ================== Estilos (alineados con Menú) ==================
  const softBtn = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
      amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
      red: 'bg-red-50 text-red-700 hover:bg-red-100',
      green: 'bg-green-50 text-green-700 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      pink: 'bg-pink-50 text-pink-700 hover:bg-pink-100',
      indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    };
    return [
      'px-3 py-2 rounded-lg',
      'text-[12px] sm:text-sm font-medium',
      'transition-colors',
      'flex items-center justify-center',
      'whitespace-nowrap',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
      colorMap[color] || colorMap.gray,
    ].join(' ');
  };

  const ctaGrad = () =>
    [
      'px-4 py-2',
      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
      'rounded-lg',
      'text-[12px] sm:text-sm font-medium',
      'hover:from-blue-700 hover:to-indigo-700',
      'transition-colors',
      'flex items-center justify-center',
      'whitespace-nowrap',
      'shadow-sm',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    ].join(' ');

  /** Sesión de reservas **/
  const [sessionId, setSessionId] = useState<string>('');
  useEffect(() => {
    let sid = sessionStorage.getItem(SS_RES_SESSION);
    if (!sid) {
      sid = `S${Date.now()}`;
      sessionStorage.setItem(SS_RES_SESSION, sid);
    }
    setSessionId(sid);
  }, []);

  /** Mesas **/
  const [tables, setTablesState] = useState<TableItem[]>([]);
  useEffect(() => {
    const loadTables = () => setTablesState(getTables().sort((a, b) => a.number - b.number));
    loadTables();
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_TABLES) loadTables();
    };
    const onCustom = () => loadTables();
    window.addEventListener('storage', onStorage);
    window.addEventListener('woky:tables-updated', onCustom as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('woky:tables-updated', onCustom as EventListener);
    };
  }, []);
  const activeTables = useMemo(
    () => tables.filter((t) => t.active).sort((a, b) => a.number - b.number),
    [tables],
  );

  /** Reservas **/
  const [reservations, setReservationsState] = useState<Reservation[]>([]);
  useEffect(() => {
    const load = () => setReservationsState(getReservations());
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_RESERVATIONS) load();
    };
    const onCustom = () => load();
    const onFocus = () => load();
    const onVisibility = () => {
      if (!document.hidden) load();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('woky:reservations-updated', onCustom as EventListener);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('woky:reservations-updated', onCustom as EventListener);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  /** Filtros / búsqueda **/
  const [reservationFilter, setReservationFilter] = useState<'all' | 'today' | 'upcoming' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const onlySessionReservations = useMemo(
    () => reservations.filter((r) => r.sessionId === sessionId),
    [reservations, sessionId],
  );
  const filteredReservations = useMemo(() => {
    const today = todayStr();
    return onlySessionReservations.filter((r) => {
      const matchFilter =
        reservationFilter === 'all' ||
        (reservationFilter === 'today' && r.date === today) ||
        (reservationFilter === 'upcoming' && r.date > today) ||
        (reservationFilter === 'pending' && r.status === 'pending');
      const haystack = (r.name + ' ' + (r.identification || '')).toLowerCase();
      const matchSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [onlySessionReservations, reservationFilter, searchTerm]);

  /** Modal / Form **/
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    identification: '',
    date: todayStr(),
    time: '19:00',
    guests: 2,
    tableId: '',
    notes: '',
  });
  const resetForm = () =>
    setForm({
      name: '',
      phone: '',
      identification: '',
      date: todayStr(),
      time: '19:00',
      guests: 2,
      tableId: '',
      notes: '',
    });

  const handleSaveReservation = () => {
    if (!form.name.trim()) return showToast('error', 'Ingresa el nombre del cliente');
    if (!form.phone.trim()) return showToast('error', 'Ingresa el teléfono de contacto');
    if (!form.date) return showToast('error', 'Selecciona la fecha');
    if (!form.time) return showToast('error', 'Selecciona la hora');
    if (form.guests <= 0) return showToast('error', 'La cantidad de personas debe ser mayor a 0');

    const sel = form.tableId ? tables.find((t) => String(t.id) === String(form.tableId)) : undefined;

    // Siempre crear como CONFIRMADA (aunque no tenga mesa asignada)
    const newRes: Reservation = {
      id: `r${Date.now()}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      identification: form.identification.trim() || undefined,
      date: form.date,
      time: form.time,
      guests: form.guests,
      tableId: sel ? String(sel.id) : '',
      tableNumber: sel ? sel.number : 0,
      status: 'confirmed',
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      sessionId,
    };

    const next = [...reservations, newRes];
    setReservationsState(next);
    saveReservations(next);
    reserveTableIfToday(newRes);

    showToast('success', 'Reservación creada y confirmada');
    setShowReservationModal(false);
    resetForm();
  };

  /** Acciones tarjeta **/
  // Se deja por si existieran reservas previas "pending", pero ya no se renderiza el botón de Confirmar en UI.
  const confirmReservation = (res: Reservation) => {
    const next = reservations.map((r) => (r.id === res.id ? { ...r, status: 'confirmed' as const } : r));
    setReservationsState(next);
    saveReservations(next);
    reserveTableIfToday({ ...res, status: 'confirmed' });
    showToast('success', 'Reservación confirmada');
  };
  const cancelReservation = (res: Reservation) => {
    const next = reservations.map((r) => (r.id === res.id ? { ...r, status: 'cancelled' } : r));
    setReservationsState(next);
    saveReservations(next);
    freeIfReservedToday(res);
    showToast('info', 'Reservación cancelada');
  };
  const registerArrival = (res: Reservation) => {
    const next = reservations.map((r) => (r.id === res.id ? { ...r, status: 'completed' } : r));
    setReservationsState(next);
    saveReservations(next);
    if (res.tableId) {
      occupyTableForArrival(res.tableId, res.name);
      showToast('success', `Cliente registrado en mesa ${res.tableNumber}`);
    } else {
      showToast('warning', 'La reserva no tiene mesa asignada');
    }
  };

  /** UI helpers **/
  const tableLabel = (t: TableItem) =>
    `Mesa ${t.number}${t.capacity ? ` (${t.capacity} pers.)` : ''}${t.zone ? ` · ${t.zone}` : ''}${t.alias ? ` · ${t.alias}` : ''}`;

  /** ===== Render ===== **/
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 via-violet-50 to-pink-50 p-4 rounded-3xl shadow-sm border border-white/60">
        <div className="bg-white/60 p-3 rounded-2xl">
          <h1 className="text-2xl font-bold text-gray-800">Reservaciones</h1>
          <p className="text-sm text-gray-600">Solo se muestran las reservaciones creadas en esta sesión</p>
        </div>
      </div>

      {/* Mesas activas (vista rápida) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
        <div className="flex items-center mb-2 text-gray-700">
          <TableIcon size={18} className="mr-2 text-indigo-600" aria-hidden />
          <span className="font-medium">Mesas (desde Configuración)</span>
          <span className="ml-2 text-xs text-gray-500">
            Activas: {useMemo(() => tables.filter((t) => t.active).length, [tables])}
          </span>
        </div>
        {activeTables.length === 0 ? (
          <p className="text-sm text-gray-500">No hay mesas creadas/activas aún.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeTables.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-700"
                title={tableLabel(t)}
              >
                <span className="mr-1 font-medium">#{t.number}</span>
                {t.zone && (
                  <span className="flex items-center mr-1 text-gray-500">
                    <MapPinIcon size={12} className="mr-0.5" aria-hidden />
                    {t.zone}
                  </span>
                )}
                {typeof t.capacity === 'number' && (
                  <span className="flex items-center text-gray-500">
                    <UsersIcon size={12} className="mr-0.5" aria-hidden />
                    {t.capacity}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filtros + Búsqueda */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={18} className="text-gray-400" aria-hidden />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o identificación…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus-visible:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 text-sm md:text-base"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReservationFilter('all')}
            className={`${softBtn(reservationFilter === 'all' ? 'blue' : 'gray')} w-full`}
            aria-pressed={reservationFilter === 'all'}
          >
            <CalendarIcon size={16} className="mr-2" aria-hidden />
            Todas
          </button>
          <button
            type="button"
            onClick={() => setReservationFilter('today')}
            className={`${softBtn(reservationFilter === 'today' ? 'amber' : 'gray')} w-full`}
            aria-pressed={reservationFilter === 'today'}
          >
            <CalendarIcon size={16} className="mr-2" aria-hidden />
            Hoy
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReservationFilter('upcoming')}
            className={`${softBtn(reservationFilter === 'upcoming' ? 'purple' : 'gray')} w-full`}
            aria-pressed={reservationFilter === 'upcoming'}
          >
            <CalendarIcon size={16} className="mr-2" aria-hidden />
            Próximas
          </button>
          <button
            type="button"
            onClick={() => setReservationFilter('pending')}
            className={`${softBtn(reservationFilter === 'pending' ? 'pink' : 'gray')} w-full`}
            aria-pressed={reservationFilter === 'pending'}
          >
            <UserSearchIcon size={16} className="mr-2" aria-hidden />
            Pendientes
          </button>
        </div>
      </div>

      {/* CTA crear (desktop) */}
      <div className="flex justify-end">
        <button type="button" className={ctaGrad()} onClick={() => setShowReservationModal(true)}>
          <PlusIcon size={16} className="mr-2" aria-hidden />
          Nueva reservación
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <div
            role="status"
            className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-600"
          >
            <p className="font-medium">Sin resultados</p>
            <p className="text-sm text-gray-500">Crea una nueva reservación o ajusta los filtros.</p>
          </div>
        ) : (
          filteredReservations
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
            .map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 focus-within:ring-2 focus-within:ring-indigo-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UserIcon size={16} className="text-gray-500" aria-hidden />
                      <h3 className="font-semibold text-gray-900 truncate">{r.name}</h3>
                      {r.identification && (
                        <span className="text-xs text-gray-500 truncate">· {r.identification}</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <div className="inline-flex items-center">
                        <CalendarIcon size={14} className="mr-1" aria-hidden />
                        {r.date} {r.time}
                      </div>
                      <div className="inline-flex items-center">
                        <UsersIcon size={14} className="mr-1" aria-hidden />
                        {r.guests} {r.guests === 1 ? 'persona' : 'personas'}
                      </div>
                      {r.tableNumber ? (
                        <div className="inline-flex items-center">
                          <TableIcon size={14} className="mr-1" aria-hidden />
                          Mesa {r.tableNumber}
                        </div>
                      ) : (
                        <div className="inline-flex items-center text-amber-600">
                          <TableIcon size={14} className="mr-1" aria-hidden />
                          Sin mesa
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                      r.status === 'confirmed'
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                        : r.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                        : r.status === 'cancelled'
                        ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                        : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                    }`}
                  >
                    {r.status === 'confirmed'
                      ? 'Confirmada'
                      : r.status === 'pending'
                      ? 'Pendiente'
                      : r.status === 'cancelled'
                      ? 'Cancelada'
                      : 'Completada'}
                  </span>
                </div>

                {r.notes && <p className="mt-2 text-sm text-gray-600">{r.notes}</p>}

                <div className="mt-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                  {/* Se elimina botón Confirmar en UI (todas crean como confirmadas).
                      Si llegaran reservas antiguas en 'pending', no mostramos Confirmar para mantener la regla nueva. */}

                  {/* Cancelar: solo permitido en 'pending' o 'confirmed'. Nunca cuando 'completed' o 'cancelled'. */}
                  {(r.status === 'pending' || r.status === 'confirmed') && (
                    <button
                      type="button"
                      className={softBtn('red')}
                      onClick={() => cancelReservation(r)}
                      aria-label="Cancelar reservación"
                    >
                      <XIcon size={16} className="mr-2" aria-hidden />
                      Cancelar
                    </button>
                  )}

                  {/* Llegó: solo visible cuando está confirmada */}
                  {r.status === 'confirmed' && (
                    <button
                      type="button"
                      className={softBtn('indigo')}
                      onClick={() => registerArrival(r)}
                      aria-label="Registrar llegada"
                    >
                      <CheckIcon size={16} className="mr-2" aria-hidden />
                      Llegó
                    </button>
                  )}
                </div>
              </article>
            ))
        )}
      </div>

      {/* Espaciador para que la sticky no tape el contenido (igual que en Menú) */}
      <div className="h-24 md:hidden" aria-hidden />

      {/* ===== BARRA STICKY EN MOBILE — MISMA ALTURA/ESTILO QUE "NUEVO PRODUCTO" ===== */}
      <div
        className="fixed md:hidden left-0 right-0 z-[1] bg-white/90 backdrop-blur border-t border-gray-200 px-4 pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
        role="region"
        aria-label="Acciones de reservaciones"
      >
        <div className="py-2">
          <button
            className={`w-full inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pointer-events-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700`}
            onClick={() => setShowReservationModal(true)}
            aria-label="Crear nueva reservación"
          >
            <PlusIcon size={18} className="mr-2" />
            Nueva reservación
          </button>
        </div>
      </div>

      {/* Modal crear (Sheet simple para mobile) */}
      {showReservationModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6"
        >
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Nueva reservación</h2>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={() => setShowReservationModal(false)}
                aria-label="Cerrar"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Nombre</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Teléfono</span>
                  <input
                    type="tel"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Identificación (opcional)</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.identification}
                    onChange={(e) => setForm((f) => ({ ...f, identification: e.target.value }))}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Fecha</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Hora</span>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Personas</span>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.guests}
                    onChange={(e) => setForm((f) => ({ ...f, guests: Number(e.target.value) }))}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Mesa (opcional)</span>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.tableId}
                  onChange={(e) => setForm((f) => ({ ...f, tableId: e.target.value }))}
                >
                  <option value="">— Sin mesa —</option>
                  {activeTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {tableLabel(t)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Notas (opcional)</span>
                <textarea
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </label>
            </div>

            <div className="p-4 border-t flex gap-2 justify-end">
              <button
                type="button"
                className={softBtn('gray')}
                onClick={() => setShowReservationModal(false)}
              >
                <XIcon size={16} className="mr-2" aria-hidden />
                Cancelar
              </button>
              <button type="button" className={ctaGrad()} onClick={handleSaveReservation}>
                <CheckIcon size={16} className="mr-2" aria-hidden />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;
