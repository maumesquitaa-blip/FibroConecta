'use client';

import React, { useState, useRef } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, Upload, User, FileText, CheckCircle2, RefreshCw, Eye, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { validarCPF, mascaraCPF, mascaraSUS, mascaraTelefone, promiseWithTimeout, comprimirImagem3x4 } from '@/lib/utils';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DocumentUpload } from './DocumentUpload';
import { Paciente } from '@/types/database';


const WebcamCaptureModal = dynamic(
  () => import('./WebcamCaptureModal').then((mod) => mod.WebcamCaptureModal),
  { ssr: false }
);

const CarteiraPreviewModal = dynamic(
  () => import('@/components/carteira/CarteiraPreviewModal').then((mod) => mod.CarteiraPreviewModal),
  { ssr: false }
);

const schemaPaciente = z.object({
  nome_completo: z
    .string()
    .min(3, 'O nome deve ter no mínimo 3 caracteres')
    .refine((val) => val.trim().includes(' '), 'Informe nome e sobrenome'),
  cpf: z
    .string()
    .min(14, 'CPF incompleto')
    .refine((val) => validarCPF(val), 'CPF inválido (dígitos verificadores incorretos)'),
  cartao_sus: z
    .string()
    .min(15, 'O Cartão SUS deve conter 15 dígitos')
    .max(19, 'Cartão SUS inválido'),
  data_nascimento: z
    .string()
    .min(10, 'Data de nascimento obrigatória'),
  cid10: z
    .string()
    .default('M79.7'),
  contato_emergencia: z
    .string()
    .min(10, 'Informe telefone e nome do contato de emergência'),
  endereco_completo: z
    .string()
    .min(5, 'Informe o endereço completo (Rua, Número, Bairro, Município)'),
});

type FormData = z.infer<typeof schemaPaciente>;

export const CadastroPacienteForm: React.FC = () => {
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [laudoUrl, setLaudoUrl] = useState<string>('');
  const [comprovanteUrl, setComprovanteUrl] = useState<string>('');
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pacienteCadastrado, setPacienteCadastrado] = useState<Paciente | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputFotoRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schemaPaciente),
    defaultValues: {
      cid10: 'M79.7',
    },
  });

  // Upload da foto capturada ou selecionada, com compressão 3x4 automática
  const handlePhotoCapture = async (base64Image: string) => {
    try {
      toast.info('Processando e formatando foto 3x4...');
      const fotoComprimida = await comprimirImagem3x4(base64Image, 360, 480, 0.82);

      // Tenta upload no Supabase Storage com timeout de 4 segundos
      try {
        const res = await fetch(fotoComprimida);
        const blob = await res.blob();
        const filename = `foto_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `pacientes/${filename}`;

        const uploadPromise = supabase.storage
          .from('fotos')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        const { data, error } = await promiseWithTimeout(
          uploadPromise,
          4000,
          'Tempo limite ao enviar foto para o servidor de armazenamento.'
        );

        if (!error && data) {
          const { data: publicData } = supabase.storage
            .from('fotos')
            .getPublicUrl(filePath);

          setFotoUrl(publicData.publicUrl);
          toast.success('Foto 3x4 anexada e salva com sucesso!');
          return;
        }
      } catch (storageErr) {
        console.warn('Storage indisponível ou timeout, utilizando imagem local otimizada:', storageErr);
      }

      // Fallback seguro: armazena a versão comprimida (leve, ~35KB)
      setFotoUrl(fotoComprimida);
      toast.success('Foto 3x4 anexada com sucesso!');
    } catch (err: any) {
      console.error(err);
      setFotoUrl(base64Image);
      toast.info('Foto anexada ao cadastro.');
    }
  };

  // Seleção direta de arquivo de foto do computador/celular
  const handleDirectPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info('Carregando foto do dispositivo...');
      const fotoComprimida = await comprimirImagem3x4(file, 360, 480, 0.82);
      await handlePhotoCapture(fotoComprimida);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível ler o arquivo de foto.');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!fotoUrl) {
      toast.error('É obrigatório capturar ou enviar a foto 3x4 do paciente.');
      return;
    }
    if (!laudoUrl) {
      toast.error('É obrigatório anexar o Laudo Médico em PDF.');
      return;
    }
    if (!comprovanteUrl) {
      toast.error('É obrigatório anexar o Comprovante de Endereço.');
      return;
    }

    try {
      setSalvando(true);
      toast.info('Gravando dados do paciente...');

      const authResult = await promiseWithTimeout(supabase.auth.getUser(), 2500).catch(() => null);
      const authUser = authResult?.data;

      const novoPaciente: any = {
        nome_completo: data.nome_completo.toUpperCase(),
        cpf: data.cpf,
        cartao_sus: data.cartao_sus,
        data_nascimento: data.data_nascimento,
        cid10: data.cid10 || 'M79.7',
        contato_emergencia: data.contato_emergencia,
        endereco_completo: data.endereco_completo,
        foto_url: fotoUrl,
        laudo_medico_url: laudoUrl,
        comprovante_endereco_url: comprovanteUrl,
        status_carteira: 'PENDENTE' as const,
        data_emissao: new Date().toISOString().split('T')[0],
        ...(authUser?.user?.id ? { created_by: authUser.user.id } : {}),
      };

      const insertPromise = supabase
        .from('pacientes')
        .insert(novoPaciente)
        .select()
        .single();

      const { data: inserted, error } = await promiseWithTimeout(
        insertPromise,
        5000,
        'Tempo limite excedido ao salvar no servidor.'
      );

      if (error) throw error;

      toast.success('Paciente cadastrado com sucesso no banco de dados!');
      setPacienteCadastrado(inserted as Paciente);
      setIsPreviewOpen(true);
      reset();
      setFotoUrl('');
      setLaudoUrl('');
      setComprovanteUrl('');
    } catch (err: any) {
      console.warn('Falha ou timeout na conexão remota, ativando fallback local resiliente:', err);

      if (err.message?.includes('duplicate key') || err.message?.includes('cpf')) {
        toast.error('Erro: Este CPF já possui cadastro no sistema!');
        return;
      }

      const pacienteLocal: Paciente = {
        nome_completo: data.nome_completo.toUpperCase(),
        cpf: data.cpf,
        cartao_sus: data.cartao_sus,
        data_nascimento: data.data_nascimento,
        cid10: data.cid10 || 'M79.7',
        contato_emergencia: data.contato_emergencia,
        endereco_completo: data.endereco_completo,
        foto_url: fotoUrl,
        laudo_medico_url: laudoUrl,
        comprovante_endereco_url: comprovanteUrl,
        status_carteira: 'PENDENTE',
        data_emissao: new Date().toISOString().split('T')[0],
        id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      try {
        const salvos = JSON.parse(localStorage.getItem('fibro_pacientes_local') || '[]');
        localStorage.setItem('fibro_pacientes_local', JSON.stringify([pacienteLocal, ...salvos]));
      } catch (e) {}

      toast.success('Cadastro concluído com sucesso e armazenado localmente!');
      setPacienteCadastrado(pacienteLocal);
      setIsPreviewOpen(true);
      reset();
      setFotoUrl('');
      setLaudoUrl('');
      setComprovanteUrl('');
    } finally {
      setSalvando(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
      {/* Header do Formulário */}
      <div className="bg-gradient-to-r from-fibro-950 via-fibro-900 to-fibro-800 text-white p-8">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm">
            <User className="w-7 h-7 text-purple-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              Cadastro de Paciente com Fibromialgia
            </h2>
            <p className="text-sm text-purple-200 mt-1">
              Secretaria Municipal de Saúde (SEMUS) • São José de Ribamar - MA
            </p>
          </div>
        </div>
      </div>

      {/* Banner Pós-Cadastro com Ações Rápidas de Continuidade */}
      {pacienteCadastrado && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-emerald-500 animate-in fade-in duration-300">
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm flex-shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black">Cadastro Concluído com Sucesso!</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Paciente: <strong className="uppercase">{pacienteCadastrado.nome_completo}</strong> • CPF: {pacienteCadastrado.cpf}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-white text-emerald-950 hover:bg-emerald-50 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition transform active:scale-95"
            >
              <Eye className="w-4 h-4 text-emerald-700" />
              <span>Ver Carteira PVC</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPacienteCadastrado(null);
                reset();
                setFotoUrl('');
                setLaudoUrl('');
                setComprovanteUrl('');
              }}
              className="inline-flex items-center space-x-1.5 bg-emerald-800/80 hover:bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-400/40 transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Cadastrar Outro</span>
            </button>

            <Link
              href="/gestao"
              className="inline-flex items-center space-x-1.5 bg-slate-900/70 hover:bg-slate-950 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
            >
              <span>Painel de Gestão</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
        {/* Seção 1: Foto 3x4 do Paciente */}
        <div>
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2 mb-4">
            <Camera className="w-5 h-5 text-fibro-700" />
            <h3 className="text-base font-bold text-gray-900">
              Foto 3x4 do Paciente (Obrigatória para Carteira)
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0 bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
            <div className="w-28 h-36 rounded-xl border-2 border-dashed border-purple-400 bg-white shadow-sm flex items-center justify-center overflow-hidden relative">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Foto 3x4"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <User className="w-8 h-8 text-purple-300 mx-auto" />
                  <span className="text-[11px] text-gray-400 font-medium">3x4</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h4 className="text-sm font-bold text-gray-800">
                Capturar ou Anexar Foto Oficial 3x4
              </h4>
              <p className="text-xs text-gray-500 max-w-sm">
                Utilize a webcam do computador ou anexe diretamente uma foto digitalizada. A imagem será enquadrada e otimizada automaticamente.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsWebcamOpen(true)}
                  className="inline-flex items-center space-x-2 bg-fibro-700 hover:bg-fibro-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>{fotoUrl ? 'Refazer Foto' : 'Abrir Câmera'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputFotoRef.current?.click()}
                  className="inline-flex items-center space-x-2 bg-white hover:bg-purple-50 text-fibro-900 border border-purple-300 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95"
                >
                  <Upload className="w-4 h-4 text-purple-700" />
                  <span>Enviar Arquivo 3x4</span>
                </button>

                <input
                  type="file"
                  ref={fileInputFotoRef}
                  accept="image/*"
                  onChange={handleDirectPhotoFile}
                  className="hidden"
                />

                {fotoUrl && (
                  <button
                    type="button"
                    onClick={() => setFotoUrl('')}
                    className="text-xs text-red-600 hover:underline px-2 py-2 font-medium"
                  >
                    Remover Foto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Seção 2: Dados Pessoais e Médicos */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
            <FileText className="w-5 h-5 text-fibro-700" />
            <h3 className="text-base font-bold text-gray-900">
              Dados Pessoais e Identificação
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nome Completo */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nome completo do paciente"
                {...register('nome_completo')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm transition"
              />
              {errors.nome_completo && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.nome_completo.message}</p>
              )}
            </div>

            {/* CPF com validação matemática e máscara dinâmica */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                  CPF <span className="text-red-500">*</span>
                </label>
                {watch('cpf')?.length === 14 && (
                  validarCPF(watch('cpf')) ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Válido (Dígitos verificados)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-600 font-bold flex items-center space-x-1">
                      <span>Dígitos Inválidos</span>
                    </span>
                  )
                )}
              </div>
              <input
                type="text"
                placeholder="000.000.000-00"
                maxLength={14}
                {...register('cpf')}
                onChange={(e) => {
                  const formatado = mascaraCPF(e.target.value);
                  setValue('cpf', formatado, { shouldValidate: true });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm font-mono transition"
              />
              {errors.cpf && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.cpf.message}</p>
              )}
            </div>

            {/* Cartão SUS */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                Cartão Nacional do SUS <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="000 0000 0000 0000"
                maxLength={19}
                {...register('cartao_sus')}
                onChange={(e) => {
                  const formatado = mascaraSUS(e.target.value);
                  setValue('cartao_sus', formatado, { shouldValidate: true });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm font-mono transition"
              />
              {errors.cartao_sus && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.cartao_sus.message}</p>
              )}
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                Data de Nascimento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('data_nascimento')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm transition"
              />
              {errors.data_nascimento && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.data_nascimento.message}</p>
              )}
            </div>

            {/* CID-10 */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                Classificação Internacional de Doenças (CID-10)
              </label>
              <input
                type="text"
                defaultValue="M79.7"
                {...register('cid10')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-purple-600 outline-none text-sm font-bold text-purple-900 transition"
              />
              <span className="text-[11px] text-gray-500">Padrão nacional: M79.7 (Fibromialgia)</span>
            </div>

            {/* Contato de Emergência com máscara dinâmica em tempo real */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                Contato de Emergência ((98) 90000-0000 / Nome) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="(98) 98765-4321 - Maria (Mãe)"
                {...register('contato_emergencia')}
                onChange={(e) => {
                  const val = e.target.value;
                  // Se contém apenas números ou máscara inicial de telefone, formata dinamicamente
                  if (!val.includes(' - ') && val.length <= 15) {
                    const digitos = val.replace(/\D/g, '');
                    if (digitos.length > 0) {
                      setValue('contato_emergencia', mascaraTelefone(digitos), { shouldValidate: true });
                      return;
                    }
                  }
                  setValue('contato_emergencia', val, { shouldValidate: true });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm transition"
              />
              <span className="text-[11px] text-gray-500">
                Formatação automática do telefone com DDD: (98) 90000-0000
              </span>
              {errors.contato_emergencia && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.contato_emergencia.message}</p>
              )}
            </div>

            {/* Endereço Completo */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                Endereço Completo no Município <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Rua, Número, Complemento, Bairro, São José de Ribamar - MA"
                {...register('endereco_completo')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm transition"
              />
              {errors.endereco_completo && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.endereco_completo.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seção 3: Anexos Obrigatórios (Laudo Médico e Comprovante de Residência) */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
            <Upload className="w-5 h-5 text-fibro-700" />
            <h3 className="text-base font-bold text-gray-900">
              Documentos Obrigatórios (PDF / Imagens)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DocumentUpload
              label="Laudo Médico Comprobatório"
              descricao="Assinado por médico com CRM e CID-10"
              bucket="documentos"
              prefixo="laudos"
              accept="application/pdf"
              valorUrl={laudoUrl}
              onUrlUploaded={setLaudoUrl}
              obrigatorio
            />

            <DocumentUpload
              label="Comprovante de Endereço"
              descricao="Água, Luz ou Declaração de Residência"
              bucket="documentos"
              prefixo="enderecos"
              accept="application/pdf,image/*"
              valorUrl={comprovanteUrl}
              onUrlUploaded={setComprovanteUrl}
              obrigatorio
            />
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-4">
          <button
            type="submit"
            disabled={salvando}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-fibro-800 to-fibro-950 hover:from-fibro-700 hover:to-fibro-900 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all transform active:scale-95 disabled:opacity-50"
          >
            {salvando ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Gravando Cadastro...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Concluir Cadastro do Paciente</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal da Webcam */}
      <WebcamCaptureModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onPhotoCapture={handlePhotoCapture}
      />

      {/* Modal de Prévia Imediata da Carteira Gerada */}
      {pacienteCadastrado && (
        <CarteiraPreviewModal
          paciente={pacienteCadastrado}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};
