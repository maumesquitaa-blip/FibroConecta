'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X, SwitchCamera, AlertCircle } from 'lucide-react';

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCapture: (base64OrBlob: string) => void;
}

export const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCapture,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot({
      width: 720,
      height: 960,
    });
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage);
      onClose();
      setCapturedImage(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden border border-purple-800/40">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold tracking-wide">Captura de Foto Oficial 3x4</h3>
          </div>
          <button
            onClick={() => {
              setCapturedImage(null);
              onClose();
            }}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport da Câmera / Prévia */}
        <div className="relative w-full h-[400px] bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-red-400 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 mb-3" />
              <p className="text-sm font-semibold">{cameraError}</p>
              <p className="text-xs text-gray-400 mt-2">
                Verifique se o seu navegador possui permissão para acessar a câmera.
              </p>
            </div>
          ) : capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-gray-950">
              <img
                src={capturedImage}
                alt="Foto Capturada"
                className="h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-emerald-600/90 text-white px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm">
                Foto Pronta para Uso
              </div>
            </div>
          ) : (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: { ideal: 1280 },
                  height: { ideal: 960 },
                  facingMode: facingMode,
                  aspectRatio: 3 / 4,
                }}
                onUserMediaError={(err) => {
                  console.error('Webcam error:', err);
                  setCameraError('Não foi possível inicializar a câmera.');
                }}
                className="w-full h-full object-cover"
              />

              {/* Guia Visual 3x4 (Silhueta / Máscara de Enquadramento) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Sombra externa */}
                <div className="w-[240px] h-[320px] border-2 border-dashed border-purple-400 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  {/* Linhas de apoio */}
                  <div className="absolute top-1/4 left-0 right-0 border-t border-purple-400/40" />
                  <div className="absolute top-1/2 left-0 right-0 border-t border-purple-400/40" />
                  <div className="absolute left-1/2 top-0 bottom-0 border-l border-purple-400/40" />

                  {/* Silhueta indicativa de rosto e ombros */}
                  <div className="absolute inset-x-8 top-10 bottom-4 border-2 border-white/40 rounded-full pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] text-white/70 bg-black/60 px-2 py-0.5 rounded">
                      Alinhe os olhos e ombros
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de troca de câmera frontal/traseira */}
              <button
                type="button"
                onClick={toggleCamera}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition"
                title="Inverter Câmera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Barra de Controles Inferior */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-center space-x-4">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-5 py-2.5 rounded-xl font-medium text-sm transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tirar Outra</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Foto</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={capture}
              disabled={!!cameraError}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-purple-500/25 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              <span>Capturar Foto 3x4</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
