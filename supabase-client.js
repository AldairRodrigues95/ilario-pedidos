// Client Supabase — inicializado uma única vez (carregar após config.js e o CDN)
window.supabaseClient = window.supabaseClient
  || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
