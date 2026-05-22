# Site de la Livroteca
## Description
Nous créeons un site principal et une boutique (deux sites différents) pour la livroteca brincante do pina, un centre social de Recife qui accueil des jeunes de favela.

Le site est en portugais.

Le contexte est actualisé dans CLAUDE.md en fin de session pour avoir l'état courant du site.

Nous allons avoir trois phases pour chaque site:

1. Le plan 
2. Itérations
3. Mise en prod

## Description de la Livro
La livroteca brincante do pina est un centre social créé par Kcal (Ricardo Gomez) dans la communauté du bode à Recife. 
Il y a là une bibliothèque communautaire ainsi qu'une quadra où sont organisées des activités (capoeira, musique, cirque, dessin...) pour les enfants et les jeunes de la communauté. 
Il s'y déroule des actions en lien avec d'autres collectifs / collectivités (oficina de grafiti, campagne de vaccination...)
L'association fonctionne via les dons et le volontariat et est en train d'essayer de s'auto financer en créant une boutique où sont vendus des produits de la livroteca.
## Description de la phase actuelle 

Nous sommes actuellement à la fin de la planification du site principal.
**Phase courante : planification terminée. Prochaine étape — validation Kcal + bootstrap Astro.**

### TODO

5. **Validation Kcal** — domaine (`.com.br` / `.org` / les deux), accès CMS (qui édite réellement), Doar v1 (PIX link vs Stripe/MP intégré), newsletter v1 ou v2.
6. **Bootstrap Astro** — créer repo GitHub, scaffold Astro 5, porter `template/index.html` en composants (Header, Footer, PodcastPlayer, layout).

### Done
0. LIVRO.md — description de la Livroteca, histoire de Kcal, activités, modèle de financement.
1. BODE.md — contexte géographique, historique et politique du Bode (Pina, Recife) ; RioMar, Via Mangue, remoções.
2. STRUCTURE.md — mapa do site, esqueletos de páginas, modelo d'article/évent, composants transversaux (header, footer, calendrier, dialogue Ajudar). Inclut la page `/transparencia` (documents institutionnels).
3. DESIGN.md — système de design (tokens couleurs Pernambuco, typo Anton+Inter+Caveat, espacement, composants).
   - Itéré via `template/index.html`. **Variante d'élévation tranchée : Riso (default) + Linha en switch optionnel.** Bloco et Papel éliminés.
4. STACK.md — Astro 5 SSG + **Sanity** (CMS hébergé, auth email pour Kcal/volontaires sans GitHub) + Cloudflare Pages (site + studio) + R2 (MP3 podcast, PDFs transparência) + `rrule.js` pré-calculé au build + webhook Sanity → deploy hook + cron hebdo. i18n via champs localisés Sanity (édition pt/en côte à côte) + Astro i18n natif. CSS vanilla sur tokens DESIGN.md. **Monorepo** `apps/site` + `apps/studio` recommandé.

## État courant — reprendre ici

### Design — figé
- **Variante d'élévation : `Riso` en default**, `Linha` proposée comme switch optionnel (à exposer en réglage UI ou pas — à décider en implémentation).
- `template/index.html` : `<body data-variant="riso">`.
- **Header en blanc pur** (`--cor-branco` / #FFFFFF), reste du site en `--cor-papel` (#FAF7F0).
- **Player podcast "A Voz da Lama"** (bottom-left flottant) : bouton = animation Lottie `template/speakers.lottie` rendue via web component `@lottiefiles/dotlottie-wc`, scalée à 1.35× dans le bouton (124×84).
- Bug couleur texte au hover des CTAs colorisés : corrigé.

### Stack figée (voir STACK.md)

- **Astro 5 SSG**, CSS vanilla sur les tokens DESIGN.md, pas de framework UI.
- **Sanity** (CMS hébergé) : auth par email pour Kcal/volontaires, schemas TypeScript, CDN d'images natif. Pas de compte GitHub requis pour les éditeurs.
- **Monorepo** : `apps/site` (Astro) + `apps/studio` (Sanity Studio React).
- **Cloudflare Pages** : site sur `livroteca.org` + studio sur `studio.livroteca.org`.
- **Cloudflare R2** : MP3 podcast + PDFs transparência (Sanity gère les images d'articles).
- **`rrule.js`** pré-calculé au build (±6 mois passés / +12 mois futurs) via `RRuleSet`, rebuild cron hebdo + webhook Sanity à chaque publication.
- **Annulations d'occurrences (V1)** : champ `event.exceptions: datetime[]` (EXDATE iCal). Affichage public silencieux. V2 prévue : type `eventOverride` pour gérer aussi les déplacements + affichage barré + note.
- **i18n** : champs localisés Sanity (édition pt/en côte à côte) + Astro i18n natif pour le routing. `pt-BR` sans préfixe, `/en/...`. Fallback banner si traduction absente.
- **Workflow** : main → prod, PR → preview URLs Cloudflare. Pas de staging permanent.
- **Backups** : cron Worker → `sanity dataset export` → R2 (12 derniers dumps).
- **Loja** (site séparé) : stack à définir après bootstrap du site principal.

- **Police du logo** : Anton est une approximation — à confirmer auprès de Kcal.
- **Widget RRULE Sanity** : input texte v1, widget custom si pain point.
- **Calendar UI** : vanilla JS ou island Preact (décision à l'implémentation).

### Décisions validées par Kcal (2026-05-21)

- **Accès Studio** : Kcal + quelques volontaires (free tier Sanity 3 users suffit).
- **Newsletter** : v2 (pas dans le scope v1).
- **Page "O Bode"** : section de `/a-livroteca` (pas de page propre `/o-bode`).
- **Loja** : dans le menu principal (en plus du footer + dialog Ajudar).
- **Palette Pernambuco + typos** : validées telles qu'au template.
- **Repo GitHub** : org `livrotecabrincante` à créer ; Hugo owner principal, Kcal owner secondaire (continuité projet, n'utilise pas GitHub au quotidien).
- **Domaines** : **`livrotecabrincantedopina.org`** canonical (Cloudflare Registrar) **+ `livrotecabrincantedopina.com.br`** en redirect 301 (Registro.br, défense de marque côté Brésil).
- **Studio hosting** : auto-hébergé sur **`studio.livrotecabrincantedopina.org`** (Cloudflare Pages).
- **Doar v1** : page statique éditée dans Sanity — QR code PIX + clé PIX + bouton hosted Mercado Pago + bank info + email pour donations internationales. Zéro code. V2 envisagée post-launch si friction.

### À fournir/confirmer côté Livroteca
- Titre + année du film documentaire (Festival de Cinéma de Rome).
- Bio plus détaillée de Kcal (groupe musical, livres publiés, prix).
- Validation de la palette Pernambuco avec Kcal et le coletivo.
- Décider si BODE.md est repris en entier sur le site ou seulement résumé sur `/a-livroteca`.
- Qui éditera le contenu au quotidien (Kcal, volontaires, devs) ? Conditionne le choix CMS vs markdown.

## Réquisitions Initiales

Je souhaite que tu me pose des questions pour qu'on créé les fichiers ensembles, et qu'une fois que tu as tout ce qu'il te faut, on passera au développement.
Si des choses décrites ici sont trop compliquées à implémenter ou sembles de mauvais choix, n'hésite pas à me le communiquer.

Le site est en portugais par défaut, mais il est possible de choisir la version anglaise.
Le site aura une Home, une page "A Livroteca", une page "As Atividades", une page "Doar", une page "Voluntariar", une page "Loja".
La Home aura une image d'accueil ainsi qu'une description, un calendrier avec les événements futurs et passés. 
La page A livroteca présente le projet, Kcal et le quartier (Pina et plus précisément le bode). 
La page As Atividades montre les événements de la semaine, le même calendrier que la Home et les articles dans l'ordre du plus récent au plus ancien.
La gestion des événements se fait de la manière suivante: un article peut représenter un événement ponctuel, un événement récurrent ou autre chose. Si elle représente un événement elle apparait dans le calendrier et un clic sur l'évenement ouvre la page correspondante.
On verra les pages Doar et Voluntariar après, tu peux créer un simple place holder.

Itérons aussi sur le design, pour se faire je vais mettre des références dans le dossier moodboard/
