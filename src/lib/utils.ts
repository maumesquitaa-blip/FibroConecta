import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validação algorítmica matemática de CPF (Dígitos verificadores)
 */
export function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(10))) return false;

  return true;
}

/**
 * Máscara para CPF: 000.000.000-00
 */
export function mascaraCPF(valor: string): string {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Máscara para Cartão SUS: 000 0000 0000 0000 (15 dígitos)
 */
export function mascaraSUS(valor: string): string {
  return valor
    .replace(/\D/g, '')
    .slice(0, 15)
    .replace(/(\d{3})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2');
}

/**
 * Máscara para Telefone / Celular: (98) 98765-4321
 */
export function mascaraTelefone(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 11);
  if (limpo.length <= 10) {
    return limpo
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return limpo
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/**
 * Formata data ISO (YYYY-MM-DD) para DD/MM/AAAA
 */
export function formatarDataBR(dataIso?: string | null): string {
  if (!dataIso) return '-';
  const partes = dataIso.split('T')[0].split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataIso;
}

/**
 * Executa uma Promise com tempo limite (timeout) para evitar travamentos de rede ou conexões congeladas.
 */
export function promiseWithTimeout<T = any>(
  promise: Promise<T> | PromiseLike<T>,
  timeoutMs: number,
  timeoutMessage = 'A operação excedeu o tempo limite estipulado.'
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}


/**
 * Compacta e redimensiona qualquer foto para o enquadramento 3x4 padrão (360x480px, JPEG 82%).
 * Reduz arquivos de 3-5MB para ~30-50KB instantaneamente com corte centralizado (cover).
 */
export async function comprimirImagem3x4(
  fileOrBase64: File | string,
  targetWidth = 360,
  targetHeight = 480,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Se estiver rodando fora do navegador
    if (typeof window === 'undefined') {
      if (typeof fileOrBase64 === 'string') return resolve(fileOrBase64);
      return reject(new Error('Execução fora do navegador.'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Não foi possível inicializar o contexto 2D do Canvas.');
        }

        // Fundo branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Lógica de centralização 'object-fit: cover'
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const targetRatio = targetWidth / targetHeight;

        let renderWidth = targetWidth;
        let renderHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > targetRatio) {
          // Imagem mais larga que o alvo
          renderHeight = targetHeight;
          renderWidth = targetHeight * imgRatio;
          offsetX = (targetWidth - renderWidth) / 2;
        } else {
          // Imagem mais alta que o alvo
          renderWidth = targetWidth;
          renderHeight = targetWidth / imgRatio;
          offsetY = (targetHeight - renderHeight) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar a imagem para processamento.'));
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo de foto.'));
      reader.readAsDataURL(fileOrBase64);
    }
  });
}

