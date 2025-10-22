import { USE_SUPABASE } from '../flags';
import {
  BusinessSettings,
  CashCountCOP,
  CashMovement,
  CashSession,
  PaymentMethod,
  Sale,
  Ticket,
  UUID,
} from '../types';

import * as db from './mockdb';
import { ticketToSale } from './adapters';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
function assertOpenSession(): CashSession {
  const s = db.getOpenSession();
  if (!s) throw new Error('No hay caja abierta.');
  return s;
}

// ---------- BUSINESS ----------
async function getBusiness(): Promise<BusinessSettings | null> {
  await delay(80);
  return db.getBusiness();
}

// ---------- TICKETS ----------
async function listActiveTickets(): Promise<Ticket[]> {
  await delay(100);
  return db.getActiveTickets();
}
async function markTicketPaid(ticketId: string): Promise<void> {
  await delay(60);
  db.markTicketPaid(ticketId);
}

// ---------- CAJA ----------
async function getOpenCashSession(): Promise<CashSession | null> {
  await delay(60);
  return db.getOpenSession();
}
async function openCashSession(params: {
  cashier_id: UUID;
  opening_count: CashCountCOP;
  supervisor_id?: UUID | null;
  device_id?: string | null;
}): Promise<CashSession> {
  await delay(150);
  if (USE_SUPABASE) throw new Error('Supabase aún no integrado');
  return db.openSession({
    cashier_id: params.cashier_id,
    supervisor_id: params.supervisor_id,
    opening_count: params.opening_count,
    device_id: params.device_id,
  });
}

async function addCashMovement(params: {
  type: Exclude<CashMovement['type'], 'apertura' | 'cierre'>;
  amount: number;
  notes?: string;
  user_id: UUID;
  sale_id?: string | null;
}): Promise<CashMovement> {
  await delay(120);
  const s = assertOpenSession();
  return db.addMovement({
    session_id: s.id,
    type: params.type,
    amount: params.amount,
    notes: params.notes,
    user_id: params.user_id,
    sale_id: params.sale_id ?? null,
  });
}

async function registerIngreso(amount: number, user_id: UUID, notes?: string) {
  return addCashMovement({ type: 'ingreso', amount, user_id, notes });
}
async function registerEgreso(amount: number, user_id: UUID, notes?: string) {
  return addCashMovement({ type: 'sangria', amount, user_id, notes });
}
async function registerReembolso(amount: number, user_id: UUID, notes?: string, sale_id?: string) {
  return addCashMovement({ type: 'reembolso', amount, user_id, notes, sale_id: sale_id ?? null });
}
async function registerVentaEfectivo(amount: number, user_id: UUID, sale_id?: string) {
  return addCashMovement({ type: 'venta', amount, user_id, notes: 'Venta en efectivo', sale_id: sale_id ?? null });
}

async function closeCashSession(params: { closing_count: CashCountCOP; user_id: UUID }) {
  await delay(180);
  const s = assertOpenSession();
  return db.closeSession({ session_id: s.id, closing_count: params.closing_count, user_id: params.user_id });
}

async function getCashSessionSummary(sessionId?: string) {
  await delay(100);
  const s = sessionId ? db.listSessions().find((x) => x.id === sessionId) : db.getOpenSession();
  if (!s) throw new Error('No hay sesión de caja.');
  return db.getSessionSummary(s.id);
}

async function listCashMovements(sessionId?: string) {
  await delay(90);
  return db.listMovements(sessionId ?? db.getOpenSession()?.id || '');
}
async function listCashSessions(): Promise<CashSession[]> {
  await delay(90);
  return db.listSessions();
}

// ---------- VENTAS ----------
async function listSales(): Promise<Sale[]> {
  await delay(120);
  return db.getSales();
}
async function __setSales(list: Sale[]) {
  db.setSales(list);
}

async function finalizeTicketPayment(params: {
  ticket: Ticket;
  payment_method: PaymentMethod;
  cashier_id: UUID;
  register_cash?: boolean;
}): Promise<{ sale: Sale }> {
  await delay(180);
  const sale = ticketToSale(params.ticket, params.payment_method, params.cashier_id);
  const current = db.getSales();
  db.setSales([sale, ...current]);
  db.markTicketPaid(params.ticket.id);

  if (params.payment_method === 'efectivo' && params.register_cash) {
    const open = db.getOpenSession();
    if (open) {
      db.addMovement({
        session_id: open.id,
        type: 'venta',
        amount: sale.total,
        user_id: params.cashier_id,
        notes: `Venta ${sale.id}`,
        sale_id: sale.id,
      });
    }
  }
  return { sale };
}

// ---------- Denominaciones COP ----------
const COP_DENOMINATIONS = {
  coins: db.COP_DENOMS.coins,
  bills: db.COP_DENOMS.bills,
};

export const api = {
  // business
  getBusiness,

  // tickets
  listActiveTickets,
  markTicketPaid,

  // caja
  getOpenCashSession,
  openCashSession,
  addCashMovement,
  registerIngreso,
  registerEgreso,
  registerReembolso,
  registerVentaEfectivo,
  closeCashSession,
  getCashSessionSummary,
  listCashMovements,
  listCashSessions,

  // ventas
  listSales,
  __setSales,
  finalizeTicketPayment,

  // utils
  COP_DENOMINATIONS,
};

export type Api = typeof api;
