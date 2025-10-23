import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserPlusIcon, SaveIcon, UserIcon, BuildingIcon, PhoneIcon, MailIcon, IdCardIcon, MapPinIcon,
  EyeIcon, CheckCircleIcon, XCircleIcon, SearchIcon, PlusIcon, PencilIcon,
  Trash2Icon, ToggleLeftIcon, ToggleRightIcon, LayoutGridIcon, TableIcon, TagIcon, UsersIcon
} from 'lucide-react';

// ================== Tipos ==================
type TableItem = {
  id: string;
  number: number;
  alias?: string;
  zone?: string;
  capacity?: number;
  active: boolean;
  status?: 'libre'|'ocupada'|'reservada'|'fuera_de_servicio';
  createdAt: string;
};

type ZoneItem = {
  id: string;
  name: string;
  createdAt: string;
};

type BusinessSettings = {
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxRate: number;                   // % (IVA o Impoconsumo)
  taxType: 'iva' | 'impoconsumo';    // selector
  currencySymbol: string;
  logoUrl?: string;
  defaultServicePct: number;         // % sugerido servicio voluntario
  pricesIncludeTax: boolean;         // opcional
  // Numeración
  invoiceSeries: string;
  invoiceSeparator: string;
  invoicePadding: number;
  nextInvoiceNumber: number;
};

type AppUser = {
  id: number;
  name: string;
  email: string;
  role: 'admin'|'waiter'|'cook'|'cashier';
  active: boolean;
  lastLogin: string | null;
};

// ================== LocalStorage Keys ==================
const LS_TABLES   = 'woky.tables';
const LS_ZONES    = 'woky.zones';
const LS_BUSINESS = 'woky.business';
const LS_WAITERS  = 'woky.waiters';   // <— Usuarios/Meseros persistidos

// ================== Defaults ==================
const defaultBusiness: BusinessSettings = {
  name: 'Mi Restaurante',
  nit: '901.234.567-8',
  address: 'Calle 123 #45-67, Ciudad',
  phone: '(601) 123-4567',
  email: 'contacto@mirestaurante.com',
  website: 'www.mirestaurante.com',
  taxRate: 8,
  taxType: 'impoconsumo',
  currencySymbol: '$',
  logoUrl: '',
  defaultServicePct: 10,
  pricesIncludeTax: true,
  invoiceSeries: 'FE',
  invoiceSeparator: '-',
  invoicePadding: 6,
  nextInvoiceNumber: 1
};

const seedUsers: AppUser[] = [
  { id: 1, name: 'Admin User',        email: 'admin@example.com', role: 'admin',  active: true,  lastLogin: '2023-04-15T10:30:00Z' },
  { id: 2, name: 'Carlos Rodríguez',  email: 'carlos@example.com', role: 'waiter', active: true,  lastLogin: '2023-04-14T15:45:00Z' },
  { id: 3, name: 'María López',       email: 'maria@example.com',  role: 'waiter', active: true,  lastLogin: '2023-04-14T09:20:00Z' },
  { id: 4, name: 'Juan Pérez',        email: 'juan@example.com',   role: 'cook',   active: true,  lastLogin: '2023-04-13T18:10:00Z' },
  { id: 5, name: 'Ana García',        email: 'ana@example.com',    role: 'cashier',active: false, lastLogin: '2023-04-10T12:05:00Z' }
];

// ================== Componente ==================
const ConfigurationPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState<'business'|'users'|'tables'>('business');
  const [loading, setLoading] = useState(false);

  // ======= Business =======
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(defaultBusiness);
  // Modo edición bloqueado por defecto
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [businessBackup, setBusinessBackup] = useState<BusinessSettings | null>(null);

  // Nuevo: detectar “dirty” para mostrar CTA Actualizar solo si hay cambios
  const isBusinessDirty = useMemo(() => {
    if (!isEditingBusiness || !businessBackup) return false;
    try {
      return JSON.stringify(businessSettings) !== JSON.stringify(businessBackup);
    } catch {
      return true;
    }
  }, [isEditingBusiness, businessSettings, businessBackup]);

  // ======= Users / Waiters (persistidos en LS_WAITERS) =======
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // 👇🏼 Sin contraseñas en creación
  const [newUser, setNewUser] = useState<{ name: string; email: string; role: AppUser['role'] }>({
    name: '',
    email: '',
    role: 'waiter'
  });

  // ======= Zones =======
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneItem | null>(null);
  const [zoneName, setZoneName] = useState('');

  // ======= Tables =======
  const [tables, setTables] = useState<TableItem[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all'|'active'|'inactive'>('all');
  const [filterZone, setFilterZone] = useState<string>('all');

  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [tableForm, setTableForm] = useState<{number: string; alias: string; zoneId: string; capacity: string; active: boolean}>({
    number: '',
    alias: '',
    zoneId: '',
    capacity: '',
    active: true
  });

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState<{start: string; end: string; zoneId: string; capacity: string; active: boolean}>({
    start: '',
    end: '',
    zoneId: '',
    capacity: '',
    active: true
  });

  // ===== Guard: admin only =====
  useEffect(() => {
    if (user?.role !== 'admin') {
      showToast('error', 'No tienes permisos para acceder a esta página');
      navigate('/dashboard');
    }
  }, [user, navigate, showToast]);

  // ===== Helpers: notify other views =====
  const dispatchStorage = (key: string, value: any) => {
    try {
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(value) }));
    } catch {}
  };

  const notifyTablesUpdated = () => {
    try { window.dispatchEvent(new Event('woky:tables-updated')); } catch {}
  };

  // ===== Load Business =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_BUSINESS);
      if (raw) setBusinessSettings(prev => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  // ===== Load Zones & Tables =====
  useEffect(() => {
    // Zonas
    const zonesRaw = localStorage.getItem(LS_ZONES);
    if (zonesRaw) {
      try { setZones(JSON.parse(zonesRaw)); } catch { setZones([]); }
    } else {
      const seedZones: ZoneItem[] = [
        { id: crypto.randomUUID(), name: 'Salón',   createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Terraza', createdAt: new Date().toISOString() }
      ];
      setZones(seedZones);
      localStorage.setItem(LS_ZONES, JSON.stringify(seedZones));
    }

    // Mesas
    const raw = localStorage.getItem(LS_TABLES);
    if (raw) {
      try {
        const parsed: TableItem[] = JSON.parse(raw);
        setTables(parsed);
      } catch {
        setTables([]);
      }
    } else {
      const currentZones = JSON.parse(localStorage.getItem(LS_ZONES) || '[]') as ZoneItem[];
      const salon   = currentZones.find(z => z.name === 'Salón')?.name   || 'Salón';
      const terraza = currentZones.find(z => z.name === 'Terraza')?.name || 'Terraza';
      const seed: TableItem[] = [
        { id: crypto.randomUUID(), number: 1,  alias: 'Ventana',   zone: salon,   capacity: 2, active: true, status: 'libre', createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), number: 2,  alias: 'Central',   zone: salon,   capacity: 4, active: true, status: 'libre', createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), number: 10, alias: 'Terraza A', zone: terraza, capacity: 4, active: true, status: 'libre', createdAt: new Date().toISOString() },
      ];
      setTables(seed);
      localStorage.setItem(LS_TABLES, JSON.stringify(seed));
    }
  }, []);

  // ===== Persist helpers =====
  const persistTables = (next: TableItem[]) => {
    setTables(next);
    localStorage.setItem(LS_TABLES, JSON.stringify(next));
    notifyTablesUpdated();
  };

  const persistZones = (next: ZoneItem[]) => {
    setZones(next);
    localStorage.setItem(LS_ZONES, JSON.stringify(next));
  };

  const persistUsers = (next: AppUser[]) => {
    setUsers(next);
    localStorage.setItem(LS_WAITERS, JSON.stringify(next));
    dispatchStorage(LS_WAITERS, next);
  };

  // ===== Load Users (from LS_WAITERS) =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_WAITERS);
      if (raw) {
        const parsed: AppUser[] = JSON.parse(raw);
        setUsers(parsed);
      } else {
        setUsers(seedUsers);
        localStorage.setItem(LS_WAITERS, JSON.stringify(seedUsers));
      }
    } catch {
      setUsers(seedUsers);
      localStorage.setItem(LS_WAITERS, JSON.stringify(seedUsers));
    }
  }, []);

  // ===== Business: editar / cancelar / guardar =====
  const startEditBusiness = () => {
    setBusinessBackup(businessSettings);
    setIsEditingBusiness(true);
  };

  const cancelEditBusiness = () => {
    if (businessBackup) setBusinessSettings(businessBackup);
    setIsEditingBusiness(false);
    showToast('info', 'Edición cancelada');
  };

  const handleBusinessSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingBusiness) return; // no-op si está bloqueado
    setLoading(true);
    setTimeout(() => {
      try { localStorage.setItem(LS_BUSINESS, JSON.stringify(businessSettings)); } catch {}
      setLoading(false);
      setIsEditingBusiness(false);
      setBusinessBackup(null);
      showToast('success', 'Información del negocio actualizada');
    }, 400);
  };

  // ===== Users Handlers =====
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    // 🔒 Sin contraseña en alta: sólo datos básicos
    setLoading(true);
    setTimeout(() => {
      const newUserId = (users.reduce((m,u)=>Math.max(m,u.id),0) || 0) + 1;
      const toSave: AppUser = {
        id: newUserId,
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        active: true,
        lastLogin: null
      };
      const next = [...users, toSave];
      persistUsers(next);
      setLoading(false);
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', role: 'waiter' });
      showToast('success', 'Usuario creado correctamente');
    }, 600);
  };

  const toggleUserStatus = (userId: number) => {
    const next = users.map(u => u.id === userId ? { ...u, active: !u.active } : u);
    persistUsers(next);
    const target = next.find(u => u.id === userId);
    showToast('success', `Usuario ${target?.name} ${target?.active ? 'activado' : 'desactivado'} correctamente`);
  };

  // ===== Users helpers =====
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string|null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':  return 'Administrador';
      case 'waiter': return 'Mesero';
      case 'cook':   return 'Cocinero';
      case 'cashier':return 'Cajero';
      default:       return role;
    }
  };

  // ===== Zone Handlers =====
  const openCreateZone = () => {
    setEditingZone(null);
    setZoneName('');
    setShowZoneModal(true);
  };

  const openEditZone = (z: ZoneItem) => {
    setEditingZone(z);
    setZoneName(z.name);
    setShowZoneModal(true);
  };

  const submitZoneForm = (e: React.FormEvent) => {
    e.preventDefault();
    const name = zoneName.trim();
    if (!name) return showToast('error', 'Ingresa el nombre de la zona');

    if (!editingZone) {
      if (zones.some(z => z.name.toLowerCase() === name.toLowerCase())) {
        showToast('error', 'Ya existe una zona con ese nombre');
        return;
      }
      const next: ZoneItem = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
      const updated = [...zones, next].sort((a,b)=>a.name.localeCompare(b.name));
      persistZones(updated);
      showToast('success', `Zona "${name}" creada`);
    } else {
      if (zones.some(z => z.name.toLowerCase() === name.toLowerCase() && z.id !== editingZone.id)) {
        showToast('error', 'Ya existe otra zona con ese nombre');
        return;
      }
      const oldName = editingZone.name;
      const updatedZones = zones.map(z => z.id === editingZone.id ? { ...z, name } : z).sort((a,b)=>a.name.localeCompare(b.name));
      persistZones(updatedZones);

      if (oldName !== name) {
        const updatedTables = tables.map(t => t.zone === oldName ? { ...t, zone: name } : t);
        persistTables(updatedTables);
      }
      showToast('success', `Zona actualizada a "${name}"`);
    }

    setShowZoneModal(false);
  };

  const removeZone = (id: string) => {
    const z = zones.find(x => x.id === id);
    if (!z) return;
    const inUse = tables.some(t => t.zone === z.name);
    if (inUse) {
      showToast('error', `No se puede eliminar la zona "${z.name}" porque hay mesas asignadas`);
      return;
    }
    if (!confirm(`¿Eliminar zona "${z.name}"?`)) return;
    const updated = zones.filter(x => x.id !== id);
    persistZones(updated);
    showToast('success', `Zona "${z.name}" eliminada`);
  };

  // ===== Table Handlers =====
  const resetTableForm = () => setTableForm({ number: '', alias: '', zoneId: '', capacity: '', active: true });

  const openCreateTable = () => {
    setEditingTable(null);
    resetTableForm();
    setShowTableModal(true);
  };

  const openEditTable = (t: TableItem) => {
    const zoneId = zones.find(z => z.name === t.zone)?.id || '';
    setEditingTable(t);
    setTableForm({
      number: String(t.number),
      alias: t.alias || '',
      zoneId,
      capacity: t.capacity ? String(t.capacity) : '',
      active: t.active
    });
    setShowTableModal(true);
  };

  const submitTableForm = (e: React.FormEvent) => {
    e.preventDefault();
    const number = parseInt(tableForm.number);
    if (isNaN(number) || number <= 0) {
      showToast('error', 'Ingresa un número de mesa válido');
      return;
    }
    const capacity = tableForm.capacity ? Math.max(1, parseInt(tableForm.capacity)) : undefined;
    const zone = tableForm.zoneId ? zones.find(z => z.id === tableForm.zoneId)?.name : undefined;

    if (!editingTable) {
      if (tables.some(t => t.number === number)) {
        showToast('error', `La mesa #${number} ya existe`);
        return;
      }
      const next: TableItem = {
        id: crypto.randomUUID(),
        number,
        alias: tableForm.alias?.trim() || undefined,
        zone,
        capacity,
        active: tableForm.active,
        status: 'libre',
        createdAt: new Date().toISOString()
      };
      const updated = [next, ...tables].sort((a,b)=>a.number-b.number);
      persistTables(updated);
      showToast('success', `Mesa #${number} creada`);
    } else {
      const updated = tables.map(t => t.id === editingTable.id
        ? { ...t,
            number,
            alias: tableForm.alias?.trim() || undefined,
            zone,
            capacity,
            active: tableForm.active
          }
        : t
      ).sort((a,b)=>a.number-b.number);
      const duplicates = updated.filter(t => t.number === number);
      if (duplicates.length > 1) {
        showToast('error', `Ya existe otra mesa con el número #${number}`);
        return;
      }
      persistTables(updated);
      showToast('success', `Mesa #${number} actualizada`);
    }
    setShowTableModal(false);
  };

  const toggleTableActive = (id: string) => {
    const updated = tables.map(t => t.id === id ? { ...t, active: !t.active } : t);
    persistTables(updated);
  };

  const removeTable = (id: string) => {
    const t = tables.find(x => x.id === id);
    if (!t) return;
    if (!confirm(`¿Eliminar mesa #${t.number}? Esta acción no se puede deshacer.`)) return;
    const updated = tables.filter(x => x.id !== id);
    persistTables(updated);
    showToast('success', `Mesa #${t.number} eliminada`);
  };

  // ===== Bulk create =====
  const submitBulk = (e: React.FormEvent) => {
    e.preventDefault();
    const start = parseInt(bulkForm.start);
    const end = parseInt(bulkForm.end);
    if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || end < start) {
      showToast('error', 'Rango inválido');
      return;
    }
    const capacity = bulkForm.capacity ? Math.max(1, parseInt(bulkForm.capacity)) : undefined;
    const zone = bulkForm.zoneId ? zones.find(z => z.id === bulkForm.zoneId)?.name : undefined;

    const existingNumbers = new Set(tables.map(t => t.number));
    const created: TableItem[] = [];
    for (let n = start; n <= end; n++) {
      if (existingNumbers.has(n)) continue;
      created.push({
        id: crypto.randomUUID(),
        number: n,
        alias: undefined,
        zone,
        capacity,
        active: bulkForm.active,
        status: 'libre',
        createdAt: new Date().toISOString()
      });
    }
    if (created.length === 0) {
      showToast('info', 'No se crearon mesas (todas existían)');
      return;
    }
    const updated = [...tables, ...created].sort((a,b)=>a.number-b.number);
    persistTables(updated);
    setShowBulkModal(false);
    setBulkForm({ start:'', end:'', zoneId:'', capacity:'', active:true });
    showToast('success', `Se crearon ${created.length} mesa(s)`);
  };

  // ===== Filters / view =====
  const filteredTables = useMemo(() => {
    return tables
      .filter(t => {
        const txt = `mesa ${t.number} ${t.alias||''} ${t.zone||''}`.toLowerCase();
        const passText = txt.includes(tableSearch.toLowerCase());
        const passActive = filterActive === 'all' ? true : (filterActive === 'active' ? t.active : !t.active);
        const passZone = filterZone === 'all' ? true : (t.zone === filterZone);
        return passText && passActive && passZone;
      })
      .sort((a,b)=>a.number-b.number);
  }, [tables, tableSearch, filterActive, filterZone]);

  const zoneOptions = useMemo(() => zones.sort((a,b)=>a.name.localeCompare(b.name)), [zones]);

  // ========================= Render =========================
  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Gestión Mesas</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar" role="tablist" aria-label="Configuración">
        <button
          role="tab"
          aria-selected={activeTab === 'business'}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === 'business' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('business')}
        >
          Información del Negocio
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'users'}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('users')}
        >
          Gestión de Usuarios
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'tables'}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === 'tables' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('tables')}
        >
          Mesas
        </button>
      </div>

      {/* ===== Business Tab ===== */}
      {activeTab === 'business' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium mb-1">Información del Negocio</h2>
                <p className="text-sm text-gray-500 mb-2">
                  Esta información se utilizará en los tickets, facturas y reportes.
                </p>
              </div>

              {/* Botón Editar/Bloquear (desktop) */}
              {!isEditingBusiness ? (
                <button
                  type="button"
                  onClick={startEditBusiness}
                  className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Editar información del negocio"
                >
                  <PencilIcon size={16} className="mr-1" />
                  Editar
                </button>
              ) : (
                <div className="hidden sm:flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEditBusiness}
                    className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="business-form"
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={loading || !isBusinessDirty}
                    aria-label="Actualizar información del negocio"
                  >
                    {loading ? <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" /> : <SaveIcon size={16} className="mr-2" />}
                    Actualizar
                  </button>
                </div>
              )}
            </div>

            {/* Botón Editar en mobile (fuera del form) */}
            {!isEditingBusiness && (
              <div className="sm:hidden mb-3">
                <button
                  type="button"
                  onClick={startEditBusiness}
                  className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Editar información del negocio en móvil"
                >
                  <PencilIcon size={16} className="mr-1" />
                  Editar
                </button>
              </div>
            )}

            <form id="business-form" onSubmit={handleBusinessSettingsSubmit} className="mt-2">
              <fieldset
                aria-readonly={!isEditingBusiness}
                aria-disabled={!isEditingBusiness}
                className={`${!isEditingBusiness ? 'opacity-90' : ''}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BuildingIcon size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={businessSettings.name}
                        onChange={e => setBusinessSettings({ ...businessSettings, name: e.target.value })}
                        className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                        required
                        disabled={!isEditingBusiness}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIT / Identificación Fiscal</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IdCardIcon size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={businessSettings.nit}
                        onChange={e => setBusinessSettings({ ...businessSettings, nit: e.target.value })}
                        className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                        required
                        disabled={!isEditingBusiness}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPinIcon size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={businessSettings.address}
                        onChange={e => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                        className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                        required
                        disabled={!isEditingBusiness}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhoneIcon size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={businessSettings.phone}
                        onChange={e => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                        className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                        required
                        disabled={!isEditingBusiness}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={businessSettings.email}
                        onChange={e => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                        className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                        required
                        disabled={!isEditingBusiness}
                      />
                    </div>
                  </div>

                  {/* Impuestos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de impuesto</label>
                    <select
                      value={businessSettings.taxType}
                      onChange={e => setBusinessSettings({ ...businessSettings, taxType: e.target.value as 'iva'|'impoconsumo' })}
                      className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                      disabled={!isEditingBusiness}
                    >
                      <option value="impoconsumo">Impoconsumo (RTE-IMP)</option>
                      <option value="iva">IVA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">% {businessSettings.taxType === 'impoconsumo' ? 'Impoconsumo' : 'IVA'}</label>
                    <input
                      type="number"
                      value={businessSettings.taxRate}
                      onChange={e => setBusinessSettings({ ...businessSettings, taxRate: Math.max(0, parseInt(e.target.value)||0) })}
                      min={0} max={100}
                      className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                      required
                      disabled={!isEditingBusiness}
                    />
                  </div>

                  {/* Numeración de facturas */}
                  <div className="md:col-span-2">
                    <h3 className="text-base font-medium text-gray-900 mb-2">Numeración de facturas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serie / prefijo</label>
                        <input
                          type="text"
                          value={businessSettings.invoiceSeries}
                          onChange={e => setBusinessSettings({ ...businessSettings, invoiceSeries: e.target.value })}
                          className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                          placeholder="FE, POS, A, etc."
                          disabled={!isEditingBusiness}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Separador</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={businessSettings.invoiceSeparator}
                          onChange={e => setBusinessSettings({ ...businessSettings, invoiceSeparator: e.target.value })}
                          className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                          placeholder="-"
                          disabled={!isEditingBusiness}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relleno (dígitos)</label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={businessSettings.invoicePadding}
                          onChange={e => setBusinessSettings({ ...businessSettings, invoicePadding: Math.max(1, Math.min(12, parseInt(e.target.value)||1)) })}
                          className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                          disabled={!isEditingBusiness}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Siguiente número</label>
                        <input
                          type="number"
                          min={1}
                          value={businessSettings.nextInvoiceNumber}
                          onChange={e => setBusinessSettings({ ...businessSettings, nextInvoiceNumber: Math.max(1, parseInt(e.target.value)||1) })}
                          className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-600"
                          disabled={!isEditingBusiness}
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Vista previa:&nbsp;
                      <span className="font-semibold">
                        {`${businessSettings.invoiceSeries || ''}${businessSettings.invoiceSeparator || ''}${String(businessSettings.nextInvoiceNumber || 1).padStart(businessSettings.invoicePadding || 1, '0')}`}
                      </span>
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Espacio inferior para que el contenido no quede tapado por la barra fija en mobile */}
              {isEditingBusiness && isBusinessDirty && (
                <div aria-hidden className="h-20 sm:h-0" />
              )}
            </form>

            {/* Barra sticky en mobile: aparece SOLO si hay cambios */}
            {isEditingBusiness && isBusinessDirty && (
              <div
                className="sm:hidden fixed inset-x-0 bottom-0 p-3 bg-white/95 backdrop-blur shadow-[0_-2px_10px_rgba(0,0,0,0.06)] border-t border-gray-200 z-50"
                role="region"
                aria-label="Acciones de actualización"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
              >
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEditBusiness}
                    className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="business-form"
                    className="flex-1 inline-flex items-center justify-center py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={loading}
                    aria-label="Actualizar información del negocio"
                  >
                    {loading ? (
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                    ) : (
                      <SaveIcon size={16} className="mr-2" />
                    )}
                    Actualizar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Users Tab ===== */}
      {activeTab === 'users' && (
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium">Gestión de Usuarios</h2>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <UserPlusIcon size={16} className="mr-1" />
                  Nuevo Usuario
                </button>
              </div>
              <div className="mb-4 relative">
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  aria-label="Buscar usuarios"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon size={16} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Tabla users */}
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Rol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center min-w-0">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon size={16} className="text-gray-500" />
                          </div>
                          <div className="ml-3 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{u.name}</div>
                            <div className="text-sm text-gray-500 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {getRoleName(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full mr-2 ${u.active ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={`text-sm ${u.active ? 'text-green-800' : 'text-red-800'}`}>
                            {u.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          {/* 👁️ Ver datos del usuario (no contraseña) */}
                          <button
                            onClick={() => { setSelectedUser(u); setShowViewUserModal(true); }}
                            className="text-indigo-600 hover:text-indigo-900" title="Ver datos del usuario"
                          >
                            <EyeIcon size={16} />
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              className={`${u.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                              title={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                            >
                              {u.active ? <XCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No se encontraron usuarios</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ===== Tables Tab ===== */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <TableIcon className="text-indigo-600" size={20} />
                <h2 className="text-lg font-semibold">Mesas</h2>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => openCreateZone()}
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-sm flex items-center justify-center"
                  title="Nueva zona"
                >
                  <TagIcon size={16} className="mr-1 shrink-0" />
                  <span className="truncate">Nueva zona</span>
                </button>

                <button
                  onClick={() => setShowBulkModal(true)}
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-800 flex items-center justify-center"
                  title="Creación masiva"
                >
                  <LayoutGridIcon size={16} className="mr-1 shrink-0" />
                  <span className="truncate">Creación masiva</span>
                </button>

                <button
                  onClick={openCreateTable}
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm flex items-center justify-center"
                  title="Nueva mesa"
                >
                  <PlusIcon size={16} className="mr-1 shrink-0" />
                  <span className="truncate">Nueva mesa</span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <input
                  type="text"
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  placeholder="Buscar por número, alias o zona..."
                  className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Buscar mesas"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon size={16} className="text-gray-400" />
                </div>
              </div>
              <div>
                <label className="sr-only">Filtro de activas</label>
                <select
                  className="w-full py-2 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterActive}
                  onChange={e => setFilterActive(e.target.value as any)}
                >
                  <option value="all">Todas (activas/inactivas)</option>
                  <option value="active">Sólo activas</option>
                  <option value="inactive">Sólo inactivas</option>
                </select>
              </div>
              <div>
                <label className="sr-only">Filtro por zona</label>
                <select
                  className="w-full py-2 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterZone}
                  onChange={e => setFilterZone(e.target.value)}
                >
                  <option value="all">Todas las zonas</option>
                  {zoneOptions.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* móvil: tarjetas */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTables.map(t => (
              <div key={t.id} className="bg-white rounded-lg shadow p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">Mesa {t.number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.status === 'libre' ? 'bg-green-100 text-green-800'
                        : t.status === 'ocupada' ? 'bg-amber-100 text-amber-800'
                        : t.status === 'reservada' ? 'bg-purple-100 text-purple-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                        {t.status ? t.status[0].toUpperCase()+t.status.slice(1) : '—'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600 space-x-2">
                      <span className="inline-flex items-center"><TagIcon size={12} className="mr-1" /> {t.zone || '—'}</span>
                      <span className="inline-flex items-center"><UsersIcon size={12} className="mr-1" /> {t.capacity || '—'}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{t.alias || '—'}</div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => toggleTableActive(t.id)}
                    className="flex-1 min-w-0 px-3 py-2 rounded-md border text-xs font-medium bg-white hover:bg-gray-50 flex items-center justify-center"
                  >
                    {t.active ? <ToggleRightIcon size={14} className="mr-1 shrink-0" /> : <ToggleLeftIcon size={14} className="mr-1 shrink-0" />}
                    <span className="truncate">{t.active ? 'Desactivar' : 'Activar'}</span>
                  </button>

                  <button
                    onClick={() => openEditTable(t)}
                    className="flex-1 min-w-0 px-3 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <PencilIcon size={14} className="mr-1 shrink-0" />
                    <span className="truncate">Editar</span>
                  </button>

                  <button
                    onClick={() => removeTable(t.id)}
                    className="flex-1 min-w-0 px-3 py-2 rounded-md bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 flex items-center justify-center"
                  >
                    <Trash2Icon size={14} className="mr-1 shrink-0" />
                    <span className="truncate">Eliminar</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredTables.length === 0 && (
              <div className="text-center py-6 text-gray-500 bg-white rounded-lg shadow">No hay mesas con los filtros actuales</div>
            )}
          </div>

          {/* escritorio: tabla */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="w-full">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">Alias</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Zona</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Capacidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Activa</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTables.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">Mesa {t.number}</td>
                      <td className="px-6 py-3 text-sm text-gray-700 truncate">{t.alias || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700 truncate">{t.zone || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{t.capacity || '—'}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.status === 'libre' ? 'bg-green-100 text-green-800'
                          : t.status === 'ocupada' ? 'bg-amber-100 text-amber-800'
                          : t.status === 'reservada' ? 'bg-purple-100 text-purple-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                          {t.status ? t.status[0].toUpperCase()+t.status.slice(1) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <button
                          onClick={() => toggleTableActive(t.id)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs ${
                            t.active
                              ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                              : 'border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100'
                          }`}
                          title={t.active ? 'Desactivar' : 'Activar'}
                        >
                          {t.active ? <ToggleRightIcon size={14} className="mr-1" /> : <ToggleLeftIcon size={14} className="mr-1" />}
                          {t.active ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-sm text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEditTable(t)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Editar"
                          >
                            <PencilIcon size={16} />
                          </button>
                          <button
                            onClick={() => removeTable(t.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar"
                          >
                            <Trash2Icon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTables.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No hay mesas con los filtros actuales
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ================= Modals ================= */}

      {/* Add User Modal (sin contraseña) */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Agregar Nuevo Usuario</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
                <XCircleIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as AppUser['role'] })}
                  className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="waiter">Mesero</option>
                  <option value="cook">Cocinero</option>
                  <option value="cashier">Cajero</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700" disabled={loading}>
                  {loading ? <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1" /> : null}
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal (solo datos, nunca contraseña) */}
      {showViewUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Datos del usuario</h3>
              <button onClick={() => setShowViewUserModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
                <XCircleIcon size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Correo</p>
                <p className="text-sm font-medium text-gray-900">{selectedUser.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Rol</p>
                  <p className="text-sm font-medium text-gray-900">{getRoleName(selectedUser.role)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <p className={`text-sm font-medium ${selectedUser.active ? 'text-green-700' : 'text-red-700'}`}>
                    {selectedUser.active ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Último ingreso</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(selectedUser.lastLogin)}</p>
              </div>

              {/* Nota: No mostramos ni editamos contraseña aquí */}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewUserModal(false)}
                className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md" role="dialog" aria-modal="true" aria-label={editingTable ? `Editar mesa #${editingTable.number}` : 'Nueva mesa'}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingTable ? `Editar mesa #${editingTable.number}` : 'Nueva mesa'}</h3>
              <button onClick={() => setShowTableModal(false)} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar">
                <XCircleIcon size={20} />
              </button>
            </div>
            <form onSubmit={submitTableForm} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="number"
                  value={tableForm.number}
                  onChange={e => setTableForm({ ...tableForm, number: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alias (opcional)</label>
                <input
                  type="text"
                  value={tableForm.alias}
                  onChange={e => setTableForm({ ...tableForm, alias: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ventana, Terraza A, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                <select
                  value={tableForm.zoneId}
                  onChange={e => setTableForm({ ...tableForm, zoneId: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Sin zona</option>
                  {zoneOptions.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                <input
                  type="number"
                  value={tableForm.capacity}
                  onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="4"
                  min={1}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="active"
                  type="checkbox"
                  checked={tableForm.active}
                  onChange={e => setTableForm({ ...tableForm, active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">Activa</label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowTableModal(false)} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                  {editingTable ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md" role="dialog" aria-modal="true" aria-label="Creación masiva de mesas">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Creación masiva</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar">
                <XCircleIcon size={20} />
              </button>
            </div>
            <form onSubmit={submitBulk} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde #</label>
                  <input
                    type="number"
                    value={bulkForm.start}
                    onChange={e => setBulkForm({ ...bulkForm, start: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta #</label>
                  <input
                    type="number"
                    value={bulkForm.end}
                    onChange={e => setBulkForm({ ...bulkForm, end: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required min={1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                <select
                  value={bulkForm.zoneId}
                  onChange={e => setBulkForm({ ...bulkForm, zoneId: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Sin zona</option>
                  {zoneOptions.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (opcional)</label>
                <input
                  type="number"
                  value={bulkForm.capacity}
                  onChange={e => setBulkForm({ ...bulkForm, capacity: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min={1}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="bulk-active"
                  type="checkbox"
                  checked={bulkForm.active}
                  onChange={e => setBulkForm({ ...bulkForm, active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="bulk-active" className="ml-2 text-sm text-gray-700">Marcar como activas</label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                  Crear
                </button>
              </div>
            </form>

            <div className="p-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Zonas existentes</h4>
              {zones.length === 0 ? (
                <p className="text-sm text-gray-500">No hay zonas creadas.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {zones.map(z => (
                    <button
                      key={z.id}
                      onClick={() => openEditZone(z)}
                      className="px-2.5 py-1 rounded-full border bg-gray-50 hover:bg-gray-100 text-sm"
                    >
                      {z.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ConfigurationPage;
