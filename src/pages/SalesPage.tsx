import React, { useEffect, useState, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MinusIcon, TrashIcon, SearchIcon, ScanIcon, PenIcon, PercentIcon, ShoppingCartIcon, TagIcon, WifiOffIcon, LockIcon, StopCircleIcon, PlusCircleIcon, CheckIcon, PackageIcon, AlertCircleIcon, ArrowRightIcon, DollarSignIcon, XIcon, CameraIcon, ChevronRightIcon, ChevronLeftIcon, GridIcon, ListIcon, UserIcon } from 'lucide-react';
import { mockScanProduct, getProductById } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { mockProducts } from '../utils/mockData';
import ClientSelector from '../components/ClientSelector';
// Tipos
interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  taxRate: number; // 0, 0.05, 0.19
  taxRequired?: boolean; // Indica si el IVA es obligatorio
  stock: number;
  unit: string;
  image?: string;
  sku?: string;
  category?: string;
}
interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
  discount?: number;
}
// Función para validar GTIN (dígito de control)
const isValidGTIN = (barcode: string): boolean => {
  if (!/^\d+$/.test(barcode)) return false;
  // Para el escaneo simulado, permitir códigos específicos sin validación
  if (barcode === '7701234567890') return true;
  // Algoritmo de validación de dígito de control
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop();
  let sum = 0;
  digits.reverse().forEach((digit, i) => {
    sum += digit * (i % 2 === 0 ? 3 : 1);
  });
  const calculatedCheckDigit = (10 - sum % 10) % 10;
  return calculatedCheckDigit === checkDigit;
};
// Función para procesar códigos con precio/peso embebido
const processEmbeddedCode = (barcode: string): {
  productCode: string;
  value: number;
} | null => {
  // Códigos de precio embebido (prefijo 20 o 02)
  if (barcode.startsWith('20') || barcode.startsWith('02')) {
    const productCode = barcode.substring(0, 7); // Primeros 7 dígitos (incluyendo prefijo)
    const valueStr = barcode.substring(7, 12); // 5 dígitos para precio/peso
    const value = parseInt(valueStr) / 100; // Convertir a valor decimal
    return {
      productCode,
      value
    };
  }
  return null;
};
// Sonido de beep para escaneo exitoso
const playBeepSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 1800;
    gainNode.gain.value = 0.1;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(0);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    console.log('Audio no soportado');
  }
};
// Componente de mini-toast para confirmación de escaneo
const ScanToast = ({
  code,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-out">
      <CheckIcon size={16} className="mr-2 text-green-400" />
      <span className="text-sm">Leído: {code}</span>
    </div>;
};
// Modal para seleccionar productos por categoría
const CategoryProductsModal = ({
  isOpen,
  onClose,
  onAddProduct
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Cargar categorías al abrir el modal
  useEffect(() => {
    if (isOpen) {
      // Extraer categorías únicas de los productos
      const uniqueCategories = Array.from(new Set(mockProducts.map(p => p.category || 'Sin categoría'))).sort();
      setCategories(uniqueCategories);
      setSelectedCategory(null);
    }
  }, [isOpen]);
  // Cargar productos cuando se selecciona una categoría
  useEffect(() => {
    if (selectedCategory) {
      const categoryProducts = mockProducts.filter(p => (p.category || 'Sin categoría') === selectedCategory && p.active !== false);
      setProducts(categoryProducts);
    } else {
      setProducts([]);
    }
  }, [selectedCategory]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <h3 className="text-lg font-medium">
            {selectedCategory ? selectedCategory : 'Seleccionar categoría'}
          </h3>
          <div className="flex items-center gap-2">
            {selectedCategory && <button onClick={() => setSelectedCategory(null)} className="p-2 rounded-full hover:bg-gray-100">
                <ChevronLeftIcon size={20} className="text-gray-600" />
              </button>}
            {selectedCategory && <>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}>
                  <GridIcon size={18} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}>
                  <ListIcon size={18} />
                </button>
              </>}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <XIcon size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          {!selectedCategory ?
        // Mostrar lista de categorías
        <div className="grid grid-cols-2 gap-3">
              {categories.map(category => <button key={category} onClick={() => setSelectedCategory(category)} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span className="font-medium">{category}</span>
                  <ChevronRightIcon size={18} className="text-gray-400" />
                </button>)}
            </div> : viewMode === 'grid' ?
        // Mostrar productos en modo grid
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.length > 0 ? products.map(product => <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                    <div className="h-24 bg-gray-100 flex items-center justify-center">
                      {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <PackageIcon size={32} className="text-gray-400" />}
                    </div>
                    <div className="p-3 flex-1">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-gray-600 text-sm mb-2">
                        {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0
                }).format(product.price)}
                      </p>
                      <button onClick={() => {
                onAddProduct(product);
                onClose();
              }} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 px-3 rounded">
                        Agregar
                      </button>
                    </div>
                  </div>) : <div className="col-span-3 py-8 text-center text-gray-500">
                  No hay productos en esta categoría
                </div>}
            </div> :
        // Mostrar productos en modo lista
        <div className="divide-y divide-gray-200">
              {products.length > 0 ? products.map(product => <div key={product.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-md mr-3 flex items-center justify-center overflow-hidden">
                        {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <PackageIcon size={20} className="text-gray-400" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <p className="text-gray-600 text-sm">
                          {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(product.price)}
                          {product.stock < 5 && <span className="ml-2 text-xs bg-amber-50 text-amber-600 px-1 py-0.5 rounded">
                              Stock: {product.stock}
                            </span>}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => {
              onAddProduct(product);
              onClose();
            }} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200">
                      <PlusIcon size={18} />
                    </button>
                  </div>) : <div className="py-8 text-center text-gray-500">
                  No hay productos en esta categoría
                </div>}
            </div>}
        </div>
      </div>
    </div>;
};
// Modal para checkout
const CheckoutModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentInfo: any) => void;
  total: number;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  total
}) => {
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cardType, setCardType] = useState('credito'); // Added card type state
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [documentType, setDocumentType] = useState('cc');
  const [documentNumber, setDocumentNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  // Formatear monto recibido con separadores de miles
  const formatAmount = (value: string) => {
    // Eliminar todo excepto números
    const numericValue = value.replace(/\D/g, '');
    // Convertir a número y formatear
    if (numericValue) {
      const numberValue = parseInt(numericValue);
      return new Intl.NumberFormat('es-CO').format(numberValue);
    }
    return '';
  };
  // Actualizar monto recibido y calcular cambio
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatAmount(e.target.value);
    setAmountReceived(formattedValue);
    // Calcular cambio
    const numericValue = parseInt(e.target.value.replace(/\D/g, '') || '0');
    setChange(Math.max(0, numericValue - total));
  };
  // Manejar confirmación de pago
  const handleConfirm = () => {
    const amountValue = parseInt(amountReceived.replace(/\D/g, '') || '0');
    // Validar monto para pago en efectivo
    if (paymentMethod === 'efectivo' && amountValue < total) {
      alert('El monto recibido debe ser mayor o igual al total');
      return;
    }
    // Validar datos de facturación si se solicita
    if (invoiceRequested) {
      if (!documentNumber || !customerName) {
        alert('Por favor complete los datos de facturación');
        return;
      }
      if (customerEmail && !/\S+@\S+\.\S+/.test(customerEmail)) {
        alert('Por favor ingrese un correo electrónico válido');
        return;
      }
    }
    onConfirm({
      paymentMethod,
      cardType: paymentMethod === 'tarjeta' ? cardType : null,
      amountReceived: amountValue,
      change,
      invoiceRequested,
      documentType,
      documentNumber,
      customerName,
      customerEmail
    });
  };
  return <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Procesar pago</h3>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPaymentMethod('efectivo')} className={`py-2 px-4 rounded-lg border ${paymentMethod === 'efectivo' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}>
                Efectivo
              </button>
              <button type="button" onClick={() => setPaymentMethod('tarjeta')} className={`py-2 px-4 rounded-lg border ${paymentMethod === 'tarjeta' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}>
                Tarjeta
              </button>
            </div>
            {/* Card type selection */}
            {paymentMethod === 'tarjeta' && <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de tarjeta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCardType('credito')} className={`py-2 px-4 rounded-lg border ${cardType === 'credito' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}>
                    Crédito
                  </button>
                  <button type="button" onClick={() => setCardType('debito')} className={`py-2 px-4 rounded-lg border ${cardType === 'debito' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'}`}>
                    Débito
                  </button>
                </div>
              </div>}
          </div>
          {paymentMethod === 'efectivo' && <div className="mb-4">
              <label htmlFor="amountReceived" className="block text-sm font-medium text-gray-700 mb-1">
                Monto recibido
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input type="text" id="amountReceived" value={amountReceived} onChange={handleAmountChange} className="pl-7 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
              </div>
              {change > 0 && <div className="mt-2 bg-green-50 p-2 rounded-lg">
                  <p className="text-sm text-green-700">
                    Cambio:{' '}
                    {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
              }).format(change)}
                  </p>
                </div>}
            </div>}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input type="checkbox" id="invoiceRequested" checked={invoiceRequested} onChange={e => setInvoiceRequested(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="invoiceRequested" className="ml-2 block text-sm text-gray-700">
                Solicitar factura electrónica
              </label>
            </div>
            {invoiceRequested && <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de documento
                  </label>
                  <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="cc">Cédula de Ciudadanía</option>
                    <option value="ce">Cédula de Extranjería</option>
                    <option value="nit">NIT</option>
                    <option value="pp">Pasaporte</option>
                    <option value="ti">Tarjeta de Identidad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de documento
                  </label>
                  <input type="text" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Número de documento" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre/Razón social
                  </label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nombre completo o razón social" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="correo@ejemplo.com" />
                </div>
              </div>}
          </div>
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            {/* Store information */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-700 mb-1">
                {storeInfo.name}
              </h4>
              <p className="text-sm text-gray-600">NIT: {storeInfo.nit}</p>
              <p className="text-sm text-gray-600">
                Dirección: {storeInfo.address}
              </p>
              <p className="text-sm text-gray-600">
                Teléfono: {storeInfo.phone}
              </p>
            </div>
            {/* Client information if selected */}
            {selectedClient && <div className="mb-3 pb-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-700 mb-1">Cliente:</h4>
                <p className="text-sm text-gray-600">{selectedClient.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedClient.documentType}: {selectedClient.document}
                </p>
                {selectedClient.address && <p className="text-sm text-gray-600">
                    Dirección: {selectedClient.address}
                  </p>}
              </div>}
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">Total a pagar:</span>
              <span className="font-bold text-gray-900">
                {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
              }).format(total)}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Confirmar pago
          </button>
        </div>
      </div>
    </div>;
};
// Mock store data for invoice
const storeInfo = {
  name: 'Mi Tienda S.A.S',
  nit: '900.123.456-7',
  address: 'Calle Principal #123, Bogotá',
  phone: '(601) 123-4567',
  email: 'contacto@mitienda.com'
};
// Componente principal
const SalesPage: React.FC = () => {
  const {
    showToast
  } = useToast();
  const {
    user
  } = useAuth();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [scanError, setScanError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<{
    type: string;
    itemIndex?: number;
    value?: number;
  }>({
    type: ''
  });
  const [showScanToast, setShowScanToast] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(true); // Simulación
  const [showSwipeItem, setShowSwipeItem] = useState<number | null>(null);
  const [swipePosition, setSwipePosition] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0); // Add global discount state
  const [showGlobalDiscountModal, setShowGlobalDiscountModal] = useState(false); // Add modal state
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number>(0);
  const touchItemRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  // Simular carga inicial de productos
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingProducts(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  // Verificar estado de conexión
  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);
  // Enfocar input de código de barras al cargar y cuando cambia el estado
  useEffect(() => {
    if (barcodeInputRef.current && !isScanning && !showSearch && !showPinModal && !showCameraScanner && !showCategoryModal) {
      barcodeInputRef.current.focus();
    }
  }, [isScanning, showSearch, showPinModal, showCameraScanner, showCategoryModal]);
  // Calcular totales
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemDiscountAmount = cart.reduce((sum, item) => {
    const itemSubtotal = item.product.price * item.quantity;
    return sum + (item.discount ? itemSubtotal * (item.discount / 100) : 0);
  }, 0);
  // Apply global discount after individual item discounts
  const afterItemDiscounts = subtotal - itemDiscountAmount;
  const globalDiscountAmount = afterItemDiscounts * (globalDiscount / 100);
  const totalDiscountAmount = itemDiscountAmount + globalDiscountAmount;
  const taxableAmount = subtotal - totalDiscountAmount;
  const taxes = cart.reduce((sum, item) => {
    const itemSubtotal = item.product.price * item.quantity;
    const itemDiscount = item.discount ? itemSubtotal * (item.discount / 100) : 0;
    // Apply proportional global discount to this item
    const itemGlobalDiscount = globalDiscount > 0 ? (itemSubtotal - itemDiscount) * (globalDiscount / 100) : 0;
    return sum + (itemSubtotal - itemDiscount - itemGlobalDiscount) * item.product.taxRate;
  }, 0);
  const total = taxableAmount + taxes;
  // Iniciar escáner de cámara
  const startCameraScanner = async () => {
    setShowCameraScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      showToast('error', 'No se pudo acceder a la cámara');
      setShowCameraScanner(false);
    }
  };
  // Detener escáner de cámara
  const stopCameraScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCameraScanner(false);
  };
  // Simular escaneo de producto
  const handleScan = async () => {
    if (!barcodeInput.trim()) return;
    try {
      setIsLoading(true);
      setScanError('');
      // Validar GTIN solo si no estamos en modo de escaneo continuo
      if (!isScanning && barcodeInput.length >= 8 && !isValidGTIN(barcodeInput)) {
        showToast('warning', 'Código de barras inválido');
        setScanError('Código de barras inválido');
        setIsLoading(false);
        return;
      }
      // Guardar el código escaneado para el mini-toast
      setLastScannedCode(barcodeInput);
      setShowScanToast(true);
      // Procesar códigos con precio/peso embebido
      const embeddedData = processEmbeddedCode(barcodeInput);
      let productCode = barcodeInput;
      let embeddedValue = 0;
      if (embeddedData) {
        productCode = embeddedData.productCode;
        embeddedValue = embeddedData.value;
      }
      const product = await mockScanProduct(productCode);
      if (product) {
        // Reproducir sonido de éxito
        playBeepSound();
        // Vibración si está disponible
        try {
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
        } catch (e) {
          console.log('Vibración no soportada');
        }
        // Verificar si el producto ya está en el carrito
        const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
        if (existingItemIndex >= 0) {
          // Incrementar cantidad si ya existe
          const newCart = [...cart];
          newCart[existingItemIndex].quantity += 1;
          setCart(newCart);
          showToast('success', `${product.name} +1`);
        } else {
          // Añadir nuevo producto al carrito
          setCart([...cart, {
            product: {
              ...product,
              // Asignar SKU si no tiene
              sku: product.sku || `SKU-${product.id.padStart(6, '0')}`
            },
            quantity: 1
          }]);
          showToast('success', `${product.name} agregado`);
        }
        // Incrementar contador de escaneos
        if (isScanning) {
          setScanCount(prev => prev + 1);
        }
        // Desplazar a la parte inferior del carrito
        setTimeout(() => {
          if (cartRef.current) {
            cartRef.current.scrollTop = cartRef.current.scrollHeight;
          }
        }, 100);
      } else {
        setScanError('Producto no encontrado');
        showToast('error', 'Producto no encontrado');
        // Vibración de error
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (error) {
      console.error('Error al escanear:', error);
      setScanError('Error al escanear producto');
      showToast('error', 'Error al escanear');
    } finally {
      setIsLoading(false);
      setBarcodeInput('');
      // Volver a enfocar el input para el siguiente escaneo
      if (barcodeInputRef.current && !showSearch && !showPinModal) {
        barcodeInputRef.current.focus();
      }
    }
  };
  // Simular escaneo continuo
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        // Generar un código de barras aleatorio para simular
        const randomBarcode = Math.floor(Math.random() * 10000000000).toString();
        setBarcodeInput(randomBarcode);
        handleScan();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isScanning]);
  // Manejar cambio de cantidad
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
    showToast('info', `Cantidad actualizada: ${newQuantity}`);
  };
  // Eliminar item del carrito
  const removeItem = (index: number) => {
    const itemName = cart[index].product.name;
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    showToast('info', `${itemName} eliminado`);
  };
  // Añadir nota a un item
  const addNote = (index: number, note: string) => {
    const newCart = [...cart];
    newCart[index].note = note;
    setCart(newCart);
    showToast('success', 'Nota agregada');
  };
  // Aplicar descuento a un item
  const applyDiscount = (index: number, discount: number) => {
    // Verificar si el usuario tiene permisos o si el descuento es mayor al 10%
    if (user?.role !== 'admin' && user?.role !== 'supervisor' || discount > 10) {
      setPinAction({
        type: 'discount',
        itemIndex: index,
        value: discount
      });
      setShowPinModal(true);
      return;
    }
    // Verificar si el producto tiene IVA obligatorio
    const product = cart[index].product;
    if (product.taxRate > 0 && product.taxRequired) {
      showToast('warning', 'Este producto tiene IVA obligatorio. El descuento se aplicará sobre el precio base.');
    }
    const newCart = [...cart];
    newCart[index].discount = discount;
    setCart(newCart);
    showToast('success', `Descuento de ${discount}% aplicado`);
  };
  // Apply global discount
  const applyGlobalDiscount = (discount: number) => {
    // Verify permissions for high discounts
    if (user?.role !== 'admin' && user?.role !== 'supervisor' || discount > 10) {
      setPinAction({
        type: 'global_discount',
        value: discount
      });
      setShowPinModal(true);
      return;
    }
    setGlobalDiscount(discount);
    setShowGlobalDiscountModal(false);
    showToast('success', `Descuento global de ${discount}% aplicado`);
  };
  // Verificar PIN de supervisor (simulado)
  const verifyPin = (pin: string) => {
    // Simulación: PIN correcto es "1234"
    if (pin === '1234') {
      if (pinAction.type === 'discount' && pinAction.itemIndex !== undefined) {
        const newCart = [...cart];
        newCart[pinAction.itemIndex].discount = pinAction.value;
        setCart(newCart);
        showToast('success', `Descuento de ${pinAction.value}% aplicado`);
      } else if (pinAction.type === 'price' && pinAction.itemIndex !== undefined) {
        // Implementar cambio de precio
        showToast('success', 'Precio modificado');
      } else if (pinAction.type === 'open_price') {
        addManualProduct(true);
      } else if (pinAction.type === 'global_discount') {
        setGlobalDiscount(pinAction.value);
        showToast('success', `Descuento global de ${pinAction.value}% aplicado`);
      }
      setShowPinModal(false);
    } else {
      showToast('error', 'PIN incorrecto');
    }
  };
  // Agregar producto manualmente
  const addManualProduct = (openPrice = false) => {
    // Mostrar modal de categorías en lugar de agregar directamente
    if (!openPrice) {
      setShowCategoryModal(true);
      return;
    }
    // Si es precio abierto, seguir con la implementación anterior
    const mockProduct = {
      id: `manual-${Date.now()}`,
      barcode: '',
      name: openPrice ? 'Precio abierto' : 'Producto manual',
      price: openPrice ? 0 : 5000,
      taxRate: 0.19,
      stock: 999,
      unit: 'un',
      sku: `SKU-${Math.floor(Math.random() * 10000).toString().padStart(6, '0')}`
    };
    if (openPrice) {
      // Solicitar precio
      const price = prompt('Ingrese el precio:', '0');
      if (price !== null) {
        mockProduct.price = parseInt(price) || 0;
      }
    }
    setCart([...cart, {
      product: mockProduct,
      quantity: 1
    }]);
    showToast('success', `${mockProduct.name} agregado`);
  };
  // Agregar producto desde el modal de categorías
  const addProductFromCategory = (product: Product) => {
    const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
      showToast('success', `${product.name} +1`);
    } else {
      setCart([...cart, {
        product: {
          ...product,
          sku: product.sku || `SKU-${product.id.padStart(6, '0')}`
        },
        quantity: 1
      }]);
      showToast('success', `${product.name} agregado`);
    }
    // Desplazar a la parte inferior del carrito
    setTimeout(() => {
      if (cartRef.current) {
        cartRef.current.scrollTop = cartRef.current.scrollHeight;
      }
    }, 100);
  };
  // Buscar productos
  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    // Simular búsqueda
    await new Promise(resolve => setTimeout(resolve, 500));
    // Resultados simulados
    const results = [{
      id: '101',
      barcode: '7701111111111',
      name: `Resultado para "${term}" 1`,
      price: 4500,
      taxRate: 0.19,
      stock: 10,
      unit: 'un',
      sku: 'SKU-000101',
      image: 'https://via.placeholder.com/50'
    }, {
      id: '102',
      barcode: '7702222222222',
      name: `Resultado para "${term}" 2`,
      price: 8900,
      taxRate: 0,
      stock: 5,
      unit: 'un',
      sku: 'SKU-000102',
      image: 'https://via.placeholder.com/50'
    }, {
      id: '103',
      barcode: '7703333333333',
      name: `Resultado para "${term}" 3`,
      price: 12500,
      taxRate: 0.05,
      stock: 2,
      unit: 'un',
      sku: 'SKU-000103',
      image: 'https://via.placeholder.com/50'
    }];
    setSearchResults(results);
    setIsLoading(false);
  };
  // Agregar producto desde búsqueda
  const addFromSearch = (product: Product) => {
    const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        product,
        quantity: 1
      }]);
    }
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
    showToast('success', `${product.name} agregado`);
  };
  // Manejar gestos touch para swipe
  const handleTouchStart = (e, index) => {
    touchStartRef.current = e.touches[0].clientX;
    touchItemRef.current = index;
    setIsSwipeActive(true);
  };
  const handleTouchMove = e => {
    if (touchItemRef.current === null || !isSwipeActive) return;
    const touchX = e.touches[0].clientX;
    const diff = touchStartRef.current - touchX;
    // Limitar el deslizamiento a la izquierda
    if (diff > 0) {
      setShowSwipeItem(touchItemRef.current);
      setSwipePosition(Math.min(diff, 100));
    } else {
      setSwipePosition(0);
    }
  };
  const handleTouchEnd = () => {
    if (swipePosition > 50 && showSwipeItem !== null) {
      // Si deslizó más del 50%, eliminar el item
      removeItem(showSwipeItem);
    }
    // Resetear estado
    setShowSwipeItem(null);
    setSwipePosition(0);
    touchItemRef.current = null;
    setIsSwipeActive(false);
  };
  // Handle client selection
  const handleClientSelected = client => {
    setSelectedClient(client);
    setShowClientSelector(false);
    showToast('success', `Cliente seleccionado: ${client.name}`);
  };
  // Add function to remove selected client
  const handleRemoveClient = () => {
    setSelectedClient(null);
    showToast('info', 'Cliente removido');
  };
  // Proceder al checkout
  const handleCheckout = () => {
    // Prepare cart data with client info if available
    const checkoutData = {
      items: cart,
      subtotal: subtotal,
      itemDiscountAmount: itemDiscountAmount,
      globalDiscount: globalDiscount,
      globalDiscountAmount: globalDiscountAmount,
      totalDiscountAmount: totalDiscountAmount,
      taxableAmount: taxableAmount,
      taxes: taxes,
      total: total,
      client: selectedClient ? {
        id: selectedClient.id,
        name: selectedClient.name,
        document: `${selectedClient.documentType} ${selectedClient.document}`,
        address: selectedClient.address || '',
        phone: selectedClient.phone || '',
        email: selectedClient.email || ''
      } : null
    };
    // Store cart data in session storage to ensure it's available on the checkout page
    sessionStorage.setItem('currentCart', JSON.stringify(cart));
    // Navigate to checkout with the data
    navigate('/checkout', {
      state: {
        checkoutData
      }
    });
  };
  return <div className="h-full flex flex-col bg-gray-50">
      {/* Mini-toast para escaneo */}
      {showScanToast && <ScanToast code={lastScannedCode} onClose={() => setShowScanToast(false)} />}
      {/* Indicador de modo offline */}
      {isOffline && <div className="bg-amber-100 text-amber-800 px-3 py-2 flex items-center justify-center text-sm mb-2 rounded-md">
          <WifiOffIcon size={16} className="mr-1" />
          <span>Sin conexión - Las ventas se guardarán localmente</span>
        </div>}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Nueva Venta</h1>
        {/* Client selector button */}
        <div className="flex items-center">
          <button onClick={() => setShowClientSelector(true)} className="flex items-center bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-200 text-sm">
            <UserIcon size={16} className="mr-1" />
            {selectedClient ? 'Cambiar cliente' : 'Seleccionar cliente'}
          </button>
        </div>
      </div>
      {/* Escáner / input de código de barras */}
      <div className="bg-white rounded-lg shadow-md p-2 mb-1.5">
        <div className="flex mb-1">
          <input type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleScan()} className="flex-1 px-3 py-1 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" placeholder="Código de barras" ref={barcodeInputRef} autoFocus />
          <button onClick={startCameraScanner} className="bg-blue-600 text-white px-2 py-1 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[40px]" disabled={isLoading}>
            <ScanIcon size={18} />
          </button>
        </div>
        <div className="flex items-center flex-wrap gap-1.5">
          {scanError && <span className="text-xs text-red-600 flex items-center">
              <AlertCircleIcon size={12} className="mr-1" />
              {scanError}
            </span>}
        </div>
      </div>
      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow-md p-1 mb-1.5 flex gap-1.5 overflow-x-auto">
        <button onClick={() => setShowCategoryModal(true)} className="flex-1 flex flex-col items-center justify-center p-1 rounded-lg hover:bg-gray-100 min-w-[65px] min-h-[38px]">
          <PlusCircleIcon size={14} className="text-blue-600 mb-0.5" />
          <span className="text-xs text-gray-700">Agregar manual</span>
        </button>
        <button onClick={() => setShowSearch(true)} className="flex-1 flex flex-col items-center justify-center p-1 rounded-lg hover:bg-gray-100 min-w-[65px] min-h-[38px]">
          <SearchIcon size={14} className="text-blue-600 mb-0.5" />
          <span className="text-xs text-gray-700">Buscar</span>
        </button>
        <button onClick={() => {
        if (user?.role === 'admin' || user?.role === 'supervisor') {
          addManualProduct(true);
        } else {
          setPinAction({
            type: 'open_price'
          });
          setShowPinModal(true);
        }
      }} className="flex-1 flex flex-col items-center justify-center p-1 rounded-lg hover:bg-gray-100 min-w-[65px] min-h-[38px] relative">
          <TagIcon size={14} className="text-blue-600 mb-0.5" />
          <span className="text-xs text-gray-700">Precio abierto</span>
          {user?.role !== 'admin' && user?.role !== 'supervisor' && <LockIcon size={8} className="absolute top-1 right-1 text-gray-500" />}
        </button>
      </div>
      {/* Lista de productos en el carrito */}
      <div className="flex-1 overflow-auto bg-white rounded-lg shadow-md mb-3" ref={cartRef}>
        {loadingProducts ? <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="animate-pulse flex flex-col">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-md mr-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="flex justify-between mt-2">
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
              </div>)}
          </div> : cart.length === 0 ? <div className="p-6 text-center flex flex-col items-center justify-center h-full">
            <ShoppingCartIcon size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">
              Escanea un producto o agrega manualmente
            </p>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setShowCategoryModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center">
                <PlusIcon size={18} className="mr-1" />
                Agregar producto
              </button>
            </div>
          </div> : <ul className="divide-y divide-gray-200">
            {cart.map((item, index) => <li key={index} className={`relative ${showSwipeItem === index ? 'bg-red-50' : 'bg-white'}`} style={{
          transform: showSwipeItem === index ? `translateX(-${swipePosition}px)` : 'none',
          transition: 'transform 0.2s ease-out'
        }} onTouchStart={e => handleTouchStart(e, index)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                {/* Acción de swipe */}
                {showSwipeItem === index && <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 text-white" style={{
            width: `${swipePosition}px`
          }}>
                    <TrashIcon size={24} />
                  </div>}
                <div className="p-3">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.product.image ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" /> : <PackageIcon size={20} className="text-gray-400" />}
                    </div>
                    <div className="ml-2 flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start">
                        <h3 className="font-medium text-gray-800 text-sm mr-1 truncate">
                          {item.product.name}
                          {item.discount && <span className="ml-1 text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">
                              -{item.discount}%
                            </span>}
                        </h3>
                        <span className="font-medium text-gray-800 text-sm whitespace-nowrap">
                          {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0
                    }).format(item.product.price * item.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mb-1 flex-wrap">
                        <span className="mr-1">{item.product.sku}</span>
                        <div className="flex items-center flex-wrap">
                          <span className="mr-1">
                            {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0
                      }).format(item.product.price)}
                          </span>
                          {item.product.taxRate > 0 && <span className="mr-1 text-xs bg-blue-50 text-blue-600 px-1 py-0.5 rounded">
                              +{item.product.taxRate * 100}%
                            </span>}
                          {item.product.stock < 5 && <span className="text-xs bg-amber-50 text-amber-600 px-1 py-0.5 rounded">
                              Stock: {item.product.stock}
                            </span>}
                        </div>
                      </div>
                      {/* Notes section */}
                      {(item.note || item.discount) && <div className="mt-1 mb-2">
                          {item.note && <p className="text-xs text-gray-500 italic">
                              Nota: {item.note}
                            </p>}
                          {item.discount && <p className="text-xs text-green-500">
                              Descuento: {item.discount}% (-
                              {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0
                    }).format(item.product.price * item.quantity * (item.discount / 100))}
                              )
                            </p>}
                        </div>}
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button onClick={() => updateQuantity(index, item.quantity - 1)} className="p-1 bg-gray-100 hover:bg-gray-200 min-w-[24px] min-h-[24px] flex items-center justify-center" aria-label="Disminuir cantidad">
                            <MinusIcon size={14} />
                          </button>
                          <span className="px-2 py-0.5 min-w-[24px] text-center font-medium text-xs">
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQuantity(index, item.quantity + 1)} className="p-1 bg-gray-100 hover:bg-gray-200 min-w-[24px] min-h-[24px] flex items-center justify-center" aria-label="Aumentar cantidad">
                            <PlusIcon size={14} />
                          </button>
                        </div>
                        <button onClick={() => {
                    const note = prompt('Agregar nota:', item.note || '');
                    if (note !== null) {
                      addNote(index, note);
                    }
                  }} className="p-1 rounded-lg hover:bg-gray-100 min-w-[24px] min-h-[24px] flex items-center justify-center" aria-label="Agregar nota">
                          <PenIcon size={14} className="text-gray-600" />
                        </button>
                        <button onClick={() => {
                    const discount = prompt('Descuento (%):', item.discount?.toString() || '0');
                    if (discount !== null) {
                      const discountValue = parseInt(discount);
                      if (!isNaN(discountValue) && discountValue >= 0 && discountValue <= 100) {
                        applyDiscount(index, discountValue);
                      } else {
                        showToast('error', 'Descuento inválido');
                      }
                    }
                  }} className="p-1 rounded-lg hover:bg-gray-100 min-w-[24px] min-h-[24px] flex items-center justify-center relative" aria-label="Aplicar descuento">
                          <PercentIcon size={14} className="text-gray-600" />
                          {user?.role !== 'admin' && user?.role !== 'supervisor' && <LockIcon size={8} className="absolute top-0 right-0 text-gray-500" />}
                        </button>
                        <button onClick={() => removeItem(index)} className="p-1 rounded-lg hover:bg-red-50 min-w-[24px] min-h-[24px] flex items-center justify-center" aria-label="Eliminar">
                          <TrashIcon size={14} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>)}
          </ul>}
      </div>
      {/* Resumen y totales (sticky) */}
      <div className="bg-white rounded-lg shadow-md p-2 sticky bottom-0 border-t border-gray-200">
        {/* Display selected client info in the checkout section as well */}
        {selectedClient && <div className="mb-1 border-b border-gray-200 pb-1">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-600">
                Cliente:{' '}
                <span className="font-medium">{selectedClient.name}</span>
              </p>
              <div className="flex gap-1">
                <button onClick={() => setShowClientSelector(true)} className="text-blue-600 hover:text-blue-700 text-xs underline">
                  Cambiar
                </button>
                <button onClick={handleRemoveClient} className="text-red-600 hover:text-red-700 text-xs underline ml-2">
                  Quitar
                </button>
              </div>
            </div>
          </div>}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Ítems:</span>
            <span className="font-medium">{itemCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>
              {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(subtotal)}
            </span>
          </div>
          {itemDiscountAmount > 0 && <div className="flex justify-between text-green-600">
              <span>Descuentos por ítem:</span>
              <span>
                -
                {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(itemDiscountAmount)}
              </span>
            </div>}
          {globalDiscount > 0 && <div className="flex justify-between text-green-600">
              <span>Descuento global ({globalDiscount}%):</span>
              <span>
                -
                {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(globalDiscountAmount)}
              </span>
            </div>}
          <div className="flex justify-between">
            <span className="text-gray-600">IVA:</span>
            <span>
              {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(taxes)}
            </span>
          </div>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
          <span>Total:</span>
          <span>
            {new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
          }).format(total)}
          </span>
        </div>
        <div className="relative">
          <button onClick={handleCheckout} disabled={cart.length === 0 || !isCashRegisterOpen} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center">
            <span>Proceder al cobro</span>
            <ArrowRightIcon size={18} className="ml-1.5" />
          </button>
          {!isCashRegisterOpen && cart.length > 0 && <div className="absolute inset-0 flex items-center justify-center mt-3 bg-gray-800 bg-opacity-70 rounded-lg text-white text-sm">
              <DollarSignIcon size={16} className="mr-1" />
              <span>Abre caja para cobrar</span>
            </div>}
        </div>
      </div>
      {/* Modal de cámara para escanear */}
      {showCameraScanner && <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col">
          <div className="flex justify-between items-center bg-gray-900 p-4 text-white">
            <h3 className="text-lg font-medium">Escanear código de barras</h3>
            <button onClick={stopCameraScanner} className="text-white p-2 rounded-full hover:bg-gray-800">
              <XIcon size={24} />
            </button>
          </div>
          <div className="flex-1 relative">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"></video>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 max-w-sm h-1/4 border-2 border-white rounded-lg flex items-center justify-center">
                <div className="w-full h-1 bg-red-500 animate-pulse"></div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <p className="text-white text-center mb-4">
                Alinee el código de barras dentro del recuadro
              </p>
              <button onClick={() => {
            // Aquí simularemos un escaneo exitoso
            stopCameraScanner();
            setBarcodeInput('7701234567890');
            setTimeout(() => handleScan(), 100);
          }} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium">
                Simular escaneo
              </button>
            </div>
          </div>
        </div>}
      {/* Modal de categorías y productos */}
      <CategoryProductsModal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} onAddProduct={addProductFromCategory} />
      {/* Modal de búsqueda */}
      {showSearch && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">
                Buscar productos
              </h3>
              <button onClick={() => {
            setShowSearch(false);
            setSearchTerm('');
            setSearchResults([]);
          }} className="text-gray-400 hover:text-gray-500 p-1">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex mb-4">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && searchProducts(searchTerm)} className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre o código" autoFocus />
                <button onClick={() => searchProducts(searchTerm)} className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <SearchIcon size={20} />
                </button>
              </div>
              {isLoading ? <div className="py-4 text-center">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                  <p className="mt-2 text-gray-500">Buscando productos...</p>
                </div> : <div>
                  {searchResults.length === 0 ? searchTerm ? <p className="text-center py-4 text-gray-500">
                        No se encontraron productos
                      </p> : <p className="text-center py-4 text-gray-500">
                        Ingrese un término de búsqueda
                      </p> : <ul className="divide-y divide-gray-200 max-h-96 overflow-auto">
                      {searchResults.map(product => <li key={product.id} className="py-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md mr-3 flex items-center justify-center overflow-hidden">
                              {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <PackageIcon size={20} className="text-gray-400" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{product.name}</h4>
                              <div className="flex items-center text-sm text-gray-600">
                                <span>{product.sku}</span>
                                <span className="mx-1">•</span>
                                <span>
                                  {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0
                        }).format(product.price)}
                                </span>
                                {product.stock < 5 && <span className="ml-2 text-xs bg-amber-50 text-amber-600 px-1 py-0.5 rounded">
                                    Stock: {product.stock}
                                  </span>}
                              </div>
                            </div>
                            <button onClick={() => addFromSearch(product)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 min-w-[44px] min-h-[44px] flex items-center justify-center">
                              <PlusIcon size={20} />
                            </button>
                          </div>
                        </li>)}
                    </ul>}
                </div>}
            </div>
          </div>
        </div>}
      {/* Client Selector Modal */}
      {showClientSelector && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">
                Seleccionar Cliente
              </h3>
              <button onClick={() => setShowClientSelector(false)} className="text-gray-400 hover:text-gray-500">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <ClientSelector onSelectClient={handleClientSelected} />
            </div>
          </div>
        </div>}
      {/* Global Discount Modal */}
      {showGlobalDiscountModal && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">
                Aplicar descuento global
              </h3>
              <button onClick={() => setShowGlobalDiscountModal(false)} className="text-gray-400 hover:text-gray-500">
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                El descuento se aplicará sobre el total de la venta después de
                aplicar los descuentos individuales por ítem.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de descuento
                </label>
                <div className="flex items-center">
                  <input type="number" min="0" max="100" value={globalDiscount} onChange={e => setGlobalDiscount(Number(e.target.value))} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  <span className="ml-2 text-gray-600">%</span>
                </div>
              </div>
              {globalDiscount > 0 && <div className="bg-green-50 p-3 rounded-lg mb-4">
                  <p className="text-green-700 font-medium">
                    Descuento:{' '}
                    {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
              }).format(subtotal * (globalDiscount / 100))}
                  </p>
                  <p className="text-green-700">
                    Nuevo total:{' '}
                    {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
              }).format(subtotal - subtotal * (globalDiscount / 100) + taxes)}
                  </p>
                </div>}
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowGlobalDiscountModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={() => applyGlobalDiscount(globalDiscount)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Aplicar descuento
                </button>
              </div>
            </div>
          </div>
        </div>}
      {/* Modal de PIN */}
      {showPinModal && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xs mx-4 p-4">
            <h3 className="text-lg font-medium mb-3">
              Ingrese PIN de supervisor
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta acción requiere autorización de supervisor
            </p>
            <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" placeholder="PIN" maxLength={4} autoFocus onKeyPress={e => {
          if (e.key === 'Enter') {
            verifyPin((e.target as HTMLInputElement).value);
          }
        }} />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowPinModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={e => {
            const input = (e.target as HTMLElement).closest('div')?.previousElementSibling as HTMLInputElement;
            if (input) {
              verifyPin(input.value);
            }
          }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Verificar
              </button>
            </div>
          </div>
        </div>}
    </div>;
};
export default SalesPage;