'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X, UploadCloud, AlertTriangle } from 'lucide-react';
import { comprimirImagem3x4 } from '@/lib/utils';
import { toast } from 'sonner';

export interface CapturaFotoModalProps {
  onCapture: (imgSrc: string) => void;
  onClose: () => void;
  isOpen?: boolean;
}

export const CapturaFotoModal: React.FC<CapturaFotoModalProps> = ({
  onCapture,
  onClose,
  isOpen = true,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    try {
      setProcessando(true);
      const rawScreenshot = webcamRef.current.getScreenshot({ width: 480, height: 640 });
      if (!rawScreenshot) {
        toast.error('Não foi possível obter imagem da câmera.');
        return;
      }
      // Compactar para padrão 3x4 leve
      const comprimida = await comprimirImagem3x4(rawScreenshot, 360, 480, 0.82);
      setImgSrc(comprimida);
    } catch (err: any) {
      console.error('Erro ao processar captura:', err);
      toast.error('Erro ao processar imagem.');
    } finally {
      setProcessando(false);
    }
  }, [webcamRef]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProcessando(true);
      toast.info('Ajustando e formatando foto no padrão 3x4...');
      const comprimida = await comprimirImagem3x4(file, 360, 480, 0.82);
      setImgSrc(comprimida);
      toast.success('Foto carregada e enquadrada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao carregar arquivo de foto:', err);
      toast.error('Não foi possível processar a imagem do arquivo.');
    } finally {
      setProcessando(false);
    }
  };

  const confirmPhoto = () => {
    if (imgSrc) {
      onCapture(imgSrc);
      onClose();
    }
  };

  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col items-center relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
          title="Fechar"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-gray-900 mb-1">Fotografia do Paciente (Padrão 3x4)</h3>
        <p className="text-xs text-gray-500 mb-4 text-center">
          Posicione o rosto do paciente centralizado na moldura oval.
        </p>

        {/* Área de Visualização / Câmera */}
        <div className="relative w-[280px] h-[373px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
          {cameraError && !imgSrc ? (
            <div className="p-6 text-center text-white space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-amber-200 font-semibold leading-relaxed">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Escolher Arquivo do Dispositivo</span>
              </button>
            </div>
          ) : !imgSrc ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user', width: 480, height: 640 }}
                onUserMediaError={(err) => {
                  console.warn('Erro de acesso à webcam:', err);
                  setCameraError('Câmera indisponível ou permissão bloqueada. Você pode selecionar um arquivo diretamente do computador.');
                }}
                className="w-full h-full object-cover"
              />
              {/* Guia Visual Oval 3x4 */}
              <div className="absolute inset-0 border-2 border-dashed border-purple-400 rounded-[50%] m-6 pointer-events-none opacity-75" />
            </>
          ) : (
            <img src={imgSrc} alt="Preview 3x4" className="w-full h-full object-cover" />
          )}

          {processando && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-semibold">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-300" />
            </div>
          )}
        </div>

        {/* Input Oculto de Arquivo */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Botões de Ação */}
        <div className="flex flex-col gap-3 mt-5 w-full">
          {!imgSrc ? (
            <div className="flex gap-2 w-full">
              {!cameraError && (
                <button
                  type="button"
                  onClick={capture}
                  disabled={processando}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-50"
                >
                  <Camera size={16} /> Capturar Foto
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processando}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition active:scale-95"
              >
                <UploadCloud size={16} /> Carregar Arquivo
              </button>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setImgSrc(null)}
                disabled={processando}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                <RefreshCw size={16} /> Refazer
              </button>
              <button
                type="button"
                onClick={confirmPhoto}
                disabled={processando}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <Check size={16} /> Confirmar Foto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

