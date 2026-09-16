'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { UserRole } from '@/types/database';
import { Toaster } from 'sonner';

export const AppClientShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentRole={role} onRoleChange={setRole} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-700">
          FibroConecta • Secretaria Municipal de Saúde de São José de Ribamar (SEMUS)
        </p>
        <p className="mt-1 text-gray-400">
          Amparo Legal: Lei Federal Nº 14.705/2023 e Lei Municipal Nº 1.375/2023.
        </p>
      </footer>
      <Toaster richColors position="top-right" />
    </div>
  );
};
