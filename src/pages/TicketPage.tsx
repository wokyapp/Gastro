import React, { useEffect, useState, createElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MailIcon, QrCodeIcon, PrinterIcon, CheckIcon, PhoneIcon } from 'lucide-react';
import { generateTicket } from '../utils/api';
// Store information
const storeInfo = {
  name: 'Mi Tienda S.A.S',
  nit: '900.123.456-7',
  address: 'Calle Principal #123, Bogotá',
  phone: '(601) 123-4567',
  email: 'contacto@mitienda.com'
};
const TicketPage: React.FC = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [saleData, setSaleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState('');
  const [ticketMethod, setTicketMethod] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  // QR code state
  const [showQR, setShowQR] = useState(false);
  const [qrValue, setQrValue] = useState('');
  // Función para formatear números con separadores de miles
  const formatNumberInput = (value: string, setter: (val: string) => void) => {
    // Eliminar caracteres no numéricos
    const numericValue = value.replace(/\D/g, '');
    setter(numericValue);
  };
  // Simular carga de datos de venta
  useEffect(() => {
    const loadSaleData = async () => {
      // En un caso real, esto cargaría los datos de la venta desde la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Datos simulados para la demostración
      setSaleData({
        id: id || 'SALE-123456789',
        date: new Date().toISOString(),
        items: [{
          id: '1',
          name: 'Arroz Premium 1kg',
          quantity: 2,
          price: 5600,
          taxRate: 0.05,
          total: 11200,
          discount: 5 // Discount percentage
        }, {
          id: '4',
          name: 'Leche Entera 1L',
          quantity: 1,
          price: 3800,
          taxRate: 0,
          total: 3800,
          discount: 0
        }],
        subtotal: 15000,
        taxes: 560,
        discountAmount: 560,
        total: 15000,
        paymentMethod: 'efectivo',
        posId: `POS-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        invoiceRequested: false,
        globalDiscount: 0,
        client: {
          name: 'Juan Pérez',
          documentType: 'CC',
          document: '1234567890',
          address: 'Calle Cliente #456, Bogotá',
          phone: '3101234567',
          email: 'cliente@ejemplo.com',
          identifier: 'CLI-001'
        }
      });
      setLoading(false);
    };
    loadSaleData();
  }, [id]);
  // Generar ticket
  const handleGenerateTicket = async method => {
    setTicketMethod(method);
    setIsGenerating(true);
    try {
      // Si el método requiere contacto y no se ha proporcionado
      if ((method === 'whatsapp' || method === 'email') && !contact) {
        return;
      }
      const result = await generateTicket(id, method);
      if (result.success) {
        setSuccess(true);
        // Acciones específicas según el método
        if (method === 'print') {
          // Simular impresión
          setTimeout(() => {
            window.print();
          }, 500);
        } else if (method === 'qr') {
          // Generar un QR con URL simulada
          setQrValue(`https://micropos.demo/ticket/${id || 'SALE-123456789'}`);
          setShowQR(true);
        } else if (method === 'whatsapp') {
          // Simular envío por WhatsApp
          showToast(`Ticket enviado por WhatsApp al número ${contact}`);
        } else if (method === 'email') {
          // Simular envío por Email
          showToast(`Ticket enviado por email a ${contact}`);
        }
      }
    } catch (error) {
      console.error('Error al generar ticket:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  // Función para mostrar toast (simulado)
  const showToast = message => {
    const toastDiv = document.createElement('div');
    toastDiv.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50';
    toastDiv.innerHTML = message;
    document.body.appendChild(toastDiv);
    setTimeout(() => {
      toastDiv.remove();
    }, 3000);
  };
  // Volver al inicio
  const handleFinish = () => {
    navigate('/dashboard');
  };
  if (loading) {
    return <div className="h-full flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando información...</p>
        </div>
      </div>;
  }
  return <div className="h-full flex flex-col">
      <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
        <div className="flex">
          <CheckIcon className="text-green-600 mr-2" size={24} />
          <div>
            <p className="font-bold text-green-700">
              ¡Venta completada con éxito!
            </p>
            <p className="text-green-600">
              Documento Equivalente POS: {saleData.posId}
            </p>
          </div>
        </div>
      </div>

      {/* Ticket digital */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex-1">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Ticket digital
        </h2>
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">{storeInfo.name}</h3>
            <p className="text-sm text-gray-600">NIT: {storeInfo.nit}</p>
            <p className="text-sm text-gray-600">
              Dirección: {storeInfo.address}
            </p>
            <p className="text-sm text-gray-600">Teléfono: {storeInfo.phone}</p>
            <p className="text-sm text-gray-600">
              Documento Equivalente POS: {saleData.posId}
            </p>
          </div>
          <div className="mb-4">
            <p className="text-sm">
              Fecha:{' '}
              {new Date(saleData.date).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            </p>
          </div>
          {/* Client information section */}
          {saleData.client && <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-1">Cliente:</h4>
              <p className="text-sm text-blue-700">{saleData.client.name}</p>
              <p className="text-sm text-blue-700">
                {saleData.client.documentType}: {saleData.client.document}
              </p>
              {saleData.client.address && <p className="text-sm text-blue-700">
                  Dirección: {saleData.client.address}
                </p>}
              {saleData.client.phone && <p className="text-sm text-blue-700">
                  Teléfono: {saleData.client.phone}
                </p>}
              {saleData.client.identifier && <p className="text-sm text-blue-700">
                  ID: {saleData.client.identifier}
                </p>}
              {/* Electronic Invoice Status */}
              {saleData.invoiceRequested && <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="flex items-center">
                    <FileTextIcon size={16} className="text-blue-600 mr-1" />
                    <p className="text-sm font-medium text-blue-800">
                      Factura Electrónica:
                    </p>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <ClockIcon size={12} className="mr-1" />
                      Procesando
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    La factura electrónica está siendo procesada por el PTA y
                    será enviada a la DIAN.
                  </p>
                </div>}
            </div>}
          <div className="border-t border-gray-200 pt-2 mb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-1">Producto</th>
                  <th className="pb-1 text-right">Cant.</th>
                  <th className="pb-1 text-right">Precio</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {saleData.items.map(item => <tr key={item.id}>
                    <td className="py-1">
                      {item.name}
                      {item.discount > 0 && <span className="ml-1 text-xs text-green-600">
                          (-{item.discount}%)
                        </span>}
                      <div className="text-xs text-gray-500">
                        IVA: {(item.taxRate * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className="py-1 text-right">{item.quantity}</td>
                    <td className="py-1 text-right">
                      {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                  }).format(item.price)}
                    </td>
                    <td className="py-1 text-right">
                      {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                  }).format(item.total)}
                      {item.discount > 0 && <div className="text-xs text-green-600">
                          Desc:{' '}
                          {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(item.price * item.quantity * (item.discount / 100))}
                        </div>}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between mb-1">
              <span>Subtotal:</span>
              <span>
                {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
              }).format(saleData.subtotal)}
              </span>
            </div>
            {saleData.discountAmount > 0 && <div className="flex justify-between mb-1 text-green-600">
                <span>Descuentos:</span>
                <span>
                  -
                  {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
              }).format(saleData.discountAmount)}
                </span>
              </div>}
            {saleData.globalDiscount > 0 && <div className="flex justify-between mb-1 text-green-600">
                <span>Descuento global ({saleData.globalDiscount}%):</span>
                <span>Aplicado</span>
              </div>}
            <div className="flex justify-between mb-1">
              <span>IVA:</span>
              <span>
                {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
              }).format(saleData.taxes)}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>
                {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
              }).format(saleData.total)}
              </span>
            </div>
          </div>
          {/* Footer with store information */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>
              {storeInfo.name} - NIT: {storeInfo.nit}
            </p>
            <p>
              {storeInfo.address} - Tel: {storeInfo.phone}
            </p>
            <p>{storeInfo.email}</p>
            <p className="mt-2">¡Gracias por su compra!</p>
          </div>
        </div>
        {/* Mostrar QR cuando se solicita */}
        {showQR && <div className="flex flex-col items-center justify-center my-4 p-4 border border-gray-200 rounded-lg">
            <div className="bg-white p-2 rounded border border-gray-300 mb-2">
              <div className="w-48 h-48 bg-gray-300 flex items-center justify-center">
                {/* Simulación de código QR */}
                <div className="w-40 h-40 bg-white p-2 relative">
                  <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-black"></div>
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-black"></div>
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-black"></div>
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-black"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-black"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Escanea para ver el ticket</p>
            <p className="text-xs text-gray-500 mt-1 break-all">{qrValue}</p>
          </div>}
      </div>

      {/* Opciones de envío de ticket */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Enviar ticket
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => handleGenerateTicket('whatsapp')} disabled={isGenerating && ticketMethod === 'whatsapp'} className={`flex items-center justify-center p-3 rounded-lg border ${success && ticketMethod === 'whatsapp' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <PhoneIcon size={20} className="mr-2" />
            <span>WhatsApp</span>
          </button>
          <button onClick={() => handleGenerateTicket('email')} disabled={isGenerating && ticketMethod === 'email'} className={`flex items-center justify-center p-3 rounded-lg border ${success && ticketMethod === 'email' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <MailIcon size={20} className="mr-2" />
            <span>Email</span>
          </button>
          <button onClick={() => handleGenerateTicket('qr')} disabled={isGenerating && ticketMethod === 'qr'} className={`flex items-center justify-center p-3 rounded-lg border ${success && ticketMethod === 'qr' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <QrCodeIcon size={20} className="mr-2" />
            <span>Mostrar QR</span>
          </button>
          <button onClick={() => handleGenerateTicket('print')} disabled={isGenerating && ticketMethod === 'print'} className={`flex items-center justify-center p-3 rounded-lg border ${success && ticketMethod === 'print' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <PrinterIcon size={20} className="mr-2" />
            <span>Imprimir</span>
          </button>
        </div>
        {(ticketMethod === 'whatsapp' || ticketMethod === 'email') && !success && <div className="mb-4">
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                {ticketMethod === 'whatsapp' ? 'Número de WhatsApp' : 'Correo electrónico'}
              </label>
              <div className="flex">
                <input id="contact" type={ticketMethod === 'email' ? 'email' : 'tel'} value={contact} onChange={e => {
            if (ticketMethod === 'whatsapp') {
              formatNumberInput(e.target.value, setContact);
            } else {
              setContact(e.target.value);
            }
          }} placeholder={ticketMethod === 'whatsapp' ? 'Ej. 3101234567' : 'Ej. cliente@ejemplo.com'} className="flex-1 px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => handleGenerateTicket(ticketMethod)} disabled={!contact || isGenerating} className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                  Enviar
                </button>
              </div>
            </div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {ticketMethod === 'whatsapp' && `Ticket enviado al WhatsApp ${contact}`}
            {ticketMethod === 'email' && `Ticket enviado al correo ${contact}`}
            {ticketMethod === 'qr' && 'Código QR generado correctamente'}
            {ticketMethod === 'print' && 'Ticket enviado a la impresora'}
          </div>}
      </div>

      {/* Botón para finalizar */}
      <button onClick={handleFinish} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Finalizar
      </button>
    </div>;
};
export default TicketPage;