'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  Heart,
  UserPlus,
  Users,
  ShieldCheck,
  FileArchive,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Award,
  CreditCard,
  QrCode,
  Database,
} from 'lucide-react';

export default function HomePage() {
  const [metricas, setMetricas] = useState({
    total: 0,
    pendentes: 0,
    aprovados: 0,
    emitidos: 0,
  });

  useEffect(() => {
    async function carregarMetricas() {
      try {
        const { data, error } = await supabase
          .from('pacientes')
          .select('status_carteira');

        if (data) {
          const total = data.length;
          const pendentes = data.filter((p) => p.status_carteira === 'PENDENTE').length;
          const aprovados = data.filter((p) => p.status_carteira === 'APROVADO').length;
          const emitidos = data.filter((p) => p.status_carteira === 'EMITIDO' || p.status_carteira === 'ENTREGUE').length;
          setMetricas({ total, pendentes, aprovados, emitidos });
        }
      } catch (err) {
        console.warn('Erro ao carregar métricas:', err);
      }
    }
    carregarMetricas();
  }, []);

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fibro-950 via-fibro-900 to-purple-900 text-white p-8 sm:p-12 shadow-2xl border border-purple-800/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-purple-500/20 backdrop-blur-md border border-purple-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-purple-200">
            <Heart className="w-4 h-4 text-purple-300 fill-purple-400" />
            <span>Prefeitura Municipal de São José de Ribamar • SEMUS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Sistema Oficial <span className="text-purple-300">FibroConecta</span>
          </h1>

          <p className="text-sm sm:text-base text-purple-100 leading-relaxed max-w-2xl">
            Plataforma digital para cadastramento de pacientes com fibromialgia e emissão da 
            <strong> Carteira de Identificação da Pessoa com Fibromialgia (CIPFIBRO)</strong> em formato 
            físico PVC oficial (57mm x 86mm), garantindo prioridade nos termos da 
            <strong> Lei Federal Nº 14.705/2023</strong> e <strong>Lei Municipal Nº 1.375/2023</strong>.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href="/cadastro"
              className="inline-flex items-center space-x-2 bg-white text-fibro-950 hover:bg-purple-50 px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl transition transform hover:scale-105"
            >
              <UserPlus className="w-5 h-5 text-fibro-800" />
              <span>Novo Cadastro de Paciente</span>
            </Link>

            <Link
              href="/gestao"
              className="inline-flex items-center space-x-2 bg-purple-600/50 hover:bg-purple-600/70 border border-purple-400/30 text-white px-6 py-3.5 rounded-2xl font-bold text-sm backdrop-blur-sm transition"
            >
              <Users className="w-5 h-5 text-purple-200" />
              <span>Painel de Gestão & Lotes</span>
            </Link>
          </div>
        </div>

        {/* Efeito decorativo de fundo */}
        <div className="absolute right-0 top-0 -bottom-10 w-96 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pacientes</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{metricas.total}</p>
          <span className="text-[11px] text-gray-400 font-medium">Cadastrados na base</span>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pendentes</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{metricas.pendentes}</p>
          <span className="text-[11px] text-gray-400 font-medium">Aguardando análise</span>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Aprovados</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{metricas.aprovados}</p>
          <span className="text-[11px] text-gray-400 font-medium">Prontos para emissão</span>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Emitidas</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{metricas.emitidos}</p>
          <span className="text-[11px] text-gray-400 font-medium">Carteiras ativas</span>
        </div>
      </div>

      {/* Módulos de Funcionalidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Cadastro */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col justify-between group hover:border-purple-300 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Módulo Atendente</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Formulário intuitivo com validação matemática de CPF, captura fotográfica 3x4 pela webcam e upload direto de laudo médico e comprovante de residência.
            </p>
          </div>
          <Link
            href="/cadastro"
            className="inline-flex items-center space-x-2 text-xs font-bold text-fibro-800 hover:text-fibro-950 mt-6 pt-4 border-t border-gray-100 group-hover:translate-x-1 transition"
          >
            <span>Acessar Cadastro</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 2: Gestão & Lotes */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col justify-between group hover:border-purple-300 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <FileArchive className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Módulo Administrador</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Painel com Supabase Realtime, visualizador de laudos médicos anexados, alteração individual/lote de status e download massivo de carteiras em arquivo ZIP.
            </p>
          </div>
          <Link
            href="/gestao"
            className="inline-flex items-center space-x-2 text-xs font-bold text-blue-700 hover:text-blue-900 mt-6 pt-4 border-t border-gray-100 group-hover:translate-x-1 transition"
          >
            <span>Acessar Gestão</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 3: Formato PVC Oficial */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col justify-between group hover:border-purple-300 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Padrão PVC (57x86mm)</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Desenvolvido com <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">@react-pdf/renderer</code> seguindo as medidas regulamentares, com QR Code digital para validação pública e dados oficiais.
            </p>
          </div>
          <Link
            href="/setup"
            className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 mt-6 pt-4 border-t border-gray-100 group-hover:translate-x-1 transition"
          >
            <span>Ver Configurações SQL</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
