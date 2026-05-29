import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Matricula } from '../models/course.models';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);

  enroll(cursoId: number): Observable<Matricula> {
    return this.http.post<Matricula>(`${environment.apiUrl}/matriculas/cursos/${cursoId}`, {});
  }

  listMine(): Observable<Matricula[]> {
    return this.http.get<Matricula[]>(`${environment.apiUrl}/matriculas/minhas`);
  }

  listByCourse(cursoId: number): Observable<Matricula[]> {
    return this.http.get<Matricula[]>(`${environment.apiUrl}/matriculas/cursos/${cursoId}/alunos`);
  }

  listByUser(usuarioId: number): Observable<Matricula[]> {
    return this.http.get<Matricula[]>(`${environment.apiUrl}/matriculas/usuarios/${usuarioId}/cursos`);
  }
}
