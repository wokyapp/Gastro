import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileTextIcon,
  SearchIcon,
  DownloadIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SendIcon,
  RefreshCwIcon,
  FilterIcon,
  CalendarIcon,
  ExternalLinkIcon,
  MailIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { mockElectronicInvoices } from '../utils/mockData'
import Skeleton from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import { useToast } from '../contexts/ToastContext'
// Tipos
interface ElectronicInvoice {
  id: string
  saleId: string
  date: string
  clientId: string
  clientName: string
  clientDocument: string
  clientDocumentType: string
  clientEmail: string
  clientAddress: string // Added address
  vatResponsible: boolean // Added VAT responsibility
  companyId: string | null // Added CompanyID with DV
  wantsToReceiveEmail: boolean // Added email preference
  total: number
  taxes: number
  subtotal: number
  status: 'processing' | 'sent' | 'accepted' | 'rejected'
  cufe: string | null
  qrUrl: string | null
  pdfUrl: string | null
  xmlUrl: string | null
  ptaId: string
  dianResponse: {
    statusCode: number
    message: string
    date: string
  } | null
  ptaData: {
    businessLine: string
    operationType: string
    paymentMethod: string
    paymentDueDate: string
    municipality: string
    contractType: string
    orderReference: string
    additionalNotes: string
    technicalKey: string
    softwareID: string
    testSetId: string
    accountingCustomerParty?: {
      documentType: string
      documentNumber: string
      name: string
      address: string
      vatResponsible: boolean
      companyId: string | null
      email: string | null
    }
    processingSteps?: Array<{
      step: string
      status: 'success' | 'error' | 'pending'
      timestamp: string
      details?: string
    }>
  }
}
const ElectronicInvoicesPage: React.FC = () => {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<ElectronicInvoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<ElectronicInvoice[]>(
    [],
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] =
    useState<ElectronicInvoice | null>(null)
  const [modalType, setModalType] = useState<'view' | 'resend' | 'log'>('view')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [amountReceived, setAmountReceived] = useState('')
  const [change, setChange] = useState(0)
  const [activeTab, setActiveTab] = useState('invoices') // New state for tabs
  // Cargar facturas
  useEffect(() => {
    const loadInvoices = async () => {
      // Simular carga de datos
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setInvoices(mockElectronicInvoices)
      setLoading(false)
    }
    loadInvoices()
  }, [])
  // Filtrar facturas
  useEffect(() => {
    let filtered = [...invoices]
    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.clientDocument
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.saleId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter)
    }
    // Filtrar por fecha
    if (dateFilter !== 'all') {
      const today = new Date()
      const startOfToday = new Date(today.setHours(0, 0, 0, 0))
      if (dateFilter === 'today') {
        filtered = filtered.filter(
          (invoice) => new Date(invoice.date) >= startOfToday,
        )
      } else if (dateFilter === 'week') {
        const startOfWeek = new Date(today)
        startOfWeek.setDate(startOfWeek.getDate() - 7)
        filtered = filtered.filter(
          (invoice) => new Date(invoice.date) >= startOfWeek,
        )
      } else if (dateFilter === 'month') {
        const startOfMonth = new Date(today)
        startOfMonth.setDate(startOfMonth.getDate() - 30)
        filtered = filtered.filter(
          (invoice) => new Date(invoice.date) >= startOfMonth,
        )
      }
    }
    setFilteredInvoices(filtered)
  }, [invoices, searchTerm, statusFilter, dateFilter])
  // Abrir modal
  const openModal = (
    type: 'view' | 'resend' | 'log',
    invoice: ElectronicInvoice,
  ) => {
    setModalType(type)
    setSelectedInvoice(invoice)
    setShowModal(true)
  }
  // Reenviar factura
  const resendInvoice = async () => {
    if (!selectedInvoice) return
    setIsProcessing(true)
    // Simular envío a la DIAN a través del PTA
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // Actualizar estado de la factura
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === selectedInvoice.id) {
        return {
          ...inv,
          status: 'sent' as const,
          dianResponse: {
            statusCode: 202,
            message: 'Documento reenviado, pendiente de validación',
            date: new Date().toISOString(),
          },
        }
      }
      return inv
    })
    setInvoices(updatedInvoices)
    setIsProcessing(false)
    setShowModal(false)
    showToast('success', 'Factura reenviada correctamente')
  }
  // Descargar factura
  const downloadInvoice = (type: 'pdf' | 'xml', url: string | null) => {
    if (!url) {
      showToast('error', 'Documento no disponible')
      return
    }
    // Simular descarga
    showToast('info', `Descargando ${type.toUpperCase()}...`)
    setTimeout(() => {
      showToast('success', `${type.toUpperCase()} descargado correctamente`)
    }, 1500)
  }
  // Enviar por correo
  const sendByEmail = (email: string) => {
    if (!selectedInvoice) return
    showToast('info', `Enviando factura a ${email}...`)
    setTimeout(() => {
      showToast('success', `Factura enviada a ${email}`)
      setShowModal(false)
    }, 1500)
  }
  // Obtener color según estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  // Obtener icono según estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircleIcon size={16} className="text-green-600" />
      case 'rejected':
        return <XCircleIcon size={16} className="text-red-600" />
      case 'processing':
        return <ClockIcon size={16} className="text-yellow-600" />
      case 'sent':
        return <SendIcon size={16} className="text-blue-600" />
      default:
        return null
    }
  }
  // Obtener texto según estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Aceptada'
      case 'rejected':
        return 'Rechazada'
      case 'processing':
        return 'Procesando'
      case 'sent':
        return 'Enviada'
      default:
        return status
    }
  }
  // Renderizar contenido
  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton height={100} className="rounded-xl" />
          <Skeleton height={400} className="rounded-xl" />
        </div>
      )
    }
    // New tab navigation
    return (
      <div className="space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'invoices'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Facturas Electrónicas
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'results'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Resultados de Generación
            </button>
          </div>
        </div>
        {activeTab === 'invoices' ? renderInvoicesTab() : renderResultsTab()}
      </div>
    )
  }
  // New function to render the invoices tab
  const renderInvoicesTab = () => (
    <>
      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar por ID, cliente o documento..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none block rounded-lg border border-gray-300 py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="processing">Procesando</option>
                <option value="sent">Enviada</option>
                <option value="accepted">Aceptada</option>
                <option value="rejected">Rechazada</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FilterIcon size={16} className="text-gray-400" />
              </div>
            </div>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none block rounded-lg border border-gray-300 py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <CalendarIcon size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tabla de facturas */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Factura
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cliente
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Fecha
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileTextIcon
                          size={18}
                          className="text-gray-400 mr-2"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.id}
                          </div>
                          <div className="text-xs text-gray-500">
                            Venta: {invoice.saleId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.clientName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {invoice.clientDocumentType}: {invoice.clientDocument}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0,
                      }).format(invoice.total)}
                      <div className="text-xs text-gray-500">
                        IVA:{' '}
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0,
                        }).format(invoice.taxes)}{' '}
                        ({((invoice.taxes / invoice.subtotal) * 100).toFixed(1)}
                        %)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                      >
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1">
                          {getStatusText(invoice.status)}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-1">
                      <button
                        onClick={() => openModal('view', invoice)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                        title="Ver detalles"
                      >
                        <EyeIcon size={16} />
                      </button>
                      {invoice.status === 'rejected' && (
                        <button
                          onClick={() => openModal('resend', invoice)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-50"
                          title="Reenviar"
                        >
                          <RefreshCwIcon size={16} />
                        </button>
                      )}
                      {(invoice.status === 'accepted' ||
                        invoice.status === 'sent') && (
                        <button
                          onClick={() => downloadInvoice('pdf', invoice.pdfUrl)}
                          className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                          title="Descargar PDF"
                        >
                          <DownloadIcon size={16} />
                        </button>
                      )}
                      {invoice.dianResponse && (
                        <button
                          onClick={() => openModal('log', invoice)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50"
                          title="Ver respuesta DIAN"
                        >
                          <ExternalLinkIcon size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    {searchTerm ||
                    statusFilter !== 'all' ||
                    dateFilter !== 'all'
                      ? 'No se encontraron facturas con los filtros aplicados'
                      : 'No hay facturas electrónicas registradas'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
  // New function to render the results tab
  const renderResultsTab = () => {
    // Generate summary statistics
    const totalInvoices = invoices.length
    const acceptedInvoices = invoices.filter(
      (inv) => inv.status === 'accepted',
    ).length
    const rejectedInvoices = invoices.filter(
      (inv) => inv.status === 'rejected',
    ).length
    const processingInvoices = invoices.filter(
      (inv) => inv.status === 'processing',
    ).length
    const sentInvoices = invoices.filter((inv) => inv.status === 'sent').length
    // Calculate success rate
    const successRate =
      totalInvoices > 0
        ? Math.round((acceptedInvoices / totalInvoices) * 100)
        : 0
    return (
      <>
        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Total Facturas
            </h3>
            <p className="text-2xl font-bold mt-1">{totalInvoices}</p>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-500">Últimos 30 días</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Tasa de Éxito</h3>
            <p className="text-2xl font-bold mt-1">{successRate}%</p>
            <div className="mt-2 flex items-center text-sm">
              <div className="bg-gray-200 h-2 w-full rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${successRate}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Tiempo Promedio
            </h3>
            <p className="text-2xl font-bold mt-1">4.2 min</p>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-500">↓ 12% vs mes anterior</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Rechazos</h3>
            <p className="text-2xl font-bold mt-1">{rejectedInvoices}</p>
            <div className="mt-2 flex items-center text-sm">
              <span
                className={
                  totalInvoices > 0 && rejectedInvoices / totalInvoices > 0.1
                    ? 'text-red-500'
                    : 'text-green-500'
                }
              >
                {totalInvoices > 0
                  ? Math.round((rejectedInvoices / totalInvoices) * 100)
                  : 0}
                % del total
              </span>
            </div>
          </div>
        </div>
        {/* Estado actual */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-medium mb-4">
            Estado Actual de Facturas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircleIcon size={24} className="text-green-600" />
              </div>
              <span className="text-sm font-medium">Aceptadas</span>
              <span className="text-xl font-bold text-green-700">
                {acceptedInvoices}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <SendIcon size={24} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium">Enviadas</span>
              <span className="text-xl font-bold text-blue-700">
                {sentInvoices}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                <ClockIcon size={24} className="text-yellow-600" />
              </div>
              <span className="text-sm font-medium">Procesando</span>
              <span className="text-xl font-bold text-yellow-700">
                {processingInvoices}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                <XCircleIcon size={24} className="text-red-600" />
              </div>
              <span className="text-sm font-medium">Rechazadas</span>
              <span className="text-xl font-bold text-red-700">
                {rejectedInvoices}
              </span>
            </div>
          </div>
        </div>
        {/* Últimos errores */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Últimos Errores</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {invoices
              .filter((inv) => inv.status === 'rejected')
              .slice(0, 5)
              .map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.id}</p>
                      <p className="text-sm text-gray-500">
                        Cliente: {invoice.clientName} •{' '}
                        {new Date(invoice.date).toLocaleDateString()}
                      </p>
                      {invoice.dianResponse && (
                        <p className="mt-1 text-sm text-red-600">
                          Error: {invoice.dianResponse.message}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openModal('view', invoice)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                    >
                      <EyeIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            {invoices.filter((inv) => inv.status === 'rejected').length ===
              0 && (
              <div className="p-6 text-center text-gray-500">
                No hay facturas rechazadas
              </div>
            )}
          </div>
        </div>
        {/* Rendimiento del PTA */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-medium mb-4">Rendimiento del PTA</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">
                  Tiempo de respuesta promedio
                </span>
                <span className="text-sm text-gray-500">4.2 min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: '70%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">
                  Disponibilidad del servicio
                </span>
                <span className="text-sm text-gray-500">99.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: '99.8%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">
                  Tasa de validación DIAN
                </span>
                <span className="text-sm text-gray-500">{successRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${successRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
  // Render step 2: Payment confirmation
  const renderStep2 = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Confirmar pago
      </h2>
      {paymentMethod === 'efectivo' && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="amountReceived"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Monto recibido
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                id="amountReceived"
                type="text"
                value={amountReceived}
                onChange={(e) =>
                  setAmountReceived(formatAmount(e.target.value))
                }
                className="pl-7 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0,00"
                disabled={isPaymentConfirmed}
                required
              />
            </div>
            {parseFloat(amountReceived.replace(/\./g, '').replace(',', '.')) <
              (invoiceRequested && !includeIva ? subtotal : total) &&
              amountReceived !== '' && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircleIcon size={16} className="mr-1" />
                  El monto recibido es menor al total
                </p>
              )}
          </div>
          {change > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-1">
                Cambio a entregar
              </h3>
              <p className="text-2xl font-bold text-green-700">
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(change)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
  // Render PTA Process Tracking section
  {
    modalType === 'view' &&
      selectedInvoice &&
      selectedInvoice.ptaData &&
      selectedInvoice.ptaData.processingSteps && (
        <div>
          <h3 className="font-medium mb-2">
            Proceso de facturación electrónica
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-3">
              {selectedInvoice.ptaData.processingSteps.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div
                    className={`mt-1.5 rounded-full w-4 h-4 flex-shrink-0 ${
                      step.status === 'success'
                        ? 'bg-green-500'
                        : step.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                  ></div>
                  <div className="ml-3">
                    <p
                      className={`font-medium ${
                        step.status === 'success'
                          ? 'text-green-700'
                          : step.status === 'error'
                            ? 'text-red-700'
                            : 'text-yellow-700'
                      }`}
                    >
                      {step.step}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(step.timestamp).toLocaleString('es-CO')}
                    </p>
                    {step.details && (
                      <p className="text-xs text-gray-600 mt-1">
                        {step.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
  }
  // Render PTA Technical Details section
  {
    modalType === 'view' && selectedInvoice && selectedInvoice.ptaData && (
      <div>
        <h3 className="font-medium mb-2">Datos técnicos PTA</h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Línea de negocio</p>
              <p className="font-medium">
                {selectedInvoice.ptaData.businessLine}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Tipo de operación</p>
              <p className="font-medium">
                {selectedInvoice.ptaData.operationType === '10'
                  ? 'Estándar'
                  : selectedInvoice.ptaData.operationType}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Método de pago</p>
              <p className="font-medium">
                {selectedInvoice.ptaData.paymentMethod === '10'
                  ? 'Efectivo'
                  : selectedInvoice.ptaData.paymentMethod === '20'
                    ? 'Tarjeta de crédito'
                    : 'Transferencia'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Fecha vencimiento</p>
              <p className="font-medium">
                {selectedInvoice.ptaData.paymentDueDate}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Municipio</p>
              <p className="font-medium">
                {selectedInvoice.ptaData.municipality}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Tipo de contrato</p>
              <p className="font-medium">
                {selectedInvoice.ptaData.contractType}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Referencia de orden</p>
              <p className="font-medium">
                {selectedInvoice.ptaData.orderReference}
              </p>
            </div>
            {selectedInvoice.ptaData.additionalNotes && (
              <div className="col-span-2">
                <p className="text-gray-500">Notas adicionales</p>
                <p className="font-medium">
                  {selectedInvoice.ptaData.additionalNotes}
                </p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-gray-500">Clave técnica</p>
              <p className="font-mono text-xs break-all">
                {selectedInvoice.ptaData.technicalKey}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Software ID</p>
              <p className="font-mono text-xs break-all">
                {selectedInvoice.ptaData.softwareID}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="h-full space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Facturación Electrónica
          </h1>
          <p className="text-gray-600 text-sm">
            Gestiona las facturas electrónicas enviadas a la DIAN a través del
            PTA
          </p>
        </div>
      </div>
      {renderContent()}
      {/* Modal para ver detalles */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalType === 'view'
            ? 'Detalles de Factura Electrónica'
            : modalType === 'resend'
              ? 'Reenviar Factura Electrónica'
              : 'Respuesta de la DIAN'
        }
        footer={
          modalType === 'resend' ? (
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={resendInvoice}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCwIcon size={16} className="mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon size={16} className="mr-2" />
                    Reenviar a la DIAN
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
              {modalType === 'view' &&
                selectedInvoice &&
                (selectedInvoice.status === 'accepted' ||
                  selectedInvoice.status === 'sent') && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        downloadInvoice('pdf', selectedInvoice.pdfUrl)
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                    >
                      <DownloadIcon size={16} className="mr-2" />
                      Descargar PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => sendByEmail(selectedInvoice.clientEmail)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <MailIcon size={16} className="mr-2" />
                      Enviar por correo
                    </button>
                  </>
                )}
            </div>
          )
        }
      >
        {selectedInvoice && (
          <div className="space-y-4">
            {modalType === 'view' && (
              <>
                {/* Información general */}
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID Factura</p>
                    <p className="font-medium">{selectedInvoice.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de emisión</p>
                    <p className="font-medium">
                      {new Date(selectedInvoice.date).toLocaleDateString(
                        'es-CO',
                        {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID PTA</p>
                    <p className="font-medium">{selectedInvoice.ptaId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className="font-medium flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}
                      >
                        {getStatusIcon(selectedInvoice.status)}
                        <span className="ml-1">
                          {getStatusText(selectedInvoice.status)}
                        </span>
                      </span>
                    </p>
                  </div>
                  {selectedInvoice.cufe && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">CUFE</p>
                      <p className="font-mono text-xs break-all">
                        {selectedInvoice.cufe}
                      </p>
                    </div>
                  )}
                </div>
                {/* Información del cliente */}
                <div>
                  <h3 className="font-medium mb-2">Información del cliente</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nombre</p>
                        <p className="font-medium">
                          {selectedInvoice.clientName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Documento</p>
                        <p className="font-medium">
                          {selectedInvoice.clientDocumentType}:{' '}
                          {selectedInvoice.clientDocument}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dirección</p>
                        <p className="font-medium">
                          {selectedInvoice.clientAddress || 'No especificada'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Responsable de IVA
                        </p>
                        <p className="font-medium">
                          {selectedInvoice.vatResponsible ? 'Sí' : 'No'}
                        </p>
                      </div>
                      {selectedInvoice.vatResponsible &&
                        selectedInvoice.companyId && (
                          <div>
                            <p className="text-sm text-gray-500">
                              NIT con DV (CompanyID)
                            </p>
                            <p className="font-medium">
                              {selectedInvoice.companyId}
                            </p>
                          </div>
                        )}
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">
                          Correo electrónico
                        </p>
                        <div className="flex items-center">
                          <p className="font-medium">
                            {selectedInvoice.clientEmail || 'No especificado'}
                          </p>
                          {selectedInvoice.wantsToReceiveEmail && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              Recibe factura por correo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Información de la venta */}
                <div>
                  <h3 className="font-medium mb-2">Información de la venta</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          }).format(selectedInvoice.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">IVA:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          }).format(selectedInvoice.taxes)}{' '}
                          (
                          {(
                            (selectedInvoice.taxes / selectedInvoice.subtotal) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-medium">Total:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          }).format(selectedInvoice.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Enlaces y documentos */}
                {(selectedInvoice.status === 'accepted' ||
                  selectedInvoice.status === 'sent') && (
                  <div>
                    <h3 className="font-medium mb-2">Documentos disponibles</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {selectedInvoice.pdfUrl && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Archivo PDF</span>
                          <button
                            onClick={() =>
                              downloadInvoice('pdf', selectedInvoice.pdfUrl)
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <DownloadIcon size={14} className="mr-1" />
                            Descargar
                          </button>
                        </div>
                      )}
                      {selectedInvoice.xmlUrl && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Archivo XML</span>
                          <button
                            onClick={() =>
                              downloadInvoice('xml', selectedInvoice.xmlUrl)
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <DownloadIcon size={14} className="mr-1" />
                            Descargar
                          </button>
                        </div>
                      )}
                      {selectedInvoice.qrUrl && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Validación DIAN</span>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              showToast(
                                'info',
                                'Abriendo validación DIAN (simulado)',
                              )
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <ExternalLinkIcon size={14} className="mr-1" />
                            Verificar
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Respuesta DIAN */}
                {selectedInvoice.dianResponse && (
                  <div>
                    <h3 className="font-medium mb-2">Respuesta de la DIAN</h3>
                    <div
                      className={`rounded-lg p-4 ${selectedInvoice.dianResponse.statusCode >= 400 ? 'bg-red-50 border border-red-100' : selectedInvoice.dianResponse.statusCode >= 300 ? 'bg-yellow-50 border border-yellow-100' : 'bg-green-50 border border-green-100'}`}
                    >
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-500">
                            Código de estado
                          </p>
                          <p className="font-medium">
                            {selectedInvoice.dianResponse.statusCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Mensaje</p>
                          <p className="font-medium">
                            {selectedInvoice.dianResponse.message}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Fecha de respuesta
                          </p>
                          <p className="font-medium">
                            {new Date(
                              selectedInvoice.dianResponse.date,
                            ).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Add AccountingCustomerParty section */}
                {modalType === 'view' &&
                  selectedInvoice &&
                  selectedInvoice.ptaData &&
                  selectedInvoice.ptaData.accountingCustomerParty && (
                    <div>
                      <h3 className="font-medium mb-2">
                        Datos AccountingCustomerParty (PTA)
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Tipo de documento</p>
                            <p className="font-medium">
                              {
                                selectedInvoice.ptaData.accountingCustomerParty
                                  .documentType
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Número de documento</p>
                            <p className="font-medium">
                              {
                                selectedInvoice.ptaData.accountingCustomerParty
                                  .documentNumber
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Nombre/Razón social</p>
                            <p className="font-medium">
                              {
                                selectedInvoice.ptaData.accountingCustomerParty
                                  .name
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Dirección</p>
                            <p className="font-medium">
                              {
                                selectedInvoice.ptaData.accountingCustomerParty
                                  .address
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Responsable de IVA</p>
                            <p className="font-medium">
                              {selectedInvoice.ptaData.accountingCustomerParty
                                .vatResponsible
                                ? 'Sí'
                                : 'No'}
                            </p>
                          </div>
                          {selectedInvoice.ptaData.accountingCustomerParty
                            .vatResponsible &&
                            selectedInvoice.ptaData.accountingCustomerParty
                              .companyId && (
                              <div>
                                <p className="text-gray-500">
                                  CompanyID (NIT con DV)
                                </p>
                                <p className="font-medium">
                                  {
                                    selectedInvoice.ptaData
                                      .accountingCustomerParty.companyId
                                  }
                                </p>
                              </div>
                            )}
                          {selectedInvoice.ptaData.accountingCustomerParty
                            .email && (
                            <div>
                              <p className="text-gray-500">
                                Email para factura
                              </p>
                              <p className="font-medium">
                                {
                                  selectedInvoice.ptaData
                                    .accountingCustomerParty.email
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}
            {modalType === 'resend' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 flex items-center mb-2">
                    <RefreshCwIcon size={16} className="mr-2" />
                    Reenviar factura rechazada
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Está a punto de reenviar la factura {selectedInvoice.id} a
                    la DIAN a través del PTA. Esta operación intentará corregir
                    los errores de validación anteriores.
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Motivo del rechazo
                  </h3>
                  {selectedInvoice.dianResponse && (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-red-700">
                          Código: {selectedInvoice.dianResponse.statusCode}
                        </p>
                        <p className="text-sm text-red-700">
                          Mensaje: {selectedInvoice.dianResponse.message}
                        </p>
                        <p className="text-sm text-red-700">
                          Fecha:{' '}
                          {new Date(
                            selectedInvoice.dianResponse.date,
                          ).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    El sistema intentará corregir automáticamente los errores
                    detectados y reenviará la factura al PTA FacturaTech para su
                    validación con la DIAN.
                  </p>
                </div>
              </div>
            )}
            {modalType === 'log' && selectedInvoice.dianResponse && (
              <div className="space-y-4">
                <div
                  className={`rounded-lg p-4 ${selectedInvoice.dianResponse.statusCode >= 400 ? 'bg-red-50 border border-red-100' : selectedInvoice.dianResponse.statusCode >= 300 ? 'bg-yellow-50 border border-yellow-100' : 'bg-green-50 border border-green-100'}`}
                >
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <ExternalLinkIcon size={16} className="mr-2" />
                    Respuesta de la DIAN
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Código de estado</p>
                      <p className="font-medium">
                        {selectedInvoice.dianResponse.statusCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mensaje</p>
                      <p className="font-medium">
                        {selectedInvoice.dianResponse.message}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Fecha de respuesta
                      </p>
                      <p className="font-medium">
                        {new Date(
                          selectedInvoice.dianResponse.date,
                        ).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">
                    Información del PTA
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Proveedor</p>
                      <p className="font-medium">FacturaTech</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID Transacción</p>
                      <p className="font-medium">{selectedInvoice.ptaId}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
export default ElectronicInvoicesPage
const mockElectronicInvoices = [
  {
    id: 'FE-2023-001',
    saleId: 'VTA-2023-1234',
    date: '2023-09-15T14:30:00Z',
    clientId: 'CLI-001',
    clientName: 'Juan Pérez',
    clientDocument: '1234567890',
    clientDocumentType: 'CC',
    clientEmail: 'juan.perez@example.com',
    clientAddress: 'Calle 123, Bogotá',
    vatResponsible: true,
    companyId: '12345678901234',
    wantsToReceiveEmail: true,
    total: 120000,
    taxes: 19200,
    subtotal: 100800,
    status: 'accepted',
    cufe: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    qrUrl: 'https://example.com/qr/FE-2023-001',
    pdfUrl: 'https://example.com/pdf/FE-2023-001',
    xmlUrl: 'https://example.com/xml/FE-2023-001',
    ptaId: 'PTA-2023-001',
    dianResponse: {
      statusCode: 200,
      message: 'Documento validado y aceptado',
      date: '2023-09-15T14:35:00Z',
    },
    ptaData: {
      businessLine: 'Comercio minorista',
      operationType: '10',
      paymentMethod: '10',
      paymentDueDate: '2023-09-15',
      municipality: '11001',
      contractType: 'Venta directa',
      orderReference: 'ORD-2023-1234',
      additionalNotes: '',
      technicalKey: '9d3b2c1a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0',
      softwareID: 'e7d6c5b4-a3b2-c1d0-e9f8-g7h6i5j4k3l2',
      testSetId: '',
      processingSteps: [
        {
          step: 'Generación de documento electrónico',
          status: 'success',
          timestamp: '2023-09-15T14:31:00Z',
        },
        {
          step: 'Firma digital aplicada',
          status: 'success',
          timestamp: '2023-09-15T14:32:00Z',
        },
        {
          step: 'Envío a la DIAN',
          status: 'success',
          timestamp: '2023-09-15T14:33:00Z',
        },
        {
          step: 'Validación por la DIAN',
          status: 'success',
          timestamp: '2023-09-15T14:35:00Z',
          details: 'Documento validado correctamente',
        },
      ],
      accountingCustomerParty: {
        documentType: 'CC',
        documentNumber: '1234567890',
        name: 'Juan Pérez',
        address: 'Calle 123, Bogotá',
        vatResponsible: true,
        companyId: '12345678901234',
        email: 'juan.perez@example.com',
      },
    },
  },
  {
    id: 'FE-2023-002',
    saleId: 'VTA-2023-1235',
    date: '2023-09-15T16:45:00Z',
    clientId: 'CLI-002',
    clientName: 'María Rodríguez',
    clientDocument: '0987654321',
    clientDocumentType: 'CC',
    clientEmail: 'maria.rodriguez@example.com',
    clientAddress: 'Calle 456, Medellín',
    vatResponsible: false,
    companyId: null,
    wantsToReceiveEmail: false,
    total: 85000,
    taxes: 13600,
    subtotal: 71400,
    status: 'rejected',
    cufe: null,
    qrUrl: null,
    pdfUrl: null,
    xmlUrl: null,
    ptaId: 'PTA-2023-002',
    dianResponse: {
      statusCode: 400,
      message: 'Error en la validación: NIT del emisor no registrado',
      date: '2023-09-15T16:50:00Z',
    },
    ptaData: {
      businessLine: 'Comercio minorista',
      operationType: '10',
      paymentMethod: '20',
      paymentDueDate: '2023-09-15',
      municipality: '11001',
      contractType: 'Venta directa',
      orderReference: 'ORD-2023-1235',
      additionalNotes: '',
      technicalKey: '9d3b2c1a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0',
      softwareID: 'e7d6c5b4-a3b2-c1d0-e9f8-g7h6i5j4k3l2',
      testSetId: '',
      processingSteps: [
        {
          step: 'Generación de documento electrónico',
          status: 'success',
          timestamp: '2023-09-15T16:46:00Z',
        },
        {
          step: 'Firma digital aplicada',
          status: 'success',
          timestamp: '2023-09-15T16:47:00Z',
        },
        {
          step: 'Envío a la DIAN',
          status: 'success',
          timestamp: '2023-09-15T16:48:00Z',
        },
        {
          step: 'Validación por la DIAN',
          status: 'error',
          timestamp: '2023-09-15T16:50:00Z',
          details: 'Error en la validación: NIT del emisor no registrado',
        },
      ],
      accountingCustomerParty: {
        documentType: 'CC',
        documentNumber: '0987654321',
        name: 'María Rodríguez',
        address: 'Calle 456, Medellín',
        vatResponsible: false,
        companyId: null,
        email: null,
      },
    },
  },
  {
    id: 'FE-2023-003',
    saleId: 'VTA-2023-1236',
    date: '2023-09-16T10:15:00Z',
    clientId: 'CLI-003',
    clientName: 'Carlos Gómez',
    clientDocument: '5678901234',
    clientDocumentType: 'CC',
    clientEmail: 'carlos.gomez@example.com',
    clientAddress: 'Calle 789, Cali',
    vatResponsible: true,
    companyId: '98765432109876',
    wantsToReceiveEmail: true,
    total: 45000,
    taxes: 7200,
    subtotal: 37800,
    status: 'processing',
    cufe: null,
    qrUrl: null,
    pdfUrl: null,
    xmlUrl: null,
    ptaId: 'PTA-2023-003',
    dianResponse: null,
    ptaData: {
      businessLine: 'Comercio minorista',
      operationType: '10',
      paymentMethod: '31',
      paymentDueDate: '2023-09-16',
      municipality: '11001',
      contractType: 'Venta directa',
      orderReference: 'ORD-2023-1236',
      additionalNotes: '',
      technicalKey: '9d3b2c1a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0',
      softwareID: 'e7d6c5b4-a3b2-c1d0-e9f8-g7h6i5j4k3l2',
      testSetId: '',
      processingSteps: [
        {
          step: 'Generación de documento electrónico',
          status: 'success',
          timestamp: '2023-09-16T10:16:00Z',
        },
        {
          step: 'Firma digital aplicada',
          status: 'success',
          timestamp: '2023-09-16T10:17:00Z',
        },
        {
          step: 'Envío a la DIAN',
          status: 'pending',
          timestamp: '2023-09-16T10:18:00Z',
          details: 'En cola para procesamiento',
        },
      ],
      accountingCustomerParty: {
        documentType: 'CC',
        documentNumber: '5678901234',
        name: 'Carlos Gómez',
        address: 'Calle 789, Cali',
        vatResponsible: true,
        companyId: '98765432109876',
        email: 'carlos.gomez@example.com',
      },
    },
  },
  // ... more invoices
]
