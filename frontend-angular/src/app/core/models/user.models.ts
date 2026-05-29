import { Perfil } from './auth.models';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}
