export type StatusCarteira = 'PENDENTE' | 'APROVADO' | 'EMITIDO' | 'ENTREGUE' | 'RECUSADO';

export type UserRole = 'admin' | 'atendente';

export interface Paciente {
  id: string;
  nome_completo: string;
  cpf: string;
  cartao_sus: string;
  data_nascimento: string;
  cid10: string;
  contato_emergencia: string;
  endereco_completo: string;
  foto_url: string;
  laudo_medico_url: string;
  comprovante_endereco_url: string;
  status_carteira: StatusCarteira;
  data_emissao: string | null;
  created_at: string;
  updated_at?: string;
}

export type PacienteInput = Omit<Paciente, 'id' | 'created_at' | 'updated_at'>;

export interface Perfil {
  id: string;
  nome: string | null;
  role: UserRole;
  created_at: string;
}
