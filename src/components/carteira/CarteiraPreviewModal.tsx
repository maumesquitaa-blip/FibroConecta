'use client';

import React, { useState, useEffect } from 'react';
import { Paciente } from '@/types/database';
import { formatarDataBR } from '@/lib/utils';
import { baixarCarteiraPDF, gerarQRCodeDataUrl } from '@/lib/pdf-generator';
import { Download, X, Eye, ShieldCheck, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CarteiraPreviewModalProps {
  paciente: Paciente | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CarteiraPreviewModal: React.FC<CarteiraPreviewModalProps> = ({
  paciente,
  isOpen,
  onClose,
}) => {
  const [lado, setLado] = useState<'frente' | 'verso'>('frente');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    if (paciente?.id) {
      gerarQRCodeDataUrl(paciente.id).then((url) => setQrCodeUrl(url));
    }
  }, [paciente]);

  if (!isOpen || !paciente) return null;

  const handleDownload = async () => {
    try {
      setBaixando(true);
      toast.info('Gerando PDF da carteira oficial (PVC 57x86mm)...');
      await baixarCarteiraPDF(paciente);
      toast.success('Carteira baixada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF da carteira.');
    } finally {
      setBaixando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-100 my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-fibro-950 via-fibro-900 to-fibro-800 text-white">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Eye className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Pré-visualização da Carteira</h3>
              <p className="text-xs text-purple-200">Padrão PVC Oficial (57mm x 86mm)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor Frente / Verso */}
        <div className="flex justify-center p-3 bg-purple-50 border-b border-purple-100">
          <div className="inline-flex rounded-xl bg-purple-200/60 p-1">
            <button
              onClick={() => setLado('frente')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                lado === 'frente'
                  ? 'bg-white text-fibro-900 shadow-sm'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              Frente
            </button>
            <button
              onClick={() => setLado('verso')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                lado === 'verso'
                  ? 'bg-white text-fibro-900 shadow-sm'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              Verso
            </button>
          </div>
        </div>

        {/* Visualizador do Cartão PVC */}
        <div className="p-6 flex flex-col items-center justify-center bg-gray-100">
          <div
            className="w-[260px] h-[392px] bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 flex flex-col justify-between relative select-none transition-all duration-300"
            style={{ aspectRatio: '57/86' }}
          >
            {lado === 'frente' ? (
              // FRENTE
              <>
                <div className="bg-fibro-950 text-white rounded-lg p-2 text-center shadow-inner">
                  <h4 className="text-[9px] font-black tracking-tight uppercase leading-tight">
                    Carteira de Prioridade da Pessoa com Fibromialgia
                  </h4>
                  <p className="text-[7px] text-purple-200 font-semibold mt-0.5">
                    Lei Federal Nº 14.705/2023
                  </p>
                </div>

                <div className="flex justify-center my-1">
                  <div className="w-[100px] h-[130px] rounded-lg border-2 border-fibro-600 overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center">
                    {paciente.foto_url ? (
                      <img
                        src={paciente.foto_url}
                        alt="Foto 3x4"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">Foto 3x4</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block">
                      Nome Completo
                    </span>
                    <p className="text-[11px] font-black text-gray-900 uppercase leading-tight line-clamp-2">
                      {paciente.nome_completo}
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block">
                      Cartão SUS
                    </span>
                    <p className="text-[10px] font-bold text-gray-900 font-mono">
                      {paciente.cartao_sus}
                    </p>
                  </div>

                  <div className="inline-flex items-center space-x-1 bg-purple-100 text-purple-900 px-2 py-0.5 rounded border border-purple-300">
                    <Heart className="w-2.5 h-2.5 text-purple-700 fill-purple-500" />
                    <span className="text-[9px] font-extrabold">CID-10: {paciente.cid10 || 'M79.7'}</span>
                  </div>
                </div>

                <div className="border-t border-purple-200 pt-1.5 text-center mt-1">
                  <p className="text-[8px] font-extrabold text-fibro-950 leading-tight">
                    PREFEITURA DE SÃO JOSÉ DE RIBAMAR
                  </p>
                  <p className="text-[6.5px] text-gray-600 font-medium leading-tight">
                    SEMUS • Válido em todo território nacional
                  </p>
                </div>
              </>
            ) : (
              // VERSO
              <>
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div>
                    <h5 className="text-[10px] font-extrabold text-blue-900 uppercase">
                      Dados Oficiais
                    </h5>
                    <p className="text-[7px] text-gray-500">Validação Digital</p>
                  </div>
                  {qrCodeUrl && (
                    <div className="p-0.5 bg-white border border-blue-200 rounded shadow-sm">
                      <img src={qrCodeUrl} alt="QR Code" className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 py-1">
                  <div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase block">CPF</span>
                    <p className="text-[10.5px] font-bold text-gray-900 font-mono">{paciente.cpf}</p>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase block">Data de Nascimento</span>
                    <p className="text-[10px] font-bold text-gray-900">{formatarDataBR(paciente.data_nascimento)}</p>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase block">Contato de Emergência</span>
                    <p className="text-[9.5px] font-bold text-gray-900">{paciente.contato_emergencia}</p>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase block">Data de Emissão</span>
                    <p className="text-[10px] font-bold text-gray-900">{formatarDataBR(paciente.data_emissao || new Date().toISOString())}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-1.5 space-y-1">
                  <p className="text-[6.5px] font-bold text-gray-800 uppercase leading-tight">
                    EMITIDO POR: SECRETARIA MUNICIPAL DE SÃO JOSÉ DE RIBAMAR - SEMUS
                  </p>
                  <p className="text-[6px] text-gray-600 text-justify leading-snug">
                    AMPARO LEGAL: Confere atendimento preferencial em órgãos públicos e empresas privadas nos termos da Lei Federal Nº 14.705/2023 e Lei Municipal Nº 1.375, de 09 de maio de 2023.
                  </p>
                  <p className="text-[5.5px] text-gray-400 text-center font-mono truncate">
                    Autenticidade: {paciente.id}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Documento oficial gerado</span>
          </div>
          <button
            onClick={handleDownload}
            disabled={baixando}
            className="inline-flex items-center space-x-2 bg-fibro-800 hover:bg-fibro-900 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{baixando ? 'Gerando...' : 'Baixar PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
