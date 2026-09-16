'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Paciente } from '@/types/database';
import { formatarDataBR } from '@/lib/utils';
import { ShieldCheck, AlertTriangle, Heart, Award, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ValidarCarteiraPage() {
  const params = useParams();
  const pacienteId = params?.id as string;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function buscarPaciente() {
      if (!pacienteId) return;

      try {
        setCarregando(true);
        const { data, error } = await supabase
          .from('pacientes')
          .select('*')
          .eq('id', pacienteId)
          .single();

        if (error || !data) {
          setErro('Carteira ou registro não localizado no sistema oficial.');
        } else {
          setPaciente(data as Paciente);
        }
      } catch (err) {
        console.error(err);
        setErro('Erro na consulta de autenticidade.');
      } finally {
        setCarregando(false);
      }
    }

    buscarPaciente();
  }, [pacienteId]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Topo Oficial */}
        <div className="bg-gradient-to-r from-fibro-950 via-fibro-900 to-fibro-800 text-white p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-3 shadow-inner">
            <Heart className="w-8 h-8 text-purple-300 fill-purple-300" />
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase">
            Autenticidade de Documento Oficial
          </h1>
          <p className="text-xs text-purple-200 mt-1 font-medium">
            Prefeitura Municipal de São José de Ribamar • SEMUS
          </p>
          <p className="text-[11px] text-purple-300">
            Carteira de Prioridade da Pessoa com Fibromialgia (CIPFIBRO)
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {carregando ? (
            <div className="py-16 text-center text-gray-500 space-y-3">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-semibold text-sm">Consultando banco de dados oficial...</p>
            </div>
          ) : erro || !paciente ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-9 h-9" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Carteira Não Encontrada</h2>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  {erro || 'O identificador escaneado não corresponde a uma carteira válida.'}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-xs font-bold text-purple-700 hover:underline pt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Portal</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Badge de Validação Válida */}
              <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 block">
                    Documento Válido & Autêntico
                  </span>
                  <p className="text-xs text-emerald-950">
                    Status: <strong className="uppercase">{paciente.status_carteira}</strong>
                  </p>
                </div>
              </div>

              {/* Informações do Paciente */}
              <div className="flex items-center space-x-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                <div className="w-20 h-24 rounded-xl border-2 border-purple-300 overflow-hidden bg-white shadow-sm flex-shrink-0">
                  {paciente.foto_url ? (
                    <img
                      src={paciente.foto_url}
                      alt={paciente.nome_completo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      3x4
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Titular da Carteira
                  </span>
                  <h3 className="text-base font-black text-gray-950 uppercase leading-snug">
                    {paciente.nome_completo}
                  </h3>
                  <div className="inline-block bg-purple-200 text-purple-900 text-xs font-extrabold px-2.5 py-0.5 rounded-md">
                    CID-10: {paciente.cid10 || 'M79.7'}
                  </div>
                </div>
              </div>

              {/* Detalhes de Registro */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-gray-500 font-bold block">CPF:</span>
                  <span className="font-mono font-bold text-gray-900">{paciente.cpf}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-bold block">Cartão SUS:</span>
                  <span className="font-mono font-bold text-gray-900">{paciente.cartao_sus}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-bold block">Data de Nascimento:</span>
                  <span className="font-semibold text-gray-900">{formatarDataBR(paciente.data_nascimento)}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-bold block">Data de Emissão:</span>
                  <span className="font-semibold text-gray-900">{formatarDataBR(paciente.data_emissao)}</span>
                </div>
              </div>

              {/* Amparo Legal */}
              <div className="p-4 bg-purple-900/5 rounded-2xl border border-purple-200/60 space-y-2">
                <div className="flex items-center space-x-1.5 text-purple-950 font-bold text-xs">
                  <Award className="w-4 h-4 text-purple-700" />
                  <span>Amparo Legal & Direitos</span>
                </div>
                <p className="text-[11px] text-gray-600 text-justify leading-relaxed">
                  Confere atendimento preferencial em órgãos públicos e empresas privadas nos termos da <strong>Lei Federal Nº 14.705/2023</strong> e <strong>Lei Municipal Nº 1.375, de 09 de maio de 2023</strong> da Prefeitura Municipal de São José de Ribamar - MA.
                </p>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/"
                  className="text-xs font-bold text-purple-800 hover:text-purple-950 hover:underline"
                >
                  Acessar portal FibroConecta
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
