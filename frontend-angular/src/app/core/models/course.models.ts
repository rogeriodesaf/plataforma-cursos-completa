export interface Curso {
  id: number;
  titulo: string;
  descricao: string;
  ativo: boolean;
}

export interface CursoPayload {
  titulo: string;
  descricao: string;
}

export interface Aula {
  id: number;
  titulo: string;
  descricao: string;
  urlVideo: string;
  ordem: number;
  duracaoMinutos: number;
  ativa: boolean;
  cursoId: number;
  nomeCurso: string;
  professorId: number;
  nomeProfessor: string;
}

export interface AulaPayload {
  titulo: string;
  descricao: string;
  urlVideo: string;
  duracaoMinutos: number;
  cursoId: number;
  professorId: number;
}

export interface Matricula {
  id: number;
  usuarioId: number;
  nomeUsuario: string;
  cursoId: number;
  tituloCurso: string;
  ativa: boolean;
  dataMatricula: string;
}

export interface Progresso {
  cursoId: number;
  totalAuLas: number;
  aulasConcluidas: number;
  percentual: number;
}

export interface Certificado {
  id: number;
  nomeAluno: string;
  tituloCurso: string;
  dataEmissao: string;
  codigoValidacao: string;
}

export interface Professor {
  id: number;
  nome: string;
  email: string;
  especialidade: string;
  ativo: boolean;
}

export interface ProfessorPayload {
  nome: string;
  email: string;
  especialidade: string;
}
