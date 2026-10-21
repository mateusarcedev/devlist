---
name: agent-orchestration-setup
description: Diagnostica um repositório contra a arquitetura de orquestração de agentes (skills canônicas, subagentes, rules, orquestrador, handoff, grafos, roteamento de modelos e checks), apresenta o plano num relatório HTML visual em pt-BR e, com o ok do dono, constrói camada por camada a partir das skills, docs e comandos do próprio repositório, sem copiar arquivos. Use para replicar a configuração de agentes em outro sistema.
disable-model-invocation: true
---

# Agent Orchestration Setup

Compara o repositório com a arquitetura alvo de [ARQUITETURA.md](ARQUITETURA.md), mostra o diagnóstico e o plano
num relatório HTML e, depois do ok do dono, constrói só as camadas aprovadas. Nada vem de outro projeto: cada
repositório tem as suas skills e rules, então tudo sai do próprio repositório.

**Sempre em pt-BR**, com acentuação correta: relatório, perguntas, docs, skills e rules geradas. Identificadores,
comandos e paths ficam como estão.

## Uso

- Claude Code em qualquer repositório: copie esta pasta para `~/.claude/skills/` e rode
  `/agent-orchestration-setup` na raiz do repositório alvo.
- Outras ferramentas (Codex, Gemini, OpenCode): copie a pasta para o diretório de skills da ferramenta ou para
  `.agents/skills/` do alvo e peça para o agente seguir este `SKILL.md`.

## Princípios

- Uma fonte canônica por regra; o resto aponta para ela.
- Agnóstico de ferramenta: o mesmo markdown serve a todas; o específico de uma ferramenta é wrapper fino.
- Julgamento no agente, encanamento no código: dedupe, contagem, voto, roteamento e validação rodam em script.
- "Pronto" é gate determinístico verde, não o agente dizendo que terminou.
- Nada inventado: todo comando, path e regra tem um arquivo do repositório como evidência. O que faltar vira
  pendência do dono. Sem gate de qualidade, não crie um.

## Processo

### 1. Inventário — só leitura

Se o dono indicou um foco (uma camada, uma dor), comece por ele. Leia antes
`docs/agents/designs/orquestracao-decisoes.md`, se existir: são decisões que esta skill não rediscute.

Despache um subagente só de leitura (tier `balanced`) para percorrer o repositório; sem subagentes, faça inline.
Ele devolve, para cada camada de [ARQUITETURA.md](ARQUITETURA.md): estado (`presente` · `parcial` · `ausente`),
evidência (arquivos) e o que existe hoje. Levante também:

- stack e gerenciador (`package.json` + lockfile, `pyproject.toml`, `go.mod`, `Cargo.toml`, `composer.json`...);
- comandos que já existem e podem compor o gate (scripts, `Makefile`, o que a CI roda);
- paths sensíveis: auth/sessão, permissões/ACL, pagamento, schema/migrations, segredos/cripto, webhooks;
- docs normativos ativos (planos e histórico não contam) e specs e2e com o que cada uma cobre;
- ferramentas de IA em uso: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.codex/`, `.opencode/`, `.cursor/`,
  `.github/copilot-instructions.md`;
- regras, skills e prompts que já existem e vão migrar para a fonte canônica, incluindo os duplicados entre
  ferramentas;
- números reais para os diagramas: linhas do ponto de entrada atual, quantas regras aparecem em mais de um lugar.

Derive os papéis e procedimentos das áreas reais do repositório, não de uma lista pronta, cada um com o arquivo
que justifica.

### 2. Relatório HTML

Escreva um HTML autocontido no diretório temporário do sistema, para nada cair no repositório: `$TMPDIR`, com
fallback para `/tmp` (`%TEMP%` no Windows), em `<tmp>/orquestracao-agentes-<timestamp>.html`. Abra para o dono
(`start` no Windows, `open` no macOS, `xdg-open` no Linux) e informe o caminho absoluto.

O relatório tem: cabeçalho com placar das 10 camadas, mapa da orquestração proposta, um card por camada, perguntas
ao dono e a primeira fatia recomendada. Cada card traz evidência, diagrama **Hoje / Proposta**, problema,
proposta, ganhos e pendências. Formato completo, padrões de diagrama e tom em
[RELATORIO-HTML.md](RELATORIO-HTML.md).

Uma proposta que contradiz `orquestracao-decisoes.md` só entra se o atrito for real o bastante para reabrir a
decisão, marcada no card.

Não escreva nada no repositório ainda. Com o arquivo aberto, pergunte: **"Quais camadas eu construo, e em que
ordem?"**, junto com as perguntas abertas do relatório.

### 3. Decisões

- O dono quer discutir uma camada: uma decisão por vez, sempre com a sua recomendação e a evidência.
- O dono recusa uma proposta por um motivo que vai se repetir: ofereça registrar uma linha datada
  (`AAAA-MM-DD · decisão · motivo`) em `docs/agents/designs/orquestracao-decisoes.md`, para a próxima execução não
  sugerir de novo. Motivo passageiro ("agora não") não entra.

### 4. Construção

Só as camadas aprovadas, em fatias, nesta ordem: docs e ponto de entrada → skills, wrappers e rules → orquestrador
→ scripts → grafos → roteamento → checks no gate.

- Docs que já existem mudam de lugar com `git mv`, com as referências atualizadas. Não apague conteúdo.
- Scripts: teste antes do script, no runner que o repositório já usa.
- Preserve alterações que já estavam pendentes no repositório; não as misture com a construção.

### 5. Verificação

Rode os testes dos scripts e os checks, valide todo JSON gerado e confira que todo path citado em
`.agents/graphs/config.json` existe no disco. Rode o gate uma vez: falha que já existia é pendência do dono, não
algo a consertar aqui.

### 6. Fechamento

No chat, três listas: **detectado** (com evidência), **decidido** e **pendente**. Não faça commit sem o dono
pedir; pedido, commits atômicos em Conventional Commits, um por camada.