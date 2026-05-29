# Plataforma Cursos Frontend

Frontend Angular standalone para a plataforma de cursos online.

## Requisitos

- Node.js 20+
- Backend Quarkus rodando em `http://localhost:8180`

## Rodar em desenvolvimento

No diretorio `frontend-angular`:

```sh
npm start
```

Se o PowerShell bloquear `npm`, use:

```sh
cmd /c npm.cmd start
```

Aplicacao local: `http://localhost:4200`

## Proxy da API

Em desenvolvimento, o frontend usa proxy para o backend:

- frontend: `http://localhost:4200`
- api via proxy: `http://localhost:4200/api`
- destino real: `http://localhost:8180`

Configuracao em `proxy.conf.json`.

## Build

```sh
npm run build
```

Saida gerada em `dist/plataforma-cursos-frontend`.

## Ambiente

- `src/app/environments/environment.ts`: desenvolvimento, usando `/api`
- `src/app/environments/environment.prod.ts`: producao, usando `/api`

## Producao

Para deploy, o frontend agora espera que a API esteja exposta no mesmo dominio via `/api`.

Exemplo:

- frontend: `https://seu-dominio.com`
- backend/proxy: `https://seu-dominio.com/api`

## Observacoes

- O script `../start-dev.ps1` sobe banco, backend e frontend.
- A area admin agora suporta cadastro, edicao e ativacao/desativacao de cursos, aulas e professores conforme a API atual.
