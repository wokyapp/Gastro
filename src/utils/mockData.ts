// =============================================================================
// STRUCTURED MOCK DATA FOR GASTROBAR
// =============================================================================
// This file contains mock data structured specifically for gastrobar operations
// =============================================================================
// -----------------------------------------------------------------------------
// TABLES TABLE
// -----------------------------------------------------------------------------
// Supabase table name: tables
// Primary key: id
// -----------------------------------------------------------------------------
export const mockTables = [{
  id: 1,
  name: 'Mesa 1',
  seats: 4,
  status: 'available',
  // available, occupied, reserved
  location: 'main',
  // main, terrace, bar
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 2,
  name: 'Mesa 2',
  seats: 2,
  status: 'available',
  location: 'main',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 3,
  name: 'Mesa 3',
  seats: 6,
  status: 'available',
  location: 'main',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 4,
  name: 'Mesa 4',
  seats: 4,
  status: 'available',
  location: 'main',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 5,
  name: 'Mesa 5',
  seats: 2,
  status: 'available',
  location: 'main',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 6,
  name: 'Mesa 6',
  seats: 8,
  status: 'available',
  location: 'main',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 7,
  name: 'Barra 1',
  seats: 1,
  status: 'available',
  location: 'bar',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 8,
  name: 'Barra 2',
  seats: 1,
  status: 'available',
  location: 'bar',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 9,
  name: 'Terraza 1',
  seats: 4,
  status: 'available',
  location: 'terrace',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 10,
  name: 'Terraza 2',
  seats: 4,
  status: 'available',
  location: 'terrace',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}];
// -----------------------------------------------------------------------------
// USERS TABLE
// -----------------------------------------------------------------------------
// Supabase table name: users
// Primary key: id
// -----------------------------------------------------------------------------
export const mockUsers = [{
  id: '1',
  name: 'Admin User',
  email: 'admin@gastrobar.com',
  role: 'admin',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: '2',
  name: 'Cajero',
  email: 'cashier@gastrobar.com',
  role: 'cashier',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: '3',
  name: 'Mesero',
  email: 'waiter@gastrobar.com',
  role: 'waiter',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: '4',
  name: 'Cocinero',
  email: 'cook@gastrobar.com',
  role: 'cook',
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}];
// -----------------------------------------------------------------------------
// ORDERS TABLE
// -----------------------------------------------------------------------------
// Supabase table name: orders
// Primary key: id
// Foreign keys:
//   - table_id references tables(id)
//   - server_id references users(id)
// -----------------------------------------------------------------------------
export const mockOrders = [{
  id: 'ORD-001',
  table_id: 1,
  status: 'active',
  // new, active, completed, cancelled
  total: 45600,
  server_id: '3',
  // User ID of waiter who created the order
  created_at: new Date('2023-09-15T14:30:00').toISOString(),
  updated_at: new Date('2023-09-15T14:45:00').toISOString()
}, {
  id: 'ORD-002',
  table_id: 3,
  status: 'active',
  total: 87200,
  server_id: '3',
  created_at: new Date('2023-09-15T15:10:00').toISOString(),
  updated_at: new Date('2023-09-15T15:30:00').toISOString()
}, {
  id: 'ORD-003',
  table_id: 6,
  status: 'active',
  total: 154000,
  server_id: '3',
  created_at: new Date('2023-09-15T19:20:00').toISOString(),
  updated_at: new Date('2023-09-15T19:45:00').toISOString()
}, {
  id: 'ORD-004',
  table_id: 8,
  status: 'active',
  total: 24000,
  server_id: '3',
  created_at: new Date('2023-09-15T20:05:00').toISOString(),
  updated_at: new Date('2023-09-15T20:10:00').toISOString()
}];
// -----------------------------------------------------------------------------
// ORDER_ITEMS TABLE
// -----------------------------------------------------------------------------
// Supabase table name: order_items
// Primary key: id
// Foreign keys:
//   - order_id references orders(id)
//   - menu_item_id references menu_items(id)
// -----------------------------------------------------------------------------
export const mockOrderItems = [{
  id: 1,
  order_id: 'ORD-001',
  menu_item_id: '1',
  name: 'Hamburguesa Clásica',
  price: 18000,
  quantity: 1,
  notes: 'Sin cebolla',
  created_at: new Date('2023-09-15T14:30:00').toISOString(),
  updated_at: new Date('2023-09-15T14:30:00').toISOString()
}, {
  id: 2,
  order_id: 'ORD-001',
  menu_item_id: '2',
  name: 'Papas Fritas',
  price: 8000,
  quantity: 1,
  notes: '',
  created_at: new Date('2023-09-15T14:30:00').toISOString(),
  updated_at: new Date('2023-09-15T14:30:00').toISOString()
}, {
  id: 3,
  order_id: 'ORD-001',
  menu_item_id: '3',
  name: 'Coca-Cola',
  price: 5000,
  quantity: 2,
  notes: 'Con hielo',
  created_at: new Date('2023-09-15T14:30:00').toISOString(),
  updated_at: new Date('2023-09-15T14:30:00').toISOString()
}, {
  id: 4,
  order_id: 'ORD-002',
  menu_item_id: '4',
  name: 'Pizza Margarita',
  price: 25000,
  quantity: 1,
  notes: '',
  created_at: new Date('2023-09-15T15:10:00').toISOString(),
  updated_at: new Date('2023-09-15T15:10:00').toISOString()
}, {
  id: 5,
  order_id: 'ORD-002',
  menu_item_id: '5',
  name: 'Ensalada César',
  price: 12000,
  quantity: 1,
  notes: 'Sin anchoas',
  created_at: new Date('2023-09-15T15:10:00').toISOString(),
  updated_at: new Date('2023-09-15T15:10:00').toISOString()
}, {
  id: 6,
  order_id: 'ORD-002',
  menu_item_id: '6',
  name: 'Cerveza Artesanal',
  price: 9000,
  quantity: 2,
  notes: '',
  created_at: new Date('2023-09-15T15:10:00').toISOString(),
  updated_at: new Date('2023-09-15T15:10:00').toISOString()
}, {
  id: 7,
  order_id: 'ORD-002',
  menu_item_id: '7',
  name: 'Tiramisú',
  price: 8000,
  quantity: 2,
  notes: '',
  created_at: new Date('2023-09-15T15:10:00').toISOString(),
  updated_at: new Date('2023-09-15T15:10:00').toISOString()
}];
// -----------------------------------------------------------------------------
// RESERVATIONS TABLE
// -----------------------------------------------------------------------------
// Supabase table name: reservations
// Primary key: id
// Foreign keys:
//   - table_id references tables(id)
// -----------------------------------------------------------------------------
export const mockReservations = [{
  id: 'RES-001',
  table_id: 4,
  name: 'Familia Rodríguez',
  phone: '3101234567',
  email: 'rodriguez@example.com',
  people: 4,
  date: new Date('2023-09-15').toISOString(),
  time: '19:30',
  status: 'confirmed',
  // confirmed, cancelled, completed
  notes: 'Celebración de cumpleaños',
  created_at: new Date('2023-09-10').toISOString(),
  updated_at: new Date('2023-09-10').toISOString()
}, {
  id: 'RES-002',
  table_id: 9,
  name: 'Carlos Méndez',
  phone: '3209876543',
  email: 'carlos@example.com',
  people: 3,
  date: new Date('2023-09-15').toISOString(),
  time: '20:15',
  status: 'confirmed',
  notes: '',
  created_at: new Date('2023-09-12').toISOString(),
  updated_at: new Date('2023-09-12').toISOString()
}];
// -----------------------------------------------------------------------------
// MENU_CATEGORIES TABLE
// -----------------------------------------------------------------------------
// Supabase table name: menu_categories
// Primary key: id
// -----------------------------------------------------------------------------
export const mockMenuCategories = [{
  id: 'MC-001',
  name: 'Platos principales',
  description: 'Platos fuertes para satisfacer tu hambre',
  order: 1,
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 'MC-002',
  name: 'Acompañamientos',
  description: 'Complementos perfectos para tu comida',
  order: 2,
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 'MC-003',
  name: 'Bebidas',
  description: 'Refrescantes opciones para acompañar tu comida',
  order: 3,
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 'MC-004',
  name: 'Postres',
  description: 'Deliciosos postres para terminar tu comida',
  order: 4,
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: 'MC-005',
  name: 'Entradas',
  description: 'Pequeños aperitivos para comenzar',
  order: 0,
  active: true,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}];
// -----------------------------------------------------------------------------
// MENU_ITEMS TABLE
// -----------------------------------------------------------------------------
// Supabase table name: menu_items
// Primary key: id
// Foreign keys:
//   - category_id references menu_categories(id)
// -----------------------------------------------------------------------------
export const mockMenuItems = [{
  id: '1',
  name: 'Hamburguesa Clásica',
  description: 'Carne de res, lechuga, tomate, queso y salsa especial',
  price: 18000,
  category_id: 'MC-001',
  type: 'food',
  image_url: 'https://example.com/images/hamburger.jpg',
  available: true,
  preparation_time: 15,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: '2',
  name: 'Papas Fritas',
  description: 'Papas crujientes con sal marina',
  price: 8000,
  category_id: 'MC-002',
  type: 'food',
  image_url: 'https://example.com/images/fries.jpg',
  available: true,
  preparation_time: 10,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: '3',
  name: 'Coca-Cola',
  description: 'Refresco de cola 355ml',
  price: 5000,
  category_id: 'MC-003',
  type: 'drink',
  image_url: 'https://example.com/images/coke.jpg',
  available: true,
  preparation_time: 2,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: '4',
  name: 'Pizza Margarita',
  description: 'Pizza con salsa de tomate, mozzarella y albahaca',
  price: 25000,
  category_id: 'MC-001',
  type: 'food',
  image_url: 'https://example.com/images/pizza.jpg',
  available: true,
  preparation_time: 20,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: '5',
  name: 'Ensalada César',
  description: 'Lechuga romana, crutones, pollo y aderezo césar',
  price: 12000,
  category_id: 'MC-001',
  type: 'food',
  image_url: 'https://example.com/images/salad.jpg',
  available: true,
  preparation_time: 10,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: '6',
  name: 'Cerveza Artesanal',
  description: 'Cerveza artesanal local 330ml',
  price: 9000,
  category_id: 'MC-003',
  type: 'drink',
  image_url: 'https://example.com/images/beer.jpg',
  available: true,
  preparation_time: 2,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}, {
  id: '7',
  name: 'Tiramisú',
  description: 'Postre italiano con café, mascarpone y cacao',
  price: 8000,
  category_id: 'MC-004',
  type: 'food',
  image_url: 'https://example.com/images/tiramisu.jpg',
  available: true,
  preparation_time: 5,
  created_at: new Date('2023-01-01').toISOString(),
  updated_at: new Date('2023-01-01').toISOString()
}];
// -----------------------------------------------------------------------------
// CASH_MOVEMENTS TABLE
// -----------------------------------------------------------------------------
// Supabase table name: cash_movements
// Primary key: id
// Foreign keys:
//   - user_id references users(id)
//   - cash_session_id references cash_sessions(id)
// -----------------------------------------------------------------------------
export const mockCashMovements = [{
  id: 'CASH-001',
  cash_session_id: 'SESSION-001',
  type: 'apertura',
  // apertura, venta, reembolso, sangria, ingreso, corte_x, cierre
  amount: 100000,
  date: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
  notes: 'Apertura de caja',
  user_id: '2',
  created_at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
  updated_at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString()
}, {
  id: 'CASH-002',
  cash_session_id: 'SESSION-001',
  type: 'venta',
  amount: 15560,
  date: new Date(new Date().setHours(9, 15, 0, 0)).toISOString(),
  notes: 'Venta SALE-001',
  user_id: '2',
  created_at: new Date(new Date().setHours(9, 15, 0, 0)).toISOString(),
  updated_at: new Date(new Date().setHours(9, 15, 0, 0)).toISOString()
}, {
  id: 'CASH-003',
  cash_session_id: 'SESSION-001',
  type: 'venta',
  amount: 28000,
  date: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
  notes: 'Venta SALE-002',
  user_id: '2',
  created_at: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
  updated_at: new Date(new Date().setHours(10, 30, 0, 0)).toISOString()
}, {
  id: 'CASH-004',
  cash_session_id: 'SESSION-001',
  type: 'sangria',
  amount: 50000,
  date: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
  notes: 'Retiro para cambio',
  user_id: '2',
  created_at: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
  updated_at: new Date(new Date().setHours(12, 0, 0, 0)).toISOString()
}];
// -----------------------------------------------------------------------------
// CASH_SESSIONS TABLE
// -----------------------------------------------------------------------------
// Supabase table name: cash_sessions
// Primary key: id
// Foreign keys:
//   - cashier_id references users(id)
//   - supervisor_id references users(id)
// -----------------------------------------------------------------------------
export const mockCashSessions = [{
  id: 'SESSION-001',
  open_date: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
  close_date: null,
  initial_amount: 100000,
  final_amount: null,
  expected_amount: null,
  difference: null,
  cashier_id: '2',
  supervisor_id: '1',
  status: 'open',
  // open, closed
  created_at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
  updated_at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString()
}, {
  id: 'SESSION-002',
  open_date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  close_date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  initial_amount: 150000,
  final_amount: 325000,
  expected_amount: 320000,
  difference: 5000,
  cashier_id: '2',
  supervisor_id: '1',
  status: 'closed',
  created_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  updated_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
}];
// -----------------------------------------------------------------------------
// SALES TABLE
// -----------------------------------------------------------------------------
// Supabase table name: sales
// Primary key: id
// Foreign keys:
//   - order_id references orders(id)
//   - cashier_id references users(id)
// -----------------------------------------------------------------------------
export const mockSales = [{
  id: 'SALE-001',
  order_id: 'ORD-001',
  date: new Date(new Date().setHours(9, 15, 0, 0)).toISOString(),
  subtotal: 36000,
  taxes: 2880,
  tip: 3600,
  total: 42480,
  payment_method: 'efectivo',
  // efectivo, tarjeta, digital
  cashier_id: '2',
  created_at: new Date(new Date().setHours(9, 15, 0, 0)).toISOString(),
  updated_at: new Date(new Date().setHours(9, 15, 0, 0)).toISOString()
}, {
  id: 'SALE-002',
  order_id: 'ORD-002',
  date: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
  subtotal: 46000,
  taxes: 3680,
  tip: 4600,
  total: 54280,
  payment_method: 'tarjeta',
  cashier_id: '2',
  created_at: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
  updated_at: new Date(new Date().setHours(10, 30, 0, 0)).toISOString()
}];