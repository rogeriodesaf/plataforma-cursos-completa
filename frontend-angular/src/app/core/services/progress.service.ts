import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Progresso } from '../models/course.models';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);

  getCourseProgress(cursoId: number): Observable<Progresso> {
    return this.http.get<Progresso>(`${environment.apiUrl}/progresso/cursos/${cursoId}`);
  }

  getStudentProgress(usuarioId: number, cursoId: number): Observable<Progresso> {
    return this.http.get<Progresso>(`${environment.apiUrl}/progresso/usuarios/${usuarioId}/cursos/${cursoId}`);
  }

  completeLesson(aulaId: number): Observable<string> {
    return this.http.post(`${environment.apiUrl}/progresso/aulas/${aulaId}/concluir`, {}, { responseType: 'text' });
  }
}
