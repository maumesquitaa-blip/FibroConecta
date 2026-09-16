'use client';

import React from 'react';
import { CapturaFotoModal, CapturaFotoModalProps } from './CapturaFotoModal';

export interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCapture: (base64OrBlob: string) => void;
}

export const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCapture,
}) => {
  return (
    <CapturaFotoModal
      isOpen={isOpen}
      onClose={onClose}
      onCapture={onPhotoCapture}
    />
  );
};

export { CapturaFotoModal };
