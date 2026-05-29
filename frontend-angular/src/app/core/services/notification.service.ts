import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3500,
      panelClass: ['success']
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4500,
      panelClass: ['error']
    });
  }
}
