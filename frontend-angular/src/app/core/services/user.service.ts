import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  listUsers(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${environment.apiUrl}/auth`);
  }

  getUser(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${environment.apiUrl}/auth/${id}`);
  }
}
