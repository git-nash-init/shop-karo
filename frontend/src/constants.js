// Backend API URLs (all go through Express proxy)
export const BASE_URL = ''; // Uses CRA proxy to http://localhost:5000
export const PRODUCTS_URL = '/api/products';
export const USERS_URL = '/api/users';
export const ORDERS_URL = '/api/orders';
export const PAYPAL_URL = '/api/config/paypal';
export const UPLOAD_URL = '/api/upload';

// Supabase public config (safe to expose in frontend)
export const SUPABASE_URL = 'https://sllgtaolsaecchidbnvj.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGd0YW9sc2FlY2NoaWRibnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5OTIwODMsImV4cCI6MjEwODU2ODA4M30.R9cSvO7B9sRDa9fDLmXfnoB0o5Ej1tnWyM-NRCYnmgA';
