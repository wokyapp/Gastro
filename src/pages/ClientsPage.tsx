import React, { useEffect, useState, createElement } from 'react';
import { UsersIcon, UserPlusIcon, SearchIcon, EyeIcon, PencilIcon, TrashIcon, XIcon, CheckIcon, PhoneIcon, MailIcon, MapPinIcon, HashIcon, CalendarIcon, UploadIcon, FileTextIcon, DownloadIcon } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
// Client interface
interface Client {
  id: string;
  name: string;
  document: string;
  documentType: 'CC' | 'NIT' | 'CE' | 'PASAPORTE';
  email: string;
  phone: string;
  address: string;
  identifier?: string; // Added optional identifier field
  createdAt: string;
  updatedAt: string;
}
// Mock clients data
const mockClients: Client[] = [{
  id: 'CL001',
  name: 'Juan Pérez',
  document: '1098765432',
  documentType: 'CC',
  email: 'juan.perez@example.com',
  phone: '3101234567',
  address: 'Calle 123 #45-67, Bogotá',
  createdAt: '2023-01-15T10:30:00Z',
  updatedAt: '2023-01-15T10:30:00Z'
}, {
  id: 'CL002',
  name: 'Empresa ABC S.A.S',
  document: '900123456',
  documentType: 'NIT',
  email: 'contacto@empresaabc.com',
  phone: '6017654321',
  address: 'Av. Principal #78-90, Medellín',
  createdAt: '2023-02-20T14:45:00Z',
  updatedAt: '2023-03-10T09:15:00Z'
}, {
  id: 'CL003',
  name: 'María Rodríguez',
  document: '52345678',
  documentType: 'CC',
  email: 'maria.rodriguez@example.com',
  phone: '3209876543',
  address: 'Carrera 45 #12-34, Cali',
  createdAt: '2023-03-05T16:20:00Z',
  updatedAt: '2023-03-05T16:20:00Z'
}, {
  id: 'CL004',
  name: 'Carlos Gómez',
  document: 'A12345678',
  documentType: 'PASAPORTE',
  email: 'carlos.gomez@example.com',
  phone: '3153456789',
  address: 'Calle 67 #23-45, Barranquilla',
  createdAt: '2023-04-12T11:10:00Z',
  updatedAt: '2023-04-12T11:10:00Z'
}, {
  id: 'CL005',
  name: 'Ana Martínez',
  document: '1234567890',
  documentType: 'CE',
  email: 'ana.martinez@example.com',
  phone: '3007654321',
  address: 'Carrera 12 #34-56, Bucaramanga',
  createdAt: '2023-05-18T09:30:00Z',
  updatedAt: '2023-05-18T09:30:00Z'
}];
const ClientsPage: React.FC = () => {
  const {
    showToast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | 'view'>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    documentType: 'CC',
    email: '',
    phone: '',
    address: '',
    identifier: '' // Added identifier field
  });
  // Load clients data
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setClients(mockClients);
      setFilteredClients(mockClients);
      setLoading(false);
    };
    loadData();
  }, []);
  // Filter clients when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = clients.filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.document.includes(searchTerm) || client.email.toLowerCase().includes(searchTerm.toLowerCase()) || client.phone.includes(searchTerm));
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  // Open modal for create, edit, view or delete
  const openModal = (type: 'create' | 'edit' | 'delete' | 'view', client: Client | null = null) => {
    setModalType(type);
    setSelectedClient(client);
    if (type === 'create') {
      setFormData({
        name: '',
        document: '',
        documentType: 'CC',
        email: '',
        phone: '',
        address: '',
        identifier: ''
      });
    } else if (type === 'edit' && client) {
      setFormData({
        name: client.name,
        document: client.document,
        documentType: client.documentType,
        email: client.email,
        phone: client.phone,
        address: client.address,
        identifier: client.identifier || ''
      });
    }
    setShowModal(true);
  };
  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!formData.name || !formData.document) {
      showToast('error', 'Nombre y documento son obligatorios');
      return;
    }
    if (modalType === 'create') {
      // Create new client
      const newClient: Client = {
        id: `CL${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`,
        ...formData,
        documentType: formData.documentType as 'CC' | 'NIT' | 'CE' | 'PASAPORTE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setClients([...clients, newClient]);
      showToast('success', 'Cliente creado correctamente');
    } else if (modalType === 'edit' && selectedClient) {
      // Update existing client
      const updatedClients = clients.map(client => client.id === selectedClient.id ? {
        ...client,
        ...formData,
        documentType: formData.documentType as 'CC' | 'NIT' | 'CE' | 'PASAPORTE',
        updatedAt: new Date().toISOString()
      } : client);
      setClients(updatedClients);
      showToast('success', 'Cliente actualizado correctamente');
    }
    setShowModal(false);
  };
  // Handle client deletion
  const handleDelete = () => {
    if (!selectedClient) return;
    const updatedClients = clients.filter(client => client.id !== selectedClient.id);
    setClients(updatedClients);
    setShowModal(false);
    showToast('success', 'Cliente eliminado correctamente');
  };
  // Handle file upload for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    // Check file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'xlsx') {
      showToast('error', 'Solo se permiten archivos CSV o Excel');
      setImportFile(null);
      return;
    }
    // Generate preview (mock data for demonstration)
    const mockPreview = [{
      name: 'Pedro López',
      documentType: 'CC',
      document: '1234567890',
      email: 'pedro@example.com',
      phone: '3101234567',
      address: 'Calle 123 #45-67, Bogotá'
    }, {
      name: 'Distribuidora XYZ',
      documentType: 'NIT',
      document: '900123456',
      email: 'contacto@xyz.com',
      phone: '6017654321',
      address: 'Av. Principal #78-90, Medellín'
    }, {
      name: 'Laura Gómez',
      documentType: 'CC',
      document: '52345678',
      email: 'laura@example.com',
      phone: '3209876543',
      address: 'Carrera 45 #12-34, Cali'
    }];
    setImportPreview(mockPreview);
  };
  // Handle client import
  const handleImport = () => {
    if (!importFile || importPreview.length === 0) {
      showToast('error', 'No hay datos para importar');
      return;
    }
    setIsImporting(true);
    // Simulate import process
    setTimeout(() => {
      // Create new clients from preview data
      const newClients = importPreview.map((data, index) => ({
        id: `CL${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`,
        name: data.name,
        document: data.document,
        documentType: data.documentType as 'CC' | 'NIT' | 'CE' | 'PASAPORTE',
        email: data.email,
        phone: data.phone,
        address: data.address,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      setClients([...clients, ...newClients]);
      setIsImporting(false);
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
      showToast('success', `${newClients.length} clientes importados correctamente`);
    }, 2000);
  };
  return <div className="h-full space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-600 text-sm whitespace-nowrap">
            Gestiona la información de tus clientes
          </p>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => setShowImportModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded-lg flex items-center justify-center text-xs">
            <UploadIcon size={14} className="mr-1" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button onClick={() => openModal('create')} className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded-lg flex items-center justify-center text-xs">
            <UserPlusIcon size={14} className="mr-1" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={18} className="text-gray-400" />
          </div>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Buscar por nombre, documento, email o teléfono" />
        </div>
      </div>

      {/* Clients list */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? <div className="p-4 space-y-4">
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div> : <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha creación
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length > 0 ? filteredClients.map(client => <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.id}
                              {client.identifier && <span className="ml-2 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs">
                                  ID: {client.identifier}
                                </span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client.documentType} {client.document}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900 flex items-center">
                            <PhoneIcon size={14} className="text-gray-400 mr-1" />
                            {client.phone}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MailIcon size={14} className="text-gray-400 mr-1" />
                            {client.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(client.createdAt).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openModal('view', client)} className="text-blue-600 hover:text-blue-900 p-1" aria-label="Ver detalles">
                          <EyeIcon size={18} />
                        </button>
                        <button onClick={() => openModal('edit', client)} className="text-blue-600 hover:text-blue-900 p-1 ml-1" aria-label="Editar">
                          <PencilIcon size={18} />
                        </button>
                        <button onClick={() => openModal('delete', client)} className="text-red-600 hover:text-red-900 p-1 ml-1" aria-label="Eliminar">
                          <TrashIcon size={18} />
                        </button>
                      </td>
                    </tr>) : <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron clientes con ese término de búsqueda' : 'No hay clientes registrados'}
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>}
      </div>

      {/* Modal for CRUD operations */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalType === 'create' ? 'Nuevo cliente' : modalType === 'edit' ? 'Editar cliente' : modalType === 'delete' ? 'Eliminar cliente' : 'Detalles del cliente'} footer={modalType === 'delete' ? <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Eliminar
              </button>
            </div> : modalType === 'view' ? <div className="flex justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cerrar
              </button>
            </div> : <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {modalType === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>}>
        {modalType === 'delete' ? <div className="py-4">
            <p className="text-gray-700">
              ¿Estás seguro de que deseas eliminar al cliente{' '}
              <span className="font-medium">{selectedClient?.name}</span>?
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Esta acción no se puede deshacer.
            </p>
          </div> : modalType === 'view' ? <div className="space-y-4">
            {selectedClient && <>
                <div className="flex items-center">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-2xl font-medium">
                      {selectedClient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">
                      {selectedClient.name}
                    </h3>
                    <p className="text-gray-500">{selectedClient.id}</p>
                    {selectedClient.identifier && <p className="text-blue-500 text-sm">
                        Identificador: {selectedClient.identifier}
                      </p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 mb-2">
                      <HashIcon size={16} className="mr-2" />
                      <span className="text-sm">Información de documento</span>
                    </div>
                    <p className="font-medium">
                      {selectedClient.documentType} {selectedClient.document}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 mb-2">
                      <PhoneIcon size={16} className="mr-2" />
                      <span className="text-sm">Teléfono</span>
                    </div>
                    <p className="font-medium">{selectedClient.phone}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 mb-2">
                      <MailIcon size={16} className="mr-2" />
                      <span className="text-sm">Correo electrónico</span>
                    </div>
                    <p className="font-medium">{selectedClient.email}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 mb-2">
                      <MapPinIcon size={16} className="mr-2" />
                      <span className="text-sm">Dirección</span>
                    </div>
                    <p className="font-medium">{selectedClient.address}</p>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center text-gray-500 mb-2">
                    <CalendarIcon size={16} className="mr-2" />
                    <span className="text-sm">Fechas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Creado el</p>
                      <p className="font-medium">
                        {new Date(selectedClient.createdAt).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Última actualización
                      </p>
                      <p className="font-medium">
                        {new Date(selectedClient.updatedAt).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>
              </>}
          </div> : <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo o Razón social *
              </label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nombre del cliente o empresa" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de documento *
                </label>
                <select id="documentType" name="documentType" value={formData.documentType} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div>
                <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de documento *
                </label>
                <input type="text" id="document" name="document" value={formData.document} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Número de documento" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Teléfono de contacto" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Correo electrónico" />
              </div>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Dirección" />
            </div>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                Identificador (opcional)
              </label>
              <input type="text" id="identifier" name="identifier" value={formData.identifier} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Código interno, categoría, etc." />
            </div>
          </div>}
      </Modal>

      {/* Import clients modal */}
      <Modal isOpen={showImportModal} onClose={() => {
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
    }} title="Importar clientes masivamente" footer={<div className="flex justify-end space-x-2">
            <button type="button" onClick={() => {
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview([]);
      }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" disabled={isImporting}>
              Cancelar
            </button>
            <button type="button" onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={!importFile || importPreview.length === 0 || isImporting}>
              {isImporting ? <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  Importando...
                </span> : 'Importar clientes'}
            </button>
          </div>}>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Importa múltiples clientes desde un archivo CSV o Excel. El
              archivo debe tener las siguientes columnas:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm mb-4">
              <code>
                nombre,tipo_documento,documento,email,telefono,direccion
              </code>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 text-center" onClick={() => document.getElementById('clientImportFile')?.click()}>
              {importFile ? <div className="flex items-center justify-center">
                  <FileTextIcon size={24} className="text-blue-600 mr-2" />
                  <div className="text-left">
                    <p className="font-medium">{importFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(importFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button onClick={e => {
                e.stopPropagation();
                setImportFile(null);
                setImportPreview([]);
              }} className="ml-4 text-gray-400 hover:text-gray-500" disabled={isImporting}>
                    <XIcon size={20} />
                  </button>
                </div> : <div>
                  <UploadIcon size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-2">
                    Arrastra un archivo o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-gray-500">
                    Formatos soportados: CSV, Excel (.xlsx)
                  </p>
                </div>}
              <input id="clientImportFile" type="file" className="hidden" accept=".csv,.xlsx" onChange={handleFileChange} />
            </div>
          </div>
          {/* Preview */}
          {importPreview.length > 0 && <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Vista previa ({importPreview.length} clientes)
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teléfono
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importPreview.map((client, index) => <tr key={index}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {client.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {client.documentType} {client.document}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {client.email}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {client.phone}
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 flex items-center mb-2">
              <FileTextIcon size={16} className="mr-2" />
              Información importante
            </h3>
            <ul className="text-xs text-blue-700 space-y-1 ml-5 list-disc">
              <li>Cada cliente debe tener un nombre y documento</li>
              <li>El documento debe ser único para cada cliente</li>
              <li>
                Las columnas obligatorias son: Nombre, Tipo documento, Documento
              </li>
              <li>El correo y teléfono son opcionales pero recomendados</li>
              <li>La dirección es necesaria para facturación electrónica</li>
            </ul>
            <button onClick={() => {
            // Simular descarga de plantilla
            const dummyLink = document.createElement('a');
            dummyLink.href = 'data:text/csv;charset=utf-8,Nombre,Tipo Documento,Documento,Email,Teléfono,Dirección\n';
            dummyLink.setAttribute('download', 'plantilla_clientes.csv');
            dummyLink.click();
          }} className="mt-3 text-xs font-medium text-blue-700 flex items-center">
              <DownloadIcon size={14} className="mr-1" />
              Descargar plantilla
            </button>
          </div>
        </div>
      </Modal>
    </div>;
};
export default ClientsPage;