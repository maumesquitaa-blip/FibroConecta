import { createClient } from '@supabase/supabase-js';
import { Paciente, Perfil } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ymcsmzpkfpjgjtlybemw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    'sb_publishable_-JZkeTOIW5-EyNOJCbuSUA_Fooca8H9';

export interface Database {
  public: {
    Tables: {
      pacientes: {
        Row: Paciente;
        Insert: Omit<Paciente, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Paciente, 'id'>>;
      };
      perfis: {
        Row: Perfil;
        Insert: Perfil;
        Update: Partial<Perfil>;
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
