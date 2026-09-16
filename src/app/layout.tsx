import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppClientShell } from '@/components/layout/AppClientShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FibroConecta - Carteira de Prioridade (CIPFIBRO) | SEMUS',
  description:
    'Sistema Municipal de Identificação e Emissão da Carteira de Prioridade da Pessoa com Fibromialgia - Prefeitura de São José de Ribamar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppClientShell>{children}</AppClientShell>
      </body>
    </html>
  );
}
