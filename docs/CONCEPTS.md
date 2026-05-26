# Concepts du site Livroteca

Ce document explique en détail tous les concepts, outils et choix techniques utilisés depuis le bootstrap du site. L'objectif : que tu comprennes **ce qu'on a construit, pourquoi, et comment ça marche** — pas juste les noms des outils mais leur place dans l'ensemble.

Le doc est organisé par domaine, pas dans l'ordre chronologique du build. Tu peux lire dans l'ordre ou sauter directement à une section.

> Les références de code de la forme `apps/site/src/lib/i18n.ts:13` cliquent directement vers le fichier et la ligne dans VS Code.

---

## Table des matières

1. [Architecture globale](#1-architecture-globale)
2. [Astro — le framework du site](#2-astro--le-framework-du-site)
3. [TypeScript dans le projet](#3-typescript-dans-le-projet)
4. [Sanity — le CMS](#4-sanity--le-cms)
5. [CSS et design system](#5-css-et-design-system)
6. [i18n — internationalisation](#6-i18n--internationalisation)
7. [Calendrier et événements récurrents](#7-calendrier-et-événements-récurrents)
8. [Cloudflare — la plateforme](#8-cloudflare--la-plateforme)
9. [CF Pages Functions](#9-cf-pages-functions)
10. [SEO](#10-seo)
11. [Forms web](#11-forms-web)
12. [Email transactionnel](#12-email-transactionnel)
13. [DNS, domaines, redirects](#13-dns-domaines-redirects)
14. [Git, GitHub, déploiement continu](#14-git-github-déploiement-continu)
15. [Concepts transversaux](#15-concepts-transversaux)

---

## 1. Architecture globale

### Monorepo

Un **monorepo** c'est un seul dépôt Git qui contient plusieurs applications ou packages liés. À l'opposé : le **multirepo**, où chaque app a son propre dépôt.

Pour la Livroteca, on a deux apps :
- `apps/site/` — le site Astro public (livrotecabrincantedopina.org)
- `apps/studio/` — l'interface d'édition Sanity (studio.livrotecabrincantedopina.org)

**Pourquoi un monorepo ici ?** Les deux apps évoluent ensemble : si tu changes le schéma d'un `artigo` côté Studio, il faut que le site sache lire la nouvelle structure. Quand c'est dans le même repo, tu peux faire un commit atomique qui change les deux côtés en même temps, et tu vois tout le code lié sur le même `git log`.

**L'inconvénient** : le repo grossit, et CI/CD peut devenir plus complexe (faut savoir builder seulement la partie qui a changé). Pour notre taille, c'est négligeable.

**Alternatives qu'on aurait pu prendre :**
- Deux repos `livroteca/site` + `livroteca/studio` — plus de friction pour évoluer en parallèle.
- Tout dans un seul package (pas de séparation) — le Studio aurait pollué les dépendances du site et compliqué le build.

**Référence** : voir la structure dans la racine du repo, et le fichier `pnpm-workspace.yaml` qui déclare où sont les workspaces.

### pnpm workspaces

`pnpm` est un gestionnaire de paquets Node, comme `npm` ou `yarn` — mais avec deux différences notables :

1. **Stockage par hard links** — au lieu de copier chaque paquet dans chaque `node_modules`, pnpm garde une seule copie sur disque et fait des liens. Résultat : install ~2× plus rapide, et ~10× moins d'espace disque sur les gros monorepos.

2. **Workspaces natifs et stricts** — pnpm sait que `apps/site` et `apps/studio` sont deux paquets indépendants. Tu peux installer une dépendance dans un seul des deux (`pnpm --filter site add @astrojs/sitemap`), et chaque app a son propre `package.json`.

Le fichier [pnpm-workspace.yaml](../pnpm-workspace.yaml) à la racine déclare :
```yaml
packages:
  - "apps/*"
```

Ça veut dire : "tout ce qui est dans `apps/*` est un workspace pnpm".

**Commandes utiles :**
- `pnpm install` à la racine → installe pour tous les workspaces
- `pnpm --filter site dev` → lance le script `dev` du site uniquement
- `pnpm build:site` (alias défini dans le `package.json` racine) → build le site

**Alternatives :**
- `npm workspaces` — supporté depuis npm 7. Fonctionne mais moins ergonomique, pas de hard links.
- `yarn workspaces` — la première implémentation moderne. Yarn v1 est legacy, yarn v3/v4 (Berry) est différent.
- `turbo` / `nx` — pas des gestionnaires de paquets, mais des "task runners" pour monorepos. Utiles quand tu as 10+ packages, overkill ici.

**Piège classique** : si tu install à la racine sans `--filter`, tu ajoutes la dépendance au workspace racine (pas dans `apps/site` ou `apps/studio`). Toujours `--filter` ou bien `cd` dans l'app.

### Pourquoi cette séparation site / studio

Le site et le studio ont des contraintes très différentes :

| | Site | Studio |
|---|---|---|
| Public | Tout le monde, anonyme | Kcal + volontaires, authentifiés |
| Performance | Critique (SEO, mobile, Brésil) | Peu importe |
| Build | SSG (HTML statique) | SPA (React) |
| Réseau | CDN mondial, ~50KB initial | API Sanity, ~500KB initial |
| Stack | Astro + CSS vanilla | Sanity Studio (React) |

Les mettre dans la même app aurait forcé un compromis sur la stack. Là chacun fait ce qu'il fait de mieux : Astro pour générer un HTML ultra-rapide, Sanity Studio pour l'édition.

---

## 2. Astro — le framework du site

### C'est quoi Astro

Astro est un **framework web orienté contenu**. Sa promesse : générer des sites statiques (HTML pur) ultra-rapides, tout en te permettant d'écrire des composants à la React/Vue/Svelte si tu veux.

Le slogan officiel : "ship less JavaScript". Par défaut, Astro envoie **zéro JavaScript** au navigateur — juste de l'HTML et du CSS. Si tu as besoin de JS interactif, tu l'opt-in (avec `<script>` ou les "islands" pour intégrer un composant React/Vue).

Pour la Livroteca, on est full SSG (Static Site Generation) avec du JS vanilla minimal là où nécessaire (calendrier, modal Ajudar, form Voluntariar).

### SSG vs SSR vs SPA

C'est important de comprendre ces trois modes parce qu'ils déterminent **quand le HTML est généré** :

**SSG — Static Site Generation**
- HTML généré **au build** (une seule fois, sur ta machine ou la CI)
- Chaque page est un fichier `.html` sur disque, servi tel quel par un CDN
- Avantages : ultra-rapide, ultra-cheap à héberger, parfait SEO
- Inconvénient : pour mettre à jour le contenu, faut rebuilder (sauf si tu fais du dynamic fetch côté client)
- **Notre choix pour le site**

**SSR — Server-Side Rendering**
- HTML généré **à chaque requête** par un serveur Node/Bun/etc.
- Contenu toujours frais, mais besoin d'un serveur qui tourne 24/7
- Plus cher, plus complexe à scaler

**SPA — Single Page Application**
- HTML quasi vide au début (`<div id="app"></div>`)
- Tout le contenu est généré dans le navigateur en JS au runtime
- Mauvais pour le SEO (Google sait crawler du JS mais c'est moins fiable), gros JS à charger
- **C'est ce que fait le Studio Sanity** parce qu'il s'adresse à des utilisateurs authentifiés, donc le SEO n'a aucune importance

**Pourquoi SSG pour la Livroteca ?**
1. Contenu peu fréquent à mettre à jour (quelques publications par mois) → un rebuild de 30 secondes ne gêne personne
2. Audience : on veut du SEO maximum (Google), du chargement instantané au Brésil sur mobile parfois faible
3. Hébergement gratuit sur CF Pages (jusqu'à des limites énormes)
4. Si Kcal publie un article dans Sanity, un **webhook** rebuild automatique → contenu à jour dans la minute

### File-based routing

Dans Astro, **chaque fichier dans `src/pages/` correspond à une URL**. C'est une convention simple :

```
src/pages/
  index.astro              → /
  a-livroteca.astro        → /a-livroteca
  doar.astro               → /doar
  as-atividades/
    index.astro            → /as-atividades
    [slug].astro           → /as-atividades/:slug (dynamique)
  en/
    index.astro            → /en
    a-livroteca.astro      → /en/a-livroteca
    ...
```

Les crochets `[slug].astro` indiquent une **route dynamique** : un seul fichier qui gère toutes les URLs correspondant au pattern. Le slug est récupéré via `Astro.params.slug`.

Pour les routes dynamiques en SSG, Astro doit savoir **à l'avance** quels slugs existent (pour générer un fichier HTML par slug). On le fait via `getStaticPaths` :

[apps/site/src/pages/as-atividades/\[slug\].astro:6-9](../apps/site/src/pages/as-atividades/[slug].astro#L6-L9) :
```ts
export async function getStaticPaths() {
  const artigos = await getAllArtigos();
  return artigos.map((a) => ({ params: { slug: a.slug } }));
}
```

Au build, Astro appelle cette fonction, récupère la liste des artigos depuis Sanity, et génère un fichier HTML pour chaque (`/as-atividades/toto/index.html`, etc.).

### Anatomie d'un fichier `.astro`

Un fichier `.astro` est composé de deux parties séparées par un triple tiret `---` :

```astro
---
// FRONTMATTER — code TypeScript qui tourne au build (server-side)
import Layout from "../layouts/Layout.astro";
const titre = "Bonjour";
const articles = await fetch("...").then(r => r.json());
---

<!-- TEMPLATE — HTML avec interpolation et composants -->
<Layout>
  <h1>{titre}</h1>
  <ul>
    {articles.map(a => <li>{a.title}</li>)}
  </ul>
</Layout>
```

**Le frontmatter (au-dessus de `---`)** :
- Exécuté **au build**, sur le serveur Node — jamais dans le navigateur
- Peut faire du `await` (fetch API, queries DB, etc.)
- Variables déclarées sont disponibles dans le template via `{ }`

**Le template (en dessous)** :
- Du JSX-like (mais ce n'est PAS du React)
- `{expression}` pour interpoler
- `{array.map(...)}` pour des listes
- `{condition && <Foo />}` pour du conditionnel
- Tu peux utiliser n'importe quel composant `.astro` importé

C'est très proche de Svelte ou de Vue SFC, mais sans réactivité (puisque c'est du SSG, le HTML est figé après build).

### Layouts et composants

Un **layout** est un composant `.astro` réutilisable qui définit la structure générale (header, footer, meta tags). Les pages s'enveloppent dans le layout via `<slot />`.

[apps/site/src/layouts/Layout.astro](../apps/site/src/layouts/Layout.astro) — notre layout principal :
```astro
---
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";

interface Props {
  title?: string;
  // ...
}
const { title } = Astro.props;
---

<!doctype html>
<html>
  <head>
    <title>{title}</title>
    <!-- meta tags... -->
  </head>
  <body>
    <Header />
    <main>
      <slot />     <!-- Le contenu de la page est injecté ici -->
    </main>
    <Footer />
  </body>
</html>
```

Une page l'utilise comme ça :
```astro
---
import Layout from "../layouts/Layout.astro";
---
<Layout title="Doar">
  <h1>Donation page content</h1>
</Layout>
```

**Composants** : pareil que les layouts mais sans `<slot />` (ou avec, c'est libre). Voir [apps/site/src/components/](../apps/site/src/components/) — `Header.astro`, `Footer.astro`, `Calendario.astro`, etc.

### View Transitions et `ClientRouter`

Par défaut, quand tu cliques sur un lien dans un site SSG, le navigateur fait un **rechargement complet** : il décharge la page, charge la nouvelle, rejoue tous les scripts. Le header flashe, le scroll saute en haut, etc.

Astro propose `<ClientRouter />` (anciennement `<ViewTransitions />`) — un mini-router JS qui intercepte les clics sur les liens internes et fait un **swap partiel du DOM** sans rechargement complet, en utilisant l'API native [View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API). Résultat : transitions douces type SPA.

[Layout.astro:159](../apps/site/src/layouts/Layout.astro#L159) :
```astro
<ClientRouter />
```

**Le piège** : par défaut, à chaque navigation, Astro reconstruit tout le DOM, y compris le header et le footer. Du coup ils "flashent" même avec View Transitions. Pour les figer, on utilise `transition:persist` sur les éléments à conserver :

[Header.astro](../apps/site/src/components/Header.astro) et [Footer.astro](../apps/site/src/components/Footer.astro) utilisent cette directive :
```astro
<header transition:persist="header">
  ...
</header>
```

Le `"header"` est un identifiant unique. Astro retrouve l'élément persisté entre les navigations et le réutilise tel quel.

**L'autre piège** : si tu changes de locale (PT → EN), les éléments persistés gardent leur ancien contenu (puisqu'ils ne sont pas re-rendus). Solution : sur le switcher de langue, on ajoute `data-astro-reload` qui force un vrai reload pour ce lien spécifique. Voir [Header.astro](../apps/site/src/components/Header.astro).

### Slots et slots nommés

Le `<slot />` injecte le contenu enfant. On peut avoir plusieurs slots avec des noms :

```astro
---
// Card.astro
---
<div class="card">
  <div class="card__title"><slot name="title" /></div>
  <div class="card__body"><slot /></div>
</div>
```

Utilisation :
```astro
<Card>
  <span slot="title">Mon titre</span>
  <p>Mon contenu</p>
</Card>
```

Dans notre projet on utilise surtout le slot par défaut, pas les nommés.

### Variables d'environnement Astro

Astro distingue **deux types** de variables d'env :

**1. Variables serveur** (`SANITY_PROJECT_ID`, `SANITY_API_VERSION`...)
- Disponibles uniquement dans le frontmatter (côté build)
- Accédées via `import.meta.env.SANITY_PROJECT_ID`
- Jamais incluses dans le bundle client

**2. Variables publiques** (`PUBLIC_*`)
- Disponibles à la fois dans le frontmatter et dans les `<script>` côté client
- Doivent être préfixées `PUBLIC_` pour qu'Astro accepte de les exposer
- **À utiliser uniquement pour des données non sensibles** — la valeur sera dans le HTML/JS public

Notre cas :
- `SANITY_PROJECT_ID` (publique en pratique mais on la traite comme serveur car les fetchs sont au build)
- `PUBLIC_CF_ANALYTICS_TOKEN` — exposée au client pour le snippet CF Analytics
- `PUBLIC_TURNSTILE_SITE_KEY` — exposée au client pour le widget Turnstile

Le **typage** se fait dans [apps/site/src/env.d.ts](../apps/site/src/env.d.ts) :
```ts
interface ImportMetaEnv {
  readonly SANITY_PROJECT_ID: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}
```

**Piège classique** : si tu mets une clé secrète (Resend API key, etc.) avec le préfixe `PUBLIC_`, elle se retrouve **dans le code source du site** côté navigateur. Tout le monde peut la voir. Ne JAMAIS faire ça.

### Astro vs Next.js / Nuxt / Gatsby

| | Astro | Next.js | Gatsby |
|---|---|---|---|
| Modèle par défaut | SSG, zéro JS client | SSR + ISR, React partout | SSG, React partout |
| Framework UI requis | Non (`.astro` vanilla) | React | React |
| Vendor lock-in | Faible | Modéré (Vercel optimal) | Modéré |
| Performance défaut | Excellente | Bonne, dépend usage | Bonne, déclin récent |
| Pour notre cas | ✅ parfait | overkill | abandonware en 2026 |

Le choix d'Astro pour la Livroteca tient sur : performance par défaut excellente, pas d'overkill React si on en a pas besoin, et un build/deploy ultra simples.

### Pour aller plus loin

- Doc officielle : https://docs.astro.build
- File-based routing : https://docs.astro.build/en/basics/astro-pages/
- View Transitions : https://docs.astro.build/en/guides/view-transitions/
- Env vars : https://docs.astro.build/en/guides/environment-variables/

---

## 3. TypeScript dans le projet

### C'est quoi TypeScript

TypeScript (TS) est un **sur-ensemble de JavaScript** qui ajoute un système de types. Tu écris du JS avec des annotations de type, et un compilateur (le compilateur TypeScript, `tsc`) vérifie que tu n'as pas de bug évident avant même de lancer le code.

```ts
// JS — pas d'erreur au lint, plante en prod
function greet(name) {
  return "Bonjour " + name.toUpperCase();
}
greet(42); // ❌ TypeError: name.toUpperCase is not a function

// TS — erreur attrapée à l'écriture
function greet(name: string) {
  return "Bonjour " + name.toUpperCase();
}
greet(42); // ❌ Argument of type 'number' is not assignable to parameter of type 'string'
```

Au build, le TypeScript est compilé en JavaScript pur (les types disparaissent). Le navigateur ne voit jamais de TS.

### Pourquoi TS dans ce projet

Trois raisons concrètes :

1. **Sanity → Astro typage** — quand on fetch un `Artigo` depuis Sanity, on déclare son interface (voir [apps/site/src/lib/content.ts:12](../apps/site/src/lib/content.ts#L12)). Du coup partout où on manipule un artigo, l'éditeur autocomplète les champs et te crie dessus si tu écris `artigo.titel` au lieu de `artigo.title`.

2. **i18n strings** — les fichiers JSON sont importés en TS, donc l'éditeur connaît la structure exacte. Si tu utilises `t.voluntariar_form.title` mais que la clé n'existe pas dans `pt-BR.json`, erreur à la compilation.

3. **Astro nativement TS** — `Astro.props` typés via une `interface Props { ... }` dans chaque composant, tout le code Astro/Sanity SDK est en TS, donc on a tout pour pas cher.

### Setup dans notre projet

- [apps/site/tsconfig.json](../apps/site/tsconfig.json) — config TS pour le site, étend la config recommandée d'Astro
- Astro lance le compilateur TS automatiquement au build
- VS Code (avec l'extension Astro) interprète les `.astro` et donne l'autocomplete dans le frontmatter

### Concepts TS utilisés dans le code

**Interfaces** ([content.ts:12-31](../apps/site/src/lib/content.ts#L12-L31)) :
```ts
export interface Artigo {
  _id: string;
  type: "artigo" | "evento";    // union literal — soit "artigo" soit "evento"
  slug: string;
  title: LocalizedString;
  date: string;
  cover?: SanityImageRef;        // ? = optionnel
  // ...
}
```

**Types union** :
```ts
export type Locale = "pt-BR" | "en";   // une valeur peut être l'un ou l'autre
```

**Generics** ([sanity.ts](../apps/site/src/lib/sanity.ts)) :
```ts
sanity.fetch<Artigo[]>(query)   // sanity.fetch retourne un Promise<Artigo[]>
```

**Type guards** ([content.ts:141-145](../apps/site/src/lib/content.ts#L141-L145)) :
```ts
export function hasTranslation(a: Artigo, locale: Locale): boolean {
  if (locale === "pt-BR") return true;
  // ...
}
```

**Const assertion** :
```ts
const locale = "pt-BR" as const;   // type = "pt-BR" (littéral), pas string
```

### Pièges TS classiques

- **`any` est un piège** : si tu mets `any`, TS abandonne et accepte tout. Notre code en a quelques-uns nécessaires (Portable Text de Sanity → typage compliqué), mais à éviter autant que possible.
- **Optional chaining `?.`** vs **non-null assertion `!`** : `a?.b` retourne `undefined` si `a` est null ; `a!.b` dit à TS "fais-moi confiance, a n'est jamais null" — à utiliser avec extrême parcimonie.
- **Types vs valeurs** : `type Locale = "pt-BR" | "en"` n'existe qu'au compile time. Si tu veux la liste à runtime : `const LOCALES = ["pt-BR", "en"] as const`.

### Pour aller plus loin

- Doc officielle : https://www.typescriptlang.org/docs/
- Le "TypeScript for JavaScript Programmers" guide : https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html

---

## 4. Sanity — le CMS

### C'est quoi un "headless CMS"

Un **CMS** (Content Management System) est un outil pour gérer du contenu (articles, pages, médias). Les CMS traditionnels (WordPress, Drupal, Joomla) sont **monolithiques** : ils gèrent à la fois le stockage du contenu **et** le rendu HTML.

Un **headless CMS** sépare strictement les deux :
- Le CMS stocke le contenu et fournit une API (REST ou GraphQL)
- Le frontend (Astro, Next, app mobile, etc.) consomme cette API et affiche comme il veut

**Avantages :**
- Le même contenu peut alimenter un site Astro, une app iOS, un newsletter, etc.
- Le frontend peut utiliser la stack qu'il veut (pas obligé d'être en PHP comme WordPress)
- Performance : on peut générer du HTML statique (SSG) à partir de l'API, sans serveur PHP/Node au runtime

**Inconvénients :**
- Plus de code à écrire (faut faire le frontend séparément)
- Moins de plugins "tout faits"

### Pourquoi Sanity plutôt que Decap / Contentful / Strapi

| | Sanity | Decap CMS (ex-Netlify CMS) | Contentful | Strapi |
|---|---|---|---|---|
| Modèle | Hébergé (cloud) | Auto-hébergé (Git-based) | Hébergé | Auto-hébergé ou hébergé |
| Édition | Studio React très ergonomique | Markdown édité dans Git | Bonne UI mais lourde | Correct |
| Authentification | Compte Sanity (Google, email) | Compte GitHub requis | Compte Contentful | À configurer |
| i18n natif | Oui (via objets localisés) | Limité | Oui mais cher | Plugin |
| Free tier | Généreux (3 users, 10k docs, 100GB CDN) | Gratuit (Git) | Cher | Auto-hébergé gratuit |
| Tu héberges quoi | Le Studio (frontend admin) | Tout | Rien (SaaS) | Tout |

**Pour la Livroteca, on a choisi Sanity** principalement parce que :
1. **Pas de compte GitHub à imposer à Kcal** — il a juste un email/Google login. Avec Decap, il aurait fallu lui créer un compte GitHub et l'inviter dans l'org, ce qui est une friction inutile.
2. **L'éditeur Studio est très ergonomique** — preview, drag & drop d'images, undo, real-time collab.
3. **i18n natif via objets localisés** (voir section 6).
4. **Free tier confortable** pour notre usage (3 users gratuit, qu'on n'aura jamais à dépasser).

### Project ID, dataset, schemas

Sanity organise les données par **projet** (analogue à une base de données). Notre projet :
- Project ID : `hxzxnh1c` (alphanumérique, généré à la création)
- Dataset : `production` (un projet peut avoir plusieurs datasets, ex. `production` + `staging`)

Dans le projet, tu définis des **schemas** : la structure des documents. Chaque schema décrit un type de document avec ses champs.

[apps/studio/schemas/](../apps/studio/schemas/) contient nos schemas :
- `artigo.ts` — articles et événements (un même type, distingués par le champ `type: "artigo" | "evento"`)
- `pessoa.ts` — personnes (Kcal, volontaires)
- `paginaInstitucional.ts` — pages statiques éditables (`a-livroteca`, etc.)
- `episodioPodcast.ts` — épisodes de "A Voz da Lama"
- `documentoTransparencia.ts` — PDFs de transparence
- `configSite.ts` — config globale (titres, contacts, sociaux) — singleton

Et des **objets** (réutilisables comme building blocks) :
- `localizedString.ts` — `{ pt: string, en: string }`
- `localizedText.ts` — pareil mais text area
- `localizedPortableText.ts` — contenu riche bilingue

### GROQ — le langage de query

Sanity a son propre langage de query : **GROQ** (Graph-Relational Object Queries). Inspiré de GraphQL mais plus concis et plus puissant pour les relations.

Exemple de query basique (depuis [apps/site/src/lib/content.ts](../apps/site/src/lib/content.ts)) :
```ts
sanity.fetch(`*[_type == "artigo"] | order(date desc){
  _id,
  type,
  "slug": slug.current,
  title,
  date,
  cover,
  excerpt,
  body,
  tags,
  event,
  "authors": authors[]->{_id, name, role}
}`)
```

**Décomposition** :
- `*[_type == "artigo"]` — "tous les documents dont `_type` est `artigo`"
- `| order(date desc)` — pipe vers un tri descendant sur `date`
- `{ _id, type, ... }` — projection : on ne récupère que ces champs
- `"slug": slug.current` — rename : `slug.current` (string) → `slug`
- `authors[]->{...}` — déréférence : suit les pointeurs vers les documents `pessoa`, puis projette

GROQ est puissant : tu peux faire des jointures, filtrages, agrégations, le tout dans une string compacte. Doc complète : https://www.sanity.io/docs/groq

### Le Studio — l'app d'édition

Le **Studio Sanity** est l'interface où Kcal/volontaires créent et éditent les documents. C'est une SPA React, que tu peux héberger n'importe où — c'est ton code à toi.

Le code du Studio est dans [apps/studio/](../apps/studio/) :
- `sanity.config.ts` — config du Studio (theme, plugins, project ID)
- `schemas/` — les types de documents (les mêmes que Sanity utilise côté serveur)
- `dist/` (après build) — fichiers statiques à servir

On l'héberge sur CF Pages à `studio.livrotecabrincantedopina.org`.

**Workflow d'édition :**
1. Kcal ouvre `studio.livrotecabrincantedopina.org`, login Google
2. Il édite un `artigo` ou crée un nouveau
3. Au moment du "Publish", Sanity stocke côté serveur
4. Sanity envoie un **webhook** à CF Pages → rebuild auto du site
5. ~30s plus tard, le nouvel article est visible sur livrotecabrincantedopina.org

### Localized strings — le pattern d'i18n Sanity

Sanity ne force aucun pattern d'i18n. Plusieurs approches existent :
1. **Documents séparés par locale** (`artigo` + `artigo-en`) — duplique tout, dur à maintenir
2. **Champs localisés** : un seul document, mais chaque champ traduit est un objet `{ pt, en }`
3. **Plugin officiel `@sanity/document-internationalization`** — plus avancé, ajoute UI

On a choisi l'approche 2 (champs localisés) parce que simple et qu'on n'a que 2 langues. Schema custom dans [apps/studio/schemas/localizedString.ts](../apps/studio/schemas/localizedString.ts) :

```ts
export default {
  name: "localizedString",
  type: "object",
  fields: [
    { name: "pt", type: "string", title: "Português" },
    { name: "en", type: "string", title: "English" },
  ],
};
```

Dans le Studio, l'éditeur voit deux champs côte à côte. Côté frontend, on choisit la langue à afficher :

[apps/site/src/lib/content.ts:126-128](../apps/site/src/lib/content.ts#L126-L128) :
```ts
export function titleFor(a: { title?: LocalizedString }, locale: Locale = "pt-BR"): string {
  const s = shortLocale(locale);
  return a.title?.[s] ?? a.title?.pt ?? "(sem título)";
}
```

Fallback : si pas de traduction EN, on prend le PT.

### Portable Text

Pour les contenus riches (paragraphes, titres, listes, images inline, etc.), Sanity utilise **Portable Text** — un format JSON structuré, à l'opposé du Markdown ou de l'HTML.

Pourquoi pas du HTML stocké directement ? Parce que :
- C'est portable : tu peux le rendre en HTML, en PDF, en Markdown, en plain text
- C'est typé : tu peux ajouter des "marks" custom (mise en valeur d'une citation, etc.)
- C'est diffable : merger deux versions d'un même document est plus facile

Pour le rendre en HTML, on utilise [@portabletext/to-html](https://github.com/portabletext/to-html-react) :

[apps/site/src/lib/content.ts:108-111](../apps/site/src/lib/content.ts#L108-L111) :
```ts
export function portableTextToHtml(blocks: any[] | undefined): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
  return toHTML(blocks, { components: portableTextComponents });
}
```

On peut customiser le rendu de chaque type de bloc. Exemple : pour les images, on génère une `<figure>` avec une URL optimisée :

[content.ts:97-106](../apps/site/src/lib/content.ts#L97-L106) :
```ts
const portableTextComponents: Partial<PortableTextHtmlComponents> = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) return "";
      const url = urlFor(value).width(1200).fit("max").auto("format").url();
      const alt = value.alt ?? "";
      return `<figure><img src="${url}" alt="${escapeHtml(alt)}" loading="lazy" /></figure>`;
    },
  },
};
```

### Image URL builder

Les images uploadées dans Sanity sont stockées sur leur CDN avec un `_ref` interne (ex. `image-abc123-1200x800-jpg`). Pour générer une URL utilisable, on passe par `@sanity/image-url` :

```ts
urlFor(image).width(1200).fit("crop").auto("format").url()
```

Avantages :
- Resize automatique côté CDN (pas besoin de pré-générer)
- `auto("format")` → WebP/AVIF servi automatiquement si le navigateur le supporte
- Compression intelligente

C'est notre version du "image optimization" qu'on aurait dû coder soi-même.

### Webhooks Sanity

Un **webhook** est une URL que Sanity appelle automatiquement quand un événement se produit. Notre cas :

- **Événement** : `Publish` sur n'importe quel document
- **URL** : un "deploy hook" CF Pages (URL unique générée par CF, qui déclenche un nouveau build)
- **Configuration** : dans le Sanity dashboard → API → Webhooks

Workflow :
```
Kcal clique "Publish"
  ↓
Sanity sauve le doc
  ↓
Sanity POST sur le deploy hook CF
  ↓
CF Pages déclenche un build
  ↓
Build fetch les artigos via GROQ
  ↓
HTML statique généré
  ↓
Deploy CDN
  ↓
~30s plus tard, visible en prod
```

### CORS et le Studio

Le Studio doit pouvoir parler à l'API Sanity depuis le navigateur. Comme c'est une page web qui appelle un autre domaine (`api.sanity.io`), c'est soumis au **CORS** (Cross-Origin Resource Sharing).

CORS = le navigateur bloque par défaut les requêtes vers un autre domaine, sauf si le serveur cible (Sanity) répond avec un header `Access-Control-Allow-Origin: <domain>`.

Pour autoriser notre Studio, on configure dans Sanity dashboard → API → CORS origins :
- `http://localhost:3333` (dev local)
- `https://livroteca-studio.pages.dev` (URL CF Pages)
- `https://studio.livrotecabrincantedopina.org` (custom domain)

Avec "Allow credentials" coché pour l'auth.

### Pour aller plus loin

- Doc officielle : https://www.sanity.io/docs
- GROQ tutorial : https://www.sanity.io/docs/groq-cheat-sheet
- Portable Text : https://github.com/portabletext/portabletext

---

## 5. CSS et design system

### CSS vanilla vs framework

Trois grandes options pour styler un site moderne :

1. **CSS vanilla** — du `.css` standard, tu écris à la main
2. **Préprocesseurs** (Sass, Less) — extensions du CSS qui ajoutent variables, nesting, mixins
3. **Frameworks utility-first** (Tailwind, Bootstrap) — classes pré-définies (`p-4`, `text-red-500`)

**Notre choix : CSS vanilla.** Pourquoi ?

- **CSS moderne couvre déjà 90% des besoins** : custom properties (variables), `:has()`, container queries, `clamp()`, nesting natif arrive
- **Pas de build step CSS** — Astro lit le CSS direct, zéro setup
- **Plus simple à apprendre/maintenir** pour Kcal/volontaires futurs
- **Bundle plus petit** — Tailwind purge mais ajoute quand même quelques KB de classes utilitaires

L'inconvénient : faut écrire les styles soi-même (pas de classes pré-faites). Pour un projet à scope défini comme la Livroteca, c'est acceptable.

### Design tokens (CSS custom properties)

Les **design tokens** sont des variables nommées qui contiennent les "valeurs primitives" du design : couleurs, espacements, typos, ombres, etc. On les déclare en CSS via `--nom-de-variable` et on les réutilise partout.

[apps/site/src/styles/global.css](../apps/site/src/styles/global.css) déclare tous nos tokens :

```css
:root {
  /* Couleurs Pernambuco */
  --cor-papel: #faf7f0;
  --cor-tinta: #1a1a1a;
  --cor-vermelho: #c03e2d;
  --cor-amarelo: #ebc926;
  --cor-verde: #4a7c3a;
  /* ... */

  /* Espacements (échelle 4px) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  /* ... */

  /* Typo */
  --font-display: "Anton", sans-serif;
  --font-corpo: "Inter", system-ui, sans-serif;
  --font-manuscrit: "Caveat", cursive;

  /* Bordures, ombres, rayons */
  --borda-fina: 1px solid var(--cor-tinta);
  --borda-grossa: 3px solid var(--cor-tinta);
  --sombra-bloco-md: 4px 4px 0 var(--cor-tinta);
  --radius-sm: 4px;
}
```

Et on s'en sert partout :
```css
.hero {
  padding: var(--space-8);
  background: var(--cor-papel);
  color: var(--cor-tinta);
}
```

**Avantages :**
- Cohérence — tu utilises 10 nuances de gris bien définies au lieu d'inventer une nouvelle à chaque fichier
- Maintenabilité — changer une couleur principale = 1 ligne à modifier
- Theming — on pourrait basculer en dark mode en redéfinissant les tokens dans `@media (prefers-color-scheme: dark)`
- Variantes — on a expérimenté plusieurs "variantes d'élévation" (`riso`, `serial`, etc.) en redéfinissant certains tokens dans `body[data-variant="riso"] { ... }`

### Le système de variantes (Riso)

Pendant l'itération design, on a testé plusieurs façons de donner du caractère visuel via les ombres et bordures. La variante retenue s'appelle **Riso** (référence à l'impression Risograph — couleurs vibrantes, double-impression légèrement décalée).

Dans le CSS, on bascule l'apparence via un attribut `data-variant` sur le `<body>` :

```css
body[data-variant="riso"] .stat-card {
  box-shadow:
    4px 4px 0 var(--cor-amarelo),
    -3px -3px 0 var(--cor-vermelho);
}
```

Le double `box-shadow` crée l'effet Riso (ombre jaune à droite, ombre rouge à gauche, déplacées de quelques pixels — comme une impression mal alignée).

### Conventions de naming

On suit un naming **BEM-like** (Block Element Modifier) :
- `block` — composant indépendant (`.hero`, `.card`, `.vol-form`)
- `block__element` — partie du composant (`.hero__title`, `.card__body`)
- `block--modifier` — variante (`.btn--primario`, `.btn--secundario`)

Avantages : pas de conflit de classes, structure visible directement dans le HTML.

### `@fontsource` — self-hosting des fonts

Les fonts (Anton, Inter, Caveat) viennent originellement de Google Fonts. Deux façons de les utiliser :

1. **Google Fonts CDN** :
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet">
   ```
   - Avantage : zéro setup
   - Inconvénients : appel réseau externe, pas de privacy (Google trace les visites), FOUT (Flash Of Unstyled Text) au load

2. **Self-host** via `@fontsource` :
   ```bash
   pnpm add @fontsource/anton @fontsource/inter @fontsource/caveat
   ```
   Et dans le code :
   ```ts
   import "@fontsource/anton/400.css";
   ```
   - Les fichiers `.woff2` sont bundlés dans notre dist et servis par notre CDN
   - Pas de fuite vers Google, latence minimale, pas de RGPD à craindre

On a choisi le 2 — voir [Layout.astro:2-8](../apps/site/src/layouts/Layout.astro#L2-L8).

**Le piège** : pnpm a un système strict de résolution des modules — si tes fonts vivent dans `node_modules/@fontsource/...` à la racine du monorepo, Astro/Vite peut ne pas pouvoir y accéder par défaut (Vite a un `fs.allow` qui restreint les chemins). On a fix ça dans [astro.config.mjs](../apps/site/astro.config.mjs) :
```js
vite: {
  server: {
    fs: { allow: ["../.."] }
  }
}
```

### Web Components (`dotlottie-wc`)

Un **Web Component** est un élément HTML personnalisé, défini par du JS, qui se comporte comme une balise native. Tu écris `<mon-element prop="x">...</mon-element>` et le navigateur appelle ton code.

Pour le bouton "A Voz da Lama" (le podcast en bas à gauche), on utilise [dotlottie-wc](https://github.com/LottieFiles/dotlottie-web) — un Web Component qui rend une animation Lottie depuis un fichier `.lottie`.

[apps/site/src/components/PodcastPlayer.astro](../apps/site/src/components/PodcastPlayer.astro) :
```html
<dotlottie-wc src="/lottie/speakers.lottie" autoplay loop></dotlottie-wc>
```

Le script qui définit le custom element est chargé une fois au Layout :
```html
<script
  src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.6.2/dist/dotlottie-wc.js"
  type="module" is:inline></script>
```

**Avantages des Web Components** :
- Encapsulation native, pas besoin de framework
- Tu peux les utiliser n'importe où (HTML statique, React, Vue, Svelte, Astro...)
- Pour des widgets isolés comme un player Lottie, c'est parfait

### Pour aller plus loin

- CSS custom properties : https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- BEM : https://getbem.com/
- Fontsource : https://fontsource.org/
- Web Components : https://developer.mozilla.org/en-US/docs/Web/API/Web_components

---

## 6. i18n — internationalisation

### Le problème

Le site Livroteca est en **portugais brésilien par défaut** mais doit aussi exister en **anglais**. Ça implique plusieurs choses :

1. Chaque page doit avoir une version traduite
2. Le contenu Sanity (articles, pages, etc.) doit pouvoir être traduit
3. Les strings d'UI (boutons, navigation, footer) doivent être traduits
4. Les URLs doivent refléter la langue (`/` pour PT, `/en/...` pour EN)
5. Google doit comprendre la relation entre les versions (hreflang)
6. Le visiteur doit pouvoir switcher facilement

On gère ça avec **deux mécanismes complémentaires** :
- **Astro i18n natif** pour les URLs, le routing et les strings d'UI
- **Champs localisés Sanity** pour le contenu éditorial

### Astro i18n natif

Configuration dans [apps/site/astro.config.mjs](../apps/site/astro.config.mjs) :
```js
i18n: {
  defaultLocale: "pt-BR",
  locales: ["pt-BR", "en"],
  routing: { prefixDefaultLocale: false },
},
```

**Explications** :
- `defaultLocale: "pt-BR"` — PT est la langue par défaut
- `locales: ["pt-BR", "en"]` — deux langues supportées
- `prefixDefaultLocale: false` — la langue par défaut ne prend pas de préfixe (`/` au lieu de `/pt-BR/`)

Résultat des URLs :
- PT : `/`, `/a-livroteca`, `/as-atividades/toto/`
- EN : `/en/`, `/en/a-livroteca`, `/en/as-atividades/toto/`

### Mirroring complet vs traduction dynamique

Deux approches possibles pour gérer deux versions linguistiques :

**Approche A : Mirroring complet**
Tu as deux arborescences de pages (`src/pages/index.astro` + `src/pages/en/index.astro`). Chaque page existe physiquement dans les deux langues. **C'est notre choix.**

Avantages :
- Contenu de page très différent possible (on peut adapter le ton, l'ordre des sections)
- Build statique impeccable, SEO parfait
- Chaque langue a son propre routing fiable

Inconvénients :
- Duplication du markup (mais réduite par les composants partagés)
- Sync à maintenir entre les deux

**Approche B : Page unique avec switch dynamique**
Tu as un seul fichier `index.astro` qui détecte la locale et affiche le bon contenu via des conditions.

Avantages :
- Pas de duplication
Inconvénients :
- Tout devient une grosse conditionnelle
- Difficile à maintenir quand le contenu diverge

Pour un site marketing/contenu, l'approche A est plus claire à long terme.

### Strings UI en JSON

Pour les strings communes (boutons, nav, footer, calendrier...), on a des fichiers JSON par locale :

[apps/site/src/i18n/pt-BR.json](../apps/site/src/i18n/pt-BR.json) :
```json
{
  "nav": {
    "home": "Home",
    "livroteca": "A Livroteca",
    ...
  },
  "footer": {
    "where_title": "Onde encontrar",
    ...
  }
}
```

Et [en.json](../apps/site/src/i18n/en.json) avec la même structure :
```json
{
  "nav": {
    "home": "Home",
    "livroteca": "About",
    ...
  },
  ...
}
```

Helper pour récupérer les strings dans un composant — [apps/site/src/lib/i18n.ts](../apps/site/src/lib/i18n.ts) :
```ts
export function useTranslations(locale: Locale) {
  return strings[locale] ?? strings["pt-BR"];
}
```

Utilisation dans un composant :
```astro
---
import { useTranslations } from "../lib/i18n";
const t = useTranslations(locale);
---
<a href="/doar">{t.nav.doar}</a>
```

**Pourquoi JSON et pas TS** ? Parce que :
- Plus simple à éditer pour des non-devs (on pourrait imaginer que Kcal modifie une string un jour)
- Outils de traduction (Crowdin, Lokalise) parsent du JSON nativement
- TypeScript infère le type via `import` — on garde l'autocomplete

### Champs localisés Sanity

Côté contenu éditorial (titres d'articles, descriptions, bodies), on a vu en [section 4](#4-sanity--le-cms) le pattern `localizedString` / `localizedText` / `localizedPortableText`.

Le helper `titleFor()`, `excerptFor()`, etc. choisit la bonne langue selon la locale du visiteur, avec fallback PT si pas de traduction.

### Le switcher de langue

[apps/site/src/components/Header.astro](../apps/site/src/components/Header.astro) contient le bouton de switch. Logique :

```astro
---
import { localizePath, type Locale } from "../lib/i18n";
const otherLocale: Locale = locale === "pt-BR" ? "en" : "pt-BR";
const otherPath = localizePath(otherLocale, Astro.url.pathname);
---
<a href={otherPath} data-astro-reload>
  {locale === "pt-BR" ? "EN" : "PT"}
</a>
```

`localizePath()` convertit `/a-livroteca` ↔ `/en/a-livroteca` selon la locale cible.

**Le piège résolu par `data-astro-reload`** : on a vu que `<ClientRouter />` swap le DOM sans rechargement complet. Mais Header et Footer sont `transition:persist` — donc leur contenu (strings UI) ne se met PAS à jour. Si on clique "EN" depuis une page PT, le header montre toujours les strings PT. Solution : `data-astro-reload` force un vrai reload sur ce lien spécifique.

### `hreflang` — pour Google

Quand Google indexe une URL traduite, il faut lui dire "cette page est la version EN de cette autre page". C'est le rôle des balises `<link rel="alternate" hreflang="...">` :

[Layout.astro:111-113](../apps/site/src/layouts/Layout.astro#L111-L113) :
```html
<link rel="alternate" hreflang="pt-BR" href="https://livrotecabrincantedopina.org/a-livroteca/">
<link rel="alternate" hreflang="en" href="https://livrotecabrincantedopina.org/en/a-livroteca/">
<link rel="alternate" hreflang="x-default" href="https://livrotecabrincantedopina.org/a-livroteca/">
```

- `hreflang="pt-BR"` → cette page est en portugais brésilien
- `hreflang="en"` → la version anglaise est ici
- `hreflang="x-default"` → la page à servir si la locale du visiteur n'est pas explicite

Google utilise ces infos pour afficher la bonne langue dans les SERPs (Search Engine Results Pages) selon la localisation du searcher.

### Détection de la locale courante

Dans Astro, on a besoin de savoir quelle locale est active pour la page courante. On regarde le path :

[apps/site/src/lib/i18n.ts:13-16](../apps/site/src/lib/i18n.ts#L13-L16) :
```ts
export function getLocaleFromUrl(url: URL): Locale {
  if (url.pathname === "/en" || url.pathname.startsWith("/en/")) return "en";
  return "pt-BR";
}
```

Et chaque page passe explicitement la locale au Layout :
```astro
<Layout locale="en">
  ...
</Layout>
```

### Pièges classiques d'i18n

- **Concaténer des strings traduites** : `"Bonjour " + name + " !"` casse en allemand où la phrase peut être inversée. Préférer des templates avec placeholders.
- **Dates et nombres** : `toLocaleDateString()` et `Intl.NumberFormat()` formatent selon la locale.
- **Pluralisation** : "1 article" vs "2 articles" — utiliser `Intl.PluralRules`.
- **Fallback** : toujours définir un fallback si la traduction manque (sinon page vide). Notre code fallback systématiquement sur PT.

### Pour aller plus loin

- Astro i18n : https://docs.astro.build/en/recipes/i18n/
- hreflang spec Google : https://developers.google.com/search/docs/specialty/international/localized-versions
- Intl API : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl

---

## 7. Calendrier et événements récurrents

### Le problème

La Livroteca a des événements **récurrents** : Capoeira tous les mercredis à 16h, Cine Bode un samedi sur deux, oficina de grafiti chaque dernier vendredi du mois, etc. Mais aussi des événements **ponctuels** (festas, mutirões). Et il faut pouvoir **annuler une occurrence** sans casser la récurrence.

Coder ça à la main est un cauchemar (calculs de dates, gestion des changements d'heure été/hiver, exceptions...). Heureusement, ce problème a déjà été résolu il y a 30 ans : **iCalendar**.

### iCalendar et RRULE

**iCalendar** (RFC 5545) est le standard universel pour décrire des événements. C'est ce qu'utilisent Google Calendar, Apple Calendar, Outlook, etc. Format texte assez verbeux :

```ics
BEGIN:VEVENT
DTSTART:20260520T160000
DTEND:20260520T173000
SUMMARY:Capoeira
RRULE:FREQ=WEEKLY;BYDAY=WE
EXDATE:20260603T160000
END:VEVENT
```

Le truc important pour nous : **RRULE** (Recurrence Rule). C'est une mini-grammaire qui décrit n'importe quelle récurrence :

- `FREQ=WEEKLY;BYDAY=WE` — tous les mercredis
- `FREQ=MONTHLY;BYDAY=-1FR` — le dernier vendredi de chaque mois
- `FREQ=WEEKLY;INTERVAL=2;BYDAY=SA` — un samedi sur deux
- `FREQ=DAILY;UNTIL=20260630` — tous les jours jusqu'au 30 juin

Et **EXDATE** (Exception Dates) liste les dates à exclure de la récurrence (annulations).

### rrule.js

[rrule.js](https://github.com/jakubroztocil/rrule) est la lib JavaScript de référence pour parser/générer des RRULE.

[apps/site/src/lib/events.ts](../apps/site/src/lib/events.ts) — on l'utilise au build pour expanser les récurrences en occurrences concrètes :

```ts
import { RRule, RRuleSet, rrulestr } from "rrule";

const rule = rrulestr(event.recurrence);  // parse "FREQ=WEEKLY;BYDAY=WE"
const set = new RRuleSet();
set.rrule(rule);
event.exceptions?.forEach(ex => set.exdate(new Date(ex)));

const occurrences = set.between(windowStart, windowEnd);  // [Date, Date, ...]
```

Pour chaque event récurrent dans Sanity, on génère toutes ses occurrences sur une fenêtre temporelle (chez nous : -6 mois / +12 mois autour d'aujourd'hui).

### Fenêtre de génération

On ne peut pas générer "toutes les occurrences depuis le big bang jusqu'à l'an 3000" — ça ferait des millions d'objets. On définit une fenêtre raisonnable :

[apps/site/src/pages/index.astro:11-13](../apps/site/src/pages/index.astro#L11-L13) :
```ts
const windowStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
const windowEnd = new Date(now.getFullYear(), now.getMonth() + 12, 0);
```

→ 6 mois passés + 12 mois futurs = 19 mois affichables dans le calendrier.

**Le piège** : comme c'est généré au build, si on ne rebuild pas, la fenêtre reste figée. Pour Capoeira "tous les mercredis", c'est OK pendant 12 mois. Mais si on attend 18 mois sans rebuild, les derniers 6 mois n'auront plus d'occurrences. **Solution** : on prévoit un cron rebuild hebdomadaire (pas encore implémenté — dans la todo "Polissage").

### SSR pré-rendu vs JS au runtime

Deux façons d'afficher le calendrier :

**Option A : génération côté client en JS**
- Page chargée → le navigateur fait tourner rrule.js → calcule les occurrences → affiche
- Avantage : 100% à jour
- Inconvénient : ~50KB de JS rrule.js à charger, CPU sollicité au load, mauvais pour SEO (Google peut louper le contenu)

**Option B : pré-rendu au build (notre choix)**
- Au build, on appelle rrule.js → on génère 19 mois de HTML → on commit le HTML dans le build
- Le navigateur reçoit du HTML pur, zéro JS pour afficher le calendrier
- Avantage : ultra-rapide, SEO parfait
- Inconvénient : fenêtre figée (cf piège ci-dessus)

[apps/site/src/components/Calendario.astro](../apps/site/src/components/Calendario.astro) pré-rend les 19 mois en HTML. Le JS côté client se contente de **swapper la visibilité** des mois quand l'utilisateur clique ◀▶ :

```html
<!-- Pré-rendu au build : 19 divs, un par mois -->
<div class="mes" data-month="2025-12" style="display: none">...</div>
<div class="mes" data-month="2026-01" style="display: block">...</div>
<div class="mes" data-month="2026-02" style="display: none">...</div>
...
```

Et le JS :
```js
btn.addEventListener('click', () => {
  // hide current month
  document.querySelector('.mes[style*="block"]').style.display = 'none';
  // show next month
  document.querySelector('[data-month="2026-03"]').style.display = 'block';
});
```

Coût total : 19 × ~18KB HTML brut ≈ 340KB. Compressé brotli par CF : ~40KB. Acceptable.

### Annulations vs déplacements

**Version actuelle (V1)** :
- Annulation → champ `event.exceptions: datetime[]` → EXDATE → l'occurrence est silencieusement absente du calendrier
- Suffisant pour : "la session du 3 juin est annulée"

**Pour la V2 (pas implémenté)** :
- Déplacement d'occurrence (ex. "celle du 3 juin est repoussée au 10 juin")
- Modification ponctuelle (ex. "celle du 3 juin est exceptionnellement à la place X")
- Cela demanderait un type `eventOverride` avec un lien vers l'event parent et la date à override

### Pour aller plus loin

- iCalendar RFC 5545 : https://www.rfc-editor.org/rfc/rfc5545
- RRULE generator visuel : https://jakubroztocil.github.io/rrule/
- rrule.js : https://github.com/jakubroztocil/rrule

---

## 8. Cloudflare — la plateforme

### Pourquoi Cloudflare

Cloudflare (CF) est à l'origine un fournisseur de CDN et de protection DDoS. Aujourd'hui ils ont un écosystème de produits "edge" (services qui tournent dans leurs ~300 datacenters mondiaux) :

- **CF Pages** — hébergement de sites statiques + Functions (Workers)
- **CF Workers** — code serverless à l'edge (~equiv. AWS Lambda mais plus rapide)
- **CF R2** — stockage objets (~equiv. S3, sans frais d'egress)
- **CF DNS** — DNS gratuit, plus rapide qu'AWS Route 53
- **CF Registrar** — registrar de noms de domaine au prix coûtant
- **CF Email Routing** — forward d'emails gratuit
- **CF Web Analytics** — analytics privacy-friendly, gratuit, sans cookies
- **CF Turnstile** — anti-bot (vu en section 11)
- **CF Stream** — vidéo streaming
- **CF D1** — base de données SQLite serverless
- **CF KV** — key-value store
- **CF Queues, Durable Objects, Vectorize, Workers AI**...

**Avantages écosystème** :
- Tout au même endroit (un dashboard, une facture, un compte)
- Free tier généreux sur la quasi-totalité des produits
- Edge global → latence ultra-faible partout, y compris au Brésil
- Pas de vendor lock-in extrême (les Workers sont compatibles standards V8)

**Pour la Livroteca**, on utilise déjà : Pages (site + studio), DNS, Registrar (pour `.org`), Redirect Rules (pour `.com.br`), et bientôt Turnstile + Web Analytics + Email Routing. R2 prévu pour les audio podcast et PDFs.

### CF Pages

CF Pages est le service "Vercel-like" de Cloudflare. Tu connectes un repo GitHub, tu définis une commande de build, et CF Pages :
1. Clone ton repo
2. Lance la commande de build dans un runner Docker
3. Récupère le dossier de sortie (ex. `apps/site/dist`)
4. Pousse les fichiers sur leur CDN global
5. Fait pareil pour chaque PR (preview deployments)

**Build settings** pour notre site :
- **Connected repo** : `livroteca/site` (GitHub)
- **Production branch** : `main`
- **Build command** : `pnpm install && pnpm build:site`
- **Build output directory** : `apps/site/dist`
- **Root directory** : (vide, donc racine du repo)
- **Node version** : 22 (via env var `NODE_VERSION=22`)

Au push sur `main`, CF Pages déclenche un nouveau build. Au push sur n'importe quelle branche, il crée un preview deployment à une URL unique (`<sha>.livroteca-site.pages.dev`).

### Env vars CF Pages

Dans le dashboard CF Pages → Settings → Environment variables, tu peux définir :
- **Production** — appliquées sur les builds de la branche prod (`main`)
- **Preview** — appliquées sur les builds des autres branches/PRs

Pour chaque var tu choisis le type :
- **Plaintext** — visible dans le dashboard, OK pour les valeurs publiques
- **Encrypted (Secret)** — chiffrée, jamais ré-affichée, OK pour les clés sensibles

Nos vars actuelles (site) :
- `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION` (plaintext, build time)
- `NODE_VERSION=22` (plaintext, pour choisir Node 22)
- À venir : `PUBLIC_CF_ANALYTICS_TOKEN`, `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (secret), `RESEND_API_KEY` (secret), `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`

**Distinction important** :
- Les `PUBLIC_*` (vues par Astro/Vite) seront **bundlées dans le JS client** — il faut qu'elles soient sûres
- Les autres ne sont disponibles **que côté build** (frontmatter Astro) ou **runtime CF Functions** (le code serveur des `functions/`)

### Custom domains

Pour brancher `livrotecabrincantedopina.org` sur le projet CF Pages `livroteca-site` :

1. Dans CF Pages → projet → Custom domains → "Set up a custom domain"
2. Entre `livrotecabrincantedopina.org` → CF détecte que le domaine est chez son registrar
3. CF crée automatiquement le record CNAME approprié dans le DNS
4. SSL/TLS auto via Let's Encrypt
5. Pareil pour `www.livrotecabrincantedopina.org`

URL Pages d'origine : `livroteca-site.pages.dev` (toujours actif, parallèle au custom domain).

### CF Redirect Rules — notre `.com.br` → `.org`

On a `livrotecabrincantedopina.com.br` (acheté chez Registro.br pour défense de marque) qui doit redirect vers `.org`. Plusieurs façons :

**Option A : page HTML avec meta refresh**
Hosting une page `<meta http-equiv="refresh" content="0; url=...">`. Pas de redirect 301, mauvais SEO.

**Option B : DNS CNAME**
Ne marche pas — un CNAME redirige le DNS, pas l'URL. `foo.com/bar` → `bar.com/bar`, mais l'utilisateur reste sur `foo.com`.

**Option C : Redirect Rules CF (notre choix)**
Dans CF Dashboard → Domain `.com.br` → Rules → Redirect Rules :
- Match : `(http.host eq "livrotecabrincantedopina.com.br")`
- Then : Static Redirect → mais on veut conserver le path
- Solution : **Dynamic Redirect** → `concat("https://livrotecabrincantedopina.org", http.request.uri.path)` → 301

Avec ça, `livrotecabrincantedopina.com.br/a-livroteca` → `livrotecabrincantedopina.org/a-livroteca` en 301 propre, indexé par Google comme tel.

### CF R2 (pas encore utilisé)

CF R2 est un service de stockage compatible API S3 (AWS), mais **sans frais d'egress** (sortie de données). Pour la Livroteca, on prévoit d'y mettre :
- Audio MP3 du podcast "A Voz da Lama"
- PDFs de transparence (statuts, ata, bilan)

Pourquoi pas dans Sanity ? Parce que Sanity facture le CDN après un certain quota (100GB inclus). Pour de gros fichiers (un MP3 = ~50MB), R2 est plus économique. Les URLs R2 vont dans des champs `fileUrl` côté Sanity.

### CF Web Analytics

Analytics gratuit, sans cookies, privacy-friendly. Tu ajoutes un snippet :
```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "XXXXX"}'></script>
```

Et le dashboard CF te montre pageviews, sources, top pages, etc. **Pas d'individual tracking** — pas de fingerprint, pas de profil. Idéal pour la conformité RGPD/LGPD.

Notre intégration : conditionnelle dans [Layout.astro:138-144](../apps/site/src/layouts/Layout.astro#L138-L144) — le snippet ne s'affiche que si `PUBLIC_CF_ANALYTICS_TOKEN` est défini.

### CF Email Routing (pas encore activé)

Service gratuit qui forward des emails reçus sur ton domaine vers une boîte existante. Exemple :
- `contato@livrotecabrincantedopina.org` → forward vers `kcal.gomes.real@gmail.com`

Pas d'inbox CF, juste du forwarding. Idéal pour ne pas avoir à payer un service email (Google Workspace = 6$/mois/user) juste pour avoir une adresse pro.

À activer : CF Dashboard → Email Routing → Get Started, ajouter les records MX et SPF (CF te dit lesquels).

### CF Workers (= moteur des Pages Functions)

CF Workers c'est leur "FaaS" (Functions as a Service). Tu écris du JS/TS qui tourne sur les serveurs edge de CF, déclenché par des requêtes HTTP.

**Différences avec AWS Lambda / Vercel Functions :**
- Runtime V8 isolates (pas un container Node) → cold start ~5ms (vs 100-500ms Lambda)
- ~300 datacenters mondiaux → exécution proche du visiteur (peu importe où il est)
- Restrictions : pas de Node APIs (pas de `fs`, `child_process`...), seulement les Web APIs (fetch, Request, Response, etc.)

Les **Pages Functions** sont des Workers spécifiques à un projet CF Pages, attachés à des routes URL. C'est ce qu'on utilise pour `/api/voluntariar`. Détails en [section 9](#9-cf-pages-functions).

### Pour aller plus loin

- CF Pages : https://developers.cloudflare.com/pages/
- CF Workers : https://developers.cloudflare.com/workers/
- CF R2 : https://developers.cloudflare.com/r2/
- CF Email Routing : https://developers.cloudflare.com/email-routing/

---

## 9. CF Pages Functions

### C'est quoi

Une **CF Pages Function** est une fonction serverless attachée à un projet CF Pages, déclenchée par une URL. Tu écris du code JS/TS dans un fichier, et CF le rend disponible comme endpoint HTTP.

Tu peux ainsi avoir un site statique avec des "endpoints API" sans avoir besoin d'un serveur dédié. On a utilisé ça pour `/api/voluntariar`.

### Routing par fichiers

Comme Astro, les Pages Functions utilisent le **file-based routing** :

```
functions/
  api/
    voluntariar.ts    → POST/GET/etc. sur /api/voluntariar
    hello.ts          → /api/hello
  users/
    [id].ts           → /users/:id (dynamique)
```

Chaque fichier exporte un (ou plusieurs) handlers :
- `onRequestGet` — pour les GET
- `onRequestPost` — pour les POST
- `onRequest` — pour toutes les méthodes

Notre cas, [functions/api/voluntariar.ts:25](../functions/api/voluntariar.ts#L25) :
```ts
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // ...
};
```

`PagesFunction<Env>` est le type fourni par CF pour typer la fonction. Le paramètre `Env` est ton interface qui décrit les env vars attendues.

### Localisation des functions dans le repo

Le dossier `functions/` doit être **à la racine du projet** au sens de CF Pages.

Dans notre setup :
- Le repo est mono-app du point de vue CF (pas de "root directory" custom)
- Le build command tourne à la racine du repo
- → **`functions/` est à la racine du repo** : `/functions/api/voluntariar.ts`

Quand CF Pages build le site, il détecte le dossier `functions/`, compile les fichiers TS en Workers, et les déploie à côté du site statique.

### Workers runtime

Le code dans `functions/` tourne dans un **runtime Workers**, pas Node.js. Les différences importantes :

**Pas disponibles (Node-only)** :
- `fs`, `path`, `child_process`, `crypto` (au sens Node), `Buffer`
- `__dirname`, `require()`
- Modules npm Node-centric (sharp, puppeteer, etc.)

**Disponibles (Web standard)** :
- `fetch`, `Request`, `Response`, `URL`, `URLSearchParams`
- `crypto.subtle` (Web Crypto API)
- `console.log` (logs dans le dashboard CF)
- `setTimeout`, `setInterval` (limités à 30s d'exécution totale)

**Bindings spéciaux CF** (via `env`) :
- Variables d'env (string)
- KV namespaces, R2 buckets, D1 databases, Durable Objects (si tu les bind)

Notre fonction n'utilise que `fetch` (pour appeler Resend et Turnstile siteverify) — pas besoin de bindings exotiques.

### Bindings d'env vars

Les env vars définies dans CF Pages → Settings → Environment variables sont accessibles dans `env` (paramètre du handler) :

[functions/api/voluntariar.ts:1-6](../functions/api/voluntariar.ts#L1-L6) :
```ts
interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}
```

Le handler reçoit `env` typé :
```ts
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.RESEND_API_KEY;  // string typé
  // ...
};
```

**Distinction Astro / CF Functions** :
- Vars Astro : accédées via `import.meta.env.VARNAME` (build time)
- Vars CF Functions : accédées via le param `env` du handler (runtime)
- Les vars `PUBLIC_*` côté Astro sont bundlées dans le JS client. **Les vars CF Functions ne sont jamais exposées au client.**

### Lifecycle d'une requête

```
Visiteur POST sur https://livrotecabrincantedopina.org/api/voluntariar
                            ↓
CF Edge intercepte la requête
                            ↓
Routing — c'est /api/voluntariar → voluntariar.ts
                            ↓
Worker isolate démarre (~5ms cold start, 0ms warm)
                            ↓
Handler onRequestPost exécute :
  - request.json() → body parsé
  - validation
  - fetch Turnstile siteverify
  - fetch Resend /emails
  - return Response JSON
                            ↓
CF renvoie la Response au visiteur
                            ↓
Worker isolate "dort" jusqu'à la prochaine requête
```

Latence typique : 50-150ms total (incluant les deux fetch externes). Cold start nul si la function a déjà été appelée récemment.

### Limites du free tier

- **100k requêtes/jour** par projet (largement suffisant pour la Livroteca)
- **10ms CPU time max** par requête (notre cas : ~5ms, OK)
- **30s wall clock max** par requête
- **128MB mémoire**
- **1MB de code bundle** par fonction

### Alternatives qu'on aurait pu prendre

| | CF Pages Functions | Vercel Edge Functions | Netlify Functions | Cloudflare Workers (standalone) |
|---|---|---|---|---|
| Couplage site | Couplé au projet Pages | Couplé au projet Vercel | Couplé au projet Netlify | Indépendant |
| Routing | File-based dans `functions/` | File-based dans `api/` | File-based dans `netlify/functions/` | Manuel |
| Setup | Zéro (auto-détecté) | Zéro | Zéro | Wrangler config |
| Runtime | V8 isolates | V8 isolates | Node lambda | V8 isolates |

Pour notre cas (un endpoint simple attaché à un site CF Pages), Pages Functions est le path of least resistance.

### Tester localement

`astro dev` ne lance pas les Pages Functions. Pour tester en local :
```bash
pnpm build:site
npx wrangler pages dev apps/site/dist --compatibility-date=2025-01-01
```

Wrangler est l'outil CLI Cloudflare. Il lance un serveur local qui mime CF Pages, y compris les Functions.

En pratique, on teste plutôt sur les **preview deployments** : chaque PR crée une URL `<sha>.livroteca-site.pages.dev` avec les Functions actives.

### Pour aller plus loin

- CF Pages Functions : https://developers.cloudflare.com/pages/functions/
- Workers runtime APIs : https://developers.cloudflare.com/workers/runtime-apis/

---

## 10. SEO

### Qu'est-ce que le SEO et pourquoi ça compte ici

**SEO** = Search Engine Optimization. L'ensemble des techniques pour que ton site soit bien indexé et bien classé sur Google (et Bing, Brave Search, etc.).

Pour la Livroteca, les enjeux :
- Quelqu'un cherche "biblioteca comunitária Pina Recife" → on veut sortir en premier
- Quelqu'un partage l'URL sur Facebook/WhatsApp/X → on veut une card visuelle riche
- Bots Google → on veut leur faciliter le crawl

Le SEO se découpe en plusieurs couches : **technique** (ce qu'on a fait), **contenu** (qualité éditoriale, mots-clés), **backlinks** (qui pointe vers toi). On s'occupe ici de la couche technique.

### Meta tags fondamentaux

Trois balises à savoir d'abord :

**`<title>`** — texte affiché dans l'onglet du navigateur et comme titre cliquable dans les SERPs. Doit être unique par page, ~50-60 caractères max.

**`<meta name="description">`** — résumé court de la page, affiché sous le titre dans les SERPs. ~150-160 caractères max. Google peut l'ignorer et générer le sien depuis le contenu, mais c'est rare quand la description est bonne.

**`<meta name="viewport">`** — pour le responsive mobile. Sans ça, le mobile zoome out comme si c'était un site desktop des années 2000.

Notre [Layout.astro:107-110](../apps/site/src/layouts/Layout.astro#L107-L110) les pose tous trois.

### Open Graph

**Open Graph (OG)** est un protocole créé par Facebook (vers 2010) maintenant adopté par tout le monde (LinkedIn, WhatsApp, Slack, Discord, Telegram, X...). Quand tu partages un lien, ces apps lisent les balises `<meta property="og:*">` pour générer une preview.

Les balises essentielles :
```html
<meta property="og:type" content="website">       <!-- type de contenu -->
<meta property="og:url" content="<URL canonical>">
<meta property="og:title" content="<titre>">
<meta property="og:description" content="<description>">
<meta property="og:image" content="<URL image>">  <!-- ~1200×630 idéal -->
<meta property="og:site_name" content="Livroteca Brincante do Pina">
<meta property="og:locale" content="pt_BR">
<meta property="og:locale:alternate" content="en_US">
```

Pour un article : `og:type="article"` + `<meta property="article:published_time" content="...">`.

Notre [Layout.astro:116-126](../apps/site/src/layouts/Layout.astro#L116-L126) couvre tout ça. Pour les artigos, on passe la cover Sanity en `og:image` (voir [as-atividades/[slug].astro:18-26](../apps/site/src/pages/as-atividades/[slug].astro#L18-L26)).

**Tester** : https://www.opengraph.dev/ ou https://www.opengraph.xyz/ — colle ton URL, voit le rendu sur 10 plateformes différentes.

### Twitter Cards

Variante X (ex-Twitter) du OG. Ils suivent maintenant largement OG, mais ont quelques specifics :
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">
```

Notre [Layout.astro:128-131](../apps/site/src/layouts/Layout.astro#L128-L131) les pose. Les valeurs sont les mêmes que OG (à part `twitter:card` qui décide du style — `summary` = petite image carrée, `summary_large_image` = grande image rectangulaire, plus engaging).

### Canonical URLs

Une **URL canonical** est la version "officielle" d'une page. Utile quand plusieurs URLs peuvent servir le même contenu :
- `livroteca.org/doar` vs `www.livroteca.org/doar`
- `livroteca.org/doar` vs `livroteca.org/doar?utm_source=facebook`
- `livroteca.org/doar/` vs `livroteca.org/doar` (avec ou sans trailing slash)

Sans canonical, Google peut indexer plusieurs versions de la même page et **diluer le PageRank**. La balise `<link rel="canonical" href="...">` lui dit "voici la version officielle, indexe celle-ci".

Notre [Layout.astro:111](../apps/site/src/layouts/Layout.astro#L111) :
```html
<link rel="canonical" href="https://livrotecabrincantedopina.org/doar/">
```

L'URL est construite depuis `Astro.url.pathname` + le domaine canonical. **Toujours absolue**, jamais relative.

### hreflang (vu en section 6)

Le pendant i18n du canonical. Dit à Google quelles versions linguistiques existent.

Notre [Layout.astro:114-116](../apps/site/src/layouts/Layout.astro#L114-L116) :
```html
<link rel="alternate" hreflang="pt-BR" href="...">
<link rel="alternate" hreflang="en" href="...">
<link rel="alternate" hreflang="x-default" href="...">
```

### robots.txt

Fichier texte à la racine du domaine, lu par tous les crawlers. Convention historique (1994 !). Notre [apps/site/public/robots.txt](../apps/site/public/robots.txt) :
```
User-agent: *
Allow: /

Sitemap: https://livrotecabrincantedopina.org/sitemap-index.xml
```

- `User-agent: *` — règles pour tous les bots
- `Allow: /` — autorise tout (équivalent à pas de restriction)
- `Sitemap: ...` — pointe vers notre sitemap

Tu peux **interdire des chemins** :
```
Disallow: /admin/
Disallow: /api/
```

**Le piège** : `robots.txt` est une convention **honoraire**. Les bots gentils (Google, Bing) la respectent. Les bots malicieux s'en fichent. Ne JAMAIS s'en servir comme mesure de sécurité.

### Sitemap XML

Le sitemap est un fichier XML qui liste toutes les URLs publiques. Aide Google à découvrir le contenu plus vite, surtout pour les pages peu liées.

Notre sitemap est généré automatiquement par [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) :

[apps/site/astro.config.mjs:3](../apps/site/astro.config.mjs#L3) :
```ts
import sitemap from "@astrojs/sitemap";
// ...
integrations: [sitemap()],
```

Output au build :
- `sitemap-index.xml` — index pointant vers les fichiers individuels
- `sitemap-0.xml` — la liste des URLs

Notre cas : 18 URLs (toutes les pages + `/en/*` + les routes dynamiques `as-atividades/[slug]`).

### JSON-LD / schema.org

Les meta tags décrivent la page d'un point de vue technique. **schema.org** est un vocabulaire structuré pour décrire le **contenu** de manière sémantique : "ceci est une organisation, voici son nom, son adresse, son logo, ses réseaux".

Le format recommandé par Google est **JSON-LD** (JSON for Linked Data) — un script JSON dans le `<head>` :

[Layout.astro:73-99](../apps/site/src/layouts/Layout.astro#L73-L99) :
```json
{
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "Livroteca Brincante do Pina",
  "url": "https://livrotecabrincantedopina.org",
  "logo": "https://livrotecabrincantedopina.org/images/logolivro.png",
  "foundingDate": "1997",
  "founder": { "@type": "Person", "name": "Kcal Gomes" },
  "location": {
    "@type": "Place",
    "name": "Comunidade do Bode",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Recife",
      "addressRegion": "PE",
      "addressCountry": "BR"
    }
  },
  "sameAs": [
    "https://www.instagram.com/livrotecabrincantedopina/",
    "https://www.facebook.com/LivrotecaBrincanteDoPina/"
  ]
}
```

**Pourquoi** ? Google utilise ça pour :
- Afficher un **knowledge panel** (encart à droite des SERPs) avec logo, sociaux, description
- Activer des **rich results** (étoiles, prix, événements...)
- Comprendre la nature de l'entité

`@type: "NGO"` est un sous-type de `Organization`. Plus précis = mieux. Voir https://schema.org/NGO.

**Tester** : https://search.google.com/test/rich-results — colle ton URL, voit si Google détecte ton JSON-LD.

### 404 brandée

Quand un visiteur tape une URL qui n'existe pas, le serveur renvoie un code HTTP **404 Not Found**. Par défaut, Astro/CF servent une page minimaliste. C'est une mauvaise UX : si quelqu'un arrive par un lien cassé, on perd la conversion.

Notre [404.astro](../apps/site/src/pages/404.astro) :
- Branding cohérent (police Anton, couleur vermelho)
- Liens vers la home + activités + email de contact
- Bilingue avec détection auto via `location.pathname`
- `noindex` (pour pas que Google l'indexe comme un contenu "réel")

CF Pages détecte automatiquement `/404.html` et le sert en cas de 404. Pas besoin de config supplémentaire.

### Validateurs et outils

- **Google Rich Results Test** : https://search.google.com/test/rich-results
- **PageSpeed Insights** : https://pagespeed.web.dev/ (perf + SEO + a11y)
- **Lighthouse** (intégré Chrome DevTools)
- **OG debugger** : https://www.opengraph.dev/
- **Schema.org validator** : https://validator.schema.org/
- **Google Search Console** (gratuit, faut vérifier la propriété du domaine via DNS) — voir les requêtes qui amènent du trafic, les erreurs d'indexation, etc.

### Pour aller plus loin

- Google SEO Starter Guide : https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- schema.org docs : https://schema.org/docs/full.html
- Open Graph protocol : https://ogp.me/

---

## 11. Forms web

### Le HTML form, en bref

Un form HTML c'est, dans sa forme minimale :
```html
<form action="/submit" method="POST">
  <input name="email" type="email" required>
  <button type="submit">OK</button>
</form>
```

Quand le user clique sur Submit :
1. Le navigateur valide les champs (required, type=email, etc.)
2. Il fait une requête POST à `/submit` avec les données encodées en `application/x-www-form-urlencoded` ou `multipart/form-data`
3. Le serveur traite, et redirige le navigateur vers une page de confirmation

C'était LA façon de faire avant l'AJAX. Encore pertinent pour les sites simples (zéro JS requis, fonctionne même JS désactivé).

### Pourquoi on est passé à du fetch + JSON

Pour notre form Voluntariar, on veut :
- Pas recharger la page (UX fluide)
- Pouvoir afficher un état "envoi en cours...", puis "merci" sans navigation
- Gérer les erreurs gracieusement
- Vérifier Turnstile **avant** d'envoyer (sinon le serveur refuse, et faut remontrer le form au user)

Ces besoins se gèrent mieux en JS. On intercepte le submit, on envoie en JSON via `fetch`, on lit la réponse, on met à jour le DOM.

[VoluntariarForm.astro:135-179](../apps/site/src/components/VoluntariarForm.astro#L135-L179) — le handler principal :
```js
form.addEventListener("submit", async (e) => {
  e.preventDefault();   // empêche la soumission classique
  // ...
  const fd = new FormData(form);
  const data = { name: fd.get("name"), /* ... */ };
  const res = await fetch("/api/voluntariar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const out = await res.json();
  if (out.ok) { /* afficher succès */ }
  else { /* afficher erreur */ }
});
```

### États d'un form moderne

Un form a typiquement 4 états :

1. **Idle** — affiché, en attente d'input
2. **Submitting** — en train d'envoyer, on disable le bouton + change le texte ("Envoi...")
3. **Success** — soumis avec succès, on cache le form et affiche un message
4. **Error** — erreur, on garde le form mais montre le message d'erreur

Notre code gère les 4 via :
- `setSubmitting(true/false)` — toggle disabled + label
- `showStatus(msg)` / `hideStatus()` — message d'erreur sous le form
- `form.hidden = true; successEl.hidden = false` — bascule en mode success

### Validation : client + serveur, toujours les deux

**Validation client** (HTML5 + JS) :
- Améliore l'UX (feedback instantané, pas de round-trip serveur)
- `required`, `type="email"`, `maxlength`, `pattern`
- `form.checkValidity()` en JS

**Validation serveur** (notre CF Function) :
- Impérative pour la sécurité (un attaquant peut bypasser la validation client)
- Toujours considérer que **n'importe quoi** peut arriver dans le payload

[functions/api/voluntariar.ts:37-52](../functions/api/voluntariar.ts#L37-L52) — on valide même quand le client est censé l'avoir fait :
```ts
if (!name || !email || !type || !skills) {
  return json({ ok: false, error: "validation" }, 400);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return json({ ok: false, error: "validation" }, 400);
}
if (name.length > 200 || skills.length > 5000) {
  return json({ ok: false, error: "validation" }, 400);
}
```

**Règle d'or** : "Never trust the client". Même si tu as une super UX côté client, le serveur doit re-valider tout.

### Honeypot et Turnstile

Vu en détail dans la conversation précédente. Récap rapide :

- **Honeypot** : un champ caché en CSS ; si rempli → c'est un bot, on rejette silencieusement. Filtre ~90% des bots génériques sans friction utilisateur.

- **Turnstile** : widget anti-bot de CF qui produit un token cryptographique après vérification passive du navigateur. Le serveur appelle CF `siteverify` pour valider le token. Filtre ~99% des bots, friction minimale.

Les deux combinés → quasi-totalité du spam stoppée.

### Accessibilité (a11y) des forms

Un form accessible respecte plusieurs règles :

**1. Labels** — chaque input doit avoir un `<label>` associé :
```html
<label>
  Nom
  <input type="text" name="name">
</label>
```
Quand le label englobe l'input, l'association est automatique. Sinon : `<label for="id">...</label><input id="id">`.

**2. Required fields visibles ET annoncés** :
```html
<span class="required" aria-label="obrigatório">*</span>
```
Le `*` est visible, l'`aria-label` est lu par les screen readers.

**3. Messages d'erreur live** :
```html
<p role="status" aria-live="polite" data-status></p>
```
`aria-live="polite"` → le screen reader annonce le contenu quand il change (mais sans interrompre la lecture en cours). `assertive` interromprait — à réserver pour erreurs critiques.

**4. Fieldset/legend pour les groupes** :
```html
<fieldset>
  <legend>Type de voluntariado</legend>
  <label><input type="radio" name="type"> Presencial</label>
  <label><input type="radio" name="type"> Remoto</label>
</fieldset>
```
Le `<legend>` est lu par le screen reader comme contexte pour le groupe.

**5. Focus visible** — les inputs doivent avoir un `:focus-visible` style net :
```css
.vol-form input:focus-visible {
  outline: 3px solid var(--cor-vermelho);
  outline-offset: 2px;
}
```

Notre form respecte tout ça. Voir [VoluntariarForm.astro](../apps/site/src/components/VoluntariarForm.astro).

### Pour aller plus loin

- MDN forms guide : https://developer.mozilla.org/en-US/docs/Learn/Forms
- a11y forms : https://www.w3.org/WAI/tutorials/forms/

---

## 12. Email transactionnel

### Qu'est-ce qu'un email transactionnel

Distinction :
- **Marketing email** — newsletters, promos, envois en bulk à des listes
- **Transactional email** — déclenché par une action utilisateur précise : reset password, confirmation de commande, notification de form submit (notre cas)

Les transactional emails ont des contraintes différentes : faut qu'ils arrivent **toujours** et **vite**, pas dans les spams. C'est là qu'interviennent des services dédiés.

### Pourquoi Resend / un service tiers ?

**Pourquoi pas envoyer depuis ton serveur ?**

Tu pourrais utiliser `nodemailer` ou un truc similaire pour envoyer via SMTP. Mais en pratique :

1. **Délivrabilité catastrophique** — les emails envoyés depuis une IP "résidentielle" ou un VPS lambda finissent en spam quasi-systématiquement
2. **DKIM/SPF/DMARC** doivent être configurés rigoureusement (sinon, spam)
3. **Pas de monitoring** — tu ne sais pas si tes emails sont reçus, ouverts, marqués comme spam
4. **Pas de retry** si une boîte est down temporairement

Les services dédiés (Resend, SendGrid, Mailgun, AWS SES, Postmark...) ont des **IP réputées**, des outils de monitoring, et gèrent le DKIM/SPF pour toi.

### Resend vs SendGrid / Mailgun / SES / Postmark

| | Resend | SendGrid | Mailgun | AWS SES | Postmark |
|---|---|---|---|---|---|
| Free tier | 3k emails/mois, 100/jour | 100/jour | Plus de free tier | 200/jour si depuis EC2 | 100 emails (one-time) |
| API | Moderne, REST simple | Lourde, legacy | Correct | AWS-style (signed requests) | Bonne |
| Setup | Très simple | Complexe | Moyen | Très complexe (AWS console) | Simple |
| Use case | Transactional moderne | Marketing + trans | Trans + bulk | Si tu vis déjà sur AWS | Transactional puriste |

**Resend** est récent (2023) mais s'est imposé comme la solution moderne pour les apps qui font du transactional simple. Leur API est très propre, leur dashboard agréable, et l'intégration depuis un Worker CF est triviale (juste un `fetch`).

### DKIM, SPF, DMARC, Return-Path

Ce sont les **4 piliers de l'authentification email**. Sans, tu finis en spam. Brève explication :

**SPF (Sender Policy Framework)**
Tu publies un record DNS TXT sur ton domaine qui liste **qui a le droit d'envoyer des emails en ton nom**.
```
v=spf1 include:_spf.resend.com -all
```
→ "Seul Resend peut envoyer des emails depuis `@livrotecabrincantedopina.org`. Tout le reste, rejette."

**DKIM (DomainKeys Identified Mail)**
Chaque email envoyé contient une **signature cryptographique** dans son header. La clé publique correspondante est publiée dans un record DNS TXT. Le serveur de réception vérifie la signature.
```
default._domainkey.livrotecabrincantedopina.org TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3D..."
```
→ Garantit que l'email a bien été envoyé par quelqu'un qui possède la clé privée DKIM (donc Resend, dans notre cas).

**DMARC (Domain-based Message Authentication, Reporting and Conformance)**
Politique qui dit aux serveurs de réception **quoi faire** si SPF ou DKIM échoue.
```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@livrotecabrincantedopina.org
```
→ "Si SPF ou DKIM échoue, reject l'email. Et envoie-moi un rapport hebdomadaire des tentatives."

**Return-Path / Envelope-from**
L'adresse à laquelle les bounces (emails rejetés) sont retournés. Resend gère ça en utilisant un sous-domaine spécifique (`bounces.livrotecabrincantedopina.org`).

**Notre setup à venir** :
1. Créer compte Resend
2. Ajouter `livrotecabrincantedopina.org` dans Resend → Domains
3. Resend te montre les ~3 records DNS à ajouter (SPF, DKIM, return-path)
4. Tu les copies-colles dans CF DNS
5. Tu attends la propagation (~5min)
6. Resend vérifie automatiquement → ton domaine est "verified"
7. Tu génères une API key
8. Tu l'ajoutes dans CF Pages env vars (`RESEND_API_KEY`)

### API REST vs SDK

Resend a un SDK officiel `@resend/node`, mais il est conçu pour Node. Sur le Workers runtime, on **appelle directement l'API REST** via `fetch` :

[functions/api/voluntariar.ts:108-122](../functions/api/voluntariar.ts#L108-L122) :
```ts
const resend = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: env.CONTACT_FROM_EMAIL,
    to: [env.CONTACT_TO_EMAIL],
    reply_to: email,
    subject,
    text,
    html,
  }),
});
```

Avantages :
- Pas de SDK lourd à bundler
- Compatible 100% Workers
- Tu vois exactement ce qui est envoyé

L'API Resend est simple : un endpoint POST, un payload JSON, une réponse JSON.

### From, To, Reply-to

- **From** — l'adresse "expéditeur" affichée au destinataire. Doit être sur un domaine vérifié dans Resend (`@livrotecabrincantedopina.org`). Notre cas : `voluntariar@livrotecabrincantedopina.org`.
- **To** — le destinataire (Kcal ou `contato@…`).
- **Reply-to** — quand le destinataire (Kcal) répond, c'est cette adresse qui est utilisée. Notre cas : on met l'email du volontaire qui a rempli le form, comme ça Kcal peut répondre directement.

### Templates HTML + plaintext

Un bon email transactionnel a **deux versions** dans le même envoi :
- **HTML** — pour les clients qui le supportent (Gmail, etc.)
- **Plain text** — pour les autres (terminal, anciens clients) et pour les détecteurs anti-spam (un email HTML-only est suspect)

Notre code envoie les deux ([voluntariar.ts:92-106](../functions/api/voluntariar.ts#L92-L106)).

### Pour aller plus loin

- Resend docs : https://resend.com/docs
- Email deliverability primer : https://postmarkapp.com/guides/email-deliverability
- SPF/DKIM/DMARC explained : https://easydmarc.com/blog/spf-dkim-dmarc-the-3-pillars-of-email-authentication/

---

## 13. DNS, domaines, redirects

### Le DNS, à quoi ça sert

Le **DNS (Domain Name System)** est l'annuaire du web. Sans lui, tu devrais retenir `104.21.45.78` au lieu de `google.com`. Le DNS traduit les noms en adresses IP (et plus).

Quand ton navigateur veut joindre `livrotecabrincantedopina.org` :
1. Il demande à son resolver DNS (souvent celui de ton FAI ou 1.1.1.1) : "c'est où ?"
2. Le resolver remonte la chaîne : root servers → `.org` servers → CF nameservers (qui gèrent `livrotecabrincantedopina.org`)
3. Les CF NS renvoient les records (A, CNAME, etc.)
4. Le navigateur peut alors faire la connexion TCP/HTTPS vers la bonne IP

### Types de records DNS

**A (Address)** — pointe un nom vers une adresse IPv4.
```
livrotecabrincantedopina.org → 172.66.0.96
```

**AAAA** — comme A, mais IPv6.

**CNAME (Canonical Name)** — alias d'un autre nom. Ne peut pas être à l'apex (jamais sur `example.com`, seulement `www.example.com`).
```
www.livrotecabrincantedopina.org → livrotecabrincantedopina.org
```

**TXT (Text)** — du texte libre. Sert à plein de choses :
- SPF : `v=spf1 include:_spf.resend.com -all`
- DMARC : `v=DMARC1; p=reject; rua=...`
- DKIM : `v=DKIM1; k=rsa; p=...`
- Vérification de propriété (Google Search Console, etc.)

**MX (Mail Exchange)** — où envoyer les emails pour ce domaine.
```
livrotecabrincantedopina.org → mx.cloudflare.net (priority 10)
```

**NS (Name Server)** — qui gère le DNS pour ce domaine. Au niveau du registrar.
```
livrotecabrincantedopina.com.br NS → adam.ns.cloudflare.com
                                 NS → eve.ns.cloudflare.com
```

**CAA (Certification Authority Authorization)** — qui peut émettre des certificats SSL pour ce domaine. Sécurité.

### Apex vs sous-domaine

L'**apex** est le domaine sans préfixe (`livrotecabrincantedopina.org`). Les sous-domaines sont en plus (`www.`, `studio.`, `api.`).

**Particularité historique** : un apex ne peut pas avoir de record CNAME (limitation du protocole DNS). Si tu veux pointer un apex vers un autre nom (cas typique : pointer vers un service comme CF Pages qui te donne `livroteca-site.pages.dev`), tu as deux options :
- Utiliser un **A record** vers une IP (mais l'IP peut changer)
- Utiliser un **ALIAS / ANAME / CNAME flattening** — extension non-standard supportée par CF et autres modernes, qui simule un CNAME à l'apex

CF gère ça automatiquement pour ses propres services (CF Pages, Workers). Pas besoin de s'en occuper.

### Registrar vs DNS provider

Deux services différents souvent confondus :

- **Registrar** — vend les noms de domaine (ICANN-accredited). Ex: GoDaddy, Namecheap, OVH, CF Registrar, Registro.br.
- **DNS provider** — gère les records DNS du domaine. Ex: CF DNS, Route 53, ns1.com.

Souvent le registrar inclut un DNS, mais tu peux dissocier les deux. Comment ?

Au niveau du registrar, tu indiques les **nameservers (NS)** que le domaine doit utiliser. Le registrar pousse ces NS dans la zone racine (`.org`, `.com.br`...). Quand un resolver cherche `livroteca.org`, il est dirigé vers ces NS.

**Notre cas `.org`** :
- Registrar : CF Registrar
- DNS provider : CF DNS (NS `*.ns.cloudflare.com`)
- Tout est dans CF, simple.

**Notre cas `.com.br`** :
- Registrar : Registro.br (parce que `.com.br` n'est pas accessible aux registrars étrangers — réglementation brésilienne)
- DNS provider : CF DNS (NS `*.ns.cloudflare.com`)
- Configuration : dans Registro.br, on a changé les NS de leurs valeurs par défaut vers les NS CF
- → CF gère le DNS, le registrar continue de juste "possèder" le nom

### Le 301 vs 302 vs Redirect Rules

Quand tu redirect une URL vers une autre, tu utilises un code HTTP :

- **301 Moved Permanently** — permanent, navigateurs/Google updateront leurs caches
- **302 Found** (ou 307 Temporary Redirect) — temporaire, le client devra revérifier la prochaine fois

Pour le SEO, **utilise 301** quand c'est une vraie permanence (le contenu a déménagé, le domaine a changé). Google transfère ~99% du "page rank" à la nouvelle URL.

**Notre redirect `.com.br` → `.org`** :
- Permanent → 301
- Implémenté via **CF Redirect Rules** (pas un meta refresh HTML, pas un middleware, pas un Worker custom)

CF Dashboard → `livrotecabrincantedopina.com.br` (le domaine) → Rules → Redirect Rules. Configuration :

- **When incoming requests match** : `(http.host eq "livrotecabrincantedopina.com.br")`
- **Then** : URL redirect → Dynamic → `concat("https://livrotecabrincantedopina.org", http.request.uri.path)`
- **Status** : 301
- **Preserve query string** : Yes

→ `livroteca.com.br/a-livroteca?foo=bar` → 301 → `livroteca.org/a-livroteca?foo=bar`

Le mode **Dynamic** est la clé — il permet de construire l'URL cible en utilisant des variables (le path entrant). Sans ça, on devrait définir une règle par URL.

### Propagation DNS

Quand tu modifies un record DNS, le changement n'est pas instantané. Les resolvers ont caché les anciennes valeurs (selon le TTL — Time To Live de chaque record, typiquement 1h à 24h). Délai typique : 5min à 48h pour une propagation complète.

**Astuce** : pour des changements fréquents (dev/test), baisse le TTL avant le changement (ex. 300s). Une fois stabilisé, remonte à 3600s (1h) ou plus.

### Pour aller plus loin

- DNS for developers : https://howdns.works/
- Cloudflare DNS docs : https://developers.cloudflare.com/dns/

---

## 14. Git, GitHub, déploiement continu

### Git, le strict minimum à comprendre

**Git** est un système de gestion de versions distribué (créé par Linus Torvalds en 2005 pour le kernel Linux). Trois concepts importants :

**1. Repository (repo)** — dossier qui contient ton code + l'historique des changements.

**2. Commit** — un "snapshot" du code à un instant T, avec un message qui le décrit.
```
commit 2fb552c
Site: add SEO meta, robots.txt, branded 404

Layout.astro: canonical + hreflang...
```

**3. Branch** — une ligne de développement parallèle. La branche par défaut est `main`. Tu peux créer des branches pour développer des fonctionnalités sans toucher `main`, puis "merger" quand prêt.

**Commandes essentielles** :
```bash
git status                       # voir ce qui a changé
git diff                         # voir les changements ligne par ligne
git add <file>                   # marquer un fichier pour le prochain commit
git commit -m "message"          # créer un commit
git push                         # envoyer les commits au repo distant (GitHub)
git pull                         # récupérer les commits du distant
git log --oneline                # voir l'historique
git checkout -b nouvelle-branche # créer + se positionner sur une nouvelle branche
```

### GitHub

**GitHub** est un service d'hébergement Git, propriété de Microsoft depuis 2018. Le concurrent principal est **GitLab** (open source, peut être self-hosted).

Notre repo : https://github.com/livroteca/site (public).

**Pourquoi un repo public** :
- Transparence (cohérent avec la mission de la Livroteca)
- GitHub gratuit pour les repos publics
- Crawlable par Google (visibilité)

**Risques** :
- Tout commit, même futur, est visible
- Si tu push un secret par erreur (.env, API key), il reste dans l'historique même après suppression — GitHub a un **secret scanning** qui alerte automatiquement

### GitHub Organization

Une **org** GitHub regroupe des repos sous un nom commun. Notre cas : `livroteca/` (l'org), avec `livroteca/site` (le repo).

**Pourquoi** : pour pouvoir donner le contrôle à Kcal sans qu'il dépende du compte perso d'Hugo. Si Hugo disparaît, Kcal reste owner de l'org et continue.

À faire (TODO) : inviter Kcal en owner de l'org.

### Branch protection

Sur GitHub Settings → Branches, on peut **protéger** `main` :
- Bloquer les push directs (force des PRs)
- Exiger un review avant merge
- Exiger des status checks (CI verte)
- Empêcher les force-push

Pour la Livroteca, on activera ça quand le projet sera stable (TODO 🔵).

### Workflow `main` → prod

Notre flow actuel est minimaliste :

```
Hugo code
   ↓
git commit + push (sur main)
   ↓
GitHub reçoit le push
   ↓
GitHub webhook → CF Pages
   ↓
CF Pages clone, build, deploy
   ↓
~30s plus tard, prod live
```

Pour les changements importants, on pourrait passer par des **PR (Pull Requests)** :

```
Hugo crée une branche `feat/seo-improvements`
   ↓
Push de la branche
   ↓
CF Pages crée un preview deployment unique (URL `<hash>.livroteca-site.pages.dev`)
   ↓
Test sur le preview
   ↓
Si OK, merge la PR dans main
   ↓
Prod rebuild auto
```

Pour l'instant on push direct sur `main` parce que projet solo. Quand Kcal/volontaires contribueront, on passera aux PRs.

### Webhooks deploy

CF Pages a deux webhooks "entrants" différents :

**1. Le webhook GitHub natif** — créé automatiquement quand tu connectes le repo. Push sur le repo → CF rebuild.

**2. Le "Deploy Hook" CF** — une URL unique générée dans CF Pages → Settings → Builds & deployments → Deploy hooks. Tu peux POST sur cette URL depuis n'importe où pour déclencher un build manuel.

Notre usage du deploy hook : **Sanity webhook** (vu en section 4). Quand Kcal publie un artigo, Sanity POST sur le deploy hook → CF rebuild → contenu visible.

### Conventional commits

Une **convention de message de commit** (qu'on suit informellement) :

```
<type>: <short description>

<longer body if needed>

<footer if needed>
```

Types courants : `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`, `perf`. Préfixes utiles dans le contexte de monorepo : `Site:`, `Studio:`.

Avantages : `git log --oneline` reste lisible, on peut générer un changelog automatiquement (qu'on ne fait pas encore).

### Pour aller plus loin

- Pro Git book (gratuit) : https://git-scm.com/book/en/v2
- GitHub docs : https://docs.github.com/

---

## 15. Concepts transversaux

### CDN

Un **CDN (Content Delivery Network)** est un réseau de serveurs distribués géographiquement qui caches du contenu statique pour le servir au plus proche du visiteur.

Sans CDN : ton serveur est à Paris, un visiteur au Brésil → 200ms de latence. Avec CDN : le CDN a une copie de ton site à São Paulo → 20ms.

CF Pages utilise nativement le CDN Cloudflare (~300 datacenters). Quand tu déploies, le HTML/CSS/JS est poussé à tous les nodes. Le visiteur télécharge depuis le node le plus proche.

### Caching et invalidation

Pour les ressources statiques (CSS, JS, images), on ajoute des headers HTTP de cache :
```
Cache-Control: public, max-age=31536000, immutable
```
→ "Cache pour 1 an, ne re-demande jamais."

Le piège : si le fichier change, le navigateur ne le voit pas. Solution : **fingerprinting des noms de fichiers** (`style.abc123.css`). Astro le fait automatiquement pour les assets bundles.

Pour l'HTML lui-même, on cache moins agressivement (~5min) — sinon, après un rebuild, les visiteurs verraient encore l'ancien contenu.

### CORS

**Cross-Origin Resource Sharing**. Vu en section 4.

Le navigateur applique la **same-origin policy** : par défaut, un script qui tourne sur `livroteca.org` ne peut pas faire une requête `fetch` vers `api.sanity.io`. Pour autoriser, le serveur cible doit répondre avec des headers spécifiques :
```
Access-Control-Allow-Origin: https://livroteca.org
Access-Control-Allow-Credentials: true
```

Notre cas : pas de souci côté site (Astro fetch Sanity au **build**, pas dans le navigateur). Côté Studio par contre, la connexion API se fait côté client → faut configurer les CORS origins dans Sanity.

### Webhooks (le pattern général)

Un **webhook** est un mécanisme d'inversion de contrôle : au lieu de "j'interroge périodiquement le serveur pour voir s'il y a du nouveau" (polling), c'est "le serveur me notifie quand un événement arrive".

Pattern :
1. Tu donnes au serveur source une URL ("webhook URL")
2. Quand l'événement se produit, le serveur source POST sur ton URL
3. Tu reçois le payload (JSON typique) et tu réagis

Notre cas : Sanity POST sur le deploy hook CF Pages quand un doc est publié.

Webhooks célèbres : GitHub (push, PR opened...), Stripe (paiement reçu...), Sanity, Slack, etc.

### Markdown + frontmatter

**Markdown** est un format texte léger pour écrire du contenu structuré sans HTML.
```md
# Titre

Du **gras** et de l'*italique*.

- Liste
- À puces

[Un lien](https://example.com)
```

**Frontmatter** est une zone de metadata au début d'un fichier Markdown, en YAML (entre deux `---`) :
```md
---
title: Mon article
date: 2026-05-25
tags: [livroteca, podcast]
---

# Contenu de l'article
```

Astro lit nativement les `.md` + frontmatter (via "content collections"). On ne l'utilise pas dans la Livroteca parce que tout le contenu passe par Sanity. Mais c'est un pattern hyper répandu (Jekyll, Hugo, Eleventy, Astro content collections).

### SSG, ISR, SSR, CSR — récap

Tu vas voir ces acronymes partout. Petit récap :

- **SSG** (Static Site Generation) — HTML au build. Notre choix.
- **ISR** (Incremental Static Regeneration) — SSG + revalidation par page (Next.js innovation). Pas disponible en Astro pur, mais le webhook Sanity → rebuild est l'équivalent.
- **SSR** (Server-Side Rendering) — HTML à chaque requête, serveur en marche 24/7.
- **CSR** (Client-Side Rendering) — HTML quasi vide, tout est en JS côté navigateur. Le Studio Sanity.

### Performance budget

Une bonne pratique : se fixer des **budgets** mesurables. Exemple :
- HTML initial < 50KB compressé
- LCP (Largest Contentful Paint) < 2.5s
- CLS (Cumulative Layout Shift) < 0.1
- TTI (Time To Interactive) < 3.5s

Tester via Lighthouse / PageSpeed Insights.

Notre site est actuellement très propre sur ces métriques (HTML statique, CSS minimal, zéro JS framework). À surveiller quand on ajoutera des features.

### A11y (accessibility)

**a11y** = abréviation de "accessibility" (a + 11 lettres + y).

Principes WCAG :
1. **Perceivable** — alt text sur les images, transcripts pour l'audio, contrastes corrects
2. **Operable** — navigable au clavier seul, pas de pièges au focus
3. **Understandable** — langage clair, structure logique
4. **Robust** — fonctionne avec assistive tech (screen readers, etc.)

Notre site est OK basique. À faire (TODO 🟡) : audit complet avec axe DevTools, NVDA testing, contrastes.

### Pour aller plus loin

- Web fundamentals : https://web.dev/
- MDN Web Docs (la référence) : https://developer.mozilla.org/

---

## Conclusion

On a couvert :
- L'architecture (monorepo, pnpm, Astro, Sanity, CF Pages)
- Les outils dev (TypeScript, CSS vanilla, web components)
- Les concepts web fondamentaux (i18n, SEO, forms, email, DNS)
- L'écosystème Cloudflare (Pages, Functions, Turnstile, R2)
- Les patterns transversaux (CDN, caching, CORS, webhooks)

Si un concept reste flou ou si tu veux qu'on creuse un point spécifique, dis-le moi. Ce doc est vivant — on peut le compléter à mesure qu'on ajoute des fonctionnalités au site.
