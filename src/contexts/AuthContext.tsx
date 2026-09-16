'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Perfil, UserRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  perfil: Perfil | null;
  role: UserRole;
  carregando: boolean;
  setRoleOverride: (role: UserRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  perfil: null,
  role: 'admin',
  carregando: true,
  setRoleOverride: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [role, setRole] = useState<UserRole>('admin');
  const [carregando, setCarregando] = useState(true);

  const buscarPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setPerfil(data as Perfil);
        setRole((data as Perfil).role);
      }
    } catch (err) {
      console.warn('Perfil não encontrado para usuário:', err);
    }
  };

  useEffect(() => {
    async function inicializarAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setUser(data.user);
          await buscarPerfil(data.user.id);
        }
      } catch (err) {
        console.warn('Erro ao obter sessão auth:', err);
      } finally {
        setCarregando(false);
      }
    }

    inicializarAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await buscarPerfil(session.user.id);
        } else {
          setUser(null);
          setPerfil(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
  };

  const setRoleOverride = (newRole: UserRole) => {
    setRole(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        role,
        carregando,
        setRoleOverride,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
