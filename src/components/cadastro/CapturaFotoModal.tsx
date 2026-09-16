'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X } from 'lucide-react';

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
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot({ width: 480, height: 640 });
    setImgSrc(imageSrc);
  }, [webcamRef]);

  const confirmPhoto = () => {
    if (imgSrc) {
      onCapture(imgSrc);
      onClose();
    }
  };

  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col items-center relative animate-in fade-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
          title="Fechar"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-gray-800 mb-2">Fotografia do Paciente (Padrão 3x4)</h3>
        <p className="text-xs text-gray-500 mb-4 text-center">Posicione o rosto dentro da moldura oval centralizada.</p>

        <div className="relative w-[280px] h-[373px] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
          {!imgSrc ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user", width: 480, height: 640 }}
                className="w-full h-full object-cover"
              />
              {/* Guia Visual Oval 3x4 */}
              <div className="absolute inset-0 border-2 border-dashed border-purple-400 rounded-[50%] m-6 pointer-events-none opacity-70" />
            </>
          ) : (
            <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex gap-3 mt-6 w-full">
          {!imgSrc ? (
            <button
              type="button"
              onClick={capture}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl shadow transition"
            >
              <Camera size={18} /> Capturar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setImgSrc(null)}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition"
              >
                <RefreshCw size={18} /> Refazer
              </button>
              <button
                type="button"
                onClick={confirmPhoto}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow transition"
              >
                <Check size={18} /> Confirmar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
