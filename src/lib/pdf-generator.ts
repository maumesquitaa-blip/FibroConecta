import { Paciente } from '@/types/database';
import React from 'react';

/**
 * Gera o QR Code em formato base64 PNG para inclusão no PDF e na tela (on-demand)
 */
export async function gerarQRCodeDataUrl(pacienteId: string, origin?: string): Promise<string> {
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://fibroconecta.semus.gov.br');
  const validacaoUrl = `${baseUrl}/validar/${pacienteId}`;
  
  try {
    const QRCode = (await import('qrcode')).default;
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
 * Valida com timeout se a URL de foto é acessível, evitando que o @react-pdf/renderer quebre
 */
async function obterFotoSegura(fotoUrl?: string): Promise<string | undefined> {
  if (!fotoUrl) return undefined;
  if (fotoUrl.startsWith('data:image/')) return fotoUrl;

  if (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://')) {
    try {
      if (typeof window !== 'undefined' && window.AbortController) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(fotoUrl, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) return fotoUrl;
      }
    } catch (e) {
      console.warn('Foto remota inacessível ou com bloqueio de CORS, renderizando com placeholder seguro.');
      return undefined;
    }
  }

  return fotoUrl;
}

/**
 * Gera o Blob do PDF da carteira (on-demand)
 */
export async function gerarCarteiraBlob(paciente: Paciente): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer');
  const { CarteiraFibroPDF } = await import('@/components/carteira/CarteiraFibroPDF');
  
  const qrCodeDataUrl = await gerarQRCodeDataUrl(paciente.id);
  const fotoSegura = await obterFotoSegura(paciente.foto_url);

  const pacienteSeguro: Paciente = {
    ...paciente,
    foto_url: fotoSegura || '',
  };
  
  const doc = React.createElement(CarteiraFibroPDF, {
    paciente: pacienteSeguro,
    qrCodeDataUrl,
  });

  return await pdf(doc as any).toBlob();
}

/**
 * Faz download individual da carteira (on-demand)
 */
export async function baixarCarteiraPDF(paciente: Paciente): Promise<void> {
  const { saveAs } = await import('file-saver');
  const blob = await gerarCarteiraBlob(paciente);
  const cpfLimpo = paciente.cpf.replace(/\D/g, '');
  const nomeArquivo = `${cpfLimpo}_CIPFIBRO_${paciente.nome_completo.replace(/\s+/g, '_')}.pdf`;
  saveAs(blob, nomeArquivo);
}

/**
 * Gera arquivo ZIP com carteiras selecionadas em lote (on-demand)
 */
export async function baixarCarteirasEmLoteZIP(
  pacientes: Paciente[],
  onProgress?: (processados: number, total: number) => void
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const { saveAs } = await import('file-saver');
  
  const zip = new JSZip();
  const folder = zip.folder('carteiras_cipfibro');

  let processados = 0;
  let sucessos = 0;
  for (const paciente of pacientes) {
    try {
      const blob = await gerarCarteiraBlob(paciente);
      const cpfLimpo = paciente.cpf.replace(/\D/g, '');
      const nomeArquivo = `${cpfLimpo}_CIPFIBRO_${paciente.nome_completo.replace(/\s+/g, '_')}.pdf`;
      folder?.file(nomeArquivo, blob);
      sucessos++;
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

