import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Aula, AulaPayload } from '../models/course.models';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);

  listByCourse(cursoId: number): Observable<Aula[]> {
    return this.http.get<Aula[]>(`${environment.apiUrl}/aulas/curso/${cursoId}/ativas`);
  }

  listByCourseForAdmin(cursoId: number): Observable<Aula[]> {
    return this.http.get<Aula[]>(`${environment.apiUrl}/aulas/curso/${cursoId}`);
  }

  listByProfessor(professorId: number): Observable<Aula[]> {
    return this.http.get<Aula[]>(`${environment.apiUrl}/aulas/professor/${professorId}`);
  }

  getLesson(id: number): Observable<Aula> {
    return this.http.get<Aula>(`${environment.apiUrl}/aulas/${id}`);
  }

  createLesson(payload: AulaPayload): Observable<Aula> {
    return this.http.post<Aula>(`${environment.apiUrl}/aulas`, payload);
  }

  updateLesson(id: number, payload: AulaPayload): Observable<Aula> {
    return this.http.put<Aula>(`${environment.apiUrl}/aulas/${id}/atualizar`, payload);
  }

  deactivateLesson(id: number): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/aulas/${id}/desativar`, {});
  }

  activateLesson(id: number): Observable<Aula> {
    return this.http.patch<Aula>(`${environment.apiUrl}/aulas/${id}/ativar`, {});
  }
}
