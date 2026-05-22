# Livroteca Brincante do Pina

Monorepo do site principal (Astro) e do Sanity Studio.

## Estrutura

```
livroteca/
├── apps/
│   ├── site/     → Astro 6 (livrotecabrincantedopina.org)
│   └── studio/   → Sanity Studio (studio.livrotecabrincantedopina.org)
├── pnpm-workspace.yaml
└── package.json
```

## Pré-requisitos

- Node 22+
- pnpm 11+

## Comandos

```sh
pnpm install              # instala tudo
pnpm dev:site             # roda o site em http://localhost:4321
pnpm dev:studio           # roda o studio em http://localhost:3333 (após init Sanity)
pnpm build:site           # build do site → apps/site/dist/
pnpm build:studio         # build do studio
```

## Próximos passos

1. Criar projeto Sanity em https://sanity.io/manage (Kcal owner).
2. Exportar `SANITY_STUDIO_PROJECT_ID` e configurar `apps/studio/sanity.cli.ts` / `sanity.config.ts`.
3. Adicionar `SANITY_PROJECT_ID` e `SANITY_DATASET` em `apps/site/.env`.
4. Criar repo GitHub `livrotecabrincante/livroteca`.
5. Conectar a Cloudflare Pages (site + studio), configurar domínios.
6. Importar conteúdo real no Studio.

Documentação completa: ver [CLAUDE.md](./CLAUDE.md), [STACK.md](./STACK.md), [STRUCTURE.md](./STRUCTURE.md), [DESIGN.md](./DESIGN.md).
