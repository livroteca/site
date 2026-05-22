---
title: Sistema de design — Livroteca Brincante do Pina
description: Tokens de cor, tipografia, espaçamento, e regras de componentes. Pensado para ser lido e aplicado por um LLM.
language: pt-BR
status: rascunho
---

# Sistema de design — Livroteca Brincante do Pina

> Documento operacional. Cada token tem nome estável (`--cor-primaria`, `text-display-l`, etc.) que **deve ser citado tal e qual** em CSS, código e prompts. Regra de ouro: se você está hesitando em uma decisão de design, **olhe a moodboard** (`/moodboard`) e pergunte "isso parece um cartaz de festa popular pernambucana?".

---

## 1. Princípios

1. **Cor antes de ornamento.** A identidade vibra primeiro pelas cores fortes (azul/vermelho/amarelo/verde de Pernambuco). Texturas xilográficas e cordel são acentos, não a base.
2. **Tipografia chunky, espaço generoso.** O logo dita o tom: bold condensado em caixa-alta para títulos. Corrido respira em torno.
3. **Festivo, mas com peso documental.** Páginas de festa (Home, Atividades) podem ser exuberantes. Páginas políticas (Bode, História) ficam mais sóbrias e legíveis.
4. **Mobile-first.** A maioria do público acessa por celular. Tudo decide-se primeiro a 360 px.
5. **Feito-à-mão.** Bordas, divisórias e ícones podem ter imperfeição proposital — não simular, mas evocar a mão. Evitar visual SaaS / startup.
6. **Acessível por padrão.** Contraste AA mínimo, foco visível, hit-areas ≥ 44 px, alt em todas as imagens.

---

## 2. Identidade visual

### 2.1 Logo

O logo (ver `moodboard/logolivro.png`) é o único elemento gráfico **fixo** do sistema:

- ícone de **livro aberto** + bloco de texto "LIVROTECA / BRINCANTE / DO PINA" em três linhas;
- monocromático (preto sobre claro **ou** branco sobre escuro — nunca colorido);
- altura mínima: **32 px** em digital;
- área de respiro mínima ao redor: igual à altura de uma linha do texto do logo.

**Não fazer**: estirar, recolorir, sobrepor a fundos com baixo contraste, aplicar sombras, recortar partes.

### 2.2 Marca falada

- **Nome completo**: *Livroteca Brincante do Pina*
- **Forma curta** (em corpo de texto, depois da primeira menção): *a Livroteca*
- **Nunca**: "LBP", "Brincante", "livroteca" minúsculo.

---

## 3. Cores

Paleta inspirada na **bandeira de Pernambuco** + paleta vernacular de cores fortes (ver `moodboard/images.jpg`, `Bandeira_de_Pernambuco.svg.png`).

### 3.1 Cores de marca (tokens primários)

| Token              | Hex       | Uso                                                            |
| ------------------ | --------- | -------------------------------------------------------------- |
| `--cor-azul`       | `#003F87` | Primária. Fundo de hero, header, botões principais.            |
| `--cor-vermelho`   | `#CE1126` | Destaques fortes (alertas, eventos pontuais, pull-quotes).     |
| `--cor-amarelo`    | `#FFD100` | Acento e energia. CTA secundário, highlights, calendário.      |
| `--cor-verde`      | `#078930` | Acento "vivo" — natureza, projetos, eventos recorrentes.       |
| `--cor-preto`      | `#1A1A1A` | Texto, ícones, traços xilográficos.                            |
| `--cor-papel`      | `#FAF7F0` | Fundo padrão (não branco puro — sensação de papel cordel).     |
| `--cor-branco`     | `#FFFFFF` | Cards, modais, contraste sobre fundos coloridos.               |

### 3.2 Cores funcionais

| Token                | Hex       | Uso                                                |
| -------------------- | --------- | -------------------------------------------------- |
| `--cor-fundo`        | `#FAF7F0` | = `--cor-papel`                                    |
| `--cor-superficie`   | `#FFFFFF` | Cards, modais.                                     |
| `--cor-texto`        | `#1A1A1A` | Texto corrido sobre fundo claro.                   |
| `--cor-texto-fraco`  | `#5A5A5A` | Metadados, captions, datas.                        |
| `--cor-borda`        | `#1A1A1A` | Bordas marcantes (estilo xilo). Sempre com peso ≥1. |
| `--cor-borda-suave`  | `#E2DCCC` | Divisórias discretas internas.                     |
| `--cor-link`         | `#003F87` | = `--cor-azul`                                     |
| `--cor-link-hover`   | `#CE1126` | = `--cor-vermelho`                                 |

### 3.3 Tipos de artigo / evento → cor

Mapa **fixo** entre `type` (ver [STRUCTURE.md §4](./STRUCTURE.md)) e cor de badge / ponto no calendário:

| `type`              | Cor                  | Token              |
| ------------------- | -------------------- | ------------------ |
| `noticia`           | azul                 | `--cor-azul`       |
| `projeto`           | verde                | `--cor-verde`      |
| `evento_pontual`    | vermelho             | `--cor-vermelho`   |
| `evento_recorrente` | amarelo              | `--cor-amarelo`    |

### 3.4 Regras de uso

- **Nunca** combinar duas cores primárias saturadas como texto + fundo (azul sobre vermelho = ilegível). Usar sempre **claro/escuro** com cor.
- Cor saturada como **fundo de seção** = OK; cor saturada como **fundo da página inteira** = ❌.
- Texto sobre fundo colorido: usar `--cor-papel` ou `--cor-branco`. Verificar contraste AA mínimo (4.5:1).
- Amarelo (`--cor-amarelo`) **nunca** para texto pequeno sobre fundo claro — só como fundo, badge ou highlight de fundo.

---

## 4. Tipografia

A direção do logo manda: **chunky, condensado, todo-em-caixa-alta para display**. Corpo de texto compensa com legibilidade limpa.

### 4.1 Famílias

| Token                | Família              | Uso                                                    |
| -------------------- | -------------------- | ------------------------------------------------------ |
| `--font-display`     | **Anton**            | Títulos, hero, badges. Caixa-alta. Variante única.     |
| `--font-corpo`       | **Inter**            | Texto corrido, UI, formulários.                        |
| `--font-acento`      | **Caveat** (manuscrita) | Citações, marca-páginas, "à mão". Uso pontual.       |

Todas via **Google Fonts** (gratuitas, performance ok, multilíngue).

> Fallback stack:
> - display: `Anton, "Archivo Black", Impact, sans-serif`
> - corpo:   `Inter, "Helvetica Neue", system-ui, sans-serif`
> - acento:  `Caveat, "Comic Sans MS", cursive`

### 4.2 Escala (mobile → desktop)

| Token                  | Mobile | Desktop | Família  | Peso | Caixa  | Leading |
| ---------------------- | ------ | ------- | -------- | ---- | ------ | ------- |
| `--text-display-xl`    | 40 px  | 72 px   | display  | 400  | upper  | 0.95    |
| `--text-display-l`     | 32 px  | 56 px   | display  | 400  | upper  | 1.00    |
| `--text-display-m`     | 24 px  | 36 px   | display  | 400  | upper  | 1.05    |
| `--text-titulo`        | 22 px  | 28 px   | corpo    | 700  | normal | 1.20    |
| `--text-subtitulo`     | 18 px  | 20 px   | corpo    | 600  | normal | 1.30    |
| `--text-corpo`         | 16 px  | 17 px   | corpo    | 400  | normal | 1.55    |
| `--text-pequeno`       | 14 px  | 14 px   | corpo    | 400  | normal | 1.50    |
| `--text-meta`          | 12 px  | 12 px   | corpo    | 500  | upper  | 1.40    |
| `--text-citacao`       | 22 px  | 28 px   | acento   | 400  | normal | 1.40    |

### 4.3 Regras

- **Display em UPPERCASE** sempre, com `letter-spacing: 0.01em`.
- Linhas de display **nunca** ultrapassam ~10 palavras — quebrar manualmente quando precisar.
- Corpo de texto com **largura máxima de leitura**: `64ch` (~640 px). Ler em coluna estreita é mais confortável que em coluna larga.
- Citações longas: `--text-citacao` (Caveat), com aspas tipográficas curvas e atribuição em `--text-meta`.

---

## 5. Espaçamento e grid

### 5.1 Escala (base 4 px)

| Token         | Valor   |
| ------------- | ------- |
| `--space-1`   | 4 px    |
| `--space-2`   | 8 px    |
| `--space-3`   | 12 px   |
| `--space-4`   | 16 px   |
| `--space-6`   | 24 px   |
| `--space-8`   | 32 px   |
| `--space-12`  | 48 px   |
| `--space-16`  | 64 px   |
| `--space-24`  | 96 px   |
| `--space-32`  | 128 px  |

### 5.2 Breakpoints

| Token         | min-width | Notas                                  |
| ------------- | --------- | -------------------------------------- |
| `--bp-sm`     | 480 px    | Celular grande / tablet pequeno.       |
| `--bp-md`     | 768 px    | Tablet, ponto de virada para 2 colunas. |
| `--bp-lg`     | 1024 px   | Desktop normal.                        |
| `--bp-xl`     | 1280 px   | Desktop largo. Não esticar mais.       |

### 5.3 Container

- Largura máxima do conteúdo: `1200 px`.
- Margens laterais: `--space-4` (mobile), `--space-8` (md), `--space-16` (lg).
- Grid de colunas: 4 (mobile), 8 (md), 12 (lg). Gap padrão: `--space-6`.

### 5.4 Espaçamento vertical entre seções

- Entre blocos dentro de uma seção: `--space-6` a `--space-8`.
- Entre seções: `--space-16` (mobile), `--space-24` (lg).
- Hero → primeira seção: `--space-12` (mobile), `--space-16` (lg).

---

## 6. Forma, raio e elevação

### 6.1 Bordas

A estética xilográfica pede **traço marcante**, não sombras suaves. Preferir:

| Token              | Valor              |
| ------------------ | ------------------ |
| `--borda-fina`     | `1px solid var(--cor-borda)`     |
| `--borda-grossa`   | `2px solid var(--cor-borda)`     |
| `--borda-xilo`     | `3px solid var(--cor-borda)` (cards de destaque, modais) |

### 6.2 Raios

Raio padrão **pequeno** — vivência mais "papel cortado" do que "vidro arredondado".

| Token              | Valor   |
| ------------------ | ------- |
| `--radius-zero`    | 0       |
| `--radius-sm`      | 4 px    |
| `--radius-md`      | 8 px    |
| `--radius-pilula`  | 999 px  |

Botões: `--radius-md`. Cards: `--radius-sm`. Badges: `--radius-pilula`. Modais: `--radius-md`.

### 6.3 Sombras

Em vez de sombras suaves, **deslocamento de bloco** (estilo cartaz/cordel):

| Token                  | Valor                                                     |
| ---------------------- | --------------------------------------------------------- |
| `--sombra-bloco-sm`    | `4px 4px 0 0 var(--cor-borda)`                            |
| `--sombra-bloco-md`    | `6px 6px 0 0 var(--cor-borda)`                            |
| `--sombra-bloco-cor`   | `6px 6px 0 0 var(--cor-amarelo)` (variante festiva)       |

Sombras suaves (`box-shadow: 0 8px 24px rgba(0,0,0,0.1)`) são **proibidas** — destoam do sistema.

### 6.4 Variante de elevação — **Riso (default)** + Linha (switch)

Iteramos quatro variantes no `template/index.html` (Bloco / Papel / Linha / Riso). **Decisão final** :

- **`Riso` é a variante padrão** : aproxima a estética da serigrafia (riso-print), com camadas de cor levemente desalinhadas e granulado sutil. Casa com a inspiração xilo/cordel do projeto.
- **`Linha` permanece disponível como variante alternativa** : sem sombras, só traço grosso. Mais sóbria, útil para contexto institucional (ex. página `/transparencia`) ou se Riso for percebida como visualmente "carregada" demais por algum usuário.
- O switch entre as duas pode ser exposto como preferência de leitura (a definir na implementação), ou ficar apenas como ferramenta de design.
- **`Bloco` e `Papel` foram descartadas** (efeito retro-gaming / falta de personalidade respectivamente).

---

## 7. Texturas e elementos decorativos

Inspirados em `moodboard/3.jpg` (xilo Maria Xilo), `moodboard/bandeiras-xilogravura.jpg`, `moodboard/images-1.jpg` (Pão e Tinta Quiteria).

### 7.1 Onde usar

- **Bandeirinhas (bunting)** entre seções festivas (Home, Atividades, Loja).
- **Divisórias xilográficas** (linhas onduladas, traço grosso) entre blocos longos.
- **Selos / carimbos** (círculos com texto em volta) para badges especiais ("evento da semana", "novo").
- **Sol radiante** estilo xilo como acento no hero.
- **Cactos, palafitas, peixes** em ilustrações de seções específicas (Bode, projetos ambientais).

### 7.2 Onde **não** usar

- Páginas Doar, Voluntariar — manter mais sóbrias.
- Páginas longas de leitura — não quebrar o ritmo do texto com texturas pesadas.
- Calendário e formulários — interface limpa.

### 7.3 Estilo dos elementos decorativos

- Preto sobre claro ou branco sobre escuro — **monocromáticos**.
- Traço grosso, contraste alto.
- Sempre como **SVG** (não PNG raster) para escalar sem perder qualidade.
- Aceitar imperfeição — linha tremida, cantos vivos.

---

## 8. Iconografia

- **Estilo**: traço, monocromático, ~2 px de espessura, cantos quadrados ou ligeiramente arredondados.
- **Set**: [Lucide](https://lucide.dev) como base utilitária; **ícones decorativos** específicos (livro, brinquedo, peixe, palafita, capoeira) podem ser desenhados sob medida em SVG xilo.
- **Tamanhos**: 16, 20, 24 px (`--icone-sm`, `--icone-md`, `--icone-lg`).
- Ícones em CTAs alinhados à baseline do texto, nunca maiores que ele.

---

## 9. Componentes

### 9.1 Botão

```
[ AJUDAR ]
```

Variantes:

| Variante      | Fundo            | Texto              | Borda             | Sombra              |
| ------------- | ---------------- | ------------------ | ----------------- | ------------------- |
| `primario`    | `--cor-azul`     | `--cor-papel`      | `--borda-grossa`  | `--sombra-bloco-md` |
| `secundario`  | `--cor-amarelo`  | `--cor-preto`      | `--borda-grossa`  | `--sombra-bloco-md` |
| `vermelho`    | `--cor-vermelho` | `--cor-papel`      | `--borda-grossa`  | `--sombra-bloco-md` |
| `texto`       | transparente     | `--cor-azul`       | nenhuma           | nenhuma             |

- **Padding**: `--space-3 --space-6` (em token: `12px 24px`).
- **Tipografia**: `--font-display`, `1rem`, UPPERCASE, `letter-spacing: 0.04em`.
- **Hover**: deslocar `2px 2px` para baixo-direita (sombra encolhe — efeito "apertando o botão").
- **Focus**: anel `--cor-amarelo` 3 px.
- **Disabled**: opacidade 0.5, cursor `not-allowed`.
- **Hit area mínima**: 44 × 44 px.

### 9.2 Card de artigo

```
┌─ borda-grossa ───────────────────┐
│ [imagem 16:9]                    │
├──────────────────────────────────┤
│ [BADGE TIPO]                     │
│ TÍTULO EM DISPLAY                │
│ Resumo em corpo, 2–3 linhas...   │
│ DATA · AUTOR                     │
└──────────────────────────────────┘
```

- Fundo: `--cor-superficie`.
- Borda: `--borda-grossa`.
- Raio: `--radius-sm`.
- Sombra: `--sombra-bloco-sm`.
- Hover: sombra cresce para `--sombra-bloco-md`, card desloca `-2px`.
- Badge no canto superior esquerdo, **cor depende do tipo** (ver §3.3).

### 9.3 Calendário

- Grade mensal: células quadradas, borda fina entre dias.
- Dia atual: fundo `--cor-amarelo`, borda grossa.
- Dias com evento: pontos coloridos abaixo do número (cor por tipo, ver §3.3). Máximo 3 pontos visíveis; 4º vira "+N".
- Dia selecionado: borda `--borda-xilo` em vermelho.
- Cabeçalho do mês: `--text-display-m`, com setas `◀ ▶` em botões de ícone.
- Lista de eventos abaixo da grade: cada item é um "mini-card" horizontal com badge de cor à esquerda.

### 9.4 Header

- Altura: `64 px` mobile / `80 px` desktop.
- Fundo: `--cor-papel` (sticky, com borda inferior `--borda-fina` ao fazer scroll).
- Logo à esquerda, navegação centro/direita, **PT/EN** no extremo direito.
- Item ativo: sublinhado grosso (3 px) na cor `--cor-vermelho`.
- Mobile: hambúrguer abre painel lateral full-height; PT/EN visível ao lado do hambúrguer mesmo fechado.

### 9.5 Footer

- Fundo: `--cor-azul`. Texto: `--cor-papel`.
- Três colunas em desktop (Onde / Redes / Apoiar), empilhadas em mobile.
- Tipografia: títulos em `--font-display` `--text-display-m`, listas em `--text-corpo`.
- Linha de bandeirinhas xilográficas no topo do footer (decoração).

### 9.6 Diálogo "Ajudar"

- Modal centralizado, `max-width: 720px`.
- Fundo: `--cor-superficie`. Borda: `--borda-xilo`. Sombra: `--sombra-bloco-md`.
- Três cards lado a lado (empilhados em < md), cada um com cor e ícone próprios:

| CTA          | Cor de fundo do card | Ícone          |
| ------------ | -------------------- | -------------- |
| Doar         | `--cor-vermelho`     | livro / coração |
| Voluntariar  | `--cor-verde`        | mãos           |
| Loja         | `--cor-amarelo`      | sacola         |

- Fechar: botão `×` no canto superior direito + `Esc` + clique fora.

### 9.7 Hero

- Imagem grande (foto da Livroteca / do Bode) com **overlay** azul-escuro (rgba(0, 63, 135, 0.65)) para contraste do texto.
- Texto em `--cor-papel`, display em `--text-display-xl`.
- Bandeirinhas xilográficas no rodapé do hero (acento decorativo).
- Botão `Ajudar` em variante `secundario` (amarelo) — alto contraste sobre o azul.

### 9.8 Badges

- Pílula com `--radius-pilula`.
- Tipografia: `--text-meta`, UPPERCASE.
- Padding: `--space-1 --space-3`.
- Cor: depende do `type` (§3.3). Texto: `--cor-papel` em fundos azul/vermelho/verde, `--cor-preto` em fundo amarelo.

### 9.9 Formulários

- Inputs com `--borda-grossa`, fundo `--cor-superficie`, padding `--space-3 --space-4`.
- Label sempre **acima** do input, em `--text-meta`.
- Foco: borda azul + anel amarelo 3 px.
- Erro: borda vermelha + texto de erro em vermelho abaixo.

---

## 10. Imagens

### 10.1 Tratamento

- Fotos da comunidade: **a cor real é o suficiente**, não aplicar duotone genérico.
- Pode-se aplicar um **leve grão** ou textura de papel para coesão com a estética cordel — discreto, opcional.
- Imagens de hero: aspect ratio `16:9` em desktop, `4:5` em mobile (priorizar a verticalidade).
- Cards: aspect ratio `16:9`.

### 10.2 Alt e legendas

- `alt` obrigatório, descritivo (não "imagem" / "foto").
- Legenda visível quando agregue contexto (autor da foto, momento do evento, etc.).

### 10.3 Performance

- Servir em formatos modernos (`webp`, `avif`).
- Lazy-load fora do viewport.
- Tamanhos responsivos com `srcset`.

---

## 11. Modo claro / escuro

**Decisão**: por enquanto, **só modo claro**. O sistema é otimizado para fundo `--cor-papel`. Modo escuro pode entrar na v2 e exigirá redefinir os tokens de superfície e texto.

---

## 12. Acessibilidade

- Contraste mínimo AA (4.5:1 para texto, 3:1 para texto grande).
- Foco visível em todos os elementos interativos: anel amarelo 3 px, offset 2 px.
- `prefers-reduced-motion`: desligar animações, manter transições essenciais (200 ms max).
- Hierarquia de headings respeitada (`h1` único por página, `h2`, `h3`, sem pular níveis).
- `lang="pt-BR"` ou `lang="en"` no `<html>`.
- Idioma da página declarado também no atributo `lang` em blocos com idioma estrangeiro inline.

---

## 13. Decisões pendentes

- [ ] Confirmar família tipográfica do logo atual (Anton é uma aproximação — se a fonte original existir, usá-la).
- [ ] Decidir se o footer fica em azul cheio ou em papel + faixa azul.
- [ ] Definir sub-paleta para a Loja (boutique externa) — ela pode herdar parcialmente este sistema.
- [ ] Validar paleta com Kcal e o coletivo da Livroteca.
- [ ] Encomendar ou desenhar o jogo de **selos/ilustrações xilográficas** específicos da Livroteca (livro, palafita, peixe, capoeirista, brincadeira).
