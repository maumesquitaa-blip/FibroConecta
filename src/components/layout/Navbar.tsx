'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Shield, UserPlus, Users, Database, Sparkles } from 'lucide-react';
import { UserRole } from '@/types/database';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onRoleChange }) => {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Início', icon: Sparkles },
    { href: '/cadastro', label: 'Novo Cadastro', icon: UserPlus },
    { href: '/gestao', label: 'Consulta & Gestão', icon: Users },
    { href: '/setup', label: 'Configuração Supabase', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Identidade */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fibro-950 via-fibro-800 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 text-purple-200 fill-purple-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-gray-950">
                  Fibro<span className="text-fibro-800">Conecta</span>
                </span>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  SEMUS
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                São José de Ribamar - MA
              </p>
            </div>
          </Link>

          {/* Navegação Principal */}
          <nav className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-fibro-50 text-fibro-900 border border-purple-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-fibro-800' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controle de Papel (RBAC Switcher) & Status */}
          <div className="flex items-center space-x-3">
            {/* Status Supabase Online */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Online</span>
            </div>

            {/* Alternador de Perfil */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200">
              <button
                type="button"
                onClick={() => onRoleChange('atendente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentRole === 'atendente'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Atendente
              </button>
              <button
                type="button"
                onClick={() => onRoleChange('admin')}
                className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-fibro-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
