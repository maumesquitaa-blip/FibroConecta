'use client';

import React from 'react';
import { X, ExternalLink, Download, FileText, AlertCircle } from 'lucide-react';
import { Paciente } from '@/types/database';

interface DocumentViewerModalProps {
  paciente: Paciente | null;
  tipo: 'laudo' | 'comprovante' | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  paciente,
  tipo,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !paciente || !tipo) return null;

  const url = tipo === 'laudo' ? paciente.laudo_medico_url : paciente.comprovante_endereco_url;
  const titulo = tipo === 'laudo' ? 'Laudo Médico do Paciente' : 'Comprovante de Residência';
  const isPdf = url?.toLowerCase().includes('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-fibro-950 to-fibro-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">{titulo}</h3>
              <p className="text-xs text-purple-200">
                Paciente: {paciente.nome_completo} • CPF: {paciente.cpf}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                title="Abrir em nova aba"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Nova Aba</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-purple-200 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Anexo */}
        <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-auto">
          {!url ? (
            <div className="text-center p-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-2" />
              <p className="font-semibold">Nenhum anexo encontrado para este registro.</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${url}#toolbar=0`}
              className="w-full h-full rounded-xl border border-gray-200 bg-white"
              title="Visualizador PDF"
            />
          ) : (
            <div className="max-w-full max-h-full flex items-center justify-center p-2">
              <img
                src={url}
                alt="Documento Anexo"
                className="max-h-[70vh] object-contain rounded-xl shadow-md border border-gray-300"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
