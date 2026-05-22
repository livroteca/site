---
title: Estrutura do site principal
description: Mapa do site, esqueletos das páginas, modelo de artigo/evento e componentes transversais (header, footer, calendário, diálogo Ajudar).
language: pt-BR
status: rascunho
---

# Estrutura do site principal

> Documento de referência. Define **mapa do site**, **esqueletos de cada página**, **modelo de dados** dos artigos/eventos e **componentes transversais**. A loja é um site separado — ver [STACK.md](./STACK.md).

---

## 1. Mapa do site

```
/                       → Home
/a-livroteca            → A Livroteca (projeto + Kcal + Bode)
/as-atividades          → As Atividades (calendário + artigos)
/as-atividades/[slug]   → Página de artigo / evento
/doar                   → Doar (esqueleto)
/voluntariar            → Voluntariar (esqueleto)
/loja                   → Loja (teaser → boutique externa)
/transparencia          → Transparência (documentos institucionais)
```

Idiomas: **`pt-BR` (default)** e **`en`**. Cada rota existe nas duas línguas; a mudança preserva a página atual.

---

## 2. Componentes transversais

Componentes presentes em **todas as páginas**, ou usados em mais de um lugar.

### 2.1 Header

```
[ Logo Livroteca ]   Home  A Livroteca  As Atividades  Doar  Voluntariar  Loja      [ PT | EN ]
```

- **Sticky** no topo no scroll (decisão de design — ver DESIGN.md).
- O **language switcher (PT/EN)** fica no canto superior direito.
- Em mobile: menu hambúrguer; PT/EN permanece visível ao lado do hambúrguer.
- O item ativo é destacado.

### 2.2 Footer

Três blocos:

```
Onde encontrar             Redes                   Apoiar
─────────────             ─────                   ──────
Bode, Pina — Recife/PE     Instagram               → Doar
[endereço completo]        Facebook                → Voluntariar
contato@livroteca…         Rádio "A Voz da Lama"   → Loja
[horário de funcionamento]
```

Linha inferior: copyright, "Site feito por [...]", link **Transparência** (→ `/transparencia`), link para política de privacidade quando existir.

### 2.3 Diálogo "Ajudar"

Diálogo modal acionado por **qualquer botão `Ajudar`** (hero da Home, header opcional, fim de seções, etc.).

Conteúdo do modal — três blocos lado a lado (em mobile, empilhados):

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   DOAR       │  │ VOLUNTARIAR  │  │    LOJA      │
│              │  │              │  │              │
│ ícone livro  │  │ ícone mãos   │  │ ícone sacola │
│ 1 frase      │  │ 1 frase      │  │ 1 frase      │
│              │  │              │  │              │
│  → /doar     │  │ → /voluntar… │  │  → /loja     │
└──────────────┘  └──────────────┘  └──────────────┘
```

Esse mesmo padrão de **três CTAs** é reutilizado como **seção** no fim da Home e da página A Livroteca.

### 2.4 Calendário

Componente reutilizado na Home e em As Atividades.

```
Maio 2026                                      [ ◀ ] [ ▶ ]
┌────┬────┬────┬────┬────┬────┬────┐
│ S  │ T  │ Q  │ Q  │ S  │ S  │ D  │
├────┼────┼────┼────┼────┼────┼────┤
│    │    │  1 │  2 │  3 │  4 │  5 │
│    │    │ ●● │    │ ●  │    │    │
├────┼────┼────┼────┼────┼────┼────┤
│  6 │  7 │  8 │  9 │ 10 │ 11 │ 12 │
│  ● │    │ ●● │    │    │ ●  │    │
└────┴────┴────┴────┴────┴────┴────┘

Próximos eventos
─────────────────
[QUA 8 mai · 16h] Capoeira na quadra              [recorrente]  →
[QUI 9 mai · 19h] Cine Bode — sessão especial     [pontual]     →
[SAB 11 mai · 14h] Mutirão de leitura              [pontual]    →
```

- **Visão padrão**: grade mensal + lista de próximos eventos abaixo.
- Pontos coloridos no dia indicam eventos (cor depende do tipo).
- Clique em um dia → filtra a lista para aquele dia.
- Clique em um evento → vai para a página do artigo/evento.
- Eventos recorrentes aparecem em todas as suas ocorrências (calculadas a partir da regra de recorrência).

### 2.5 Card de artigo

Padrão usado em listas e em "últimas notícias":

```
┌─────────────────────────────────────┐
│ [imagem de capa]                    │
│                                     │
│ [tipo: notícia | evento | projeto] │
│ Título do artigo                    │
│ Resumo curto em 1–2 linhas...       │
│ DATA — autor                        │
└─────────────────────────────────────┘
```

---

## 3. Esqueletos das páginas

### 3.1 Home — `/`

```
┌── HEADER ──────────────────────────────────────────────────┐
│                                                            │
└────────────────────────────────────────────────────────────┘

┌── HERO ────────────────────────────────────────────────────┐
│                                                            │
│  [ imagem grande do Bode / da Livroteca ]                  │
│                                                            │
│  Livroteca Brincante do Pina                               │
│  Cultura, leitura e brincadeira no coração do Bode.        │
│                                                            │
│  [ AJUDAR ]   [ Conhecer a Livroteca → ]                   │
└────────────────────────────────────────────────────────────┘

┌── QUEM SOMOS ──────────────────────────────────────────────┐
│  Texto curto (1–2 parágrafos)                              │
│  → Saber mais sobre A Livroteca                            │
└────────────────────────────────────────────────────────────┘

┌── CALENDÁRIO ──────────────────────────────────────────────┐
│  [ grade mensal + lista de próximos eventos ]              │
│  → Ver todas as atividades                                 │
└────────────────────────────────────────────────────────────┘

┌── ÚLTIMAS NOTÍCIAS ────────────────────────────────────────┐
│  [card] [card] [card]                                      │
│  → Ver tudo                                                │
└────────────────────────────────────────────────────────────┘

┌── CITAÇÃO ─────────────────────────────────────────────────┐
│  "Cada livro é uma carta de alforria."                     │
│  — Kcal Gomes                                              │
└────────────────────────────────────────────────────────────┘

┌── APOIAR (3 CTAs) ─────────────────────────────────────────┐
│  [ DOAR ]   [ VOLUNTARIAR ]   [ LOJA ]                     │
└────────────────────────────────────────────────────────────┘

┌── FOOTER ──────────────────────────────────────────────────┐
└────────────────────────────────────────────────────────────┘
```

Conteúdo-fonte: [LIVRO.md](./LIVRO.md) (Quem somos, citação, CTAs).

### 3.2 A Livroteca — `/a-livroteca`

Página única e longa, estruturada por âncoras (TOC à esquerda em desktop). Conteúdo derivado de [LIVRO.md](./LIVRO.md) e [BODE.md](./BODE.md).

```
HERO  — foto + título "A Livroteca"

§ Quem somos                       (← LIVRO.md)
§ História                         (← LIVRO.md — Kcal, 1997, Machado)
§ Kcal, o fundador                 (← LIVRO.md)
§ Onde estamos: o Bode             (resumo de BODE.md + link "Saber mais")
§ O que fazemos                    (lista de atividades — LIVRO.md)
§ Como nos sustentamos             (3 pilares + CTA Ajudar)
§ Mídia, reconhecimento, parcerias (LIVRO.md)

FOOTER
```

> Decisão pendente: se "O Bode" merece sua própria página `/o-bode` ou fica como seção desta. Recomendação: **começar como seção**; se a seção crescer demais, virar página.

### 3.3 As Atividades — `/as-atividades`

```
HERO — título + 1 frase

§ Esta semana
   [ grid horizontal de eventos da semana corrente ]

§ Calendário
   [ grade mensal + lista de próximos eventos ]

§ Artigos
   Filtros: [Todos] [Notícias] [Projetos] [Eventos recorrentes] [Eventos pontuais]
   [card] [card] [card]
   [card] [card] [card]
   ...
   [ Carregar mais ]

FOOTER
```

Ordem dos artigos: **mais recente primeiro**.

### 3.4 Página de artigo — `/as-atividades/[slug]`

```
HERO  — imagem de capa + tipo (badge) + título + data

§ Resumo (lede)
§ Corpo (markdown)

— Se for evento —
§ Quando: [data/hora] [+ Adicionar ao calendário]
§ Onde: [local]
§ — Se for evento recorrente —
   Próximas ocorrências:
     • Qua 8 mai · 16h
     • Qua 15 mai · 16h
     • Qua 22 mai · 16h

§ Galeria (opcional)
§ Artigos relacionados

FOOTER
```

### 3.5 Doar — `/doar` (esqueleto)

```
HERO — "Apoie a Livroteca"

§ Por que doar           [conteúdo: TBD]
§ Como doar              [conteúdo: TBD — Pix, transferência, doação de livros, materiais]
§ Para onde vai          [conteúdo: TBD]
§ Tira-dúvidas           [conteúdo: TBD]
§ Contato                [email + WhatsApp]

FOOTER
```

### 3.6 Voluntariar — `/voluntariar` (esqueleto)

```
HERO — "Junte-se à Livroteca"

§ Tipos de voluntariado  [presencial no Bode / remoto]
§ Como contribuímos      [áreas: leitura, oficinas, comunicação, design, tradução, tech…]
§ O que esperamos        [conteúdo: TBD]
§ Como se candidatar     [formulário ou email — TBD]
§ Contato                [email + WhatsApp]

FOOTER
```

### 3.7 Loja — `/loja` (teaser)

```
HERO — "Loja da Livroteca" + foto

§ O que é a loja
§ Por que a loja existe   [autofinanciamento — ver LIVRO.md]
§ Produtos em destaque    [3–4 cards puxados da boutique externa via API/feed]
§ [ VISITAR A LOJA → ]    [link externo]

FOOTER
```

> A loja em si vive em outro site (ver [STACK.md](./STACK.md)). Esta página existe para apresentar a loja a quem vem pelo site principal e para canalizar tráfego.

### 3.8 Transparência — `/transparencia`

Página institucional discreta, acessada pelo footer. Existe sobretudo para dar **credibilidade a doadores e parceiros** — quem quer doar verifica antes se a associação é regular.

```
HERO — "Transparência"
       1 frase: "A Livroteca é uma associação sem fins lucrativos.
                 Aqui ficam nossos documentos públicos."

§ Identidade jurídica
   • Estatuto Social                          [PDF]
   • CNPJ / cadastro                          [PDF ou texto]
   • Composição da diretoria atual            [texto]

§ Assembleias gerais
   Lista cronológica (mais recente primeiro):
   • Ata da AG 2026 — convocação ordinária    [PDF]
   • Ata da AG 2025 — convocação ordinária    [PDF]
   • ...

§ Relatórios e prestação de contas
   • Relatório de atividades 2025             [PDF]
   • Demonstrativo financeiro 2025            [PDF]
   • Relatório de atividades 2024             [PDF]
   • ...

§ Parcerias e convênios (se houver)
   • Lista de editais, convênios e patrocínios ativos

§ Contato para dúvidas
   email + WhatsApp

FOOTER
```

**Modelo de cada documento** : título, data, formato (PDF), tamanho, link de download. Documentos hospedados em algum lugar versionado (a definir em STACK.md — provavelmente o próprio repositório do site ou um storage simples).

> Não confundir com **prestação de contas em tempo real** (dashboard de quanto entrou / quanto saiu): isso fica para uma v2 eventual. Aqui é só arquivo institucional.

---

## 4. Modelo de artigo / evento

Todos os conteúdos em `/as-atividades` seguem um único modelo, com **tipo** discriminando o comportamento.

### 4.1 Campos comuns (todos os tipos)

| Campo          | Tipo                 | Obrigatório | Notas                                              |
| -------------- | -------------------- | :---------: | -------------------------------------------------- |
| `title`        | string               |     ✓       | Título no idioma.                                  |
| `slug`         | string (kebab-case)  |     ✓       | URL: `/as-atividades/[slug]`.                      |
| `type`         | enum                 |     ✓       | Ver §4.2.                                          |
| `excerpt`      | string (≤ 240 char)  |     ✓       | Lede / preview de card.                            |
| `cover_image`  | imagem               |     ✓       | Usada em cards e no hero do artigo.                |
| `body`         | markdown / blocos    |     ✓       | Corpo do artigo.                                   |
| `published_at` | datetime             |     ✓       | Define ordenação em listas.                        |
| `language`     | enum (`pt`, `en`)    |     ✓       | Versão linguística.                                |
| `translations` | refs                 |             | Link para versões em outros idiomas.               |
| `tags`         | string[]             |             | Livre.                                             |
| `gallery`      | imagem[]             |             | Galeria opcional.                                  |
| `related`      | refs                 |             | Outros artigos relacionados.                       |

### 4.2 Tipos (`type`)

| Valor               | Aparece no calendário? | Comportamento                                                     |
| ------------------- | :--------------------: | ----------------------------------------------------------------- |
| `noticia`           |          ✗             | Post normal. Lista cronológica.                                   |
| `projeto`           |          ✗             | Página persistente (parceria, projeto longo).                     |
| `evento_pontual`    |          ✓             | Aparece **uma vez** no calendário (data/hora únicas).             |
| `evento_recorrente` |          ✓             | Aparece em **todas as ocorrências** geradas pela regra `rrule`.   |

### 4.3 Campos de evento

Aplicam-se a `evento_pontual` e `evento_recorrente`:

```yaml
event:
  start: datetime          # obrigatório
  end: datetime            # opcional
  location: string         # opcional (ex: "Quadra da Livroteca")
  recurrence:              # apenas se evento_recorrente
    rule: string           # iCal RRULE — ex: "FREQ=WEEKLY;BYDAY=WE;BYHOUR=16"
    until: date            # opcional (fim da recorrência)
    exceptions: date[]     # datas em que a ocorrência é cancelada
```

### 4.4 Decisão importante: 1 artigo = 1 atividade recorrente

Para uma atividade como "**Capoeira toda quarta-feira**":

- **um único artigo** descreve a atividade (o quê, com quem, para quem);
- a regra de recorrência gera as ocorrências no calendário;
- cada ponto no calendário aponta para **a mesma página de artigo**;
- relatos de sessões específicas (fotos, comentários) podem entrar como **galeria** ou como **artigos do tipo `noticia`** que referenciam a atividade.

Isso evita inflação de páginas e mantém o conteúdo enxuto.

---

## 5. Conteúdo, idiomas e tradução

- Todo conteúdo é criado primeiro em **português**.
- A versão **inglesa** é uma tradução vinculada via `translations`.
- Se uma página não estiver traduzida, o switcher PT/EN avisa ("ainda não traduzido") e mantém o usuário na versão portuguesa, em vez de quebrar.
- Strings de UI (botões, labels, navegação) ficam em arquivos de tradução separados, não no CMS.

---

## 6. Acessibilidade e mobile

- **Mobile-first** — a maioria do público acessa por celular.
- Imagens com `alt` obrigatório.
- Contraste mínimo AA.
- Navegação por teclado funcional em todo o site, incluindo o calendário.
- O diálogo "Ajudar" deve ser fechável por `Esc` e por clique fora.

---

## 7. O que **não** está no escopo desta primeira versão

Decisões deliberadas para manter o MVP enxuto:

- Sistema de comentários nos artigos.
- Newsletter (pode entrar depois — ver §2.2 sobre footer).
- Fórum / área de membros.
- Sistema de busca full-text (lista paginada e filtros bastam por enquanto).
- Pagamento direto na página Doar — usaremos Pix/links externos.
- Login de usuário.

Esses itens vão para um backlog "v2".

---

## 8. Decisões pendentes

- [ ] **O Bode**: seção em `/a-livroteca` ou página própria `/o-bode`?
- [ ] **Loja na navegação**: deve ficar no menu principal ou só no diálogo Ajudar / footer?
- [ ] **Newsletter** no footer: sim agora ou na v2?
- [ ] **Domínio**: livroteca.org? livrotecabrincante.com.br? — decidir junto com STACK.md.
- [ ] **CMS** vs. arquivos markdown — decidir em STACK.md, mas afeta workflow editorial.
