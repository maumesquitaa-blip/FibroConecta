import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Paciente } from '@/types/database';
import React from 'react';

/**
 * Gera o QR Code em formato base64 PNG para inclusão no PDF e na tela
 */
export async function gerarQRCodeDataUrl(pacienteId: string, origin?: string): Promise<string> {
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://fibroconecta.semus.gov.br');
  const validacaoUrl = `${baseUrl}/validar/${pacienteId}`;
  
  try {
    return await QRCode.toDataURL(validacaoUrl, {
      width: 150,
      margin: 1,
      color: {
        dark: '#1E3A8A',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err);
    return '';
  }
}

/**
 * Gera o Blob do PDF da carteira
 */
export async function gerarCarteiraBlob(paciente: Paciente): Promise<Blob> {
  // Importação dinâmica para evitar execução indevida no SSR
  const { pdf } = await import('@react-pdf/renderer');
  const { CarteiraFibroPDF } = await import('@/components/carteira/CarteiraFibroPDF');
  
  const qrCodeDataUrl = await gerarQRCodeDataUrl(paciente.id);
  
  const doc = React.createElement(CarteiraFibroPDF, {
    paciente,
    qrCodeDataUrl,
  });

  return await pdf(doc as any).toBlob();
}

/**
 * Faz download individual da carteira
 */
export async function baixarCarteiraPDF(paciente: Paciente): Promise<void> {
  const blob = await gerarCarteiraBlob(paciente);
  const nomeArquivo = `CIPFIBRO_${paciente.nome_completo.replace(/\s+/g, '_')}_${paciente.cpf.replace(/\D/g, '')}.pdf`;
  saveAs(blob, nomeArquivo);
}

/**
 * Gera arquivo ZIP com carteiras selecionadas em lote
 */
export async function baixarCarteirasEmLoteZIP(
  pacientes: Paciente[],
  onProgress?: (processados: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('carteiras_cipfibro');

  let processados = 0;
  for (const paciente of pacientes) {
    try {
      const blob = await gerarCarteiraBlob(paciente);
      const nomeArquivo = `CIPFIBRO_${paciente.nome_completo.replace(/\s+/g, '_')}_${paciente.cpf.replace(/\D/g, '')}.pdf`;
      folder?.file(nomeArquivo, blob);
    } catch (error) {
      console.error(`Erro ao gerar PDF para ${paciente.nome_completo}:`, error);
    }
    processados++;
    if (onProgress) {
      onProgress(processados, pacientes.length);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const dataHoje = new Date().toISOString().split('T')[0];
  saveAs(zipBlob, `LOTE_CARTEIRAS_FIBROCONECTA_${dataHoje}.zip`);
}
