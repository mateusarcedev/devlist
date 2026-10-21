# Formato do relatório HTML

Um arquivo HTML autocontido no diretório temporário do sistema, todo em pt-BR. Tailwind e Mermaid vêm de CDN.
Mermaid cuida do que tem forma de grafo (fluxo do orquestrador, estados do handoff, diamante dos grafos); divs e
SVG inline cuidam dos visuais editoriais (fonte canônica em leque, cortes, massa). Misture os dois: só Mermaid
fica genérico.

## Esqueleto

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Orquestração de agentes · {{nome do repo}}</title>
    <script src="https://cdn.tailwindcss.com/3.4.17"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "strict" });
    </script>
    <style>
      /* o que o Tailwind não cobre bem */
      .aponta { stroke-dasharray: 4 4; }
      .duplicada { stroke: #dc2626; }
      .canonica { background: linear-gradient(135deg, #0f172a, #1e293b); color: #f8fafc; }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="mapa">...</section>
      <section id="camadas" class="space-y-10">...</section>
      <section id="perguntas">...</section>
      <section id="primeira-fatia">...</section>
    </main>
  </body>
</html>
```

Escape `<`, `>` e `&` em tudo que vem do repositório (paths, trechos de regra), inclusive nos rótulos dentro de
`<pre class="mermaid">`. Mantenha as versões exatas dos dois CDNs: versão flutuante executa código novo sem
revisão numa página com conteúdo do repositório.

## Cabeçalho

Nome do repositório, data e legenda compacta: caixa grossa escura = fonte canônica · caixa fina = espelho ou
wrapper · linha tracejada = aponta para · vermelho = regra duplicada, encanamento feito por agente ou lacuna
(doc órfão, arquivo vazio, check que falta) · âmbar = pendência do dono.

Logo abaixo, o **placar**: uma faixa com as 10 camadas como chips numerados, coloridos pelo estado (`presente` =
esmeralda, `parcial` = âmbar, `ausente` = slate), cada um com âncora para o seu card. Sem parágrafo de introdução.

## Mapa da orquestração

Um card largo com um `flowchart LR` em Mermaid da ordem do orquestrador proposta, com os papéis e procedimentos
**derivados deste repositório**: papel em caixa arredondada, procedimento em `[[subrotina]]`, review e QA marcados
como só leitura, transversais ligados por aresta tracejada ("só quando o escopo pede"). Embaixo, uma linha:
`N papéis · M procedimentos · K transversais`.

## Card de camada

Os diagramas carregam o peso. Texto curto, simples, no vocabulário de [ARQUITETURA.md](ARQUITETURA.md).

Cada camada é um `<article id="camada-N">`:

- **Título**: curto, nomeia a mudança (ex.: "Uma fonte canônica para as regras de banco").
- **Badges**: estado (`Presente` · `Parcial` · `Ausente`) e prioridade (`Essencial` = esmeralda, `Recomendado` =
  âmbar, `Opcional` = slate).
- **Evidência**: lista monoespaçada (`font-mono text-sm`) dos arquivos que comprovam o estado. Ausente: "nenhum
  arquivo".
- **Hoje / Proposta**: a peça central. Duas colunas lado a lado. Padrões abaixo.
- **Problema**: uma frase. O que atrapalha hoje.
- **Proposta**: uma frase. O que muda.
- **Ganhos**: bullets de até 6 palavras.
- **Pendência** (se houver): uma linha numa caixa âmbar, com o que depende do dono.
- **Decisão registrada** (se houver): uma linha numa caixa âmbar, ex.: _"contradiz a decisão de 2026-03-02, mas
  vale reabrir porque…"_.

Camada `presente` sem lacuna vira card compacto: título, badges, evidência e "nada a fazer". Sem diagrama.
Presente com pendência (ex.: estrutura pronta que nunca rodou de verdade): card compacto com a caixa de pendência
no lugar de "nada a fazer".

Sem parágrafos de explicação. Se o diagrama precisa de um parágrafo para ser entendido, redesenhe o diagrama.

## Padrões de diagrama

Escolha o padrão que serve à camada e varie: diagramas iguais em todos os cards é defeito. Use os números reais
do inventário (linhas, contagens), nunca valores ilustrativos.

### Fonte canônica em leque (camadas 3 e 4)

Hoje: a mesma regra em várias caixas (`CLAUDE.md`, `.cursor/rules/...`, prompt solto), com marcas vermelhas de
"duplicada" ligando as cópias. Proposta: uma caixa grossa `.canonica` com o `SKILL.md`, e linhas tracejadas finas
saindo para o espelho em `.claude/skills/`, o wrapper em `.claude/agents/` e "outras ferramentas leem direto",
todas em cinza claro.

### Corte transversal (camadas 1 e 2)

Faixas horizontais empilhadas (`h-12 border-l-4`). Hoje: uma faixa alta "`CLAUDE.md`: tudo", lida inteira em toda
sessão. Proposta: faixa fina `AGENTS.md` no topo e, recuadas abaixo, `docs/domain`, `docs/technical`,
`docs/agents`, `docs/archive`, com o rótulo "lido sob demanda". Rules aparecem como setas finas de uma área para o
doc dela.

### Diagrama de massa (camada 1)

Uma barra por arquivo de entrada, altura proporcional às linhas reais. Hoje: barra alta. Proposta: barra curta do
`AGENTS.md` ao lado de barras tracejadas dos docs que só carregam quando preciso.

### Fluxo em Mermaid (camadas 5 e 7)

`flowchart` para despacho de papéis e para o diamante dos grafos (fan-out → reduce → céticos → veredito). Embrulhe
num card Tailwind. `classDef` para pintar de vermelho a aresta em que um agente faz encanamento hoje, e de escuro
o nó que vira código.

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      L1[lente security] --> R[[merge em código]]
      L2[lente perf] --> R
      R --> C1[cético 1] & C2[cético 2] & C3[cético 3]
      C1 & C2 & C3 --> V[[voto ≥ 2/3 em código]]
      classDef codigo fill:#0f172a,color:#f8fafc;
      class R,V codigo
  </pre>
</div>
```

### Máquina de estados (camada 6)

`stateDiagram-v2` do handoff: implement → review → browser_qa → human_merge, com `failed` voltando para
implement e `blocked` parando em "decisão humana". Hoje costuma ser "estado no chat": uma caixa só, sem setas.

### Escada de tiers (camada 8)

Quatro degraus (`fast` → `frontier`) desenhados com divs, cada um com os papéis e nós do repositório como chips.
Hoje: chips com nomes de modelo espalhados pelos arquivos, em vermelho.

### Esteira do gate (camada 9)

Chips em linha, na ordem em que o gate roda. Comando que já existe: borda sólida. Check novo: contorno esmeralda.
Faltando: tracejado âmbar com "pendência".

## Perguntas ao dono

Um card com só as perguntas que o inventário não respondeu (ferramentas de IA em uso, handoff agora, gate
ausente, e2e sem mapa...). Cada uma numa linha, com a sua recomendação.

## Primeira fatia

Um card maior: quais camadas construir primeiro, uma frase com o porquê e links para os cards. Só isso.

## Estilo

- Editorial, não painel corporativo. Muito espaço em branco. Serifa opcional nos títulos (`font-serif` combina com
  stone/slate).
- Cor com parcimônia: um acento (esmeralda ou índigo), vermelho para duplicação e encanamento em agente, âmbar
  para pendência.
- Diagramas com ~320px de altura, para Hoje e Proposta caberem lado a lado sem rolar.
- Rótulos dentro dos diagramas em `text-xs uppercase tracking-wider`, para lerem como esquema, não como interface.
- Os únicos scripts são o Tailwind e o Mermaid. O resto é estático.

## Tom

Português simples e direto, com os substantivos da arquitetura tirados de [ARQUITETURA.md](ARQUITETURA.md).

**Use exatamente:** fonte canônica, espelho, papel, procedimento, wrapper, orquestrador, handoff, gate, âncora, nó,
aresta, encanamento, cético, tier.

**Nunca substitua:** "agente especialista" ou "persona" (por papel) · "workflow" ou "passo a passo" (por
procedimento) · "agente" (por wrapper, quando é o arquivo) · "validação" (por gate ou âncora) · nome de modelo
(por tier) · "lógica" (por encanamento).

**Frases no estilo:**

- "Regra de migration copiada em 3 lugares: `CLAUDE.md`, `.cursor/rules/db.mdc`, prompt do Codex."
- "Review herda o raciocínio de quem escreveu: falta contexto isolado."
- "Dedupe feito pelo agente: vira encanamento em script."
- "Uma fonte canônica; espelho e wrapper só apontam."

**Ganhos** nomeiam o efeito no vocabulário: _"uma fonte canônica por regra"_, _"review em contexto isolado"_,
_"gate decide o pronto"_, _"encanamento sai do prompt"_, _"troca de modelo sem editar skill"_. Nunca _"mais
organizado"_, _"melhor manutenção"_ ou _"mais escalável"_: não dizem o que muda.

Sem rodeio, sem "vale notar que…". Se uma frase pode ser bullet, vira bullet. Se um bullet pode sair, sai.