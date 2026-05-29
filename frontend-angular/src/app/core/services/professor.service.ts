import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Professor, ProfessorPayload } from '../models/course.models';

@Injectable({ providedIn: 'root' })
export class ProfessorService {
  private readonly http = inject(HttpClient);

  listProfessors(): Observable<Professor[]> {
    return this.http.get<Professor[]>(`${environment.apiUrl}/professores/ativos`);
  }

  listProfessorsForAdmin(): Observable<Professor[]> {
    return this.http.get<Professor[]>(`${environment.apiUrl}/professores`);
  }

  getProfessor(id: number): Observable<Professor> {
    return this.http.get<Professor>(`${environment.apiUrl}/professores/${id}`);
  }

  createProfessor(payload: ProfessorPayload): Observable<Professor> {
    return this.http.post<Professor>(`${environment.apiUrl}/professores`, payload);
  }

  updateProfessor(id: number, payload: ProfessorPayload): Observable<Professor> {
    return this.http.put<Professor>(`${environment.apiUrl}/professores/${id}/atualizar`, payload);
  }

  deactivateProfessor(id: number): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/professores/${id}/desativar`, {});
  }

  activateProfessor(id: number): Observable<Professor> {
    return this.http.patch<Professor>(`${environment.apiUrl}/professores/${id}/ativar`, {});
  }
}
