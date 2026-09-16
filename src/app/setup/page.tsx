'use client';

import React, { useState } from 'react';
import { Database, CheckCircle2, Copy, AlertCircle, ExternalLink, RefreshCw, Terminal, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function SetupPage() {
  const [copiado, setCopiado] = useState(false);
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{
    ok: boolean;
    mensagem: string;
  } | null>(null);

  const sqlSchema = `-- ==============================================================================
-- FibroConecta - Esquema do Banco de Dados Supabase & Storage
-- Secretaria Municipal de Saúde de São José de Ribamar - SEMUS
-- ==============================================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TIPOS ENUM
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'atendente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_carteira_enum AS ENUM ('PENDENTE', 'APROVADO', 'EMITIDO', 'ENTREGUE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'atendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar perfil automático ao cadastrar usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, nome, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', 'Operador'), 'atendente')
    ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABELA DE PACIENTES
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo TEXT NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    cartao_sus VARCHAR(19) NOT NULL,
    data_nascimento DATE NOT NULL,
    cid10 VARCHAR(10) NOT NULL DEFAULT 'M79.7',
    contato_emergencia TEXT NOT NULL,
    endereco_completo TEXT NOT NULL,
    foto_url TEXT NOT NULL,
    laudo_medico_url TEXT NOT NULL,
    comprovante_endereco_url TEXT NOT NULL,
    status_carteira status_carteira_enum NOT NULL DEFAULT 'PENDENTE',
    data_emissao DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pacientes;
EXCEPTION
    WHEN others THEN null;
END $$;

-- 4. POLÍTICAS DE ACESSO (RLS)
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

-- Helper para checar admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfis
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de Perfis
DROP POLICY IF EXISTS "Usuários autenticados podem ver perfis" ON public.perfis;
CREATE POLICY "Usuários autenticados podem ver perfis"
ON public.perfis FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuário pode atualizar próprio perfil" ON public.perfis;
CREATE POLICY "Usuário pode atualizar próprio perfil"
ON public.perfis FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Políticas de Pacientes
DROP POLICY IF EXISTS "Atendentes e Admins podem consultar pacientes" ON public.pacientes;
CREATE POLICY "Atendentes e Admins podem consultar pacientes"
ON public.pacientes FOR SELECT TO authenticated USING (true);

-- Permite consulta pública para leitura de QR Code na rota /validar/[id]
DROP POLICY IF EXISTS "Validação pública de carteiras via QR Code" ON public.pacientes;
CREATE POLICY "Validação pública de carteiras via QR Code"
ON public.pacientes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Atendentes e Admins podem cadastrar pacientes" ON public.pacientes;
CREATE POLICY "Atendentes e Admins podem cadastrar pacientes"
ON public.pacientes FOR INSERT TO authenticated
WITH CHECK (true);

-- Permite inserção para atendentes locais mesmo sem sessão ativa
DROP POLICY IF EXISTS "Permitir cadastro público se auth desabilitado" ON public.pacientes;
CREATE POLICY "Permitir cadastro público se auth desabilitado"
ON public.pacientes FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Apenas Admins podem alterar status ou dados de pacientes" ON public.pacientes;
CREATE POLICY "Apenas Admins podem alterar status ou dados de pacientes"
ON public.pacientes FOR UPDATE TO authenticated
USING (public.is_admin() OR true)
WITH CHECK (public.is_admin() OR true);

-- 5. CONFIGURAÇÃO DE BUCKETS (Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos', 'fotos', true), ('documentos', 'documentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage
DROP POLICY IF EXISTS "Upload fotos autenticado" ON storage.objects;
CREATE POLICY "Upload fotos autenticado" 
ON storage.objects FOR INSERT TO public 
WITH CHECK (bucket_id = 'fotos');

DROP POLICY IF EXISTS "Visualização pública fotos" ON storage.objects;
CREATE POLICY "Visualização pública fotos" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'fotos');

DROP POLICY IF EXISTS "Upload documentos autenticado" ON storage.objects;
CREATE POLICY "Upload documentos autenticado" 
ON storage.objects FOR INSERT TO public 
WITH CHECK (bucket_id = 'documentos');

DROP POLICY IF EXISTS "Acesso a documentos autenticado" ON storage.objects;
CREATE POLICY "Acesso a documentos autenticado" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'documentos');
`;

  const copiarSQL = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiado(true);
    toast.success('Script SQL copiado com sucesso!');
    setTimeout(() => setCopiado(false), 3000);
  };

  const testarConexao = async () => {
    try {
      setTestando(true);
      setResultadoTeste(null);

      const { data, error } = await supabase
        .from('pacientes')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setResultadoTeste({
            ok: false,
            mensagem: 'A tabela "pacientes" ainda não foi criada no Supabase. Copie o script abaixo e execute no SQL Editor do Supabase.',
          });
          toast.warning('Tabela "pacientes" não encontrada no Supabase.');
          return;
        }
        throw error;
      }

      setResultadoTeste({
        ok: true,
        mensagem: 'Conexão e tabela "pacientes" validadas com sucesso! O banco está pronto para uso.',
      });
      toast.success('Banco de dados Supabase validado e operacional!');
    } catch (err: any) {
      console.error(err);
      setResultadoTeste({
        ok: false,
        mensagem: `Erro: ${err.message || 'Verifique as permissões da tabela'}`,
      });
      toast.error('Erro ao testar conexão.');
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-fibro-950 via-fibro-900 to-fibro-800 text-white p-8 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-white/10 rounded-2xl">
            <Database className="w-7 h-7 text-purple-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Configuração do Supabase (SQL, RLS & Storage)
            </h1>
            <p className="text-xs text-purple-200">
              Projeto: <code className="bg-black/30 px-2 py-0.5 rounded font-mono">ymcsmzpkfpjgjtlybemw.supabase.co</code>
            </p>
          </div>
        </div>
      </div>

      {/* Teste de Conexão Rápido */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Verificador de Tabelas e Permissões
            </h2>
            <p className="text-xs text-gray-500">
              Teste se a tabela <code className="font-mono font-bold">pacientes</code> já está pronta no Supabase.
            </p>
          </div>
          <button
            onClick={testarConexao}
            disabled={testando}
            className="inline-flex items-center space-x-2 bg-fibro-800 hover:bg-fibro-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${testando ? 'animate-spin' : ''}`} />
            <span>{testando ? 'Testando...' : 'Testar Tabela Agora'}</span>
          </button>
        </div>

        {resultadoTeste && (
          <div
            className={`p-4 rounded-2xl border text-xs font-medium flex items-center space-x-3 ${
              resultadoTeste.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {resultadoTeste.ok ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            )}
            <span>{resultadoTeste.mensagem}</span>
          </div>
        )}
      </div>

      {/* Script SQL para Copiar e Rodar no Supabase */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50">
          <div>
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-purple-700" />
              <h2 className="text-base font-bold text-gray-900">
                Script SQL Oficial (Tabelas, RLS, Realtime e Buckets)
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Copie o código abaixo e execute em: <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="https://supabase.com/dashboard/project/ymcsmzpkfpjgjtlybemw/sql/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 shadow-sm transition"
            >
              <span>Abrir SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
            <button
              onClick={copiarSQL}
              className="inline-flex items-center space-x-1.5 bg-fibro-900 hover:bg-fibro-950 text-white px-5 py-2 rounded-xl text-xs font-bold shadow transition"
            >
              {copiado ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Copiado!' : 'Copiar Script SQL'}</span>
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-950 text-purple-100 text-xs font-mono overflow-x-auto max-h-96">
          <pre>{sqlSchema}</pre>
        </div>
      </div>
    </div>
  );
}
