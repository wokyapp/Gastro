import { createClient } from '@supabase/supabase-js';
// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ========================
// HELPER FUNCTIONS
// ========================
// Products
export const getProducts = async () => {
  const {
    data,
    error
  } = await supabase.from('products').select('*, categories(*)').order('name');
  if (error) throw error;
  return data;
};
export const getProductById = async (id: string) => {
  const {
    data,
    error
  } = await supabase.from('products').select('*, categories(*)').eq('id', id).single();
  if (error) throw error;
  return data;
};
// Categories
export const getCategories = async () => {
  const {
    data,
    error
  } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data;
};
// Clients
export const getClients = async () => {
  const {
    data,
    error
  } = await supabase.from('clients').select('*').order('name');
  if (error) throw error;
  return data;
};
export const getClientById = async (id: string) => {
  const {
    data,
    error
  } = await supabase.from('clients').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};
export const searchClients = async (term: string) => {
  const {
    data,
    error
  } = await supabase.from('clients').select('*').or(`name.ilike.%${term}%,document.ilike.%${term}%,email.ilike.%${term}%`).order('name');
  if (error) throw error;
  return data;
};
// Tables
export const getTables = async () => {
  const {
    data,
    error
  } = await supabase.from('tables').select('*').order('name');
  if (error) throw error;
  return data;
};
export const getTableById = async (id: number) => {
  const {
    data,
    error
  } = await supabase.from('tables').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};
export const updateTableStatus = async (id: number, status: string) => {
  const {
    data,
    error
  } = await supabase.from('tables').update({
    status,
    updated_at: new Date().toISOString()
  }).eq('id', id).select();
  if (error) throw error;
  return data;
};
// Orders
export const getOrders = async () => {
  const {
    data,
    error
  } = await supabase.from('orders').select(`
      *,
      tables(*),
      users:server_id(*),
      order_items(*)
    `).order('created_at', {
    ascending: false
  });
  if (error) throw error;
  return data;
};
export const getOrderById = async (id: string) => {
  const {
    data,
    error
  } = await supabase.from('orders').select(`
      *,
      tables(*),
      users:server_id(*),
      order_items(*)
    `).eq('id', id).single();
  if (error) throw error;
  return data;
};
export const getOrdersByTable = async (tableId: number) => {
  const {
    data,
    error
  } = await supabase.from('orders').select(`
      *,
      tables(*),
      users:server_id(*),
      order_items(*)
    `).eq('table_id', tableId).eq('status', 'active').order('created_at', {
    ascending: false
  });
  if (error) throw error;
  return data;
};
export const createOrder = async (order: any) => {
  const {
    data,
    error
  } = await supabase.from('orders').insert(order).select();
  if (error) throw error;
  return data;
};
export const updateOrder = async (id: string, updates: any) => {
  const {
    data,
    error
  } = await supabase.from('orders').update({
    ...updates,
    updated_at: new Date().toISOString()
  }).eq('id', id).select();
  if (error) throw error;
  return data;
};
// Order Items
export const createOrderItem = async (orderItem: any) => {
  const {
    data,
    error
  } = await supabase.from('order_items').insert(orderItem).select();
  if (error) throw error;
  return data;
};
export const updateOrderItem = async (id: number, updates: any) => {
  const {
    data,
    error
  } = await supabase.from('order_items').update({
    ...updates,
    updated_at: new Date().toISOString()
  }).eq('id', id).select();
  if (error) throw error;
  return data;
};
export const deleteOrderItem = async (id: number) => {
  const {
    error
  } = await supabase.from('order_items').delete().eq('id', id);
  if (error) throw error;
  return true;
};
// Business Settings
export const getBusinessSettings = async () => {
  const {
    data,
    error
  } = await supabase.from('business_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
};
// Users & Authentication
export const getCurrentUser = async () => {
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return null;
  // Get additional user data from users table
  const {
    data,
    error
  } = await supabase.from('users').select('*').eq('id', user.id).single();
  if (error) throw error;
  return {
    ...user,
    ...data
  };
};
export const signIn = async (email: string, password: string) => {
  const {
    data,
    error
  } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};
export const signOut = async () => {
  const {
    error
  } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
};