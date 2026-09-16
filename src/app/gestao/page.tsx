'use client';

import React, { useState } from 'react';
import { TabelaPacientes } from '@/components/gestao/TabelaPacientes';
import { UserRole } from '@/types/database';
import { Users, Shield, UserCheck } from 'lucide-react';

export default function GestaoPage() {
  const [role, setRole] = useState<UserRole>('admin');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight flex items-center space-x-2">
            <Users className="w-7 h-7 text-fibro-800" />
            <span>Gestão e Emissão de Carteiras (CIPFIBRO)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Acompanhamento em tempo real via Supabase Realtime • Atualização de status e geração de lotes em ZIP
          </p>
        </div>

        {/* Seletor Rápido de Permissão nesta página */}
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-500 px-2">Visualizando como:</span>
          <button
            onClick={() => setRole('atendente')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
              role === 'atendente'
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Atendente
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-bold rounded-xl transition ${
              role === 'admin'
                ? 'bg-fibro-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      <TabelaPacientes currentRole={role} />
    </div>
  );
}
