'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface DocumentUploadProps {
  label: string;
  descricao: string;
  bucket: 'documentos' | 'fotos';
  prefixo: string;
  accept: string;
  valorUrl?: string;
  onUrlUploaded: (url: string) => void;
  obrigatorio?: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  descricao,
  bucket,
  prefixo,
  accept,
  valorUrl,
  onUrlUploaded,
  obrigatorio = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fazerUploadArquivo = async (file: File) => {
    // Validar tipo do arquivo
    if (accept.includes('pdf') && !file.type.includes('pdf') && !accept.includes('image')) {
      toast.error('Por favor, selecione um arquivo em formato PDF.');
      return;
    }

    // Limitar tamanho (15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 15MB.');
      return;
    }

    try {
      setCarregando(true);
      setNomeArquivo(file.name);

      const extensao = file.name.split('.').pop();
      const nomeUnico = `${prefixo}_${Date.now()}_${Math.random().toString(36).substring(7)}.${extensao}`;
      const caminho = `${prefixo}/${nomeUnico}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(caminho, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(caminho);

      onUrlUploaded(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      if (err.message?.includes('Bucket not found') || err.message?.includes('not found')) {
        toast.error(`O bucket "${bucket}" ainda não foi criado no Supabase.`);
        // Fallback para permitir teste sem travar o usuário
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            onUrlUploaded(e.target.result as string);
            toast.info(`Anexo "${file.name}" carregado localmente para permitir o teste.`);
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast.error(`Falha no upload: ${err.message || 'Verifique sua conexão ou permissões no Supabase.'}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fazerUploadArquivo(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
          <span>{label}</span>
          {obrigatorio && <span className="text-red-500">*</span>}
        </label>
        <span className="text-xs text-gray-500">{descricao}</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            fazerUploadArquivo(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {valorUrl ? (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-emerald-950 truncate">
                {nomeArquivo || 'Documento anexado com sucesso'}
              </p>
              <a
                href={valorUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-700 hover:underline inline-flex items-center space-x-1"
              >
                <span>Visualizar anexo</span>
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUrlUploaded('')}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition"
            title="Remover anexo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-200 hover:border-purple-400 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-full">
              <UploadCloud className={`w-6 h-6 ${carregando ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {carregando ? 'Enviando documento...' : 'Clique para selecionar ou arraste o arquivo aqui'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {accept.includes('pdf') && !accept.includes('image')
                  ? 'Apenas formato PDF (máx. 15MB)'
                  : 'PDF ou Imagens PNG/JPG (máx. 15MB)'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
