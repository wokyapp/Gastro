import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SearchIcon, RefreshCcwIcon, ShoppingCartIcon, ArrowLeftIcon, CheckIcon, XIcon, AlertTriangleIcon, DollarSignIcon, ClipboardIcon, CalendarIcon } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from '../components/ui/Skeleton';
import { mockSales } from '../utils/mockData';
const RefundPage: React.FC = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    showToast
  } = useToast();
  const {
    user
  } = useAuth();
  const [searchTerm, setSearchTerm] = useState(id && id !== 'new' ? id : '');
  const [isSearching, setIsSearching] = useState(false);
  const [sale, setSale] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authPin, setAuthPin] = useState('');
  const [error, setError] = useState('');
  // Si se proporciona un ID en la URL, buscar la venta automáticamente
  useEffect(() => {
    if (id && id !== 'new' && id !== 'list') {
      searchSale();
    }
  }, [id]);
  // Buscar venta
  const searchSale = async () => {
    if (!searchTerm) return;
    setIsSearching(true);
    setError('');
    setSale(null);
    try {
      // Simular búsqueda en API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Buscar en las ventas simuladas
      const foundSale = mockSales.find(s => s.id.toLowerCase() === searchTerm.toLowerCase());
      if (foundSale) {
        setSale(foundSale);
        // Inicializar todos los items como no seleccionados
        setSelectedItems([]);
      } else {
        setError('Venta no encontrada');
        showToast('error', 'Venta no encontrada');
      }
    } catch (err) {
      setError('Error al buscar la venta');
      showToast('error', 'Error al buscar la venta');
    } finally {
      setIsSearching(false);
    }
  };
  // Seleccionar/deseleccionar item para reembolso
  const toggleItemSelection = item => {
    if (selectedItems.some(i => i.productId === item.productId)) {
      setSelectedItems(selectedItems.filter(i => i.productId !== item.productId));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };
  // Calcular total a reembolsar
  const calculateRefundTotal = () => {
    return selectedItems.reduce((total, item) => {
      const saleItem = sale.items.find(i => i.productId === item.productId);
      return total + (saleItem ? saleItem.price * saleItem.quantity : 0);
    }, 0);
  };
  // Procesar reembolso
  const processRefund = async () => {
    // Verificar si se requiere autorización
    const refundTotal = calculateRefundTotal();
    if (refundTotal > 50000 && user?.role !== 'admin' && user?.role !== 'supervisor') {
      setIsAuthorizing(true);
      return;
    }
    // Continuar con el reembolso
    processRefundConfirmed();
  };
  // Procesar reembolso después de autorización
  const processRefundConfirmed = async () => {
    if (selectedItems.length === 0) {
      showToast('warning', 'Seleccione al menos un producto para reembolsar');
      return;
    }
    setIsProcessing(true);
    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      setRefundSuccess(true);
      showToast('success', 'Reembolso procesado correctamente');
    } catch (err) {
      showToast('error', 'Error al procesar el reembolso');
    } finally {
      setIsProcessing(false);
      setIsAuthorizing(false);
    }
  };
  // Verificar PIN de autorización
  const verifyAuthPin = () => {
    // Simular verificación (PIN correcto es "1234")
    if (authPin === '1234') {
      setIsAuthorizing(false);
      processRefundConfirmed();
    } else {
      showToast('error', 'PIN incorrecto');
    }
  };
  // Volver al inicio
  const handleFinish = () => {
    navigate('/dashboard');
  };
  // Renderizar página de reembolso exitoso
  const renderSuccessPage = () => <div className="space-y-4">
      <div className="bg-green-100 rounded-lg p-4 flex items-start">
        <CheckIcon className="text-green-600 mt-1 mr-3" size={20} />
        <div>
          <h3 className="font-medium text-green-800">
            Reembolso procesado correctamente
          </h3>
          <p className="text-green-700 text-sm mt-1">
            El reembolso ha sido registrado en el sistema.
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-medium text-gray-800 mb-3">
          Detalles del reembolso
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Venta original:</span>
            <span className="font-medium">{sale.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha:</span>
            <span>
              {new Date().toLocaleDateString('es-CO', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Productos:</span>
            <span>{selectedItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Monto reembolsado:</span>
            <span className="font-medium">
              {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(calculateRefundTotal())}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Motivo:</span>
            <span>{refundReason || 'No especificado'}</span>
          </div>
        </div>
      </div>
      <div className="pt-4">
        <button onClick={handleFinish} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
          Finalizar
        </button>
      </div>
    </div>;
  // Renderizar formulario de búsqueda
  const renderSearchForm = () => <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-medium text-gray-800 mb-3">Buscar venta</h3>
        <div className="flex mb-4">
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && searchSale()} className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Número de venta" />
          <button onClick={searchSale} disabled={isSearching || !searchTerm} className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            {isSearching ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : <SearchIcon size={20} />}
          </button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangleIcon size={16} className="mr-2" />
            {error}
          </div>}
        <p className="text-sm text-gray-600 mt-2">
          Ingrese el número de venta para buscar (ejemplo: SALE-001).
        </p>
      </div>
      <div className="bg-amber-50 rounded-lg p-4 flex items-start">
        <AlertTriangleIcon className="text-amber-600 mt-1 mr-3" size={20} />
        <div>
          <h3 className="font-medium text-amber-800">Política de reembolsos</h3>
          <p className="text-amber-700 text-sm mt-1">
            Los reembolsos solo pueden procesarse dentro de los 30 días
            posteriores a la compra. Algunos productos pueden tener
            restricciones adicionales.
          </p>
        </div>
      </div>
    </div>;
  // Renderizar detalles de venta y selección de items
  const renderSaleDetails = () => <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-gray-800">Detalles de la venta</h3>
          <button onClick={() => {
          setSale(null);
          setSelectedItems([]);
          setError('');
        }} className="text-blue-600 text-sm flex items-center">
            <ArrowLeftIcon size={16} className="mr-1" />
            Volver
          </button>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Venta:</span>
            <span className="font-medium">{sale.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fecha:</span>
            <span>
              {new Date(sale.date).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="font-medium">
              {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(sale.total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Método de pago:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sale.paymentMethod === 'efectivo' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
              {sale.paymentMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-medium text-gray-800 mb-2">
            Seleccione productos a reembolsar
          </h4>
          <div className="space-y-2">
            {sale.items.map((item, index) => <div key={index} className={`border rounded-lg p-3 cursor-pointer ${selectedItems.some(i => i.productId === item.productId) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`} onClick={() => toggleItemSelection(item)}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {`Producto ${item.productId}`}{' '}
                      <span className="text-gray-600 text-sm">
                        x{item.quantity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(item.price)}{' '}
                      c/u
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedItems.some(i => i.productId === item.productId) ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                    {selectedItems.some(i => i.productId === item.productId) && <CheckIcon size={16} />}
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-medium text-gray-800 mb-3">Motivo del reembolso</h3>
        <select value={refundReason} onChange={e => setRefundReason(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4">
          <option value="">Seleccione un motivo</option>
          <option value="product_defect">Producto defectuoso</option>
          <option value="wrong_product">Producto equivocado</option>
          <option value="customer_dissatisfaction">Cliente insatisfecho</option>
          <option value="billing_error">Error en cobro</option>
          <option value="other">Otro</option>
        </select>
        <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3 mb-4">
          <span>Total a reembolsar:</span>
          <span>
            {new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
          }).format(calculateRefundTotal())}
          </span>
        </div>
        <button onClick={processRefund} disabled={selectedItems.length === 0 || !refundReason || isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center">
          {isProcessing ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div> : <RefreshCcwIcon size={20} className="mr-2" />}
          Procesar reembolso
        </button>
      </div>
    </div>;
  // Modal de autorización
  const renderAuthorizationModal = () => <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <LockIcon size={20} className="mr-2 text-amber-600" />
          Autorización requerida
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Este reembolso requiere autorización de supervisor.
        </p>
        <input type="password" value={authPin} onChange={e => setAuthPin(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" placeholder="PIN de supervisor" maxLength={4} />
        <div className="flex justify-end space-x-2">
          <button onClick={() => setIsAuthorizing(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={verifyAuthPin} disabled={!authPin || authPin.length < 4} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            Verificar
          </button>
        </div>
      </div>
    </div>;
  return <div className="h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Reembolso</h1>
      {isSearching ? <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Buscando venta...</p>
        </div> : refundSuccess ? renderSuccessPage() : sale ? renderSaleDetails() : renderSearchForm()}
      {isAuthorizing && renderAuthorizationModal()}
    </div>;
};
// Ícono de candado para el modal de autorización
const LockIcon = ({
  size,
  className
}) => {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>;
};
export default RefundPage;