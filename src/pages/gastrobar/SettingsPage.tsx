// src/pages/settings/SettingsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  UsersIcon, PrinterIcon, DollarSignIcon, SmartphoneIcon, TruckIcon, ArchiveIcon, CheckIcon,
  XIcon, SaveIcon, PlusIcon, UserIcon, KeyIcon, BellIcon, PercentIcon, ReceiptIcon, LayoutIcon,
  QrCodeIcon, CreditCardIcon, TableIcon, CogIcon, BarcodeIcon, MailIcon, ClockIcon, EditIcon,
  UserPlusIcon, ArrowRightIcon, LockIcon, UnlockIcon, EyeIcon
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

type ActiveTab =
  | 'general'
  | 'tables'
  | 'users'
  | 'printers'
  | 'billing'
  | 'payments'
  | 'notifications'
  | 'exports';

type TableRow = {
  id: number;
  name: string;
  seats: number;
  waiter?: string | null;
  status: 'available' | 'occupied' | 'reserved';
};

const LS_TABLES = 'woky.tables';

const SettingsPage = () => {
  const { showToast } = useToast();

  const softBtn = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 hover:bg-green-100',
      red: 'bg-red-50 text-red-600 hover:bg-red-100',
      gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
    };
    return `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${colorMap[color] || colorMap.gray}`;
  };
  const ctaGrad = () =>
    'bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center';

  // ---- Tabs (arranca en 'tables' y guarda/restaura última pestaña)
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = localStorage.getItem('woky.lastSettingsTab') as ActiveTab | null;
    return saved || 'tables';
  });
  useEffect(() => {
    localStorage.setItem('woky.lastSettingsTab', activeTab);
  }, [activeTab]);

  // Debug visual para asegurar que es este componente
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('%cSettingsPage activo (con pestaña Mesas)', 'color:#2563eb;font-weight:bold;');
  }, []);

  // Modales existentes
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showTableLayoutModal, setShowTableLayoutModal] = useState(false);

  // Edit toggles
  const [editMode, setEditMode] = useState({
    general: false,
    tables: true, // activo para poder crear mesas sin “Guardar”
    users: false,
    printers: false,
    billing: false,
    taxes: false,
    payments: false,
    dataphonos: false,
    notifications: false,
    exports: false,
  });

  const toggleEditMode = (section: keyof typeof editMode) => {
    setEditMode((prev) => ({ ...prev, [section]: !prev[section] }));
    if (editMode[section]) showToast('success', 'Cambios guardados correctamente');
  };

  // Users form
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'mesero',
    password: '',
    confirmPassword: '',
    active: true,
  });

  // Printer form
  const [printerForm, setPrinterForm] = useState({
    name: '',
    ip: '',
    port: '',
    model: 'epson',
    active: true,
  });

  // Billing form
  const [billingForm, setBillingForm] = useState({
    nit: '900.123.456-7',
    businessName: 'Woky Gastrobar',
    address: 'Calle 123 #45-67',
    phone: '601 234 5678',
    resolution: 'DIAN-12345',
    prefix: 'WK',
    validUntil: '2023-12-31',
  });

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'cash', name: 'Efectivo', active: true },
    { id: 'credit', name: 'Tarjeta de crédito', active: true },
    { id: 'debit', name: 'Tarjeta débito', active: true },
    { id: 'transfer', name: 'Transferencia', active: true },
    { id: 'qr', name: 'Pago con QR', active: false },
  ]);

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userForm.password !== userForm.confirmPassword) {
      showToast('error', 'Las contraseñas no coinciden');
      return;
    }
    showToast('success', `Usuario ${userForm.name} guardado correctamente`);
    setShowUserModal(false);
    setUserForm({
      name: '', email: '', role: 'mesero', password: '', confirmPassword: '', active: true,
    });
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
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
    const method = paymentMethods.find((m) => m.id === id);
    if (method) {
      showToast(
        'success',
        `Método de pago "${method.name}" ${method.active ? 'desactivado' : 'activado'}`
      );
    }
  };

  // ---------------------
  //   MESAS (Settings)
  // ---------------------
  const [tables, setTables] = useState<TableRow[]>([]);
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [tableForm, setTableForm] = useState({ name: '', seats: '', waiter: '' });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_TABLES);
      if (raw) setTables(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persistTables = (next: TableRow[]) => {
    setTables(next);
    localStorage.setItem(LS_TABLES, JSON.stringify(next));
  };

  const resetTableForm = () => {
    setTableForm({ name: '', seats: '', waiter: '' });
    setEditingTableId(null);
  };

  const saveTable = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (tableForm.name || '').trim();
    const seats = Number(tableForm.seats) || 0;
    const waiter = (tableForm.waiter || '').trim();

    if (!name) return showToast('error', 'El nombre de la mesa es obligatorio');
    if (seats <= 0) return showToast('error', 'La capacidad debe ser mayor a 0');

    if (editingTableId) {
      const updated = tables.map((t) =>
        t.id === editingTableId ? { ...t, name, seats, waiter: waiter || null } : t
      );
      persistTables(updated);
      showToast('success', 'Mesa actualizada');
    } else {
      const nextId = tables.length ? Math.max(...tables.map((t) => t.id)) + 1 : 100;
      const row: TableRow = {
        id: nextId,
        name,
        seats,
        waiter: waiter || null,
        status: 'available',
      };
      persistTables([row, ...tables]);
      showToast('success', 'Mesa creada');
    }

    setShowNewTableModal(false);
    resetTableForm();
  };

  const editTable = (row: TableRow) => {
    setEditingTableId(row.id);
    setTableForm({ name: row.name, seats: String(row.seats), waiter: row.waiter || '' });
    setShowNewTableModal(true);
  };

  const deleteTable = (id: number) => {
    persistTables(tables.filter((t) => t.id !== id));
    showToast('success', 'Mesa eliminada');
  };

  // ---------------------
  //  RENDER SECTIONS
  // ---------------------
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
                <button
                  className={editMode.general ? softBtn('green') : softBtn('blue')}
                  onClick={() => toggleEditMode('general')}
                >
                  {editMode.general ? (
                    <>
                      <SaveIcon size={16} className="mr-1" />
                      Guardar
                    </>
                  ) : (
                    <>
                      <EditIcon size={16} className="mr-1" />
                      Editar
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del negocio
                  </label>
                  <input
                    type="text"
                    className={`block w-full rounded-lg border ${
                      editMode.general ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                    } py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    defaultValue="Woky Gastrobar"
                    readOnly={!editMode.general}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de negocio
                  </label>
                  <select
                    className={`block w-full rounded-lg border ${
                      editMode.general ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                    } py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    defaultValue="restaurant"
                    disabled={!editMode.general}
                  >
                    <option value="restaurant">Restaurante</option>
                    <option value="bar">Bar</option>
                    <option value="cafe">Café</option>
                    <option value="gastrobar">Gastrobar</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableTips"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    defaultChecked
                    disabled={!editMode.general}
                  />
                  <label htmlFor="enableTips" className="ml-2 text-sm text-gray-700">
                    Habilitar propinas
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableNotifications"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    defaultChecked
                    disabled={!editMode.general}
                  />
                  <label htmlFor="enableNotifications" className="ml-2 text-sm text-gray-700">
                    Habilitar notificaciones
                  </label>
                </div>
              </div>
            </div>

            {/* Config mesas (acciones generales) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <TableIcon size={20} className="mr-2 text-blue-600" />
                  Configuración de mesas
                </h3>
                <div className="flex space-x-2">
                  <button
                    className={softBtn('blue')}
                    onClick={() => setShowTableLayoutModal(true)}
                  >
                    <LayoutIcon size={16} className="mr-1" />
                    Diseño de mesas
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoAssignWaiter"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label htmlFor="autoAssignWaiter" className="ml-2 text-sm text-gray-700">
                      Asignar mesero automáticamente
                    </label>
                  </div>
                  {/* Acceso directo a pestaña Mesas */}
                  <button
                    className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm"
                    onClick={() => setActiveTab('tables')}
                  >
                    Ir a gestión de mesas
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

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
                  >
                    <PlusIcon size={16} className="mr-1" />
                    Nueva mesa
                  </button>
                </div>
              </div>

              {tables.length === 0 ? (
                <>
                  <div className="text-sm text-gray-600 mb-3">
                    Aún no has creado mesas. Pulsa <span className="font-medium">Nueva mesa</span> para empezar.
                  </div>
                  <button
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
                    onClick={() => { resetTableForm(); setShowNewTableModal(true); }}
                  >
                    + Crear primera mesa
                  </button>
                </>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesero</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tables.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 text-sm font-medium text-gray-800">{row.name}</td>
                          <td className="px-3 py-3 text-sm text-gray-800">{row.seats}</td>
                          <td className="px-3 py-3 text-sm text-gray-800">{row.waiter || '—'}</td>
                          <td className="px-3 py-3 text-sm">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.status === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : row.status === 'occupied'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {row.status === 'available'
                                ? 'Disponible'
                                : row.status === 'occupied'
                                ? 'Ocupada'
                                : 'Reservada'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-right">
                            <button
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium mr-2"
                              onClick={() => editTable(row)}
                            >
                              Editar
                            </button>
                            <button
                              className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium"
                              onClick={() => deleteTable(row.id)}
                            >
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
                <button
                  className={editMode.users ? softBtn('green') : softBtn('blue')}
                  onClick={() => toggleEditMode('users')}
                >
                  {editMode.users ? (
                    <>
                      <SaveIcon size={16} className="mr-1" />
                      Guardar
                    </>
                  ) : (
                    <>
                      <EditIcon size={16} className="mr-1" />
                      Editar
                    </>
                  )}
                </button>
              </div>
            </div>
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
                  {/* Demo rows */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-800">Carlos Rodríguez</td>
                    <td className="px-3 py-3 text-sm text-gray-800">carlos@woky.com</td>
                    <td className="px-3 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Mesero</span>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-right">
                      <button className="text-blue-600 hover:text-blue-900 mr-2" disabled={!editMode.users}>Editar</button>
                      <button className="text-red-600 hover:text-red-900" disabled={!editMode.users}>Desactivar</button>
                    </td>
                  </tr>
                  {/* ... otros demo rows ... */}
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
                  <PlusIcon size={16} className="mr-1" />
                  Nueva impresora
                </button>
                <button
                  className={editMode.printers ? softBtn('green') : softBtn('blue')}
                  onClick={() => toggleEditMode('printers')}
                >
                  {editMode.printers ? (
                    <>
                      <SaveIcon size={16} className="mr-1" />
                      Guardar
                    </>
                  ) : (
                    <>
                      <EditIcon size={16} className="mr-1" />
                      Editar
                    </>
                  )}
                </button>
              </div>
            </div>

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
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        onClick={() => showToast('success', 'Impresora de prueba enviada')}
                      >
                        Probar
                      </button>
                      <button className="text-red-600 hover:text-red-900" disabled={!editMode.printers}>Eliminar</button>
                    </td>
                  </tr>
                  {/* ... otra demo row ... */}
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
                <button
                  className={editMode.billing ? softBtn('green') : softBtn('blue')}
                  onClick={() => (editMode.billing ? toggleEditMode('billing') : setShowBillingModal(true))}
                >
                  {editMode.billing ? (
                    <>
                      <SaveIcon size={16} className="mr-1" />
                      Guardar
                    </>
                  ) : (
                    <>
                      <EditIcon size={16} className="mr-1" />
                      Editar
                    </>
                  )}
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
                  {editMode.taxes ? (
                    <>
                      <SaveIcon size={16} className="mr-1" />
                      Guardar
                    </>
                  ) : (
                    <>
                      <EditIcon size={16} className="mr-1" />
                      Editar
                    </>
                  )}
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
                    <PlusIcon size={16} className="mr-1" />
                    Nuevo método
                  </button>
                  <button className={editMode.payments ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('payments')}>
                    {editMode.payments ? (
                      <>
                        <SaveIcon size={16} className="mr-1" />
                        Guardar
                      </>
                    ) : (
                      <>
                        <EditIcon size={16} className="mr-1" />
                        Editar
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      {method.id === 'cash' && <DollarSignIcon size={18} className="mr-2 text-green-600" />}
                      {method.id === 'credit' && <CreditCardIcon size={18} className="mr-2 text-blue-600" />}
                      {method.id === 'debit' && <CreditCardIcon size={18} className="mr-2 text-indigo-600" />}
                      {method.id === 'transfer' && <ArrowRightIcon size={18} className="mr-2 text-purple-600" />}
                      {method.id === 'qr' && <QrCodeIcon size={18} className="mr-2 text-amber-600" />}
                      <span className="font-medium">{method.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`mr-3 px-2 py-0.5 rounded-full text-xs font-medium ${method.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {method.active ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        className={`${method.active ? softBtn('red') : softBtn('green')} ${!editMode.payments ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => togglePaymentMethod(method.id)}
                        disabled={!editMode.payments}
                      >
                        {method.active ? (
                          <>
                            <XIcon size={14} className="mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <CheckIcon size={14} className="mr-1" />
                            Activar
                          </>
                        )}
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
                  Integración con datafonos
                </h3>
                <button className={editMode.dataphonos ? softBtn('green') : softBtn('blue')} onClick={() => toggleEditMode('dataphonos')}>
                  {editMode.dataphonos ? (
                    <>
                      <SaveIcon size={16} className="mr-1" />
                      Guardar
                    </>
                  ) : (
                    <>
                      <EditIcon size={16} className="mr-1" />
                      Editar
                    </>
                  )}
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
                {editMode.notifications ? (
                  <>
                    <SaveIcon size={16} className="mr-1" />
                    Guardar
                  </>
                ) : (
                  <>
                    <EditIcon size={16} className="mr-1" />
                    Editar
                  </>
                )}
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
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Notificaciones de reservas</h4>
                  <p className="text-sm text-gray-500">Enviar notificaciones cuando se crea una nueva reserva</p>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="reservationNotifications" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked disabled={!editMode.notifications} />
                  <label htmlFor="reservationNotifications" className="ml-2 text-sm text-gray-700">Activar</label>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Notificaciones de inventario</h4>
                  <p className="text-sm text-gray-500">Enviar alertas cuando el inventario está bajo</p>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="inventoryNotifications" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked disabled={!editMode.notifications} />
                  <label htmlFor="inventoryNotifications" className="ml-2 text-sm text-gray-700">Activar</label>
                </div>
              </div>
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
                {editMode.exports ? (
                  <>
                    <SaveIcon size={16} className="mr-1" />
                    Guardar
                  </>
                ) : (
                  <>
                    <EditIcon size={16} className="mr-1" />
                    Editar
                  </>
                )}
              </button>
            </div>
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

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">Exportar inventario</h4>
                <div className="flex flex-wrap gap-2">
                  <button className={softBtn('blue')} onClick={() => showToast('success', 'Exportación de inventario iniciada')} disabled={!editMode.exports}>Excel</button>
                  <button className={softBtn('blue')} onClick={() => showToast('success', 'Exportación de inventario iniciada')} disabled={!editMode.exports}>CSV</button>
                  <button className={softBtn('blue')} onClick={() => showToast('success', 'Exportación de inventario iniciada')} disabled={!editMode.exports}>PDF</button>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">Exportar para contabilidad</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button className={softBtn('blue')} onClick={() => showToast('success', 'Exportación para Siigo iniciada')} disabled={!editMode.exports}>Siigo</button>
                  <button className={softBtn('blue')} onClick={() => showToast('success', 'Exportación para Alegra iniciada')} disabled={!editMode.exports}>Alegra</button>
                  <button className={softBtn('blue')} onClick={() => showToast('success', 'Exportación para Contapyme iniciada')} disabled={!editMode.exports}>Contapyme</button>
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
        {/* Importante: flex-wrap para que no se oculte ninguna pestaña */}
        <div className="flex flex-wrap">
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('general')}>
            <CogIcon size={16} className="inline-block mr-1" />
            General
          </button>

          {/* NUEVA PESTAÑA MESAS */}
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'tables' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('tables')}>
            <TableIcon size={16} className="inline-block mr-1" />
            Mesas
          </button>

          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('users')}>
            <UsersIcon size={16} className="inline-block mr-1" />
            Usuarios
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'printers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('printers')}>
            <PrinterIcon size={16} className="inline-block mr-1" />
            Impresoras
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'billing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('billing')}>
            <ReceiptIcon size={16} className="inline-block mr-1" />
            Facturación
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('payments')}>
            <CreditCardIcon size={16} className="inline-block mr-1" />
            Pagos
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('notifications')}>
            <BellIcon size={16} className="inline-block mr-1" />
            Notificaciones
          </button>
          <button className={`py-3 px-4 text-center whitespace-nowrap font-medium ${activeTab === 'exports' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('exports')}>
            <ArchiveIcon size={16} className="inline-block mr-1" />
            Exportaciones
          </button>
        </div>
        <div className="p-4">{renderContent()}</div>
      </div>

      {/* MODALES */}

      {/* Nuevo usuario */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Nuevo usuario</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100" onClick={() => setShowUserModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleUserFormSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input id="userName" type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input id="userEmail" type="email" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select id="userRole" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} required>
                    <option value="mesero">Mesero</option>
                    <option value="cajero">Cajero</option>
                    <option value="cocinero">Cocinero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input id="userPassword" type="password" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="userConfirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                  <input id="userConfirmPassword" type="password" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={userForm.confirmPassword} onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })} required />
                </div>
                <div className="flex items-center">
                  <input id="userActive" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" checked={userForm.active} onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })} />
                  <label htmlFor="userActive" className="ml-2 text-sm text-gray-700">Usuario activo</label>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button type="button" className={softBtn('gray')} onClick={() => setShowUserModal(false)}>Cancelar</button>
                <button type="submit" className={ctaGrad()}>
                  <UserPlusIcon size={16} className="mr-1" />
                  Guardar usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nueva impresora */}
      {showPrinterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Nueva impresora</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100" onClick={() => setShowPrinterModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handlePrinterFormSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="printerName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la impresora</label>
                  <input id="printerName" type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={printerForm.name} onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="printerIp" className="block text-sm font-medium text-gray-700 mb-1">Dirección IP</label>
                  <input id="printerIp" type="text" placeholder="192.168.1.100" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={printerForm.ip} onChange={(e) => setPrinterForm({ ...printerForm, ip: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="printerPort" className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                  <input id="printerPort" type="text" placeholder="9100" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={printerForm.port} onChange={(e) => setPrinterForm({ ...printerForm, port: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="printerModel" className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <select id="printerModel" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={printerForm.model} onChange={(e) => setPrinterForm({ ...printerForm, model: e.target.value })} required>
                    <option value="epson">Epson TM-T20</option>
                    <option value="epson88">Epson TM-T88</option>
                    <option value="star">Star TSP100</option>
                    <option value="bixolon">Bixolon SRP-350</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input id="printerActive" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" checked={printerForm.active} onChange={(e) => setPrinterForm({ ...printerForm, active: e.target.checked })} />
                  <label htmlFor="printerActive" className="ml-2 text-sm text-gray-700">Impresora activa</label>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button type="button" className={softBtn('gray')} onClick={() => setShowPrinterModal(false)}>Cancelar</button>
                <button type="submit" className={ctaGrad()}>
                  <PrinterIcon size={16} className="mr-1" />
                  Guardar impresora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editar facturación */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Configuración de facturación</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100" onClick={() => setShowBillingModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleBillingFormSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="billingNit" className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                  <input id="billingNit" type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={billingForm.nit} onChange={(e) => setBillingForm({ ...billingForm, nit: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="billingName" className="block text-sm font-medium text-gray-700 mb-1">Razón social</label>
                  <input id="billingName" type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={billingForm.businessName} onChange={(e) => setBillingForm({ ...billingForm, businessName: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input id="billingAddress" type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={billingForm.address} onChange={(e) => setBillingForm({ ...billingForm, address: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="billingPhone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input id="billingPhone" type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={billingForm.phone} onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="billingResolution" className="block text-sm font-medium text-gray-700 mb-1">Resolución DIAN</label>
                  <input id="billingResolution" type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={billingForm.resolution} onChange={(e) => setBillingForm({ ...billingForm, resolution: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="billingPrefix" className="block text-sm font-medium text-gray-700 mb-1">Prefijo</label>
                  <input id="billingPrefix" type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={billingForm.prefix} onChange={(e) => setBillingForm({ ...billingForm, prefix: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="billingValidUntil" className="block text-sm font-medium text-gray-700 mb-1">Válido hasta</label>
                  <input id="billingValidUntil" type="date" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={billingForm.validUntil} onChange={(e) => setBillingForm({ ...billingForm, validUntil: e.target.value })} required />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button type="button" className={softBtn('gray')} onClick={() => setShowBillingModal(false)}>Cancelar</button>
                <button type="submit" className={ctaGrad()}>
                  <SaveIcon size={16} className="mr-1" />
                  Guardar configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nuevo método de pago */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Nuevo método de pago</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100" onClick={() => setShowPaymentMethodModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="paymentMethodName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del método de pago</label>
                <input id="paymentMethodName" type="text" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Transferencia bancaria" />
              </div>
              <div>
                <label htmlFor="paymentMethodType" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select id="paymentMethodType" className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mobile">Pago móvil</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className="flex items-center">
                <input id="paymentMethodActive" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                <label htmlFor="paymentMethodActive" className="ml-2 text-sm text-gray-700">Método activo</label>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button className={softBtn('gray')} onClick={() => setShowPaymentMethodModal(false)}>Cancelar</button>
              <button className={ctaGrad()} onClick={() => { showToast('success', 'Método de pago añadido correctamente'); setShowPaymentMethodModal(false); }}>
                <SaveIcon size={16} className="mr-1" />
                Guardar método
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diseño de mesas (demo) */}
      {showTableLayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Diseño de mesas</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100" onClick={() => setShowTableLayoutModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Formas de mesa disponibles</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50">
                  <div className="h-16 w-16 rounded-lg bg-gray-200 mx-auto mb-2"></div>
                  <span className="text-sm">Cuadrada</span>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50">
                  <div className="h-16 w-16 rounded-lg bg-gray-200 mx-auto mb-2 transform scale-x-150"></div>
                  <span className="text-sm">Rectangular</span>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50">
                  <div className="h-16 w-16 rounded-full bg-gray-200 mx-auto mb-2"></div>
                  <span className="text-sm">Circular</span>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="tableColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Color para las mesas
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 cursor-pointer"></div>
                  <div className="h-8 w-8 rounded-full bg-green-500 cursor-pointer"></div>
                  <div className="h-8 w-8 rounded-full bg-red-500 cursor-pointer"></div>
                  <div className="h-8 w-8 rounded-full bg-yellow-500 cursor-pointer"></div>
                  <div className="h-8 w-8 rounded-full bg-purple-500 cursor-pointer"></div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Áreas del restaurante</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                    <span>Terraza</span>
                    <div className="flex space-x-2">
                      <button className={softBtn('blue')}>Editar</button>
                      <button className={softBtn('red')}>Eliminar</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                    <span>Salón principal</span>
                    <div className="flex space-x-2">
                      <button className={softBtn('blue')}>Editar</button>
                      <button className={softBtn('red')}>Eliminar</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                    <span>Bar</span>
                    <div className="flex space-x-2">
                      <button className={softBtn('blue')}>Editar</button>
                      <button className={softBtn('red')}>Eliminar</button>
                    </div>
                  </div>
                </div>
                <button className={`mt-2 ${softBtn('gray')}`}>
                  <PlusIcon size={16} className="mr-1" />
                  Añadir área
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button className={softBtn('gray')} onClick={() => setShowTableLayoutModal(false)}>Cancelar</button>
              <button className={ctaGrad()} onClick={() => { showToast('success', 'Diseño de mesas guardado correctamente'); setShowTableLayoutModal(false); }}>
                <SaveIcon size={16} className="mr-1" />
                Guardar diseño
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NUEVA MESA - MODAL */}
      {showNewTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingTableId ? 'Editar mesa' : 'Nueva mesa'}</h3>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100" onClick={() => { setShowNewTableModal(false); resetTableForm(); }}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={saveTable}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la mesa</label>
                  <input
                    type="text"
                    placeholder="Ej. Mesa 1, Terraza A, Barra 2"
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={tableForm.name}
                    onChange={(e) => setTableForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (personas)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="4"
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={tableForm.seats}
                    onChange={(e) => setTableForm((p) => ({ ...p, seats: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesero (opcional)</label>
                  <input
                    type="text"
                    placeholder="Nombre del mesero"
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={tableForm.waiter}
                    onChange={(e) => setTableForm((p) => ({ ...p, waiter: e.target.value }))}
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button type="button" className={softBtn('gray')} onClick={() => { setShowNewTableModal(false); resetTableForm(); }}>
                  Cancelar
                </button>
                <button type="submit" className={ctaGrad()}>
                  <SaveIcon size={16} className="mr-1" />
                  {editingTableId ? 'Actualizar mesa' : 'Crear mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;
