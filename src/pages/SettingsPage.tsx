import React, { useEffect, useMemo, useState } from 'react';
import {
  UsersIcon, PrinterIcon, DollarSignIcon, SmartphoneIcon, TruckIcon, ArchiveIcon, CheckIcon, XIcon,
  SaveIcon, PlusIcon, UserIcon, KeyIcon, BellIcon, PercentIcon, ReceiptIcon, LayoutIcon, QrCodeIcon,
  CreditCardIcon, TableIcon, CogIcon, BarcodeIcon, MailIcon, ClockIcon, EditIcon, UserPlusIcon,
  ArrowRightIcon, LockIcon, UnlockIcon, EyeIcon, TrashIcon
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

type NewTableForm = {
  name: string;
  seats: number | string;
  waiter?: string;
};

type TableRow = {
  id: number;
  name: string;
  seats: number;
  waiter?: string | null;
  status: 'available' | 'occupied' | 'reserved';
};

const LS_KEY = 'woky.tables';

const SettingsPage = () => {
  const { showToast } = useToast();

  // helpers UI
  const softBtn = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 hover:bg-green-100',
      red: 'bg-red-50 text-red-600 hover:bg-red-100',
      gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100'
    };
    return `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${colorMap[color] || colorMap.gray}`;
  };
  const ctaGrad = () =>
    'bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center';

  // pestaña activa
  const [activeTab, setActiveTab] = useState<'general'|'tables'|'users'|'printers'|'billing'|'payments'|'notifications'|'exports'>('general');

  // modales existentes
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showTableLayoutModal, setShowTableLayoutModal] = useState(false);

  // NUEVO: modal crear/editar mesa
  const [showNewTableModal, setShowNewTableModal] = useState(false);

  // estados edición
  const [editMode, setEditMode] = useState({
    general: false,
    tables: true,      // activamos edición en la pestaña de Mesas por defecto
    users: false,
    printers: false,
    billing: false,
    taxes: false,
    payments: false,
    dataphonos: false,
    notifications: false,
    exports: false
  });

  // form usuario (existente)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'mesero',
    password: '',
    confirmPassword: '',
    active: true
  });

  // form impresora (existente)
  const [printerForm, setPrinterForm] = useState({
    name: '',
    ip: '',
    port: '',
    model: 'epson',
    active: true
  });

  // form facturación (existente)
  const [billingForm, setBillingForm] = useState({
    nit: '900.123.456-7',
    businessName: 'Woky Gastrobar',
    address: 'Calle 123 #45-67',
    phone: '601 234 5678',
    resolution: 'DIAN-12345',
    prefix: 'WK',
    validUntil: '2023-12-31'
  });

  // métodos pago (existente)
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'cash', name: 'Efectivo', active: true },
    { id: 'credit', name: 'Tarjeta de crédito', active: true },
    { id: 'debit', name: 'Tarjeta débito', active: true },
    { id: 'transfer', name: 'Transferencia', active: true },
    { id: 'qr', name: 'Pago con QR', active: false }
  ]);

  // NUEVO: datos y formulario de mesas
  const [tables, setTables] = useState<TableRow[]>([]);
  const [tableForm, setTableForm] = useState<NewTableForm>({ name: '', seats: '', waiter: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  // waiters de ejemplo (para asignación opcional – cadena libre o sugerencias)
  const waiterSuggestions = useMemo(
    () => ['Carlos Rodríguez', 'María López', 'Juan Pérez', 'Ana García'],
    []
  );

  // cargar mesas guardadas
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TableRow[];
        setTables(parsed);
      } catch {
        // si se dañó el json, limpiamos
        localStorage.removeItem(LS_KEY);
        setTables([]);
      }
    }
  }, []);

  // persistencia
  const persistTables = (data: TableRow[]) => {
    setTables(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  };

  // util edición
  const resetTableForm = () => {
    setTableForm({ name: '', seats: '', waiter: '' });
    setEditingId(null);
  };

  // alternar modo edición secciones
  const toggleEditMode = (section: keyof typeof editMode) => {
    setEditMode(prev => ({ ...prev, [section]: !prev[section] }));
    if (editMode[section]) showToast('success', 'Cambios guardados correctamente');
  };

  // guardar/actualizar mesa
  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMode.tables) return;

    const name = (tableForm.name || '').trim();
    const seatsNum = Number(tableForm.seats) || 0;
    const waiter = (tableForm.waiter || '').trim() || undefined;

    if (!name) {
      showToast('error', 'El nombre de la mesa es obligatorio');
      return;
    }
    if (seatsNum <= 0) {
      showToast('error', 'La capacidad debe ser mayor a 0');
      return;
    }

    if (editingId) {
      // actualizar
      const updated = tables.map(t => t.id === editingId ? { ...t, name, seats: seatsNum, waiter } : t);
      persistTables(updated);
      showToast('success', 'Mesa actualizada');
    } else {
      // crear
      const nextId = tables.length ? Math.max(...tables.map(t => t.id)) + 1 : 100; // 100+ para no chocar con mock
      const row: TableRow = {
        id: nextId,
        name,
        seats: seatsNum,
        waiter: waiter || null,
        status: 'available'
      };
      persistTables([row, ...tables]);
      showToast('success', 'Mesa creada');
    }

    resetTableForm();
    setShowNewTableModal(false);
  };

  const handleEditTable = (row: TableRow) => {
    if (!editMode.tables) return;
    setEditingId(row.id);
    setTableForm({ name: row.name, seats: row.seats, waiter: row.waiter || '' });
    setShowNewTableModal(true);
  };

  const handleDeleteTable = (id: number) => {
    if (!editMode.tables) return;
    const filtered = tables.filter(t => t.id !== id);
    persistTables(filtered);
    showToast('success', 'Mesa eliminada');
  };

  // formularios existentes
  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userForm.password !== userForm.confirmPassword) {
      showToast('error', 'Las contraseñas no coinciden');
      return;
    }
    showToast('success', `Usuario ${userForm.name} guardado correctamente`);
    setShowUserModal(false);
    setUserForm({ name: '', email: '', role: 'mesero', password: '', confirmPassword: '', active: true });
  };

  const handlePrinterFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerForm.name || !printerForm.ip || !printerForm.port) {
      showToast('error', 'Todos los campos son obligatorios');
      return;
    }
    showToast('success', `Impresora ${printerForm.name} configurada correctamente`);
    setShowPrinterModal(false);
    setPrinterForm({ name: '', ip: '', port: '', model: 'epson', active: true });
  };

  const handleBillingFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Configuración de facturación guardada correctamente');
    setShowBillingModal(false);
    toggleEditMode('billing');
  };

  const togglePaymentMethod = (id: string) => {
    if (!editMode.payments) return;
    setPaymentMethods(prev =>
      prev.map(m => m.id === id ? { ...m, active: !m.active } : m)
    );
    const method = paymentMethods.find(m => m.id === id);
    if (method) {
      showToast('success', `Método de pago "${method.name}" ${method.active ? 'desactivado' : 'activado'}`);
    }
  };

  // CONTENIDOS DE PESTAÑAS
  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <CogIcon size={20} className="mr-2 text-blue-600" />
                  Configuración general
                </h3>
                <button className={editMode.general ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('general')}>
                  {editMode.general ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio</label>
                  <input type="text" className={`block w-full rounded-lg border ${editMode.general ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} defaultValue="Woky Gastrobar" readOnly={!editMode.general} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de negocio</label>
                  <select className={`block w-full rounded-lg border ${editMode.general ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} defaultValue="restaurant" disabled={!editMode.general}>
                    <option value="restaurant">Restaurante</option>
                    <option value="bar">Bar</option>
                    <option value="cafe">Café</option>
                    <option value="gastrobar">Gastrobar</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="enableTips" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked disabled={!editMode.general} />
                  <label htmlFor="enableTips" className="ml-2 text-sm text-gray-700">Habilitar propinas</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="enableNotifications" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked disabled={!editMode.general} />
                  <label htmlFor="enableNotifications" className="ml-2 text-sm text-gray-700">Habilitar notificaciones</label>
                </div>
              </div>
            </div>

            {/* Tarjeta antigua de mesas (solo switches); mantenida */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <TableIcon size={20} className="mr-2 text-blue-600" />
                  Configuración de mesas (básica)
                </h3>
                <div className="flex space-x-2">
                  <button className={softBtn('blue')} onClick={() => setShowTableLayoutModal(true)} disabled={!editMode.tables}>
                    <LayoutIcon size={16} className="mr-1" />
                    Diseño de mesas
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input type="checkbox" id="autoAssignWaiter" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked disabled />
                    <label htmlFor="autoAssignWaiter" className="ml-2 text-sm text-gray-700">Asignar mesero automáticamente</label>
                  </div>
                  <div className="opacity-60 text-sm">Para crear mesas entra a la pestaña “Mesas”.</div>
                </div>
              </div>
            </div>
          </div>
        );

      // NUEVO: pestaña MESAS
      case 'tables':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <TableIcon size={20} className="mr-2 text-blue-600" />
                  Mesas del local
                </h3>
                <div className="flex space-x-2">
                  <button
                    className={ctaGrad()}
                    onClick={() => { resetTableForm(); setShowNewTableModal(true); }}
                    disabled={!editMode.tables}
                  >
                    <PlusIcon size={16} className="mr-1" />
                    Nueva mesa
                  </button>
                  <button
                    className={editMode.tables ? softBtn('green') : softBtn('blue')}
                    onClick={() => toggleEditMode('tables')}
                  >
                    {editMode.tables ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
                  </button>
                </div>
              </div>

              {tables.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Aún no has creado mesas aquí. Pulsa <span className="font-medium">Nueva mesa</span> para empezar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidad</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesero</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tables.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 text-sm font-medium text-gray-800">{row.name}</td>
                          <td className="px-3 py-3 text-sm text-gray-800">{row.seats}</td>
                          <td className="px-3 py-3 text-sm text-gray-800">{row.waiter || '—'}</td>
                          <td className="px-3 py-3 text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.status === 'available' ? 'bg-green-100 text-green-800' :
                              row.status === 'occupied' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {row.status === 'available' ? 'Disponible' : row.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-right">
                            <button
                              className={`mr-2 ${softBtn('blue')} ${!editMode.tables ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => handleEditTable(row)}
                              disabled={!editMode.tables}
                            >
                              Editar
                            </button>
                            <button
                              className={`${softBtn('red')} ${!editMode.tables ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => handleDeleteTable(row.id)}
                              disabled={!editMode.tables}
                            >
                              <TrashIcon size={14} className="mr-1" />
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <UsersIcon size={20} className="mr-2 text-blue-600" />
                Gestión de usuarios
              </h3>
              <div className="flex space-x-2">
                <button className={ctaGrad()} onClick={() => setShowUserModal(true)} disabled={!editMode.users}>
                  <PlusIcon size={16} className="mr-1" />
                  Nuevo usuario
                </button>
                <button className={editMode.users ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('users')}>
                  {editMode.users ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
                </button>
              </div>
            </div>
            {/* lista demo – sin cambios */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-800">Carlos Rodríguez</td>
                    <td className="px-3 py-3 text-sm text-gray-800">carlos@woky.com</td>
                    <td className="px-3 py-3 text-sm"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Mesero</span></td>
                    <td className="px-3 py-3 text-sm"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span></td>
                    <td className="px-3 py-3 text-sm text-right">
                      <button className="text-blue-600 hover:text-blue-900 mr-2" disabled={!editMode.users}>Editar</button>
                      <button className="text-red-600 hover:text-red-900" disabled={!editMode.users}>Desactivar</button>
                    </td>
                  </tr>
                  {/* ... resto demo igual ... */}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'printers':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <PrinterIcon size={20} className="mr-2 text-blue-600" />
                Configuración de impresoras
              </h3>
              <div className="flex space-x-2">
                <button className={ctaGrad()} onClick={() => setShowPrinterModal(true)} disabled={!editMode.printers}>
                  <PlusIcon size={16} className="mr-1" />Nueva impresora
                </button>
                <button className={editMode.printers ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('printers')}>
                  {editMode.printers ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
                </button>
              </div>
            </div>
            {/* tabla demo impresoras – sin cambios */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección IP</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puerto</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-800">Impresora Caja</td>
                    <td className="px-3 py-3 text-sm text-gray-800">192.168.1.100</td>
                    <td className="px-3 py-3 text-sm text-gray-800">9100</td>
                    <td className="px-3 py-3 text-sm text-gray-800">Epson TM-T20</td>
                    <td className="px-3 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Conectada</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-right">
                      <button className="text-blue-600 hover:text-blue-900 mr-2" onClick={() => showToast('success', 'Impresora de prueba enviada')}>Probar</button>
                      <button className="text-red-600 hover:text-red-900" disabled={!editMode.printers}>Eliminar</button>
                    </td>
                  </tr>
                  {/* ... demo ... */}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <ReceiptIcon size={20} className="mr-2 text-blue-600" />
                  Configuración de facturación
                </h3>
                <button className={editMode.billing ? softBtn('green') : softBtn('blue')} onClick={() => editMode.billing ? toggleEditMode('billing') : setShowBillingModal(true)}>
                  {editMode.billing ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h4 className="text-sm font-medium text-gray-500 mb-1">NIT</h4><p>{billingForm.nit}</p></div>
                <div><h4 className="text-sm font-medium text-gray-500 mb-1">Razón social</h4><p>{billingForm.businessName}</p></div>
                <div><h4 className="text-sm font-medium text-gray-500 mb-1">Dirección</h4><p>{billingForm.address}</p></div>
                <div><h4 className="text-sm font-medium text-gray-500 mb-1">Teléfono</h4><p>{billingForm.phone}</p></div>
                <div><h4 className="text-sm font-medium text-gray-500 mb-1">Resolución DIAN</h4><p>{billingForm.resolution}</p></div>
                <div><h4 className="text-sm font-medium text-gray-500 mb-1">Prefijo</h4><p>{billingForm.prefix}</p></div>
                <div><h4 className="text-sm font-medium text-gray-500 mb-1">Válido hasta</h4><p>{billingForm.validUntil}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <PercentIcon size={20} className="mr-2 text-blue-600" />
                  Impuestos y propinas
                </h3>
                <button className={editMode.taxes ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('taxes')}>
                  {editMode.taxes ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
                  <input type="number" className={`block w-full rounded-lg border ${editMode.taxes ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} defaultValue="19" readOnly={!editMode.taxes} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impuesto al consumo (%)</label>
                  <input type="number" className={`block w-full rounded-lg border ${editMode.taxes ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} defaultValue="8" readOnly={!editMode.taxes} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Propina sugerida (%)</label>
                  <input type="number" className={`block w-full rounded-lg border ${editMode.taxes ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} defaultValue="10" readOnly={!editMode.taxes} />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="autoAddTip" className="h-4 w-4 text-blue-600 border-gray-300 rounded" disabled={!editMode.taxes} />
                  <label htmlFor="autoAddTip" className="ml-2 text-sm text-gray-700">Añadir propina automáticamente</label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <CreditCardIcon size={20} className="mr-2 text-blue-600" />
                  Métodos de pago
                </h3>
                <div className="flex space-x-2">
                  <button className={ctaGrad()} onClick={() => setShowPaymentMethodModal(true)} disabled={!editMode.payments}>
                    <PlusIcon size={16} className="mr-1" />Nuevo método
                  </button>
                  <button className={editMode.payments ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('payments')}>
                    {editMode.payments ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <div key={method.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      {method.id === 'cash' && <DollarSignIcon size={18} className="mr-2 text-green-600" />}
                      {(method.id === 'credit' || method.id === 'debit') && <CreditCardIcon size={18} className="mr-2 text-blue-600" />}
                      {method.id === 'transfer' && <ArrowRightIcon size={18} className="mr-2 text-purple-600" />}
                      {method.id === 'qr' && <QrCodeIcon size={18} className="mr-2 text-amber-600" />}
                      <span className="font-medium">{method.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`mr-3 px-2 py-0.5 rounded-full text-xs font-medium ${method.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {method.active ? 'Activo' : 'Inactivo'}
                      </span>
                      <button className={`${method.active ? softBtn('red') : softBtn('green')} ${!editMode.payments ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => togglePaymentMethod(method.id)} disabled={!editMode.payments}>
                        {method.active ? (<><XIcon size={14} className="mr-1" />Desactivar</>) : (<><CheckIcon size={14} className="mr-1" />Activar</>)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <BarcodeIcon size={20} className="mr-2 text-blue-600" />
                  Integración con datáfonos
                </h3>
                <button className={editMode.dataphonos ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('dataphonos')}>
                  {editMode.dataphonos ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor de datáfono</label>
                  <select className={`block w-full rounded-lg border ${editMode.dataphonos ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} defaultValue="" disabled={!editMode.dataphonos}>
                    <option value="">Seleccione un proveedor</option>
                    <option value="redeban">Redeban</option>
                    <option value="credibanco">Credibanco</option>
                    <option value="payu">PayU</option>
                    <option value="nequi">Nequi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terminal ID</label>
                  <input type="text" className={`block w-full rounded-lg border ${editMode.dataphonos ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} readOnly={!editMode.dataphonos} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input type="password" className={`block w-full rounded-lg border ${editMode.dataphonos ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} readOnly={!editMode.dataphonos} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <BellIcon size={20} className="mr-2 text-blue-600" />
                Configuración de notificaciones
              </h3>
              <button className={editMode.notifications ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('notifications')}>
                {editMode.notifications ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Notificaciones de órdenes</h4>
                  <p className="text-sm text-gray-500">Enviar notificaciones cuando se crea una nueva orden</p>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="orderNotifications" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked disabled={!editMode.notifications} />
                  <label htmlFor="orderNotifications" className="ml-2 text-sm text-gray-700">Activar</label>
                </div>
              </div>
              {/* ... resto sin cambios ... */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico para notificaciones</label>
                <input type="email" className={`block w-full rounded-lg border ${editMode.notifications ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} defaultValue="admin@woky.com" readOnly={!editMode.notifications} />
              </div>
            </div>
          </div>
        );

      case 'exports':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <ArchiveIcon size={20} className="mr-2 text-blue-600" />
                Exportación de datos
              </h3>
              <button className={editMode.exports ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('exports')}>
                {editMode.exports ? (<><SaveIcon size={16} className="mr-1" />Guardar</>) : (<><EditIcon size={16} className="mr-1" />Editar</>)}
              </button>
            </div>
            {/* bloques demo – sin cambios */}
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">Exportar ventas</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button className={softBtn('blue')} onClick={() => showToast('success', 'Exportación de ventas iniciada')} disabled={!editMode.exports}>Excel</button>
                  <button className={softBtn('blue')} onClick={() => showToast('success', 'Exportación de ventas iniciada')} disabled={!editMode.exports}>CSV</button>
                  <button className={softBtn('blue')} onClick={() => showToast('success', 'Exportación de ventas iniciada')} disabled={!editMode.exports}>PDF</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                    <input type="date" className={`block w-full rounded-lg border ${editMode.exports ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} readOnly={!editMode.exports} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                    <input type="date" className={`block w-full rounded-lg border ${editMode.exports ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} readOnly={!editMode.exports} />
                  </div>
                </div>
              </div>
              {/* ... resto sin cambios ... */}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 rounded-lg shadow-md">
        <div className="bg-white/90 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Ajustes - Woky</h1>
              <p className="text-sm text-gray-600">La llave maestra para tu negocio</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-600">Woky POS</div>
              <div className="text-xs text-gray-500">Soluciones inteligentes para restaurantes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto">
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('general')}>
            <CogIcon size={16} className="inline-block mr-1" />General
          </button>
          {/* NUEVO: pestaña Mesas */}
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'tables' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('tables')}>
            <TableIcon size={16} className="inline-block mr-1" />Mesas
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('users')}>
            <UsersIcon size={16} className="inline-block mr-1" />Usuarios
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'printers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('printers')}>
            <PrinterIcon size={16} className="inline-block mr-1" />Impresoras
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'billing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('billing')}>
            <ReceiptIcon size={16} className="inline-block mr-1" />Facturación
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('payments')}>
            <CreditCardIcon size={16} className="inline-block mr-1" />Pagos
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('notifications')}>
            <BellIcon size={16} className="inline-block mr-1" />Notificaciones
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'exports' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('exports')}>
            <ArchiveIcon size={16} className="inline-block mr-1" />Exportaciones
          </button>
        </div>
        <div className="p-4">{renderContent()}</div>
      </div>

      {/* Modal NUEVA/EDITAR mesa */}
      {showNewTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar mesa' : 'Nueva mesa'}</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100" onClick={() => { setShowNewTableModal(false); resetTableForm(); }}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveTable}>
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la mesa</label>
                  <input
                    id="tableName"
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej. Mesa 1, Terraza A, Barra 2"
                    value={tableForm.name}
                    onChange={e => setTableForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="tableSeats" className="block text-sm font-medium text-gray-700 mb-1">Capacidad (personas)</label>
                  <input
                    id="tableSeats"
                    type="number"
                    min={1}
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="4"
                    value={tableForm.seats}
                    onChange={e => setTableForm(prev => ({ ...prev, seats: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="tableWaiter" className="block text-sm font-medium text-gray-700 mb-1">Mesero (opcional)</label>
                  <input
                    id="tableWaiter"
                    type="text"
                    list="waiter-suggestions"
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Escribe un nombre o déjalo vacío"
                    value={tableForm.waiter}
                    onChange={e => setTableForm(prev => ({ ...prev, waiter: e.target.value }))}
                  />
                  <datalist id="waiter-suggestions">
                    {waiterSuggestions.map(w => <option key={w} value={w} />)}
                  </datalist>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button type="button" className={softBtn('gray')} onClick={() => { setShowNewTableModal(false); resetTableForm(); }}>
                  Cancelar
                </button>
                <button type="submit" className={ctaGrad()}>
                  <SaveIcon size={16} className="mr-1" />
                  {editingId ? 'Actualizar mesa' : 'Crear mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modales existentes (usuario/impresora/facturación/método pago/diseño mesas) – sin cambios en estructura */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* ... (tu modal de usuario original) ... */}
        </div>
      )}
      {showPrinterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* ... (tu modal de impresora original) ... */}
        </div>
      )}
      {showBillingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* ... (tu modal de facturación original) ... */}
        </div>
      )}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* ... (tu modal de método de pago original) ... */}
        </div>
      )}
      {showTableLayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* ... (tu modal de diseño de mesas original) ... */}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
