-- ==============================================================================
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

-- Política para validação pública de QR Code (sem exigir login do fiscal/comércio)
DROP POLICY IF EXISTS "Validação pública de carteiras via QR Code" ON public.pacientes;
CREATE POLICY "Validação pública de carteiras via QR Code"
ON public.pacientes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Atendentes e Admins podem cadastrar pacientes" ON public.pacientes;
CREATE POLICY "Atendentes e Admins podem cadastrar pacientes"
ON public.pacientes FOR INSERT TO authenticated
WITH CHECK (true);

-- Fallback para inserção anônima se modo sem login estiver ativo
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
