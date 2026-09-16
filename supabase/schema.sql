-- ==============================================================================
-- FibroConecta - Esquema do Banco de Dados Supabase & Storage
-- Secretaria Municipal de Saúde de São José de Ribamar - SEMUS
-- ==============================================================================

-- 1. Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Pacientes
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    status_carteira VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status_carteira IN ('PENDENTE', 'APROVADO', 'EMITIDO', 'ENTREGUE', 'RECUSADO')),
    data_emissao DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON public.pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON public.pacientes(nome_completo);
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON public.pacientes(status_carteira);

-- 3. Tabela de Perfis de Usuário (RBAC)
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    role TEXT NOT NULL DEFAULT 'atendente' CHECK (role IN ('admin', 'atendente')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Habilitar Supabase Realtime para a tabela pacientes
ALTER PUBLICATION supabase_realtime ADD TABLE public.pacientes;

-- 5. Configuração de RLS (Row Level Security)
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Políticas para Pacientes (Permite leitura e escrita pelo app com chave anon/publishable)
CREATE POLICY "Permitir leitura pública/autenticada de pacientes"
    ON public.pacientes FOR SELECT
    USING (true);

CREATE POLICY "Permitir inserção de novos pacientes"
    ON public.pacientes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permitir atualização de pacientes"
    ON public.pacientes FOR UPDATE
    USING (true);

CREATE POLICY "Permitir exclusão de pacientes"
    ON public.pacientes FOR DELETE
    USING (true);

-- Políticas para Perfis
CREATE POLICY "Permitir leitura de perfis"
    ON public.perfis FOR SELECT
    USING (true);

CREATE POLICY "Permitir atualização de perfil próprio"
    ON public.perfis FOR UPDATE
    USING (auth.uid() = id);

-- 6. Configuração dos Buckets de Armazenamento (Storage)
-- Criação dos buckets 'fotos' e 'documentos'
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('fotos', 'fotos', true),
    ('documentos', 'documentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para o bucket 'fotos'
CREATE POLICY "Fotos públicas para visualização"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'fotos');

CREATE POLICY "Upload de fotos permitido"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'fotos');

CREATE POLICY "Atualização de fotos permitida"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'fotos');

-- Políticas de Storage para o bucket 'documentos'
CREATE POLICY "Documentos acessíveis para leitura"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documentos');

CREATE POLICY "Upload de documentos permitido"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Atualização de documentos permitida"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'documentos');
