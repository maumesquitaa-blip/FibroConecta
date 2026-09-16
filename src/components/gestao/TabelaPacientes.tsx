'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Paciente, StatusCarteira, UserRole } from '@/types/database';
import { formatarDataBR } from '@/lib/utils';
import {
  baixarCarteiraPDF,
  baixarCarteirasEmLoteZIP,
} from '@/lib/pdf-generator';
import dynamic from 'next/dynamic';

const CarteiraPreviewModal = dynamic(
  () => import('@/components/carteira/CarteiraPreviewModal').then((mod) => mod.CarteiraPreviewModal),
  { ssr: false }
);

const DocumentViewerModal = dynamic(
  () => import('./DocumentViewerModal').then((mod) => mod.DocumentViewerModal),
  { ssr: false }
);
import {
  Search,
  Filter,
  Download,
  FileArchive,
  Eye,
  FileText,
  MapPin,
  CheckCircle,
  Clock,
  Send,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Shield,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface TabelaPacientesProps {
  currentRole: UserRole;
}

export const TabelaPacientes: React.FC<TabelaPacientesProps> = ({ currentRole }) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [baixandoLote, setBaixandoLote] = useState(false);
  const [progressoLote, setProgressoLote] = useState<{ atual: number; total: number } | null>(null);

  // Modais
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docModal, setDocModal] = useState<{
    paciente: Paciente | null;
    tipo: 'laudo' | 'comprovante' | null;
    isOpen: boolean;
  }>({
    paciente: null,
    tipo: null,
    isOpen: false,
  });

  // 1. Carregar Pacientes
  const carregarPacientes = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao carregar do Supabase:', error);
        try {
          const salvos = JSON.parse(localStorage.getItem('fibro_pacientes_local') || '[]');
          if (salvos.length > 0) {
            setPacientes(salvos);
            return;
          }
        } catch (e) {}
        toast.warning('Tabela "pacientes" não encontrada no Supabase. Acesse /setup para configurá-la.');
      } else {
        let lista = (data as Paciente[]) || [];
        try {
          const salvos = JSON.parse(localStorage.getItem('fibro_pacientes_local') || '[]');
          if (salvos.length > 0) {
            const ids = new Set(lista.map(p => p.id));
            const novosLocais = salvos.filter((p: Paciente) => !ids.has(p.id));
            lista = [...novosLocais, ...lista];
          }
        } catch (e) {}
        setPacientes(lista);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Falha na comunicação com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  // 2. Assinatura Realtime do Supabase
  useEffect(() => {
    carregarPacientes();

    // Inscrição em tempo real com supabase.channel('pacientes')
    const canal = supabase
      .channel('pacientes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pacientes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.info(`Novo paciente cadastrado: ${(payload.new as Paciente).nome_completo}`, {
              icon: '📋',
            });
            setPacientes((prev) => [payload.new as Paciente, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPacientes((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Paciente) : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setPacientes((prev) => prev.filter((p) => p.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // 3. Filtragem de dados
  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      const matchBusca =
        p.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
        p.cpf.includes(busca) ||
        p.cartao_sus.includes(busca);

      const matchStatus = filtroStatus === 'TODOS' || p.status_carteira === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [pacientes, busca, filtroStatus]);

  // 4. Seleção múltipla
  const handleSelectAll = () => {
    if (selecionados.length === pacientesFiltrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(pacientesFiltrados.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 5. Atualizar Status Individual
  const handleAtualizarStatusIndividual = async (pacienteId: string, novoStatus: StatusCarteira) => {
    try {
      const payload: Partial<Paciente> = { status_carteira: novoStatus };
      if (novoStatus === 'EMITIDO' || novoStatus === 'APROVADO') {
        payload.data_emissao = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', pacienteId);

      if (error) throw error;

      setPacientes((prev) =>
        prev.map((p) => (p.id === pacienteId ? { ...p, ...payload } : p))
      );
      toast.success(`Status atualizado para: ${novoStatus}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao atualizar status.');
    }
  };

  // 6. Atualização em Lote de Status (Admin)
  const handleAtualizarStatusLote = async (novoStatus: StatusCarteira) => {
    if (selecionados.length === 0) {
      toast.warning('Selecione pelo menos um paciente.');
      return;
    }

    try {
      toast.info(`Atualizando ${selecionados.length} pacientes para ${novoStatus}...`);
      const payload: Partial<Paciente> = { status_carteira: novoStatus };
      if (novoStatus === 'EMITIDO' || novoStatus === 'APROVADO') {
        payload.data_emissao = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('pacientes')
        .update(payload)
        .in('id', selecionados);

      if (error) throw error;

      setPacientes((prev) =>
        prev.map((p) => (selecionados.includes(p.id) ? { ...p, ...payload } : p))
      );
      toast.success(`${selecionados.length} pacientes atualizados com sucesso!`);
      setSelecionados([]);
    } catch (err: any) {
      console.error(err);
      toast.error('Falha ao atualizar em lote.');
    }
  };

  // 7. Download em Lote (Geração de ZIP com JSZip)
  const handleDownloadLoteZIP = async () => {
    const listaAlvo = pacientes.filter((p) => selecionados.includes(p.id));
    if (listaAlvo.length === 0) {
      toast.warning('Selecione os pacientes cujas carteiras deseja baixar.');
      return;
    }

    try {
      setBaixandoLote(true);
      toast.info(`Iniciando geração de lote ZIP com ${listaAlvo.length} carteiras...`);

      await baixarCarteirasEmLoteZIP(listaAlvo, (atual, total) => {
        setProgressoLote({ atual, total });
      });

      toast.success('Arquivo ZIP com as carteiras baixado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar arquivo compactado em lote.');
    } finally {
      setBaixandoLote(false);
      setProgressoLote(null);
    }
  };

  // 8. Baixa Simultânea de Status (PENDENTE -> EMITIDO) com Geração Instantânea de ZIP
  const handleBaixaSimultaneaEZip = async () => {
    const listaAlvo = pacientes.filter((p) => selecionados.includes(p.id));
    if (listaAlvo.length === 0) {
      toast.warning('Selecione os pacientes na tabela.');
      return;
    }

    try {
      setBaixandoLote(true);
      toast.info(`Atualizando status de ${listaAlvo.length} pacientes para EMITIDO...`);

      const dataHoje = new Date().toISOString().split('T')[0];
      const payload: Partial<Paciente> = {
        status_carteira: 'EMITIDO',
        data_emissao: dataHoje,
      };

      const { error } = await supabase
        .from('pacientes')
        .update(payload)
        .in('id', selecionados);

      if (error) throw error;

      setPacientes((prev) =>
        prev.map((p) => (selecionados.includes(p.id) ? { ...p, ...payload } : p))
      );
      toast.success('Status atualizado para EMITIDO!');

      toast.info('Compilando lote ZIP com PDFs renomeados por CPF...');
      await baixarCarteirasEmLoteZIP(listaAlvo, (atual, total) => {
        setProgressoLote({ atual, total });
      });

      toast.success('Lote ZIP gerado e baixado com sucesso!');
      setSelecionados([]);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro na baixa simultânea e geração do lote.');
    } finally {
      setBaixandoLote(false);
      setProgressoLote(null);
    }
  };

  // Cores e Ícones de Status
  const getBadgeStatus = (status: StatusCarteira) => {
    switch (status) {
      case 'PENDENTE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Pendente</span>
          </span>
        );
      case 'APROVADO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle className="w-3 h-3" />
            <span>Aprovado</span>
          </span>
        );
      case 'EMITIDO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Sparkles className="w-3 h-3" />
            <span>Emitido</span>
          </span>
        );
      case 'ENTREGUE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCheck className="w-3 h-3" />
            <span>Entregue</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Busca por Nome / CPF */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por Nome, CPF ou SUS..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm transition"
            />
          </div>

          {/* Filtros por Status */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {['TODOS', 'PENDENTE', 'APROVADO', 'EMITIDO', 'ENTREGUE'].map((st) => (
              <button
                key={st}
                onClick={() => setFiltroStatus(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filtroStatus === st
                    ? 'bg-fibro-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}

            <button
              onClick={carregarPacientes}
              className="p-2 text-gray-500 hover:text-fibro-800 rounded-xl hover:bg-purple-50 transition ml-auto md:ml-2"
              title="Recarregar tabela"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Barra de Ações em Lote (Admin) */}
        {currentRole === 'admin' && selecionados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-purple-50 border border-purple-200 rounded-2xl animate-in fade-in">
            <div className="flex items-center space-x-2 text-sm font-semibold text-purple-950">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                {selecionados.length}
              </span>
              <span>pacientes selecionados</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-purple-900 mr-1">Alterar Status:</span>
              <button
                onClick={() => handleAtualizarStatusLote('APROVADO')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition"
              >
                Aprovar
              </button>
              <button
                onClick={() => handleAtualizarStatusLote('EMITIDO')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition"
              >
                Emitir
              </button>
              <button
                onClick={() => handleAtualizarStatusLote('ENTREGUE')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition"
              >
                Entregar
              </button>

              <div className="h-4 w-px bg-purple-300 mx-1" />

              {/* Baixa Simultânea (PENDENTE -> EMITIDO) & ZIP */}
              <button
                onClick={handleBaixaSimultaneaEZip}
                disabled={baixandoLote}
                className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white px-3.5 py-1.5 text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
                title="Atualiza status de PENDENTE para EMITIDO e baixa arquivo ZIP com PDFs nomeados pelo CPF"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>
                  {baixandoLote
                    ? `Processando (${progressoLote?.atual || 0}/${progressoLote?.total || 0})...`
                    : 'Baixar Status (PENDENTE → EMITIDO) & .ZIP'}
                </span>
              </button>

              {/* Download em Lote ZIP */}
              <button
                onClick={handleDownloadLoteZIP}
                disabled={baixandoLote}
                className="inline-flex items-center space-x-1.5 bg-fibro-950 hover:bg-fibro-900 text-white px-3.5 py-1.5 text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
              >
                <FileArchive className="w-3.5 h-3.5 text-purple-300" />
                <span>Apenas Baixar .ZIP</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {currentRole === 'admin' && (
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        pacientesFiltrados.length > 0 &&
                        selecionados.length === pacientesFiltrados.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="p-4">Paciente</th>
                <th className="p-4">CPF / SUS</th>
                <th className="p-4">Contato / Endereço</th>
                <th className="p-4">Status</th>
                <th className="p-4">Documentos</th>
                <th className="p-4 text-right">Ações da Carteira</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {carregando ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-purple-600 mb-2" />
                    <p className="font-semibold text-sm">Carregando pacientes do Supabase...</p>
                  </td>
                </tr>
              ) : pacientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-base text-gray-700">Nenhum paciente encontrado</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {busca ? 'Tente ajustar os termos da pesquisa.' : 'Cadastre o primeiro paciente para começar.'}
                    </p>
                  </td>
                </tr>
              ) : (
                pacientesFiltrados.map((paciente) => {
                  const isSelected = selecionados.includes(paciente.id);
                  return (
                    <tr
                      key={paciente.id}
                      className={`hover:bg-purple-50/40 transition-colors ${
                        isSelected ? 'bg-purple-50/60' : ''
                      }`}
                    >
                      {currentRole === 'admin' && (
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(paciente.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Paciente (Foto + Nome) */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-13 rounded-lg border border-purple-200 overflow-hidden bg-gray-100 flex-shrink-0">
                            {paciente.foto_url ? (
                              <img
                                src={paciente.foto_url}
                                alt={paciente.nome_completo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                                3x4
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-snug">
                              {paciente.nome_completo}
                            </p>
                            <p className="text-xs text-gray-500">
                              Nasc: {formatarDataBR(paciente.data_nascimento)} • CID: {paciente.cid10}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CPF / SUS */}
                      <td className="p-4">
                        <p className="font-mono text-xs font-semibold text-gray-800">{paciente.cpf}</p>
                        <p className="font-mono text-[11px] text-gray-500">{paciente.cartao_sus}</p>
                      </td>

                      {/* Contato / Endereço */}
                      <td className="p-4 max-w-xs">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {paciente.contato_emergencia}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate" title={paciente.endereco_completo}>
                          {paciente.endereco_completo}
                        </p>
                      </td>

                      {/* Status da Carteira */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {getBadgeStatus(paciente.status_carteira)}

                          {currentRole === 'admin' && (
                            <select
                              value={paciente.status_carteira}
                              onChange={(e) =>
                                handleAtualizarStatusIndividual(
                                  paciente.id,
                                  e.target.value as StatusCarteira
                                )
                              }
                              className="block mt-1 text-[11px] font-semibold text-gray-600 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 border border-gray-200 cursor-pointer"
                            >
                              <option value="PENDENTE">Mudar: Pendente</option>
                              <option value="APROVADO">Mudar: Aprovado</option>
                              <option value="EMITIDO">Mudar: Emitido</option>
                              <option value="ENTREGUE">Mudar: Entregue</option>
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Documentos Anexos */}
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() =>
                              setDocModal({
                                paciente,
                                tipo: 'laudo',
                                isOpen: true,
                              })
                            }
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold transition"
                            title="Ver Laudo Médico"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Laudo</span>
                          </button>
                          <button
                            onClick={() =>
                              setDocModal({
                                paciente,
                                tipo: 'comprovante',
                                isOpen: true,
                              })
                            }
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-[11px] font-semibold transition"
                            title="Ver Comprovante de Residência"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Endereço</span>
                          </button>
                        </div>
                      </td>

                      {/* Ações da Carteira */}
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              setPacienteSelecionado(paciente);
                              setIsPreviewOpen(true);
                            }}
                            className="p-2 text-fibro-700 hover:text-fibro-950 bg-purple-50 hover:bg-purple-100 rounded-xl transition"
                            title="Pré-visualizar Carteira PVC"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              toast.info(`Gerando PDF da carteira de ${paciente.nome_completo}...`);
                              await baixarCarteiraPDF(paciente);
                              toast.success('Download concluído!');
                            }}
                            className="p-2 text-emerald-700 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
                            title="Baixar PDF Oficial"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Prévia e Impressão da Carteira */}
      {pacienteSelecionado && (
        <CarteiraPreviewModal
          paciente={pacienteSelecionado}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPacienteSelecionado(null);
          }}
        />
      )}

      {/* Modal Visualizador de Documentos */}
      <DocumentViewerModal
        paciente={docModal.paciente}
        tipo={docModal.tipo}
        isOpen={docModal.isOpen}
        onClose={() => setDocModal({ paciente: null, tipo: null, isOpen: false })}
      />
    </div>
  );
};
