// src/pages/ReservationsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CalendarIcon, UserIcon, CheckIcon, XIcon, PlusIcon, SearchIcon, UserSearchIcon, TableIcon, MapPinIcon, UsersIcon
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

/** ===================== Claves de Storage ===================== **/
const LS_TABLES = 'woky.tables';
const LS_RESERVATIONS = 'woky.reservations';
const LS_RUNTIME = 'woky.tables.runtime';
const SS_RES_SESSION = 'woky.reservations.sessionId'; // <- sesión actual de reservas (solo mostrar las nuevas)

/** ===================== Tipos ===================== **/
type TableItem = {
  id: string;
  number: number;
  alias?: string;
  zone?: string;
  capacity?: number;
  active: boolean;
  status?: 'libre'|'ocupada'|'reservada'|'fuera_de_servicio';
  createdAt?: string;
};

type Reservation = {
  id: string;
  name: string;
  phone: string;
  identification?: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  guests: number;
  tableId: string;
  tableNumber: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;

  /** NUEVO: metadatos para filtrar solo “las que creo nuevas” */
  createdAt?: string;      // ISO
  sessionId?: string;      // id de sesión para mostrar solo las creadas en esta sesión
};

type Runtime = {
  tableId: string | number;
  orderId?: string;
  waiter?: string;
  customerName?: string;
  items?: { id: number | string; name: string; price: number; quantity: number }[];
  itemsCount?: number;
  total?: number;
  kitchenStatus?: 'new'|'preparing'|'ready'|'delivered';
  occupiedSince?: string;
  deliveredAt?: string;
};

/** ===================== Utils fecha ===================== **/
const todayStr = () => new Date().toISOString().split('T')[0];
const isToday = (yyyy_mm_dd: string) => yyyy_mm_dd === todayStr();

/** ===================== Helpers LS (inline, sin store externo) ===================== **/
const getTables = (): TableItem[] => {
  try { return JSON.parse(localStorage.getItem(LS_TABLES) || '[]'); } catch { return []; }
};
const setTables = (list: TableItem[]) => {
  const payload = JSON.stringify(list);
  localStorage.setItem(LS_TABLES, payload);
  try { window.dispatchEvent(new StorageEvent('storage', { key: LS_TABLES, newValue: payload })); } catch {}
  try { window.dispatchEvent(new CustomEvent('woky:tables-updated')); } catch {}
};

const getReservations = (): Reservation[] => {
  try { return JSON.parse(localStorage.getItem(LS_RESERVATIONS) || '[]'); } catch { return []; }
};
const saveReservations = (list: Reservation[]) => {
  const payload = JSON.stringify(list);
  localStorage.setItem(LS_RESERVATIONS, payload);
  try { window.dispatchEvent(new StorageEvent('storage', { key: LS_RESERVATIONS, newValue: payload })); } catch {}
  try { window.dispatchEvent(new CustomEvent('woky:reservations-updated')); } catch {}
};

const getRuntime = (): Record<string, Runtime> => {
  try { return JSON.parse(localStorage.getItem(LS_RUNTIME) || '{}'); } catch { return {}; }
};
const setRuntime = (rt: Record<string, Runtime>) => {
  const payload = JSON.stringify(rt);
  localStorage.setItem(LS_RUNTIME, payload);
  try { window.dispatchEvent(new StorageEvent('storage', { key: LS_RUNTIME, newValue: payload })); } catch {}
  try { window.dispatchEvent(new CustomEvent('woky:tables-updated')); } catch {}
};

/** ===================== Side-effects Mesas/Runtime desde Reservas ===================== **/
const setTableStatus = (tableId: string, status: TableItem['status']) => {
  const tables = getTables();
  const idx = tables.findIndex(t => String(t.id) === String(tableId));
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
    const idx = tables.findIndex(t => String(t.id) === String(res.tableId));
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
    kitchenStatus: prev.kitchenStatus || undefined
  };
  setRuntime(rt);
};

/** ===================== Página ===================== **/
const ReservationsPage = () => {
  const { showToast } = useToast();
  const { softBtn, ctaGrad } = useOutletContext<any>();

  /** ====== SESIÓN DE RESERVAS: mostrar solo las creadas en esta sesión ====== **/
  const [sessionId, setSessionId] = useState<string>('');
  useEffect(() => {
    // Persistimos el sessionId en sessionStorage para que sobreviva a reloads de esta pestaña,
    // pero no a cerrar la pestaña (nuevo id en nueva sesión).
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
    const loadTables = () => setTablesState(getTables().sort((a,b)=>a.number-b.number));
    loadTables();

    const onStorage = (e: StorageEvent) => { if (e.key === LS_TABLES) loadTables(); };
    const onCustom = () => loadTables();

    window.addEventListener('storage', onStorage);
    window.addEventListener('woky:tables-updated', onCustom as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('woky:tables-updated', onCustom as EventListener);
    };
  }, []);
  const activeTables = useMemo(() => tables.filter(t => t.active).sort((a,b)=>a.number-b.number), [tables]);

  /** Reservas (persistentes) **/
  const [reservations, setReservationsState] = useState<Reservation[]>([]);
  useEffect(() => {
    const load = () => setReservationsState(getReservations());
    load();

    const onStorage = (e: StorageEvent) => { if (e.key === LS_RESERVATIONS) load(); };
    const onCustom = () => load();
    const onFocus = () => load();
    const onVisibility = () => { if (!document.hidden) load(); };

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

  // Solo mostrar RESERVAS de esta sesión (las “nuevas que voy creando ahora”)
  const onlySessionReservations = useMemo(
    () => reservations.filter(r => r.sessionId === sessionId),
    [reservations, sessionId]
  );

  const filteredReservations = onlySessionReservations.filter(r => {
    const today = todayStr();
    const matchFilter =
      reservationFilter === 'all' ||
      (reservationFilter === 'today' && r.date === today) ||
      (reservationFilter === 'upcoming' && r.date > today) ||
      (reservationFilter === 'pending' && r.status === 'pending');
    const matchSearch =
      !searchTerm ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.identification || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

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
    notes: ''
  });
  const resetForm = () => setForm({
    name: '',
    phone: '',
    identification: '',
    date: todayStr(),
    time: '19:00',
    guests: 2,
    tableId: '',
    notes: ''
  });

  /** Guardar nueva reserva (persistente + señales) **/
  const handleSaveReservation = () => {
    if (!form.name.trim()) return showToast('error', 'Ingresa el nombre del cliente');
    if (!form.phone.trim()) return showToast('error', 'Ingresa el teléfono de contacto');
    if (!form.date) return showToast('error', 'Selecciona la fecha');
    if (!form.time) return showToast('error', 'Selecciona la hora');
    if (form.guests <= 0) return showToast('error', 'La cantidad de personas debe ser mayor a 0');

    const sel = form.tableId ? tables.find(t => String(t.id) === String(form.tableId)) : undefined;

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
      status: sel ? 'confirmed' : 'pending',
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(), // <- marca nueva
      sessionId,                           // <- pertenece a la sesión actual
    };

    // Guardar
    const next = [...reservations, newRes];
    setReservationsState(next);
    saveReservations(next);

    // Efecto en Mesas
    reserveTableIfToday(newRes);

    showToast('success', 'Reservación creada');
    setShowReservationModal(false);
    resetForm();
  };

  /** Acciones por tarjeta **/
  const confirmReservation = (res: Reservation) => {
    const next = reservations.map(r => r.id === res.id ? ({ ...r, status: 'confirmed' as const }) : r);
    setReservationsState(next);
    saveReservations(next);
    reserveTableIfToday({ ...res, status: 'confirmed' });
    showToast('success', 'Reservación confirmada');
  };

  const cancelReservation = (res: Reservation) => {
    const next = reservations.map(r => r.id === res.id ? ({ ...r, status: 'cancelled' }) : r);
    setReservationsState(next);
    saveReservations(next);
    freeIfReservedToday(res);
    showToast('info', 'Reservación cancelada');
  };

  const registerArrival = (res: Reservation) => {
    const next = reservations.map(r => r.id === res.id ? ({ ...r, status: 'completed' }) : r);
    setReservationsState(next);
    saveReservations(next);

    if (res.tableId) {
      occupyTableForArrival(res.tableId, res.name);
      showToast('success', `Cliente registrado en mesa ${res.tableNumber}`);
    } else {
      showToast('warning', 'La reserva no tiene mesa asignada');
    }
  };

  /** Helpers UI **/
  const tableLabel = (t: TableItem) =>
    `Mesa ${t.number}${t.capacity ? ` (${t.capacity} pers.)` : ''}${t.zone ? ` · ${t.zone}` : ''}${t.alias ? ` · ${t.alias}` : ''}`;

  /** Render **/
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
          <TableIcon size={18} className="mr-2 text-blue-600" />
          <span className="font-medium">Mesas (desde Configuración)</span>
          <span className="ml-2 text-xs text-gray-500">
            Activas: {useMemo(() => tables.filter(t => t.active).length, [tables])}
          </span>
        </div>
        {activeTables.length === 0 ? (
          <p className="text-sm text-gray-500">No hay mesas creadas/activas aún.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeTables.map(t => (
              <span key={t.id} className="inline-flex items-center text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-700" title={tableLabel(t)}>
                <span className="mr-1 font-medium">#{t.number}</span>
                {t.zone && <span className="flex items-center mr-1 text-gray-500"><MapPinIcon size={12} className="mr-0.5"/>{t.zone}</span>}
                {typeof t.capacity === 'number' && (
                  <span className="flex items-center text-gray-500">
                    <UsersIcon size={12} className="mr-0.5"/>{t.capacity}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative w-full mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o identificación..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
            <XIcon size={16} />
          </button>
        )}
      </div>

      {/* Filtros + CTA */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex flex-nowrap overflow-x-auto space-x-2">
          <button className={softBtn(reservationFilter === 'all' ? 'blue' : 'gray')} onClick={() => setReservationFilter('all')}>Todas</button>
          <button className={softBtn(reservationFilter === 'today' ? 'green' : 'gray')} onClick={() => setReservationFilter('today')}>Hoy</button>
          <button className={softBtn(reservationFilter === 'upcoming' ? 'amber' : 'gray')} onClick={() => setReservationFilter('upcoming')}>Próximas</button>
          <button className={softBtn(reservationFilter === 'pending' ? 'red' : 'gray')} onClick={() => setReservationFilter('pending')}>Pendientes</button>
        </div>
        <button className={`${ctaGrad()} inline-flex items-center whitespace-nowrap`} onClick={() => { setShowReservationModal(true); }}>
          <PlusIcon size={16} className="mr-1" />
          Nueva reservación
        </button>
      </div>

      {/* Lista (SOLO de esta sesión) */}
      <div className="space-y-4">
        {filteredReservations.map(res => (
          <div key={res.id} className="border border-gray-100 rounded-2xl p-4 hover:border-blue-300 transition-colors bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-start">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-full mr-3 text-white shadow">
                  <UserIcon size={18} />
                </div>
                <div>
                  <h3 className="font-medium">{res.name}</h3>
                  <p className="text-sm text-gray-600">{res.phone}</p>
                  {res.identification && <p className="text-sm text-gray-600">ID: {res.identification}</p>}
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <CalendarIcon size={14} className="mr-1" />
                    {new Date(res.date).toLocaleDateString('es-CO')} - {res.time}
                  </div>
                  <div className="flex items-center mt-1 text-sm">
                    <UserIcon size={14} className="mr-1 text-gray-500" />
                    <span className="text-gray-500">{res.guests} personas</span>
                    {res.tableNumber > 0 && (
                      <>
                        <span className="mx-1 text-gray-500">•</span>
                        <span className="text-gray-500">Mesa {res.tableNumber}</span>
                      </>
                    )}
                  </div>
                  {res.notes && <p className="text-xs text-gray-500 mt-1 italic">{res.notes}</p>}
                </div>
              </div>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${res.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                ${res.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                ${res.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                ${res.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
              `}>
                {res.status === 'confirmed' ? 'Confirmada' : ''}
                {res.status === 'pending' ? 'Pendiente' : ''}
                {res.status === 'cancelled' ? 'Cancelada' : ''}
                {res.status === 'completed' ? 'Completada' : ''}
              </span>
            </div>

            {/* Acciones */}
            <div className="mt-3 flex flex-nowrap justify-end gap-2 overflow-x-auto">
              {res.status === 'pending' && (
                <button className={`${softBtn('green')} inline-flex items-center whitespace-nowrap`} onClick={() => confirmReservation(res)}>
                  <CheckIcon size={16} className="mr-1" /> Confirmar
                </button>
              )}
              {(res.status === 'confirmed' || res.status === 'pending') && (
                <button className={`${softBtn('red')} inline-flex items-center whitespace-nowrap`} onClick={() => cancelReservation(res)}>
                  <XIcon size={16} className="mr-1" /> Cancelar
                </button>
              )}
              {res.status === 'confirmed' && isToday(res.date) && (
                <button className={`${softBtn('blue')} inline-flex items-center whitespace-nowrap`} onClick={() => registerArrival(res)}>
                  <UserIcon size={16} className="mr-1" /> Registrar llegada
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredReservations.length === 0 && (
          <div className="text-center py-8 bg-white rounded-2xl shadow-sm border border-gray-100">
            {searchTerm ? (
              <>
                <UserSearchIcon size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No se encontraron reservaciones que coincidan con “{searchTerm}”.</p>
              </>
            ) : (
              <>
                <CalendarIcon size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Aquí verás solo las reservaciones nuevas creadas en esta sesión.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal Nueva reservación */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Nueva reservación</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" onClick={() => { setShowReservationModal(false); }}>
                <XIcon size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del cliente</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e=>setForm({...form, name: e.target.value})}
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e=>setForm({...form, phone: e.target.value})}
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Número de contacto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Identificación</label>
                    <input
                      type="text"
                      value={form.identification}
                      onChange={e=>setForm({...form, identification: e.target.value})}
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cédula o ID"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e=>setForm({...form, date: e.target.value})}
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={e=>setForm({...form, time: e.target.value})}
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personas</label>
                    <input
                      type="number"
                      min={1}
                      value={form.guests}
                      onChange={e=>setForm({...form, guests: Math.max(1, Number(e.target.value||1))})}
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cantidad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mesa</label>
                    <select
                      value={form.tableId}
                      onChange={e=>setForm({...form, tableId: e.target.value})}
                      className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Asignar después</option>
                      {activeTables.map(t => (
                        <option key={t.id} value={t.id}>
                          {tableLabel(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                  <textarea
                    value={form.notes}
                    onChange={e=>setForm({...form, notes: e.target.value})}
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Preferencias o solicitudes especiales"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button className={`${softBtn('gray')} inline-flex items-center whitespace-nowrap`} onClick={() => setShowReservationModal(false)}>
                Cancelar
              </button>
              <button className={`${ctaGrad()} inline-flex items-center whitespace-nowrap`} onClick={handleSaveReservation}>
                <CheckIcon size={16} className="mr-1" />
                Guardar reservación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;
