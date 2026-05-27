# Conteúdo a criar no Sanity Studio

URL Studio : https://studio.livrotecabrincantedopina.org (login Google).

O site lê 4 tipos de conteúdo do Sanity. Os schemas já existem — falta apenas criar/preencher os documentos. **Tudo é fallback-safe : o site continua funcionando se um doc não existe ainda**, só substitui placeholders quando o doc é publicado.

---

## 1. `configSite` — singleton (1 único documento)

Crie **um único** documento de tipo "Configuração do site" e preencha :

| Campo | Onde aparece no site | Exemplo |
|---|---|---|
| Título do site (pt/en) | meta `<title>` quando a página não define o seu | "Livroteca Brincante do Pina" |
| Descrição (pt/en) | meta description fallback | "Cultura, leitura e brincadeira no Bode." |
| Email de contato | Footer, page Doar (internacional) | `contato@livrotecabrincantedopina.org` |
| Endereço → local | Footer "Onde encontrar" | "Comunidade do Bode" |
| Endereço → cidade | Footer | "Pina · Recife/PE" |
| Endereço → horários | Footer | "Seg a sáb · 14h–18h" |
| Endereço → URL Google Maps | (não usado por enquanto) | opcional |
| **Chave PIX** | Page Doar, hero | (a chave real) |
| **QR code PIX (imagem)** | Page Doar, hero | upload da imagem gerada no app do banco |
| Link Mercado Pago | Page Doar, card MP | URL hosted gerado no MP |
| Dados bancários (banco/agência/conta/favorecido/CNPJ) | Page Doar, card transferência | preencher os 5 campos |
| Redes → Instagram | Footer | `https://www.instagram.com/livrotecabrincantedopina/` |
| Redes → Facebook | Footer | `https://www.facebook.com/LivrotecaBrincanteDoPina/` |
| Redes → YouTube | Footer (oculto se vazio) | opcional |
| Redes → TuneIn | Footer | URL TuneIn do podcast |

**Importante** : se um campo fica vazio, o site usa o placeholder anterior (ex. "[a definir]" para PIX). Para **eliminar** o placeholder, preencha o campo.

---

## 2. `pessoa` — Kcal

Crie um documento de tipo "Pessoa" com :

- **Nome** : `Ricardo Gomes Ferraz`
- **Slug** : `kcal` ← **importante**, o site procura exatamente esse slug
- **Função** (pt) : `Fundador da Livroteca`
- **Função** (en) : `Livroteca's founder`
- **Bio** (pt) : 2-4 frases curtas — quem é, o que faz. Aparece como card no topo da seção "Kcal — o fundador" em /a-livroteca.
- **Bio** (en) : versão traduzida
- **Foto** : foto principal de Kcal, idealmente quadrada ou retrato

**Quando o doc não existe** : o card não aparece, e a página /a-livroteca continua exibindo os parágrafos longos existentes. Quando você publica, o card aparece.

---

## 3. `episodioPodcast` — A Voz da Lama

Crie **um documento por episódio**. Ordem no player : por `number` decrescente.

### Episódios atuais (no TuneIn)

URL da série : https://tunein.com/podcasts/Arts--Culture-Podcasts/Radio-de-Andada-A-Voz-da-Lama-l-Livroteca-Brincante-do-Pina-p2276168/

São 4 episódios. Para cada um :

1. Abra a página TuneIn da série
2. Clique em um episódio específico → copie a URL completa da barra de endereço (ex. `https://tunein.com/podcasts/.../?topicId=XXXXXXX`)
3. No Studio, crie um doc "Episódio — A Voz da Lama" :
   - **Título** (pt/en) — o título do episódio
   - **Slug** — gerar a partir do título
   - **Número do episódio** — 1, 2, 3 ou 4
   - **Data de publicação** — data aproximada
   - **URL do áudio (R2)** — **deixar vazio** (não temos MP3 hospedado ainda)
   - **URL externa** — colar a URL TuneIn copiada
   - **Duração (segundos)** — opcional
   - **Descrição** (pt/en) — 1-2 frases sobre o episódio

### Comportamento do player

- Se `audioUrl` está preenchido → playback dentro do site, animação Lottie anima durante play
- Se só `externalUrl` → clique no episódio abre a URL em nova aba (TuneIn), nada toca dentro do site
- Se nenhum episódio existe → mostra um fallback "A Voz da Lama no TuneIn" que abre a página da série

### Migrar para R2 mais tarde

Quando os MP3s forem hospedados no R2 (TODO 🟡 polissage), basta editar cada episódio no Studio e preencher `audioUrl` — o player passa automaticamente para playback interno, sem mudar o código.

---

## 4. `paginaInstitucional` — sobrescrever o hero das páginas estáticas

Permite a Kcal editar o **hero** (etiqueta + título + lede) das páginas estáticas, sem mexer no código. Crie um documento por página, com o `key` correspondente :

| `key` | Página afetada | Comportamento |
|---|---|---|
| `home` | `/` e `/en/` | sobrescreve eyebrow, título e lede do hero |
| `a-livroteca` | `/a-livroteca` (+ EN) | sobrescreve hero (o restante da narrativa fica hardcoded) |
| `doar` | `/doar` (+ EN) | sobrescreve hero (o resto da página = cards PIX/MP/bank vem de `configSite`) |
| `voluntariar` | `/voluntariar` (+ EN) | sobrescreve hero (cards + form ficam hardcoded) |
| `loja` | `/loja` (+ EN) | sobrescreve hero **e** suporta body Portable Text para conteúdo rico (úteis quando a loja for descrita) |

Campos por documento :

- **Identificador** : escolher na lista (`home`, `a-livroteca`, `doar`, `voluntariar`, `loja`)
- **Etiqueta** (pt/en) : pequena linha acima do título. Ex.: "Bode · Pina · Recife"
- **Título principal** (pt/en) : grande título do hero
- **Lede** (pt/en) : parágrafo de introdução curto
- **Conteúdo rico** (pt/en, opcional) : Portable Text — usado só pela página `/loja`

**Comportamento** : se um campo fica vazio, o site usa o texto hardcoded em fallback. Se o documento inteiro não existe, tudo continua hardcoded. Podemos criar progressivamente.

---

## 5. Já existentes / fallback automático

Estes tipos já funcionam sem documentos criados :

- **`artigo`** — artigos + eventos. Sem nenhum → "Nenhum artigo publicado" / "Nenhum evento programado". Crie quantos quiser.
- **`documentoTransparencia`** — PDFs institucionais (ata, balanço…). Sem nenhum → /transparencia mostra a página vazia.

---

## Verificar

Depois de criar/publicar um documento : aguardar ~30s (webhook Sanity → rebuild CF Pages → deploy), refresh a página relevante.

Em caso de dúvida sobre um campo : olhar o schema correspondente em `apps/studio/schemas/`.
