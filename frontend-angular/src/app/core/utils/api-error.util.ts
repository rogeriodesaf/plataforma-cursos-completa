export function extractApiError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybeHttpError = error as {
      error?: { erro?: string; message?: string };
      message?: string;
    };

    return maybeHttpError.error?.erro
      ?? maybeHttpError.error?.message
      ?? maybeHttpError.message
      ?? 'Nao foi possivel concluir a operacao.';
  }

  return 'Nao foi possivel concluir a operacao.';
}
