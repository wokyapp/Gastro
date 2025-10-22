import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCardIcon, BanknoteIcon, CheckIcon, XIcon, SmartphoneIcon, ArrowLeftIcon, ArrowRightIcon, AlertCircleIcon } from 'lucide-react';
import { processSale } from '../utils/api';
const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [vatResponsible, setVatResponsible] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [wantsToReceiveEmail, setWantsToReceiveEmail] = useState(true);
  const [includeIva, setIncludeIva] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [digitalPaymentMethod, setDigitalPaymentMethod] = useState('nequi');
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [transactionReference, setTransactionReference] = useState('');
  const [cardLastDigits, setCardLastDigits] = useState('');
  const [cardAuthCode, setCardAuthCode] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [total, setTotal] = useState(0);
  const [clientInfo, setClientInfo] = useState(null);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const navigate = useNavigate();
  // Store information for invoice
  const storeInfo = {
    name: 'Mi Tienda S.A.S',
    nit: '900.123.456-7',
    address: 'Calle Principal #123, Bogotá',
    phone: '(601) 123-4567',
    email: 'contacto@mitienda.com'
  };
  // Load cart and sale data from location state or sessionStorage
  useEffect(() => {
    // First try to get data from location state (passed from SalesPage)
    if (location.state?.checkoutData) {
      const {
        checkoutData
      } = location.state;
      setCart(checkoutData.items || []);
      setSubtotal(checkoutData.subtotal || 0);
      setTaxes(checkoutData.taxes || 0);
      setTotal(checkoutData.total || 0);
      setClientInfo(checkoutData.client || null);
      setGlobalDiscount(checkoutData.globalDiscount || 0);
      setDiscountAmount(checkoutData.totalDiscountAmount || 0);
      // If client info includes document info, pre-fill invoice fields
      if (checkoutData.client) {
        setNeedsInvoice(true);
        setCustomerName(checkoutData.client.name || '');
        if (checkoutData.client.document) {
          const docParts = checkoutData.client.document.split(' ');
          if (docParts.length === 2) {
            setDocumentType(docParts[0]);
            setDocumentNumber(docParts[1]);
          }
        }
        if (checkoutData.client.address) {
          setCustomerAddress(checkoutData.client.address);
        }
        if (checkoutData.client.email) {
          setCustomerEmail(checkoutData.client.email);
          setWantsToReceiveEmail(true);
        }
      }
    } else {
      // Fallback to sessionStorage
      const savedCart = sessionStorage.getItem('currentCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        // Calculate totals if we only have the cart
        const calcSubtotal = parsedCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const calcTaxes = parsedCart.reduce((sum, item) => {
          const itemSubtotal = item.product.price * item.quantity;
          return sum + itemSubtotal * item.product.taxRate;
        }, 0);
        setSubtotal(calcSubtotal);
        setTaxes(calcTaxes);
        setTotal(calcSubtotal + calcTaxes);
      } else {
        // Redirect if no cart data is available
        navigate('/ventas');
      }
    }
  }, [location]);
  // Calculate change when amount received changes
  useEffect(() => {
    if (paymentMethod === 'efectivo' && amountReceived) {
      const received = parseFloat(amountReceived.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(received) && received >= total) {
        setChange(received - total);
      } else {
        setChange(0);
      }
    } else {
      setChange(0);
    }
  }, [amountReceived, total, paymentMethod]);
  // Format amount with decimals in the format 4.645,00
  const formatAmount = value => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    // Convert to number and divide by 100 to get the decimal value
    const numberValue = parseFloat(numericValue) / 100;
    // Format with thousands separator and two decimal places
    return numberValue.toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  // Move to next step
  const goToNextStep = () => {
    if (currentStep === 1) {
      // Validate payment method selection
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate payment confirmation
      if (!isPaymentConfirmed) {
        setError('Debe confirmar el pago antes de continuar');
        return;
      }
      completeSale();
    }
  };
  // Go back to previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    } else {
      navigate('/ventas');
    }
  };
  // Confirm payment
  const confirmPayment = () => {
    if (paymentMethod === 'efectivo') {
      const received = parseFloat(amountReceived.replace(/\./g, '').replace(',', '.'));
      if (isNaN(received) || received < total) {
        setError('El monto recibido debe ser mayor o igual al total');
        return;
      }
    } else if (paymentMethod === 'tarjeta') {
      if (!cardLastDigits.trim() || !cardAuthCode.trim()) {
        setError('Complete los datos de la tarjeta para confirmar el pago');
        return;
      }
      if (cardLastDigits.length !== 4 || !/^\d+$/.test(cardLastDigits)) {
        setError('Ingrese los últimos 4 dígitos de la tarjeta correctamente');
        return;
      }
    } else if (paymentMethod === 'digital') {
      if (!transactionReference.trim()) {
        setError('Debe ingresar la referencia de la transacción');
        return;
      }
    }
    setIsPaymentConfirmed(true);
    setError('');
  };
  // Complete sale
  const completeSale = async () => {
    if (needsInvoice || invoiceRequested) {
      // Validate required fields for invoice
      if (!documentNumber) {
        setError('Debe ingresar un número de documento para la factura');
        return;
      }
      if (!customerName) {
        setError('Debe ingresar un nombre o razón social para la factura');
        return;
      }
      if (customerEmail && !/\S+@\S+\.\S+/.test(customerEmail)) {
        setError('El correo electrónico ingresado no es válido');
        return;
      }
      if (invoiceRequested && !customerAddress) {
        setError('La dirección es requerida para facturación electrónica');
        return;
      }
      if (invoiceRequested && vatResponsible && !companyId) {
        setError('El NIT con DV es requerido para responsables de IVA');
        return;
      }
    }
    setIsProcessing(true);
    setError('');
    try {
      // Calculate final taxes based on IVA preference
      const finalTaxes = invoiceRequested && !includeIva ? 0 : taxes;
      const finalTotal = subtotal + finalTaxes;
      // Prepare sale data
      const saleData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          taxRate: invoiceRequested && !includeIva ? 0 : item.product.taxRate,
          discount: item.discount || 0
        })),
        subtotal,
        taxes: finalTaxes,
        total: finalTotal,
        globalDiscount,
        discountAmount,
        paymentMethod: paymentMethod === 'digital' ? digitalPaymentMethod : paymentMethod,
        amountReceived: paymentMethod === 'efectivo' ? parseFloat(amountReceived.replace(/\./g, '').replace(',', '.')) : finalTotal,
        change: paymentMethod === 'efectivo' ? change : 0,
        transactionReference: paymentMethod === 'digital' ? transactionReference : '',
        cardLastDigits: paymentMethod === 'tarjeta' ? cardLastDigits : '',
        cardAuthCode: paymentMethod === 'tarjeta' ? cardAuthCode : '',
        invoiceRequested: needsInvoice || invoiceRequested,
        includeIva: includeIva,
        documentType: needsInvoice || invoiceRequested ? documentType : null,
        documentNumber: needsInvoice || invoiceRequested ? documentNumber : null,
        customerName: needsInvoice || invoiceRequested ? customerName : null,
        customerEmail: needsInvoice || invoiceRequested && wantsToReceiveEmail ? customerEmail : null,
        customerAddress: needsInvoice || invoiceRequested ? customerAddress : null,
        vatResponsible: invoiceRequested ? vatResponsible : false,
        companyId: invoiceRequested && vatResponsible ? companyId : null,
        wantsToReceiveEmail: invoiceRequested ? wantsToReceiveEmail : false,
        client: clientInfo,
        // Add PTA required fields
        ptaData: invoiceRequested ? {
          businessLine: 'Comercio minorista',
          operationType: '10',
          paymentMethod: paymentMethod === 'efectivo' ? '10' : paymentMethod === 'tarjeta' ? '20' : '31',
          paymentDueDate: new Date().toISOString().split('T')[0],
          municipality: '11001',
          contractType: 'Venta directa',
          orderReference: `ORD-${Date.now()}`,
          additionalNotes: '',
          technicalKey: '9d3b2c1a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0',
          softwareID: 'e7d6c5b4-a3b2-c1d0-e9f8-g7h6i5j4k3l2',
          testSetId: '',
          // Add AccountingCustomerParty data for PTA
          accountingCustomerParty: {
            documentType: documentType,
            documentNumber: documentNumber,
            name: customerName,
            address: customerAddress,
            vatResponsible: vatResponsible,
            companyId: vatResponsible ? companyId : null,
            email: wantsToReceiveEmail ? customerEmail : null
          }
        } : null
      };
      // Process sale
      const result = await processSale(saleData);
      if (result.success) {
        // Clear cart from session storage
        sessionStorage.removeItem('currentCart');
        // Navigate to ticket page
        navigate(`/ticket/${result.saleId}`);
      } else {
        setError('Error al procesar la venta');
      }
    } catch (err) {
      console.error('Error al completar venta:', err);
      setError('Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };
  // Calculate effective IVA rate for display purposes
  const calculateEffectiveIVARate = () => {
    if (subtotal === 0) return 0;
    return taxes / subtotal * 100;
  };
  // Render step 1: Payment method selection
  const renderStep1 = () => <>
      {/* Método de pago */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Método de pago
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => setPaymentMethod('efectivo')} className={`flex flex-col items-center justify-center p-3 rounded-lg border ${paymentMethod === 'efectivo' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700'}`}>
            <BanknoteIcon size={24} className="mb-2" />
            <span>Efectivo</span>
          </button>
          <button onClick={() => setPaymentMethod('tarjeta')} className={`flex flex-col items-center justify-center p-3 rounded-lg border ${paymentMethod === 'tarjeta' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700'}`}>
            <CreditCardIcon size={24} className="mb-2" />
            <span>Tarjeta</span>
          </button>
          <button onClick={() => setPaymentMethod('digital')} className={`flex flex-col items-center justify-center p-3 rounded-lg border ${paymentMethod === 'digital' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700'}`}>
            <SmartphoneIcon size={24} className="mb-2" />
            <span>Pago digital</span>
          </button>
        </div>
        {/* Card type selection */}
        {paymentMethod === 'tarjeta' && <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de tarjeta
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDigitalPaymentMethod('credito')} className={`flex items-center justify-center p-2 rounded-lg border ${digitalPaymentMethod === 'credito' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700'}`}>
                <span>Crédito</span>
              </button>
              <button onClick={() => setDigitalPaymentMethod('debito')} className={`flex items-center justify-center p-2 rounded-lg border ${digitalPaymentMethod === 'debito' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700'}`}>
                <span>Débito</span>
              </button>
            </div>
          </div>}
        {paymentMethod === 'digital' && <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccione plataforma
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setDigitalPaymentMethod('nequi')} className={`flex items-center justify-center p-2 rounded-lg border ${digitalPaymentMethod === 'nequi' ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-gray-300 text-gray-700'}`}>
                <span>Nequi</span>
              </button>
              <button onClick={() => setDigitalPaymentMethod('daviplata')} className={`flex items-center justify-center p-2 rounded-lg border ${digitalPaymentMethod === 'daviplata' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 text-gray-700'}`}>
                <span>Daviplata</span>
              </button>
              <button onClick={() => setDigitalPaymentMethod('otro')} className={`flex items-center justify-center p-2 rounded-lg border ${digitalPaymentMethod === 'otro' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700'}`}>
                <span>Otro</span>
              </button>
            </div>
          </div>}
      </div>
      {/* Factura electrónica */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Facturación
        </h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input type="checkbox" id="invoiceRequested" checked={invoiceRequested} onChange={e => setInvoiceRequested(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="invoiceRequested" className="ml-2 block text-gray-700">
              Generar factura electrónica
            </label>
          </div>
          {invoiceRequested && <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700 mb-2">
                La factura electrónica se generará automáticamente.
              </p>
              {/* Add IVA option */}
              <div className="flex items-center mt-2 mb-2">
                <input type="checkbox" id="includeIva" checked={includeIva} onChange={e => setIncludeIva(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="includeIva" className="ml-2 block text-sm text-blue-700">
                  Incluir IVA en la factura
                </label>
              </div>
              {/* Display tax impact */}
              {!includeIva && <div className="bg-amber-50 border border-amber-100 rounded p-2 mb-2 text-xs text-amber-700">
                  Al no incluir IVA, el total a pagar será{' '}
                  {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(subtotal)}{' '}
                  en lugar de{' '}
                  {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(subtotal + taxes)}
                </div>}
              <div className="flex items-center mt-2">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-blue-200 h-3 w-3"></div>
                </div>
                <span className="ml-2 text-xs text-blue-600">
                  PTA conectado y listo para enviar
                </span>
              </div>
            </div>}
        </div>
      </div>
      {/* Display client information if available */}
      {clientInfo && <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <h3 className="font-medium text-blue-700 mb-2">
            Información del cliente
          </h3>
          <p className="text-sm text-blue-600">{clientInfo.name}</p>
          <p className="text-sm text-blue-600">{clientInfo.document}</p>
          {clientInfo.address && <p className="text-sm text-blue-600">
              Dirección: {clientInfo.address}
            </p>}
          {clientInfo.phone && <p className="text-sm text-blue-600">
              Teléfono: {clientInfo.phone}
            </p>}
        </div>}
      {(needsInvoice || invoiceRequested) && !clientInfo && <div className="space-y-3">
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de documento
            </label>
            <select id="documentType" value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="NIT">NIT</option>
              <option value="PP">Pasaporte</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="RUT">Registro Único Tributario</option>
            </select>
          </div>
          <div>
            <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Número de documento
            </label>
            <input id="documentNumber" type="text" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ingrese el número" />
          </div>
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre/Razón social
            </label>
            <input id="customerName" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ingrese nombre completo o razón social" />
          </div>
          <div>
            <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input id="customerAddress" type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ingrese la dirección completa" />
          </div>
          {invoiceRequested && <div className="flex items-center my-2">
              <input type="checkbox" id="vatResponsible" checked={vatResponsible} onChange={e => setVatResponsible(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="vatResponsible" className="ml-2 block text-sm text-gray-700">
                Responsable de IVA
              </label>
            </div>}
          {invoiceRequested && vatResponsible && <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                NIT
              </label>
              <input id="companyId" type="text" value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: 900123456-7" />
              <p className="text-xs text-gray-500 mt-1">
                Ingrese el NIT con el dígito de verificación separado por guion
              </p>
            </div>}
          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input id="customerEmail" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="correo@ejemplo.com" />
          </div>
          {invoiceRequested && customerEmail && <div className="flex items-center my-2">
              <input type="checkbox" id="wantsToReceiveEmail" checked={wantsToReceiveEmail} onChange={e => setWantsToReceiveEmail(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="wantsToReceiveEmail" className="ml-2 block text-sm text-gray-700">
                Desea recibir la factura por correo electrónico
              </label>
            </div>}
        </div>}
    </>;
  // Render step 2: Payment confirmation
  const renderStep2 = () => <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Confirmar pago
      </h2>
      {paymentMethod === 'efectivo' && <div className="space-y-4">
          <div>
            <label htmlFor="amountReceived" className="block text-sm font-medium text-gray-700 mb-1">
              Monto recibido
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input id="amountReceived" type="text" value={amountReceived} onChange={e => setAmountReceived(formatAmount(e.target.value))} className="pl-7 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0,00" disabled={isPaymentConfirmed} required />
            </div>
            {parseFloat(amountReceived.replace(/\./g, '').replace(',', '.')) < (invoiceRequested && !includeIva ? subtotal : total) && amountReceived !== '' && <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircleIcon size={16} className="mr-1" />
                  El monto recibido es menor al total
                </p>}
          </div>
          {change > 0 && <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-1">
                Cambio a entregar
              </h3>
              <p className="text-2xl font-bold text-green-700">
                {new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(change)}
              </p>
            </div>}
        </div>}
      {paymentMethod === 'tarjeta' && <div className="space-y-4">
          <div>
            <label htmlFor="cardLastDigits" className="block text-sm font-medium text-gray-700 mb-1">
              Últimos 4 dígitos de la tarjeta
            </label>
            <input id="cardLastDigits" type="text" value={cardLastDigits} onChange={e => {
          const value = e.target.value.replace(/\D/g, '');
          setCardLastDigits(value.slice(0, 4));
        }} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0000" maxLength={4} disabled={isPaymentConfirmed} required />
          </div>
          <div>
            <label htmlFor="cardAuthCode" className="block text-sm font-medium text-gray-700 mb-1">
              Código de autorización
            </label>
            <input id="cardAuthCode" type="text" value={cardAuthCode} onChange={e => setCardAuthCode(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Código de autorización" disabled={isPaymentConfirmed} required />
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              Verifique que la transacción haya sido aprobada antes de
              confirmar.
            </p>
          </div>
        </div>}
      {paymentMethod === 'digital' && <div className="space-y-4">
          <div>
            <label htmlFor="transactionReference" className="block text-sm font-medium text-gray-700 mb-1">
              Referencia de transacción
            </label>
            <input id="transactionReference" type="text" value={transactionReference} onChange={e => setTransactionReference(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Referencia o número de transacción" disabled={isPaymentConfirmed} required />
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              Verifique que haya recibido el pago en{' '}
              {digitalPaymentMethod === 'nequi' ? 'Nequi' : digitalPaymentMethod === 'daviplata' ? 'Daviplata' : 'la plataforma digital'}{' '}
              antes de confirmar.
            </p>
          </div>
        </div>}
      {/* PTA Data Entry Section when electronic invoice is requested */}
      {invoiceRequested && <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-md font-semibold text-gray-800 mb-3">
            Datos para Facturación Electrónica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Línea de negocio
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="Comercio minorista">
                <option>Comercio minorista</option>
                <option>Servicios profesionales</option>
                <option>Manufactura</option>
                <option>Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de operación
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="10">
                <option value="10">Estándar</option>
                <option value="20">Contingencia</option>
                <option value="30">Exportación</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Municipio
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="11001">
                <option value="11001">Bogotá</option>
                <option value="05001">Medellín</option>
                <option value="76001">Cali</option>
                <option value="08001">Barranquilla</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de contrato
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="Venta directa">
                <option>Venta directa</option>
                <option>Prestación de servicios</option>
                <option>Arrendamiento</option>
                <option>Otro</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales para la factura
              </label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Información adicional que aparecerá en la factura electrónica..."></textarea>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Información técnica PTA
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-blue-700">Clave técnica:</span>
                <span className="ml-1 font-mono">
                  9d3b2c1a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0
                </span>
              </div>
              <div>
                <span className="text-blue-700">Software ID:</span>
                <span className="ml-1 font-mono">
                  e7d6c5b4-a3b2-c1d0-e9f8-g7h6i5j4k3l2
                </span>
              </div>
            </div>
          </div>
        </div>}
      {!isPaymentConfirmed ? <button onClick={confirmPayment} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
          <CheckIcon size={20} className="mr-2" />
          Confirmar pago recibido
        </button> : <div className="mt-4 bg-green-100 border-l-4 border-green-500 p-4 flex items-center">
          <CheckIcon size={20} className="text-green-600 mr-2" />
          <span className="text-green-800 font-medium">Pago confirmado</span>
        </div>}
    </div>;
  return <div className="h-full flex flex-col">
      {/* Encabezado con pasos */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Finalizar Venta
        </h1>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`h-1 flex-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Método de pago</span>
          <span>Confirmar pago</span>
        </div>
      </div>
      {/* Client info if available - Make it more prominent */}
      {clientInfo && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <h3 className="font-medium text-blue-800 mb-1">
            Información del Cliente
          </h3>
          <div className="flex flex-col">
            <p className="text-blue-700 font-medium">{clientInfo.name}</p>
            {clientInfo.document && <p className="text-sm text-blue-600">{clientInfo.document}</p>}
            {clientInfo.address && <p className="text-sm text-blue-600">
                Dirección: {clientInfo.address}
              </p>}
            {clientInfo.phone && <p className="text-sm text-blue-600">
                Teléfono: {clientInfo.phone}
              </p>}
            {clientInfo.email && <p className="text-sm text-blue-600">Email: {clientInfo.email}</p>}
          </div>
        </div>}
      {/* Resumen de productos */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Resumen de productos
        </h2>
        <div className="max-h-48 overflow-y-auto mb-3">
          <table className="w-full text-sm">
            <thead className="text-left border-b border-gray-200">
              <tr>
                <th className="pb-2">Producto</th>
                <th className="pb-2 text-center">Cant.</th>
                <th className="pb-2 text-right">Precio</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cart.map((item, index) => <tr key={index}>
                  <td className="py-2">
                    {item.product.name}
                    {item.discount > 0 && <span className="ml-1 text-xs text-green-600">
                        (-{item.discount}%)
                      </span>}
                    <div className="text-xs text-gray-500">
                      IVA: {(item.product.taxRate * 100).toFixed(0)}% (
                      {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(item.product.price * item.quantity * item.product.taxRate)}
                      )
                    </div>
                  </td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">
                    {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0
                }).format(item.product.price)}
                  </td>
                  <td className="py-2 text-right">
                    {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0
                }).format(item.product.price * item.quantity)}
                    {item.discount > 0 && <div className="text-xs text-green-600">
                        Desc:{' '}
                        {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  }).format(item.product.price * item.quantity * (item.discount / 100))}
                      </div>}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 pt-3 space-y-1">
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
          {discountAmount > 0 && <div className="flex justify-between text-green-600">
              <span>Descuentos por ítem:</span>
              <span>
                -
                {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(discountAmount - (globalDiscount > 0 ? (subtotal - discountAmount) * (globalDiscount / 100) : 0))}
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
            }).format((subtotal - (discountAmount - (globalDiscount > 0 ? (subtotal - discountAmount) * (globalDiscount / 100) : 0))) * (globalDiscount / 100))}
              </span>
            </div>}
          <div className="flex justify-between">
            <span className="text-gray-600">
              IVA ({calculateEffectiveIVARate().toFixed(1)}%):
            </span>
            <span>
              {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(taxes)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-1 border-t border-gray-200">
            <span>Total:</span>
            <span>
              {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }).format(total)}
            </span>
          </div>
        </div>
      </div>
      {/* Contenido según el paso actual */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {/* Errores */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>}
      {/* Botones de acción */}
      <div className="mt-auto grid grid-cols-2 gap-3">
        <button onClick={goToPreviousStep} className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center">
          {currentStep === 1 ? <>
              <ArrowLeftIcon size={16} className="mr-1" />
              Volver
            </> : <>
              <ArrowLeftIcon size={16} className="mr-1" />
              Anterior
            </>}
        </button>
        <button onClick={goToNextStep} disabled={isProcessing || currentStep === 2 && !isPaymentConfirmed} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center">
          {isProcessing ? 'Procesando...' : currentStep === 1 ? <>
              Siguiente
              <ArrowRightIcon size={16} className="ml-1" />
            </> : 'Finalizar venta'}
        </button>
      </div>
    </div>;
};
export default CheckoutPage;