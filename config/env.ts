export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase-url.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key',
  },
  ai: {
    grokApiKey: process.env.GROK_API_KEY || '',
  },
};
