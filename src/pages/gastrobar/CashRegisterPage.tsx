import React, { useEffect, useRef, useState } from 'react'
import {
  DollarSignIcon,
  CreditCardIcon,
  PrinterIcon,
  ReceiptIcon,
  CheckIcon,
  XIcon,
  PlusIcon,
  SearchIcon,
  ArrowRightIcon,
  QrCodeIcon,
  DownloadIcon,
  InfoIcon,
  SplitSquareHorizontalIcon
} from 'lucide-react'

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

/**
 * NOTA: Este archivo asegura que, al completar el pago de una mesa (pago simple o dividido),
 * la mesa queda habilitada automáticamente:
 *  - Actualiza LS_TABLES.status = 'libre' y waiter = null
 *  - Limpia el runtime de la mesa en LS_RUNTIME
 *  - Emite StorageEvent para que Mesas se refresque
 *
 * Además, AHORA Caja solo muestra tickets cuya mesa fue marcada como "delivered" por Cocina.
 */

// ===================== Claves LS =====================
const LS_CASH = 'woky.cash.tickets'
const LS_BUSINESS = 'woky.business'
const LS_TABLES = 'woky.tables'
const LS_RUNTIME = 'woky.tables.runtime'

// ===================== Helpers =====================
const fmtCO = (n:number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(n))
const calcSubtotal = (items: {price:number; quantity:number}[]) =>
  items.reduce((s, it) => s + (Number(it.price)||0) * (Number(it.quantity)||0), 0)
const parseCurrency = (v: string) => {
  if (!v) return 0
  const cleaned = v.replace(/[^\d,.\s]/g, '').replace(/\./g, '').replace(/\s/g,'').replace(',', '.')
  const num = Number(cleaned)
  return isNaN(num) ? 0 : num
}
const formatCurrencyInput = (num: number) => {
  if (!isFinite(num)) return ''
  return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(num))
}

// ===================== Tipos =====================
type TicketItem = {
  id:number;
  name:string;
  price:number;
  quantity:number;
  // nuevo: número de tanda. 1 = orden inicial, 2..n = agregados
  batch?: number;
}
type Ticket = {
  id: string
  table: number
  items: TicketItem[]
  status: 'active'|'paid'
  waiter: string
  customerName?: string
  created: string
  // nuevos metadatos de agregados
  batches?: number;        // cuántas tandas (1 = solo inicial)
  updated?: string;        // última modificación (ISO)
  lastAppendAt?: string;   // última vez que se agregaron productos (ISO)
}

type BusinessSettings = {
  name: string
  nit: string
  address: string
  phone: string
  email: string
  website?: string
  taxRate: number
  taxType: 'iva'|'impoconsumo'
  currencySymbol?: string
  logoUrl?: string
  invoiceSeries?: string
  invoiceSeparator?: string
  invoicePadding?: number
  nextInvoiceNumber?: number
  defaultServicePct?: number
}
type ElectronicInvoiceData = {
  require: boolean
  docType: 'CC'|'CE'|'NIT'|'PAS'
  docNumber: string
  fullNameOrCompany: string
  email: string
  phone?: string
  address?: string
}
type CardDetails = { cardKind: 'debito'|'credito'; last4: string; authCode: string; surchargePct: number }
type TransferDetails = { provider: 'Nequi'|'Daviplata'|'Transfiya'|'Bancolombia a la Mano'|'Otro'; authCode: string }
type PaymentPart = {
  id: string
  method: 'cash'|'card'|'transfer'
  amountInput: string
  card?: CardDetails
  transfer?: TransferDetails
  cashReceivedInput?: string
}
type ReceiptPayment = {
  method: 'cash'|'card'|'transfer'
  amount: number
  cardDetails?: CardDetails
  transferDetails?: TransferDetails
  change?: number
}
type Receipt = {
  id: string
  table: number
  items: TicketItem[]
  status: 'paid'
  waiter: string
  created: string
  subtotal: number
  tax: number
  service: number
  total: number
  paid_at: string
  invoice_number: string
  tax_label: string
  tax_rate_pct: number
  payments: ReceiptPayment[]
  payment_method?: 'cash'|'card'|'transfer'
  amount_received?: number
  change?: number
  efact?: Omit<ElectronicInvoiceData,'require'>
}

// ===================== Componente =====================
const CashRegisterPage = () => {
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket|null>(null)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmountInput, setPaymentAmountInput] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash'|'card'|'transfer'>('cash')

  const [card, setCard] = useState<CardDetails>({ cardKind:'debito', last4:'', authCode:'', surchargePct: 0 })
  const [transfer, setTransfer] = useState<TransferDetails>({ provider:'Nequi', authCode:'' })
  const [servicePct, setServicePct] = useState<number>(10)

  const [efact, setEfact] = useState<ElectronicInvoiceData>({
    require: false, docType: 'CC', docNumber: '', fullNameOrCompany: '', email: '', phone: '', address: ''
  })
  const [splitMode, setSplitMode] = useState(false)
  const [parts, setParts] = useState<PaymentPart[]>([])

  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  const receiptRef = useRef<HTMLDivElement>(null)

  const [biz, setBiz] = useState<BusinessSettings>({
    name: 'Mi Restaurante', nit: '901.234.567-8', address: 'Calle 123 #45-67, Ciudad',
    phone: '(601) 123-4567', email: 'contacto@mirestaurante.com', website: 'www.mirestaurante.com',
    taxRate: 8, taxType: 'impoconsumo', currencySymbol: '$', logoUrl: '',
    invoiceSeries: 'FE', invoiceSeparator: '-', invoicePadding: 6, nextInvoiceNumber: 1, defaultServicePct: 10
  })

  // ====== LS helpers: Tickets / Tablas / Runtime ======
  const loadTickets = (): Ticket[] => {
    try {
      const raw = localStorage.getItem(LS_CASH)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }
  const saveTickets = (list: Ticket[]) => {
    localStorage.setItem(LS_CASH, JSON.stringify(list))
    window.dispatchEvent(new StorageEvent('storage', { key: LS_CASH, newValue: JSON.stringify(list) }))
  }

  type ConfigTable = {
    id: string|number
    number: number
    alias?: string
    zone?: string
    capacity?: number
    active: boolean
    status?: 'libre'|'ocupada'|'reservada'|'fuera_de_servicio'
    waiter?: string|null
  }
  const loadTablesCfg = (): ConfigTable[] => {
    try {
      const raw = localStorage.getItem(LS_TABLES)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  type Runtime = Record<string, any>
  const loadRuntime = (): Runtime => {
    try {
      const raw = localStorage.getItem(LS_RUNTIME)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  }

  /**
   * Libera mesa por número:
   * - En configuración: status 'libre' y waiter null
   * - En runtime: elimina entrada por tableId (clave real del runtime)
   * - Emite eventos de storage para que "Mesas" se refresque
   */
  const saveTablesCfg = (list: ConfigTable[]) => {
    localStorage.setItem(LS_TABLES, JSON.stringify(list))
    window.dispatchEvent(new StorageEvent('storage', { key: LS_TABLES, newValue: JSON.stringify(list) }))
  }
  const saveRuntime = (rt: Runtime) => {
    localStorage.setItem(LS_RUNTIME, JSON.stringify(rt))
    window.dispatchEvent(new StorageEvent('storage', { key: LS_RUNTIME, newValue: JSON.stringify(rt) }))
  }

  const freeTableByNumber = (tableNumber: number) => {
    if (tableNumber === undefined || tableNumber === null) return

    // 1) Config
    const cfg = loadTablesCfg()
    const idx = cfg.findIndex(t => Number(t.number) === Number(tableNumber))
    let tableId: string | null = null

    if (idx >= 0) {
      tableId = String(cfg[idx].id)
      cfg[idx] = { ...cfg[idx], status: 'libre', waiter: null }
      saveTablesCfg(cfg)
    }

    // 2) Runtime (si existe id)
    const rt = loadRuntime()
    if (tableId && rt[tableId]) {
      delete rt[tableId]
      saveRuntime(rt)
    }

    // 3) Señal explícita
    try {
      const evt = new CustomEvent('woky:table-freed', { detail: { tableNumber, tableId } })
      window.dispatchEvent(evt)
    } catch {}
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_BUSINESS)
      if (raw) {
        const parsed = JSON.parse(raw)
        setBiz(prev => ({ ...prev, ...parsed }))
        const preset = typeof parsed.defaultServicePct === 'number' ? parsed.defaultServicePct : 10
        setServicePct(preset)
      }
    } catch {}
  }, [])

  const taxLabel = biz.taxType === 'impoconsumo' ? 'Impoconsumo' : 'IVA'

  // === NUEVO: función que calcula qué tickets mostrar (solo "delivered")
  const computeDeliveredTickets = (): Ticket[] => {
    const tickets = loadTickets().filter(t => t.status === 'active')
    const cfg = loadTablesCfg()
    const rt = loadRuntime()

    // Mapeo por número de mesa -> id (clave de runtime)
    const tableIdByNumber = new Map<number,string>()
    for (const t of cfg) {
      tableIdByNumber.set(Number(t.number), String(t.id))
    }

    return tickets.filter(t => {
      const key = tableIdByNumber.get(Number(t.table))
      if (!key) return false
      const r = rt[key]
      return r && r.kitchenStatus === 'delivered'
    })
  }

  useEffect(() => {
    const refresh = () => setActiveTickets(computeDeliveredTickets())
    refresh()

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return
      if (e.key === LS_CASH || e.key === LS_RUNTIME || e.key === LS_TABLES) {
        refresh()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const formatInvoiceNumber = (b: BusinessSettings) => {
    const series = b.invoiceSeries || ''
    const sep = b.invoiceSeparator ?? '-'
    const pad = Math.max(1, b.invoicePadding || 1)
    const n = Math.max(1, b.nextInvoiceNumber || 1)
    const middle = (series && sep) ? sep : (series ? '' : '')
    return `${series}${middle}${String(n).padStart(pad, '0')}`
  }
  const incrementBusinessNextInvoice = (b: BusinessSettings) => {
    const next = Math.max(1, (b.nextInvoiceNumber || 1) + 1)
    const updated = { ...b, nextInvoiceNumber: next }
    try { localStorage.setItem(LS_BUSINESS, JSON.stringify(updated)) } catch {}
    return updated
  }

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    const sub = calcSubtotal(ticket.items)
    const tx = Math.round(sub * (biz.taxRate/100))
    const service0 = Math.round(sub * ((typeof biz.defaultServicePct === 'number' ? biz.defaultServicePct : 10)/100))
    const tot = sub + tx + service0
    setPaymentAmountInput(formatCurrencyInput(tot))
    setSplitMode(false)
    setParts([])
    setShowPaymentModal(true)
  }

  // ====== DIVIDIR ======
  const seedParts = (count: number) => {
    if (!selectedTicket) return
    const { total } = currentBreakdown()
    const baseEach = Math.floor(total / count)
    let remainder = total - baseEach * count
    const next: PaymentPart[] = Array.from({ length: count }).map((_, idx) => {
      const extra = remainder > 0 ? 1 : 0
      remainder -= extra
      const amount = baseEach + extra
      return {
        id: crypto.randomUUID(),
        method: idx === 0 ? 'cash' : 'card',
        amountInput: formatCurrencyInput(amount),
        card: { cardKind:'debito', last4:'', authCode:'', surchargePct: 0 },
        transfer: { provider:'Nequi', authCode:'' },
        cashReceivedInput: idx === 0 ? formatCurrencyInput(amount) : ''
      }
    })
    setParts(next)
  }
  const partsSum = (ps: PaymentPart[]) => ps.reduce((s,p)=> s + parseCurrency(p.amountInput), 0)
  const partsAreValid = (ps: PaymentPart[]) => {
    for (const p of ps) {
      const amount = parseCurrency(p.amountInput)
      if (amount <= 0) return false
      if (p.method === 'card') {
        if (!p.card) return false
        if (!p.card.last4 || p.card.last4.length !== 4) return false
        if (!p.card.authCode.trim()) return false
      }
      if (p.method === 'transfer') {
        if (!p.transfer) return false
        if (!p.transfer.authCode.trim()) return false
      }
      if (p.method === 'cash') {
        const rec = parseCurrency(p.cashReceivedInput || '')
        if (rec < amount) return false
      }
    }
    return true
  }

  const currentBreakdown = () => {
    if (!selectedTicket) return { subtotal:0, tax:0, service:0, total:0, change:0 }
    const subtotal = calcSubtotal(selectedTicket.items)
    const tax = Math.round(subtotal * (biz.taxRate/100))
    const service = Math.round(subtotal * ((servicePct || 0)/100))
    const total = subtotal + tax + service
    const received = parseCurrency(paymentAmountInput)
    const change = selectedPaymentMethod === 'cash' ? Math.max(0, Math.round(received - total)) : 0
    return { subtotal, tax, service, total, change }
  }

  const confirmSplitPayment = () => {
    if (!selectedTicket) return
    const { subtotal, tax, service, total } = currentBreakdown()

    if (efact.require) {
      if (!efact.docNumber.trim() || !efact.fullNameOrCompany.trim() || !efact.email.trim()) {
        alert('Para facturación electrónica, completa Documento, Nombre/Razón Social y Email')
        return
      }
    }

    const sumParts = partsSum(parts)
    if (sumParts !== total) {
      alert(`La suma de las partes (${fmtCO(sumParts)}) debe ser igual al total (${fmtCO(total)}).`)
      return
    }
    if (!partsAreValid(parts)) {
      alert('Revisa los datos de cada parte.')
      return
    }

    const invoiceNumber = formatInvoiceNumber(biz)
    const payments: ReceiptPayment[] = parts.map(p => {
      const amount = parseCurrency(p.amountInput)
      if (p.method === 'cash') {
        const rec = parseCurrency(p.cashReceivedInput || '')
        return { method:'cash', amount, change: Math.max(0, rec - amount) }
      }
      if (p.method === 'card') {
        return { method:'card', amount, cardDetails: { ...(p.card as CardDetails) } }
      }
      return { method:'transfer', amount, transferDetails: { ...(p.transfer as TransferDetails) } }
    })

    const receipt: Receipt = {
      id: selectedTicket.id,
      table: selectedTicket.table,
      items: selectedTicket.items,
      status: 'paid',
      waiter: selectedTicket.waiter,
      created: selectedTicket.created,
      subtotal, tax, service, total,
      paid_at: new Date().toISOString(),
      invoice_number: invoiceNumber,
      tax_label: taxLabel,
      tax_rate_pct: biz.taxRate,
      payments,
    }

    const updatedBiz = incrementBusinessNextInvoice(biz)
    setBiz(updatedBiz)

    setLastReceipt(receipt)
    setShowReceiptModal(true)
    setShowQr(false)
    setQrDataUrl('')

    // Cerrar la cuenta en LS (paid) y liberar mesa
    const list = loadTickets()
    const upd = list.map(t => t.id === selectedTicket.id ? { ...t, status: 'paid' } : t)
    saveTickets(upd)
    freeTableByNumber(selectedTicket.table)

    setActiveTickets(computeDeliveredTickets())
    setSelectedTicket(null)
    setShowPaymentModal(false)
    setParts([])
    setSplitMode(false)
  }

  const openReceiptForSingle = (ticket: Ticket, method: 'cash'|'card'|'transfer', amountReceived: number) => {
    const subtotal = calcSubtotal(ticket.items)
    const tax = Math.round(subtotal * (biz.taxRate/100))
    const service = Math.round(subtotal * ((servicePct || 0)/100))
    const total = subtotal + tax + service
    const invoiceNumber = formatInvoiceNumber(biz)

    const payments: ReceiptPayment[] = [{
      method,
      amount: total,
      ...(method === 'cash' ? { change: Math.max(0, Math.round(amountReceived - total)) } : {}),
      ...(method === 'card' ? { cardDetails: { ...card } } : {}),
      ...(method === 'transfer' ? { transferDetails: { ...transfer } } : {})
    }]

    const receipt: Receipt = {
      id: ticket.id,
      table: ticket.table,
      items: ticket.items,
      status: 'paid',
      waiter: ticket.waiter,
      created: ticket.created,
      subtotal, tax, service, total,
      paid_at: new Date().toISOString(),
      invoice_number: invoiceNumber,
      tax_label: taxLabel,
      tax_rate_pct: biz.taxRate,
      payments,
      payment_method: method,
      amount_received: Math.round(amountReceived),
      change: method === 'cash' ? Math.max(0, Math.round(amountReceived - total)) : 0
    }

    const updatedBiz = incrementBusinessNextInvoice(biz)
    setBiz(updatedBiz)

    setLastReceipt(receipt)
    setShowReceiptModal(true)
    setShowQr(false)
    setQrDataUrl('')

    // Cerrar en LS y liberar mesa (habilitar)
    const list = loadTickets()
    const upd = list.map(t => t.id === ticket.id ? { ...t, status: 'paid' } : t)
    saveTickets(upd)
    freeTableByNumber(ticket.table)

    setActiveTickets(computeDeliveredTickets())
  }

  const handlePayment = () => {
    if (!selectedTicket) return

    if (!splitMode) {
      if (selectedPaymentMethod === 'card') {
        if (!card.last4 || card.last4.length !== 4) { alert('Ingresa los 4 últimos dígitos de la tarjeta'); return }
        if (!card.authCode.trim()) { alert('Ingresa el código de autorización'); return }
      }
      if (selectedPaymentMethod === 'transfer') {
        if (!transfer.authCode.trim()) { alert('Ingresa el código de autorización de la transferencia'); return }
      }
      if (efact.require) {
        if (!efact.docNumber.trim() || !efact.fullNameOrCompany.trim() || !efact.email.trim()) {
          alert('Para facturación electrónica, completa Documento, Nombre/Razón Social y Email')
          return
        }
      }

      const amount = parseCurrency(paymentAmountInput)
      const subtotal = calcSubtotal(selectedTicket.items)
      const tax = Math.round(subtotal * (biz.taxRate/100))
      const service = Math.round(subtotal * ((servicePct || 0)/100))
      const total = subtotal + tax + service

      if (selectedPaymentMethod === 'cash' && amount < total) {
        alert('En efectivo, el valor recibido debe cubrir el total.')
        return
      }

      openReceiptForSingle(selectedTicket, selectedPaymentMethod, selectedPaymentMethod === 'cash' ? amount : total)

      // Remueve activa local y cierra modal
      setActiveTickets(prev => prev.filter(t => t.id !== selectedTicket.id))
      setSelectedTicket(null)
      setShowPaymentModal(false)
      setCard({ cardKind:'debito', last4:'', authCode:'', surchargePct: card.surchargePct })
      setTransfer({ provider:'Nequi', authCode:'' })
      setEfact(prev => ({ ...prev, require:false }))
      return
    }

    confirmSplitPayment()
  }

  // --- QR ---
  useEffect(() => {
    const gen = async () => {
      if (showReceiptModal && showQr && lastReceipt) {
        const payload = {
          invoice: lastReceipt.invoice_number,
          ticket_id: lastReceipt.id,
          paid_at: lastReceipt.paid_at,
          total: lastReceipt.total,
          methods: lastReceipt.payments.map(p=>p.method)
        }
        const data = JSON.stringify(payload)
        const url = await QRCode.toDataURL(data, { margin: 1, scale: 4 })
        setQrDataUrl(url)
      }
    }
    gen().catch(() => {})
  }, [showReceiptModal, showQr, lastReceipt])

  // --- Imprimir / PDF ---
  const printReceipt = async () => {
    if (!receiptRef.current) return
    const content = receiptRef.current.innerHTML
    const printWindow = window.open('', 'PRINT', 'height=700,width=480')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
            .ticket { width: 320px; }
            .divider { border-top: 1px dashed #888; margin: 8px 0; }
            .muted { color:#555; font-size:12px; }
            .bold { font-weight:600; }
            .right { text-align:right; }
            .grid { display:grid; grid-template-columns: 1fr auto; gap: 4px; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          <div class="ticket">
            ${content}
          </div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const downloadReceiptPdf = async () => {
    if (!receiptRef.current) return
    const node = receiptRef.current
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a6' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 24
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const y = (pageHeight - imgHeight) / 2 > 12 ? (pageHeight - imgHeight) / 2 : 12
    const filename = `ticket-${lastReceipt?.invoice_number || lastReceipt?.id || 'pago'}.pdf`
    pdf.addImage(imgData, 'PNG', 12, y, imgWidth, imgHeight)
    pdf.save(filename)
  }

  // ===================== Render =====================
  const subtotal = selectedTicket ? calcSubtotal(selectedTicket.items) : 0
  const tax = Math.round(subtotal * (biz.taxRate/100))
  const service = Math.round(subtotal * ((servicePct || 0)/100))
  const total = subtotal + tax + service
  const sumPartsCurrent = parts.reduce((s,p)=> s + parseCurrency(p.amountInput), 0)

  return (
    <div className="w-full bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Caja Registradora</h1>
        <p className="text-gray-600 mt-1">Gestión de pagos (solo cuentas entregadas)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Cuentas Entregadas (pendientes de pago)</h2>
            </div>
            <div className="p-4">
              <div className="flex mb-4">
                <div className="relative flex-1 min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="pl-10 block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="Buscar cuenta por mesa o número"
                    aria-label="Buscar cuenta"
                  />
                </div>
              </div>

              {activeTickets.length > 0 ? (
                <div className="space-y-4">
                  {activeTickets.map(ticket => {
                    const sub = calcSubtotal(ticket.items)
                    const tx = Math.round(sub * (biz.taxRate/100))
                    const tot = sub + tx + Math.round(sub * ((typeof biz.defaultServicePct === 'number' ? biz.defaultServicePct : 10)/100))

                    const batches = (ticket as any).batches || 1
                    const wasUpdated = batches > 1

                    return (
                      <div
                        key={ticket.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          (selectedTicket?.id === ticket.id)
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                        onClick={() => handleSelectTicket(ticket)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectTicket(ticket) }}
                        aria-pressed={selectedTicket?.id === ticket.id}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center min-w-0">
                            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-md shrink-0">
                              <ReceiptIcon size={20} />
                            </div>
                            <div className="ml-3 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 truncate">
                                  Cuenta #{ticket.id}
                                </h3>
                                {wasUpdated && (
                                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                    Actualizada (+{batches - 1})
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                Mesa {ticket.table} • Mesero: {ticket.waiter}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-gray-900 whitespace-nowrap">
                            ${fmtCO(tot)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <p className="truncate">
                            {ticket.items.length} productos •{' '}
                            {ticket.items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                            items
                          </p>
                          {wasUpdated && (ticket.lastAppendAt || ticket.updated) && (
                            <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                              último agregado {new Date(ticket.lastAppendAt || ticket.updated!).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ReceiptIcon size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No hay cuentas entregadas pendientes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-800">Detalles de Pago</h2>

              {selectedTicket && (
                <button
                  className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${
                    splitMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                  onClick={() => {
                    if (!splitMode) seedParts(2)
                    setSplitMode(s => !s)
                  }}
                >
                  <SplitSquareHorizontalIcon size={14} />
                  {splitMode ? 'Dividir: ON' : 'Dividir cuenta'}
                </button>
              )}
            </div>

            {selectedTicket ? (
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Cuenta seleccionada</p>
                  <div className="flex justify-between items-center">
                    <p className="font-medium">
                      {selectedTicket.id} - Mesa {selectedTicket.table}
                    </p>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="text-gray-400 hover:text-gray-500"
                      aria-label="Quitar selección"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                </div>

                {/* Detalle agrupado por tanda */}
                <div className="mb-4 border-t border-gray-200 pt-4">
                  <h3 className="font-medium mb-2">Detalle de productos</h3>

                  {(() => {
                    // Agrupar por tanda (batch); si no existe, asumir 1
                    const grouped: Record<number, TicketItem[]> = {};
                    (selectedTicket.items || []).forEach(it => {
                      const b = typeof it.batch === 'number' ? it.batch : 1;
                      if (!grouped[b]) grouped[b] = [];
                      grouped[b].push(it);
                    });
                    const batchesNums = Object.keys(grouped).map(n => Number(n)).sort((a,b)=>a-b);

                    return (
                      <div className="space-y-3">
                        {batchesNums.map((b) => (
                          <div key={b} className="border rounded-lg p-2">
                            <div className="text-[12px] font-semibold text-gray-700 mb-1">
                              {b === 1 ? 'Orden inicial' : `Agregado #${b-1}`}
                            </div>
                            <ul className="space-y-1">
                              {grouped[b].map((item) => (
                                <li key={`${b}-${item.id}`} className="flex justify-between text-sm">
                                  <span className="truncate">{item.quantity}x {item.name}</span>
                                  <span className="whitespace-nowrap">${fmtCO(item.price * item.quantity)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Resumen */}
                <div className="mb-6 border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="whitespace-nowrap">${fmtCO(subtotal)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{biz.taxType === 'impoconsumo' ? 'Impoconsumo' : 'IVA'} ({biz.taxRate}%)</span>
                    <span className="whitespace-nowrap">${fmtCO(tax)}</span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-600 flex items-center gap-2">Servicio voluntario (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={servicePct}
                        onChange={e => setServicePct(Math.max(0, Number(e.target.value)||0))}
                        className="w-16 rounded-md border border-gray-300 px-2 py-1 text-right"
                        aria-label="Porcentaje servicio voluntario"
                      />
                      <span className="w-24 text-right whitespace-nowrap">${fmtCO(service)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="whitespace-nowrap">${fmtCO(total)}</span>
                  </div>
                </div>

                {/* Método pago */}
                {!splitMode && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'cash',     name: 'Efectivo',      icon: <DollarSignIcon size={16} /> },
                          { id: 'card',     name: 'Tarjeta',       icon: <CreditCardIcon size={16} /> },
                          { id: 'transfer', name: 'Transferencia', icon: <ArrowRightIcon  size={16} /> },
                        ].map(method => (
                          <button
                            key={method.id}
                            className={`min-h-11 md:min-h-9 p-1.5 md:p-1 rounded-lg flex flex-col items-center justify-center border min-w-0 ${
                              selectedPaymentMethod === method.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                            }`}
                            onClick={() => setSelectedPaymentMethod(method.id as any)}
                            aria-pressed={selectedPaymentMethod === method.id}
                          >
                            <div className={`p-1.5 md:p-1 rounded-full shrink-0 ${
                              selectedPaymentMethod === method.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {method.icon}
                            </div>
                            <span className="mt-0.5 text-[10px] leading-tight md:text-[9px] whitespace-nowrap truncate">
                              {method.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Campos específicos */}
                    {selectedPaymentMethod === 'cash' && (
                      <div className="mb-4 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Recibido</label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={paymentAmountInput}
                            onChange={(e) => setPaymentAmountInput(formatCurrencyInput(parseCurrency(e.target.value)))}
                            className="flex-1 rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                            placeholder="0"
                            aria-label="Valor recibido en efectivo"
                          />
                        </div>
                        <p className="text-sm text-gray-600">
                          Cambio a entregar: <span className="font-semibold">${fmtCO(Math.max(0, parseCurrency(paymentAmountInput) - total))}</span>
                        </p>
                      </div>
                    )}

                    {selectedPaymentMethod === 'card' && (
                      <div className="mb-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo</label>
                            <select
                              value={card.cardKind}
                              onChange={e => setCard(prev => ({ ...prev, cardKind: e.target.value as 'debito'|'credito' }))}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            >
                              <option value="debito">Débito</option>
                              <option value="credito">Crédito</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">4 últimos</label>
                            <input
                              type="text"
                              value={card.last4}
                              onChange={e => setCard(prev => ({ ...prev, last4: e.target.value.replace(/\D/g,'').slice(0,4) }))}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                              placeholder="1234"
                              maxLength={4}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Autorización</label>
                            <input
                              type="text"
                              value={card.authCode}
                              onChange={e => setCard(prev => ({ ...prev, authCode: e.target.value.slice(0, 12) }))}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                              placeholder="Código POS"
                              maxLength={12}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Recargo (%)</label>
                            <input
                              type="number"
                              value={card.surchargePct}
                              onChange={e => setCard(prev => ({ ...prev, surchargePct: Math.max(0, Number(e.target.value)||0) }))}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                              min={0}
                            />
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <InfoIcon size={14} /> El recargo se suma al total y no se grava.
                        </p>
                      </div>
                    )}

                    {selectedPaymentMethod === 'transfer' && (
                      <div className="mb-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Canal</label>
                          <select
                            value={transfer.provider}
                            onChange={e => setTransfer(prev => ({ ...prev, provider: e.target.value as TransferDetails['provider'] }))}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          >
                            <option>Nequi</option>
                            <option>Daviplata</option>
                            <option>Transfiya</option>
                            <option>Bancolombia a la Mano</option>
                            <option>Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Código de autorización</label>
                          <input
                            type="text"
                            value={transfer.authCode}
                            onChange={e => setTransfer(prev => ({ ...prev, authCode: e.target.value.slice(0, 20) }))}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            placeholder="Referencia / aprobación"
                            maxLength={20}
                          />
                        </div>
                      </div>
                    )}

                    {/* Facturación electrónica */}
                    <div className="mb-6 border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">¿Emitir Factura Electrónica?</label>
                        <input
                          type="checkbox"
                          checked={efact.require}
                          onChange={e => setEfact(prev => ({ ...prev, require: e.target.checked }))}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>

                      {efact.require && (
                        <div className="grid grid-cols-1 gap-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600">Tipo Doc</label>
                              <select
                                value={efact.docType}
                                onChange={e => setEfact(prev => ({ ...prev, docType: e.target.value as ElectronicInvoiceData['docType'] }))}
                                className="w-full rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                              >
                                <option>CC</option>
                                <option>CE</option>
                                <option>NIT</option>
                                <option>PAS</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-gray-600">Documento</label>
                              <input
                                type="text"
                                value={efact.docNumber}
                                onChange={e => setEfact(prev => ({ ...prev, docNumber: e.target.value }))}
                                className="w-full rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                                placeholder="Nro identificación"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Nombre / Razón Social</label>
                            <input
                              type="text"
                              value={efact.fullNameOrCompany}
                              onChange={e => setEfact(prev => ({ ...prev, fullNameOrCompany: e.target.value }))}
                              className="w-full rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600">Email</label>
                              <input
                                type="email"
                                value={efact.email}
                                onChange={e => setEfact(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600">Teléfono (opcional)</label>
                              <input
                                type="text"
                                value={efact.phone}
                                onChange={e => setEfact(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Dirección (opcional)</label>
                            <input
                              type="text"
                              value={efact.address}
                              onChange={e => setEfact(prev => ({ ...prev, address: e.target.value }))}
                              className="w-full rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botones */}
                    <div className="flex space-x-2">
                      <button
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-2 rounded-lg hover:bg-gray-200 font-medium"
                        onClick={() => setShowPaymentModal(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        className="flex-1 bg-green-600 text-white py-2 px-2 rounded-lg hover:bg-green-700 font-medium inline-flex items-center justify-center"
                        onClick={handlePayment}
                      >
                        <CheckIcon size={18} className="mr-1" />
                        Confirmar Pago
                      </button>
                    </div>
                  </>
                )}

                {/* Modo dividir */}
                {splitMode && (
                  <div className="space-y-3">
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-900 flex items-start gap-2">
                      <InfoIcon size={14} className="mt-0.5" />
                      <div>Divide el total entre varias personas y métodos. La suma debe ser igual al total.</div>
                    </div>

                    {/* Resumen general */}
                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>${fmtCO(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{biz.taxType === 'impoconsumo' ? 'Impoconsumo' : 'IVA'} ({biz.taxRate}%)</span>
                        <span>${fmtCO(tax)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <label className="text-gray-600">Servicio voluntario (%)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={servicePct}
                            onChange={e => setServicePct(Math.max(0, Number(e.target.value)||0))}
                            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-right"
                          />
                          <span className="w-24 text-right">${fmtCO(service)}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${fmtCO(total)}</span>
                      </div>
                    </div>

                    {/* Controles partes */}
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-sm" onClick={() => seedParts(2)}>2 partes iguales</button>
                      <button className="px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-sm" onClick={() => seedParts(3)}>3 partes iguales</button>
                      <button
                        className="px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-sm"
                        onClick={() => {
                          setParts(prev => [...prev, {
                            id: crypto.randomUUID(),
                            method: 'cash',
                            amountInput: formatCurrencyInput(Math.max(0, Math.floor(total - prev.reduce((s,p)=>s+parseCurrency(p.amountInput),0)))),
                            card: { cardKind:'debito', last4:'', authCode:'', surchargePct: 0 },
                            transfer: { provider:'Nequi', authCode:'' },
                            cashReceivedInput: ''
                          }])
                        }}
                      >
                        + Agregar parte
                      </button>
                    </div>

                    {/* Lista de partes */}
                    <div className="space-y-3">
                      {parts.map((p, idx) => {
                        const amount = parseCurrency(p.amountInput)
                        const isCash = p.method === 'cash'
                        const cashRec = parseCurrency(p.cashReceivedInput || '')
                        const cashChange = isCash ? Math.max(0, cashRec - amount) : 0

                        return (
                          <div key={p.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-sm">Parte #{idx+1}</div>
                              <button onClick={() => setParts(prev => prev.filter(x => x.id !== p.id))} className="text-gray-500 hover:text-gray-700 text-xs">Quitar</button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'cash',     name: 'Efectivo',      icon: <DollarSignIcon size={16} /> },
                                { id: 'card',     name: 'Tarjeta',       icon: <CreditCardIcon size={16} /> },
                                { id: 'transfer', name: 'Transferencia', icon: <ArrowRightIcon  size={16} /> },
                              ].map(method => (
                                <button
                                  key={method.id}
                                  className={`min-h-11 md:min-h-9 p-1.5 md:p-1 rounded-lg flex flex-col items-center justify-center border min-w-0 ${p.method === method.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                                  onClick={() => setParts(prev => prev.map(x => x.id === p.id ? ({ ...x, method: method.id as any }) : x))}
                                  aria-pressed={p.method === method.id}
                                >
                                  <div className={`p-1.5 md:p-1 rounded-full shrink-0 ${p.method === method.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>{method.icon}</div>
                                  <span className="mt-0.5 text-[10px] leading-tight md:text-[9px] whitespace-nowrap truncate">{method.name}</span>
                                </button>
                              ))}
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-sm text-gray-700">Monto de esta parte</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">$</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={p.amountInput}
                                    onChange={e => {
                                      const v = parseCurrency(e.target.value)
                                      setParts(prev => prev.map(x => x.id === p.id ? ({ ...x, amountInput: formatCurrencyInput(v) }) : x))
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                  />
                                </div>
                              </div>

                              {p.method === 'cash' && (
                                <div>
                                  <label className="block text-sm text-gray-700">Recibido (efectivo)</label>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">$</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={p.cashReceivedInput || ''}
                                      onChange={e => {
                                        const v = parseCurrency(e.target.value)
                                        setParts(prev => prev.map(x => x.id === p.id ? ({ ...x, cashReceivedInput: formatCurrencyInput(v) }) : x))
                                      }}
                                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                      placeholder="0"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Cambio: <span className="font-medium">${fmtCO(cashChange)}</span>
                                  </p>
                                </div>
                              )}

                              {p.method === 'card' && (
                                <>
                                  <div>
                                    <label className="block text-sm text-gray-700">Tipo</label>
                                    <select
                                      value={p.card?.cardKind || 'debito'}
                                      onChange={e => setParts(prev => prev.map(x => x.id === p.id ? ({ ...x, card: { ...(x.card as CardDetails), cardKind: e.target.value as 'debito'|'credito' } }) : x))}
                                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    >
                                      <option value="debito">Débito</option>
                                      <option value="credito">Crédito</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700">4 últimos</label>
                                    <input
                                      type="text"
                                      value={p.card?.last4 || ''}
                                      onChange={e => {
                                        const v = e.target.value.replace(/\D/g,'').slice(0,4)
                                        setParts(prev => prev.map(x => x.id === p.id ? ({ ...x, card: { ...(x.card as CardDetails), last4: v } }) : x))
                                      }}
                                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                      placeholder="1234"
                                      maxLength={4}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700">Autorización</label>
                                    <input
                                      type="text"
                                      value={p.card?.authCode || ''}
                                      onChange={e => setParts(prev => prev.map(x => x.id === p.id ? ({ ...x, card: { ...(x.card as CardDetails), authCode: e.target.value.slice(0,12) } }) : x))}
                                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                      placeholder="Código POS"
                                      maxLength={12}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700">Recargo (%)</label>
                                    <input
                                      type="number"
                                      value={p.card?.surchargePct ?? 0}
                                      onChange={e => setParts(prev => prev.map(x => x.id === p.id ? ({ ...x, card: { ...(x.card as CardDetails), surchargePct: Math.max(0, Number(e.target.value)||0) } }) : x))}
                                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                      min={0}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Inclúyelo en el monto de esta parte.</p>
                                  </div>
                                </>
                              )}

                              {p.method === 'transfer' && (
                                <>
                                  <div>
                                    <label className="block text-sm text-gray-700">Canal</label>
                                    <select
                                      value={p.transfer?.provider || 'Nequi'}
                                      onChange={e => setParts(prev => prev.map(x => x.id === p.id ? ({ ...x, transfer: { ...(x.transfer as TransferDetails), provider: e.target.value as TransferDetails['provider'] } }) : x))}
                                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    >
                                      <option>Nequi</option>
                                      <option>Daviplata</option>
                                      <option>Transfiya</option>
                                      <option>Bancolombia a la Mano</option>
                                      <option>Otro</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700">Autorización</label>
                                    <input
                                      type="text"
                                      value={p.transfer?.authCode || ''}
                                      onChange={e => setParts(prev => prev.map(x => x.id === p.id ? ({ ...x, transfer: { ...(x.transfer as TransferDetails), authCode: e.target.value.slice(0,20) } }) : x))}
                                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                      placeholder="Referencia / aprobación"
                                      maxLength={20}
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Sumatoria */}
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Suma de partes</span>
                        <span className={`${sumPartsCurrent === total ? 'text-green-700' : 'text-red-700'} font-semibold`}>
                          ${fmtCO(sumPartsCurrent)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Total a pagar</span>
                        <span className="font-semibold">${fmtCO(total)}</span>
                      </div>
                      {sumPartsCurrent !== total && (
                        <p className="text-xs text-red-600 mt-1">La suma debe coincidir con el total.</p>
                      )}
                    </div>

                    {/* FE resumida */}
                    <div className="mb-2 border-t border-gray-200 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">¿Emitir Factura Electrónica?</label>
                        <input
                          type="checkbox"
                          checked={efact.require}
                          onChange={e => setEfact(prev => ({ ...prev, require: e.target.checked }))}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex space-x-2">
                      <button
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-2 rounded-lg hover:bg-gray-200 font-medium"
                        onClick={() => setShowPaymentModal(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        className={`flex-1 ${sumPartsCurrent === total ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'} py-2 px-2 rounded-lg font-medium`}
                        onClick={handlePayment}
                        disabled={sumPartsCurrent !== total}
                      >
                        <CheckIcon size={18} className="mr-1" />
                        Confirmar Pagos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="py-8">
                  <ReceiptIcon size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">Selecciona una cuenta (ya entregada) para procesar el pago</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket / Boleta post-pago */}
      {showReceiptModal && lastReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Factura {lastReceipt.invoice_number}</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-gray-500" aria-label="Cerrar modal de ticket">
                <XIcon size={20} />
              </button>
            </div>

            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
              <button className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 text-xs sm:text-sm inline-flex items-center whitespace-nowrap" onClick={printReceipt}>
                <PrinterIcon size={16} className="mr-1 hidden sm:inline-block" />
                Imprimir
              </button>
              <button className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 text-xs sm:text-sm inline-flex items-center whitespace-nowrap" onClick={downloadReceiptPdf}>
                <DownloadIcon size={16} className="mr-1 hidden sm:inline-block" />
                Descargar PDF
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm inline-flex items-center whitespace-nowrap ${showQr ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                onClick={() => setShowQr(s => !s)}
              >
                <QrCodeIcon size={16} className="mr-1 hidden sm:inline-block" />
                {showQr ? 'Ocultar QR' : 'Mostrar QR'}
              </button>
            </div>

            <div className="p-4" ref={receiptRef}>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900">{biz.name}</h4>
                <p className="text-xs text-gray-500">NIT {biz.nit} • {biz.address}</p>
                <p className="text-xs text-gray-500">Tel: {biz.phone}{biz.email ? ` • ${biz.email}` : ''}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="text-sm grid grid-cols-2 gap-y-1">
                <span className="text-gray-600">Factura:</span>
                <span className="text-right font-medium">{lastReceipt.invoice_number}</span>
                <span className="text-gray-600">Ticket interno:</span>
                <span className="text-right">{lastReceipt.id}</span>
                <span className="text-gray-600">Mesa:</span>
                <span className="text-right">{lastReceipt.table}</span>
                <span className="text-gray-600">Mesero:</span>
                <span className="text-right">{lastReceipt.waiter}</span>
                <span className="text-gray-600">Fecha:</span>
                <span className="text-right">{new Date(lastReceipt.paid_at).toLocaleString()}</span>
                <span className="text-gray-600">Impuesto:</span>
                <span className="text-right">{lastReceipt.tax_label} ({lastReceipt.tax_rate_pct}%)</span>
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="text-sm">
                {lastReceipt.items.map((it) => (
                  <div key={it.id} className="grid grid-cols-5 gap-1 mb-1">
                    <div className="col-span-3">{it.quantity}x {it.name}</div>
                    <div className="col-span-2 text-right">${fmtCO(it.price * it.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="text-sm grid grid-cols-2 gap-y-1">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-right">${fmtCO(lastReceipt.subtotal)}</span>
                <span className="text-gray-600">{lastReceipt.tax_label} ({lastReceipt.tax_rate_pct}%)</span>
                <span className="text-right">${fmtCO(lastReceipt.tax)}</span>
                {lastReceipt.service > 0 && (
                  <>
                    <span className="text-gray-600">Servicio voluntario</span>
                    <span className="text-right">${fmtCO(lastReceipt.service)}</span>
                  </>
                )}
                <span className="font-semibold">Total</span>
                <span className="text-right font-semibold">${fmtCO(lastReceipt.total)}</span>
              </div>

              {showQr && (
                <>
                  <div className="border-t border-dashed border-gray-300 my-3" />
                  <div className="w-full flex justify-center">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Ticket" className="w-32 h-32" />
                    ) : (
                      <div className="text-xs text-gray-500">Generando QR…</div>
                    )}
                  </div>
                  <p className="text-center text-[11px] text-gray-500 mt-2">
                    Escanea para ver datos del ticket
                  </p>
                </>
              )}

              <div className="mt-3 text-center text-[11px] text-gray-500">¡Gracias por su compra!</div>
            </div>

            <div className="p-3 border-t border-gray-100 flex justify-end">
              <button className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black text-sm whitespace-nowrap" onClick={() => setShowReceiptModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashRegisterPage
