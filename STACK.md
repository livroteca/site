---
title: Stack técnica do site principal
description: Framework, CMS, hospedagem, calendário, i18n e dependências do site da Livroteca. Decisões fechadas — referência para a implementação.
language: pt-BR
status: rascunho
---

# Stack técnica — site principal

> Documento de referência. Define **framework**, **CMS**, **hospedagem**, **estratégia de calendário/i18n** e **dependências**. A loja é um site separado — sua stack será definida em paralelo, mas pode reaproveitar partes daqui.

---

## 1. Resumo executivo

| Camada            | Escolha                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| Framework         | **Astro 5** (SSG)                                                        |
| Estilização       | CSS vanilla com tokens (ver [DESIGN.md](./DESIGN.md))                    |
| CMS               | **Sanity** (hosted, schemas em código, Studio React)                     |
| Conteúdo          | Documentos Sanity, consumidos via GROQ no build                          |
| Calendário        | `rrule.js`, expansão pré-calculada no build (~12 meses)                  |
| i18n              | Astro i18n nativo + document-level localization no Sanity                |
| Imagens artigos   | **CDN Sanity** (transformações on-the-fly, focal point)                  |
| Áudio podcast     | **Cloudflare R2** (MP3s, streaming)                                      |
| PDFs transparência| **Cloudflare R2**                                                        |
| Player podcast    | `@lottiefiles/dotlottie-wc` + `<audio>` HTML5                            |
| Hospedagem site   | **Cloudflare Pages**                                                     |
| Git / CI          | GitHub → Cloudflare Pages (auto-deploy)                                  |
| Rebuild on publish| Webhook Sanity → Deploy Hook Cloudflare                                  |
| Workflow          | `main` → prod ; PRs → preview URLs                                       |
| Domínio           | **`livrotecabrincantedopina.org`**                                       |
| Analytics         | Cloudflare Web Analytics (privacy-friendly, gratuito)                    |

---

## 2. Framework — Astro 5

### Por quê

- Site **majoritariamente estático** + ilhas de interatividade (calendário, player, dialog Ajudar, language switcher).
- **Zero JS por padrão** : Astro só envia JS onde explicitamente declarado (`client:load`, `client:visible`).
- **i18n nativo** desde Astro 4 — roteamento `/pt/...` e `/en/...` sem lib externa.
- **`astro:assets`** para fonts/SVGs locais ; imagens de conteúdo passam pelo CDN do Sanity.
- Integra naturalmente com Sanity (cliente JS oficial) e Cloudflare Pages.

### Versão alvo

- **Astro 5.x** (última major estável em 2026-05).
- Node 20+ para build.

### Integrações Astro instaladas

```
@astrojs/sitemap          → sitemap.xml automático
@astrojs/rss              → feed RSS dos artigos (v1 opcional)
```

i18n nativo do Astro 5, sem lib externa. Sem Tailwind, sem framework UI. **CSS vanilla** + tokens de DESIGN.md. Componentes `.astro` puros, ilhas Preact se necessário para o calendário.

---

## 3. CMS — Sanity

### Por quê

- **UI editor moderna** : drag-and-drop, rich text, live preview, multi-user temps réel.
- **Auth par email** : Kcal et volontaires invités par email, sans compte GitHub.
- **CDN d'images natif** com transformations on-the-fly (resize, crop, focal point).
- **Schemas em código** (TypeScript), versionados no repo do Studio.
- **Free tier** : 3 users (admins) + lecteurs ilimités en read-only, 10k documents, 5GB d'assets, 500k requêtes CDN/mois. Largement au-dessus de nos besoins prévisibles.
- **Export JSON** disponible à tout moment → si Sanity tournait mal, on migre.

### Architecture

```
                    ┌─────────────────────┐
                    │   Sanity Studio     │  ← Kcal & volontaires éditent ici
                    │  (React app)        │     (studio.livroteca.org)
                    └──────────┬──────────┘
                               │ publish
                               ▼
                    ┌─────────────────────┐
                    │   Sanity Content    │  ← documents + assets (CDN)
                    │   Lake (hosted)     │
                    └──────────┬──────────┘
                               │ webhook on publish
                               ▼
                    ┌─────────────────────┐
                    │  Cloudflare Pages   │  ← rebuild Astro
                    │  (livroteca.org)    │     GROQ queries → HTML
                    └─────────────────────┘
```

### Studio Sanity

- Repo séparé `livroteca-studio/` ou monorepo `apps/studio/` (à décider — recommendation : monorepo, mais Studio peut être déployé indépendamment).
- Hébergé sur **`studio.livrotecabrincantedopina.org`** (auto-hébergé sur Cloudflare Pages).
- Schemas définis em TypeScript dans `studio/schemas/`. Modifications via PR comme du code normal.

### Gestion des utilisateurs

- Kcal crée un compte Sanity (gmail SSO ou email/password).
- Il devient owner du projet.
- Il invite volontaires par email depuis le dashboard Sanity.
- Rôles : **Administrator** (Kcal), **Editor** (volontaires), **Viewer** (lecture seule).

### Conséquences pour la portabilité

- Contenu **n'est pas dans Git** — il vit dans Sanity Content Lake.
- Export en JSON natif (`sanity dataset export`) → backup automatisable (cron CF Worker → R2).
- Si on quitte Sanity un jour, le JSON est convertible en markdown.

---

## 4. Modèle de contenu — schemas Sanity

Schemas définis dans `studio/schemas/`. Reflètent le modèle de [STRUCTURE.md §4](./STRUCTURE.md).

### `artigo` (englobe articles et événements)

```ts
// studio/schemas/artigo.ts
export default defineType({
  name: 'artigo',
  title: 'Artigo / Evento',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'localizedString' }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title.pt' } }),
    defineField({
      name: 'type',
      type: 'string',
      options: { list: ['artigo', 'evento'] },
      initialValue: 'artigo',
    }),
    defineField({ name: 'date', type: 'datetime' }),
    defineField({ name: 'cover', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'excerpt', type: 'localizedText' }),
    defineField({ name: 'body', type: 'localizedPortableText' }),
    defineField({ name: 'authors', type: 'array', of: [{ type: 'reference', to: { type: 'pessoa' } }] }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'event',
      type: 'object',
      hidden: ({ parent }) => parent?.type !== 'evento',
      fields: [
        { name: 'start', type: 'datetime' },
        { name: 'end', type: 'datetime' },
        { name: 'location', type: 'string' },
        { name: 'recurrence', type: 'string', description: 'iCal RRULE (ex: FREQ=WEEKLY;BYDAY=MO,WE,FR)' },
        { name: 'recurrenceEnd', type: 'datetime' },
        {
          name: 'exceptions',
          type: 'array',
          of: [{ type: 'datetime' }],
          description: 'Datas em que esta ocorrência não acontece (eventos cancelados)',
        },
      ],
    }),
  ],
});
```

### Autres documents

- `pessoa` — auteurs, Kcal, coordinateurs.
- `paginaInstitucional` — contenu de `/a-livroteca`, `/doar`, `/voluntariar`, `/loja`.
- `episodioPodcast` — A Voz da Lama (titre, description, audio URL R2, durée, date, transcript optionnel).
- `documentoTransparencia` — fichier PDF (URL R2), titre, type (balanço, ata, prestação de contas), date.
- `configSite` — singleton : titre du site, descriptions, réseaux sociaux, contact.

### Types personnalisés (i18n)

```ts
// studio/schemas/localizedString.ts
export default defineType({
  name: 'localizedString',
  type: 'object',
  fields: [
    { name: 'pt', type: 'string', title: 'Português' },
    { name: 'en', type: 'string', title: 'English' },
  ],
});
```

Idem pour `localizedText` et `localizedPortableText`. **Édition côte à côte pt/en dans le Studio.**

---

## 5. Récupération du contenu côté Astro

Au build, Astro interroge Sanity via le client officiel et des requêtes GROQ.

```ts
// src/lib/sanity.ts
import { createClient } from '@sanity/client';

export const sanity = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2026-01-01',
  useCdn: true,
});
```

Exemple de fetch dans une page :

```astro
---
// src/pages/as-atividades/[slug].astro
import { sanity } from '../../lib/sanity';

export async function getStaticPaths() {
  const artigos = await sanity.fetch(`*[_type == "artigo"]{ "slug": slug.current }`);
  return artigos.map(a => ({ params: { slug: a.slug } }));
}

const { slug } = Astro.params;
const artigo = await sanity.fetch(
  `*[_type == "artigo" && slug.current == $slug][0]`,
  { slug }
);
---
<Layout>
  <h1>{artigo.title.pt}</h1>
  <PortableText value={artigo.body.pt} />
</Layout>
```

### Images

```ts
import imageUrlBuilder from '@sanity/image-url';
const builder = imageUrlBuilder(sanity);
export const urlFor = (src) => builder.image(src);

// usage : <img src={urlFor(artigo.cover).width(800).fit('crop').url()} />
```

Recadrage focal point géré côté Studio par les éditeurs, respecté automatiquement dans les transformations.

---

## 6. Calendário — RRULE pré-calculado

### Estratégia

1. Au build, query Sanity : `*[_type == "artigo" && type == "evento"]`.
2. Pour chaque événement avec `event.recurrence`, expanser via `rrule.js` sur **±6 mois passés / +12 mois futurs**, en filtrant les dates listées dans `event.exceptions`.
3. Générer un JSON statique `dist/eventos.json` consommé par le composant calendrier client-side.
4. **Rebuild hebdo automatique** via Cloudflare cron + deploy hook → la fenêtre rolante reste à jour même sans nouvelle publication.

### Lib

- [`rrule`](https://github.com/jakubroztocil/rrule) (`rrule.js`). Mature, RFC 5545.
- Utilisée uniquement au build — **zero JS envoyé au client** pour l'expansion.
- `RRuleSet` pour combiner RRULE + EXDATE (exceptions).

### Annulations d'occurrences (V1 — approche EXDATE)

- L'éditeur ajoute des dates au champ `event.exceptions` du document.
- Au build, ces dates sont passées en `exdate()` au `RRuleSet`, donc absentes du `eventos.json`.
- Affichage public V1 : **silencieux** (l'occurrence n'apparaît pas dans le calendrier).
- V2 envisagée : document `eventOverride` séparé pour gérer aussi les modifications (déplacement d'horaire/lieu d'une seule occurrence) + affichage barré avec note.

```ts
// src/lib/rrule-expand.ts (extrait)
import { RRuleSet, rrulestr } from 'rrule';

const set = new RRuleSet();
set.rrule(rrulestr(`DTSTART:${dtstart}\nRRULE:${ev.event.recurrence}`));
for (const exDate of (ev.event.exceptions ?? [])) {
  set.exdate(new Date(exDate));
}
const occurrences = set.between(WINDOW_START, WINDOW_END, true);
```

### Composant calendrier (côté client)

- Lit `eventos.json` (déjà expanded, exceptions déjà filtrées).
- Grille mensuelle en vanilla JS ou ilha Preact (décision à l'implémentation).
- Clic sur événement → `/as-atividades/[slug]`.

### Triggers de rebuild

```
1. Publication Sanity (article, événement, page…)  →  webhook  →  CF Pages rebuild
2. Cron hebdo (lundi 6h UTC = 3h Recife)           →  CF Worker  →  CF Pages rebuild
3. Push sur main (code)                            →  CF Pages rebuild auto
```

---

## 7. i18n

### Côté Astro

```js
// astro.config.mjs
i18n: {
  defaultLocale: 'pt-BR',
  locales: ['pt-BR', 'en'],
  routing: { prefixDefaultLocale: false }  // pt-BR sans préfixe
}
```

- `/a-livroteca` → pt-BR
- `/en/a-livroteca` → EN
- Language switcher : helper `getLocalePath` qui préserve la page actuelle.

### Côté Sanity

- Champs localisés (`localizedString`, `localizedText`, `localizedPortableText`) → édition pt/en côte à côte dans le même document.
- Édition d'un article = 1 document, 2 colonnes (pt obligatoire, en optionnel).

### Fallback pages non traduites

- Si `artigo.title.en` ou `artigo.body.en` est vide → render le pt-BR + **banner au top** :
  > "This page hasn't been translated yet. Showing the Portuguese version."
- Component Astro conditionnel `<TranslationBanner />`.

### Strings UI (header, footer, CTAs)

- Document `configSite` au Sanity avec champs localisés pour les labels statiques.
- Ou JSON local `src/i18n/{pt-BR,en}.json` si Kcal n'a pas besoin de les éditer. **Recommandé** : JSON local pour les strings purement UI (jamais éditées), Sanity pour les contenus.

---

## 8. Hébergement

### Cloudflare Pages (site Astro)

- Connect GitHub repo → build command `npm run build` → output `dist/`.
- **Preview URLs automatiques** sur chaque PR.
- HTTPS, HTTP/3, Brotli, CDN global natif.
- Free tier : 500 builds/mois, bandwidth illimitée. Largement suffisant.
- Build command : `npm run build` (qui internally fait `astro build`, et fetch Sanity au passage).

### Cloudflare Pages (Sanity Studio)

- Le Studio est aussi une SPA déployable.
- Repo `livroteca-studio` ou sous-dossier monorepo `apps/studio/`.
- Build : `sanity build` → output `dist/`.
- Domaine custom : `studio.livroteca.org`.

### Cloudflare R2 (fichiers volumineux)

Pour ce que Sanity ne héberge pas (gros volume, streaming) :

- **MP3 podcast "A Voz da Lama"** : épisodes complets (~30MB chacun). Sanity free tier limite à 5GB d'assets ; pas la peine de cramer ça pour de l'audio.
- **PDFs transparência** : balanços, atas, prestations de comptes.

R2 = S3-compatible, **zero egress fees**, $0.015/GB/mois de storage, 10GB gratuits. Largement suffisant.

Workflow upload : dashboard Cloudflare ou CLI `wrangler r2`. URL stockée dans le document Sanity correspondant.

### Sanity Content Lake (images d'articles)

- Toutes les images de contenu (couvertures d'articles, photos d'événements) → uploadées dans le Studio Sanity, hébergées sur le CDN Sanity.
- Transformations on-the-fly via URL : `?w=800&fit=crop&fm=webp`.
- 5GB d'assets gratuits + 10GB bandwidth/mois. Si on dépasse, on bascule vers paid (~$15/mois pour le tier suivant).

### Domaines

- **Principal (canonical)** : `livrotecabrincantedopina.org`
- **Redirect 301** : `livrotecabrincantedopina.com.br` → `.org` (sécurise la marque côté Brésil)
- **Studio** : `studio.livrotecabrincantedopina.org`
- **R2 media** : `media.livrotecabrincantedopina.org`

Registrars :
- `.org` → **Cloudflare Registrar** (prix coûtant, DNS intégré, SSL auto, ~$11/an).
- `.com.br` → **Registro.br** obligatoire (CPF/CNPJ brésilien requis, ~40 BRL/an).

---

## 9. Player podcast — A Voz da Lama

- **UI** : web component `@lottiefiles/dotlottie-wc` pour le speaker animé (déjà dans le template).
- **Audio** : `<audio>` HTML5 nativo.
- **Source** : URL R2 (ex: `https://media.livroteca.org/podcast/ep-01.mp3`).
- **Liste d'épisodes** : document Sanity `episodioPodcast` (titre, description, URL audio, durée, date, transcript optionnel).
- **Feed RSS podcast** (v2) : généré au build depuis les documents Sanity si on publie sur Spotify/Apple Podcasts.

---

## 10. Forms (Doar, Voluntariar)

Cloudflare Pages Functions (serverless, gratuit jusqu'à 100k req/jour).

- **Doar v1** : page statique éditée dans Sanity affichant **QR code PIX + clé PIX + bouton Mercado Pago hosted + coordonnées bancaires**. Zéro code, zéro frais sur PIX, lancement immédiat. Donations internationales = email contact.
- **Doar v2** (post-launch, si besoin) : intégration Mercado Pago API (montant libre, choix ponctuel/mensuel) + Stripe Checkout pour donateurs internationaux + page de remerciement + reçu fiscal.
- **Voluntariar** : form → Pages Function → Resend (free tier 100 mails/jour) → email Kcal.
- **Newsletter** : **non incluse en v1** (décision Kcal). Réévaluation post-launch.

---

## 11. Analytics

**Cloudflare Web Analytics** :
- Privacy-friendly (sans cookies, sans fingerprint).
- Gratuit illimité.
- Snippet 1 ligne.

Alternative : Plausible ($9/mois) si on veut des dashboards plus riches.

---

## 12. Workflow & CI/CD

### Branches code

- `main` → prod (livroteca.org + studio.livroteca.org).
- PRs → preview URL Cloudflare auto.
- Pas de `staging` permanent.

### Triggers de déploiement

| Événement                            | Action                                     |
| ------------------------------------ | ------------------------------------------ |
| Push sur `main` (code)               | CF Pages rebuild + redeploy site & studio  |
| PR ouverte (code)                    | CF Pages preview URL                       |
| Publication Sanity (article, page…)  | Webhook → CF Pages deploy hook → rebuild   |
| Cron hebdo                           | CF Worker → CF Pages deploy hook → rebuild |

### Éditeurs (Kcal, volontaires)

- Login `studio.livroteca.org` avec leur email.
- Édition + publication → site rebuilt automatiquement (~30-60s).
- Aucune interaction avec Git.

### Devs

- Branch feature → PR → review → merge `main`.
- Pré-commit : `prettier` + `astro check`.
- Modifications de schemas Sanity → PR + deploy du Studio.

---

## 13. Structure du repo (proposée)

Option **monorepo** (recommandée pour simplifier les modifs cross-cutting de schemas) :

```
livroteca/
├── package.json              → npm workspaces
├── apps/
│   ├── site/                 → Astro
│   │   ├── astro.config.mjs
│   │   ├── package.json
│   │   ├── public/
│   │   │   ├── fonts/
│   │   │   ├── lottie/
│   │   │   └── favicon.svg
│   │   └── src/
│   │       ├── components/   → Header, Footer, Calendar, PodcastPlayer, AjudarDialog, LangSwitcher
│   │       ├── layouts/
│   │       ├── lib/
│   │       │   ├── sanity.ts
│   │       │   ├── rrule-expand.ts
│   │       │   └── i18n-utils.ts
│   │       ├── pages/
│   │       │   ├── index.astro
│   │       │   ├── a-livroteca.astro
│   │       │   ├── as-atividades/
│   │       │   │   ├── index.astro
│   │       │   │   └── [slug].astro
│   │       │   ├── doar.astro
│   │       │   ├── voluntariar.astro
│   │       │   ├── loja.astro
│   │       │   ├── transparencia.astro
│   │       │   └── en/       → mirror estrutura pt
│   │       ├── i18n/
│   │       │   ├── pt-BR.json
│   │       │   └── en.json
│   │       └── styles/
│   │           ├── tokens.css
│   │           └── global.css
│   └── studio/               → Sanity Studio
│       ├── sanity.config.ts
│       ├── package.json
│       └── schemas/
│           ├── index.ts
│           ├── artigo.ts
│           ├── pessoa.ts
│           ├── paginaInstitucional.ts
│           ├── episodioPodcast.ts
│           ├── documentoTransparencia.ts
│           ├── configSite.ts
│           └── objects/
│               ├── localizedString.ts
│               ├── localizedText.ts
│               └── localizedPortableText.ts
└── README.md
```

Alternative : **deux repos séparés** `livroteca-site` et `livroteca-studio`. Plus simple à démarrer, mais modifications de schemas demandent deux PRs synchronisées.

**Recommandation : monorepo npm workspaces**.

---

## 14. Dépendances principales

### `apps/site` (Astro)

```json
{
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "@astrojs/rss": "^4.0.0",
    "@sanity/client": "^6.0.0",
    "@sanity/image-url": "^1.0.0",
    "@portabletext/to-html": "^2.0.0",
    "rrule": "^2.8.0",
    "@lottiefiles/dotlottie-wc": "^0.4.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "prettier": "^3.2.0",
    "prettier-plugin-astro": "^0.13.0"
  }
}
```

### `apps/studio` (Sanity)

```json
{
  "dependencies": {
    "sanity": "^3.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "styled-components": "^6.0.0",
    "@sanity/vision": "^3.0.0"
  }
}
```

Bundle JS final attendu sur le site : **< 30KB gzipped** pour la home (calendrier lazy). Le Studio est plus lourd (React), mais c'est l'app éditeur, hors site public.

---

## 15. Variables d'environnement

Site (Cloudflare Pages → Settings → Environment Variables) :

```
SANITY_PROJECT_ID=xxxxxxxx
SANITY_DATASET=production
SANITY_API_VERSION=2026-01-01
SANITY_READ_TOKEN=sk...     # optionnel : seulement si on lit des drafts en preview
```

Studio :

```
SANITY_STUDIO_PROJECT_ID=xxxxxxxx
SANITY_STUDIO_DATASET=production
```

---

## 16. Backups

- **Cron hebdo Cloudflare Worker** : `sanity dataset export production` (via API) → upload du dump JSON sur R2.
- Rétention : 12 dernières exports.
- Garantit la portabilité si Sanity tournait mal ou si on veut migrer un jour.

---

## 17. Décisions pendantes

- [x] ~~**Domaine** : `.com.br` vs `.org` vs les deux ?~~ → **`livrotecabrincantedopina.org`** canonical + **`livrotecabrincantedopina.com.br`** redirect 301.
- [x] ~~**Repo GitHub** : org vs perso ?~~ → **org `livrotecabrincante`** (Hugo owner principal, Kcal owner secondaire pour continuité).
- [ ] **Monorepo vs deux repos** : recommandation monorepo, à confirmer.
- [x] ~~**Studio hosting**~~ → **`studio.livrotecabrincantedopina.org`** (Cloudflare Pages).
- [x] ~~**Doar v1**~~ → **validé** : QR code PIX + clé PIX + bouton hosted Mercado Pago + bank info + email international, zéro code, contenu éditable dans Sanity.
- [x] ~~**Newsletter** : v1 ou v2 ?~~ → **v2** (décidé par Kcal, hors scope v1).
- [ ] **Strings UI** : Sanity ou JSON local ? (recommandation : JSON local).
- [ ] **Widget RRULE Studio** : input texte v1 avec helptext, custom input plugin si pain point.
- [ ] **Widget annulations** : V1 = array de datetime natif Sanity, V2 = bouton ✕ par occurrence (couplé au widget RRULE custom).
- [ ] **Affichage annulations sur le site** : V1 silencieux ; passer à "barré + note" si on ajoute `eventOverride` en V2.
- [ ] **Calendar UI** : vanilla JS ou ilha Preact ? (décision à l'implémentation).

---

## 18. Prochaines étapes

1. ✅ Valider STACK.md avec Kcal (domaine, qui aura accès au Studio, Doar v1, newsletter).
2. Créer projet Sanity (gratuit, 5 min via `sanity.io/manage`).
3. Créer repo GitHub `livroteca` (monorepo).
4. Bootstrap apps/site (`npm create astro@latest`) + apps/studio (`npm create sanity@latest`).
5. Définir schemas Sanity (artigo, pessoa, episodioPodcast, etc.).
6. Porter `template/index.html` en composants Astro (Header, Footer, PodcastPlayer, layout).
7. Implémenter Home avec calendrier stub + fetch Sanity de quelques événements de test.
8. Implémenter `/as-atividades` et `/as-atividades/[slug]`.
9. i18n setup + première traduction EN.
10. Setup Cloudflare Pages (site + studio) + domaine.
11. Setup webhook Sanity → deploy hook Cloudflare.
12. Setup cron worker pour rebuild hebdo + backup.
13. Inviter Kcal sur Sanity, formation 30 min sur le Studio.
14. Contenu réel (Kcal et volontaires commencent à éditer).
