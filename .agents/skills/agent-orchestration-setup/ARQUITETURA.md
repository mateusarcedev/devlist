# Arquitetura alvo

As 10 camadas da orquestração. Os caminhos são convenção: se o repositório já tem um equivalente, adapte. A
prioridade é o padrão; ajuste com evidência (ex.: vários agentes escrevendo ao mesmo tempo faz a camada 10 subir).

## Vocabulário

Use estes termos exatamente, no relatório e nos arquivos gerados.

| Termo | Significado |
| --- | --- |
| **fonte canônica** | O único arquivo onde uma regra mora. Todo o resto aponta para ele. |
| **espelho** | Cópia gerada por script da fonte canônica para uma ferramenta que só lê o próprio diretório. Nunca editado à mão. |
| **papel** | Skill com julgamento próprio (domínio, backend, review...). Ganha contexto isolado. |
| **procedimento** | Skill que é checklist determinística (migration, pre-deploy...). Roda inline, sem contexto isolado. |
| **wrapper** | Arquivo fino de subagente que só aponta para a skill de um papel e restringe ferramentas e tier. |
| **orquestrador** | A rule que diz em que ordem os papéis e procedimentos são despachados. |
| **handoff** | Estado de uma tentativa em JSON validado por script, nunca no chat. |
| **gate** | Comando determinístico que decide "pronto". |
| **âncora** | Nó que não pode ser convencido: teste que rodou, gate, regra congelada. |
| **nó** · **aresta** | Uma chamada de agente com saída em schema fixo · um dado que cruza de um nó para outro. |
| **encanamento** | Transformação sem julgamento (dedupe, contagem, voto, roteamento). Sempre código. |
| **cético** | Verificador em contexto limpo que vota se um achado é real. |
| **tier** | `fast` · `balanced` · `strong` · `frontier`. O que skills e nós declaram no lugar de nome de modelo. |

## Camadas

### 1. Ponto de entrada — Essencial

- `AGENTS.md` curto: stack, mapa de docs, comandos-chave, invariantes. Aponta, não explica (progressive
  disclosure).
- `CLAUDE.md` (e `GEMINI.md`, se usado) contendo só `@AGENTS.md`.
- Docs por natureza: `docs/domain/` (comportamento de produto), `docs/technical/` (engenharia), `docs/agents/`
  (planos e designs ativos, contratos de agentes), `docs/archive/` (histórico, não normativo).

### 2. Rules por área — Recomendado

- `.claude/rules/<área>.md` são roteadores: "ao mexer em X, leia `docs/technical/x.md`". Não redefinem regra. Uma
  por área real do projeto.

### 3. Skills canônicas — Essencial

- `.agents/skills/<nome>/SKILL.md`, markdown puro com frontmatter `name`/`description`; a description diz QUANDO
  usar.
- Papéis: domínio, backend, frontend, tdd, code-review, qa e os transversais que o projeto realmente tem
  (observabilidade, integrações, auditoria, feature flags, design system...).
- Procedimentos: o que é arriscado e repetível aqui (schema/migration, pre-deploy, registro de permissões...).
- Composição: padrão genérico reaproveitável vira skill de padrão + skill delta do projeto; o delta só tem paths,
  comandos, contratos e exceções locais. Matriz `requires` em `.agents/rules/skill-composition.md`; o agente
  carrega as requeridas antes de agir e reporta se alguma faltar.
- Espelho em `.claude/skills/` gerado por script de sync, com README "gerado, não editar".

### 4. Wrappers de subagente — Essencial se o dono usa Claude Code

- `.claude/agents/<nome>.md`, um por papel: mesmo `name`/`description`, `tools:` mínimo (code-review e qa só
  leitura) e `model:` pelo tier.
- Corpo de uma linha: "Leia e siga integralmente `.agents/skills/<nome>/SKILL.md`, a fonte canônica. Este wrapper
  só dá isolamento de contexto e restrição de ferramentas."

### 5. Orquestrador — Essencial

- `.agents/rules/feature-orchestrator.md` (`trigger: always_on`): num pedido de feature, o agente principal age
  como tech lead e despacha na ordem canônica adaptada ao projeto. Exemplo: domínio → banco (procedimento) →
  permissões (procedimento) → backend + tdd → frontend + guardião de UI → transversais, só quando o escopo pede →
  code review → QA.
- Code review em contexto isolado, dois eixos: Standards (conformidade com AGENTS.md e docs) e Spec (fidelidade
  ao pedido, sem scope creep).
- QA roda o gate, não edita código e diz qual papel corrige.
- A rule diz o porquê: papel ganha contexto isolado porque o review não pode herdar o raciocínio de quem escreveu;
  procedimento fica como skill. Ferramenta sem subagentes segue os `SKILL.md` inline, na mesma ordem.

### 6. Handoff verificável — Opcional

- `docs/agents/agent-pipeline.md` + `scripts/agent-handoff.mjs` com teste. Etapas: implement → review →
  browser_qa → human_merge.
- JSON: `task_id`, `attempt`, `stage`, `status` (queued, running, blocked, failed, ready_for_review, approved),
  `input_ref`/`output_ref` (SHAs, nunca branch), `checks`, `required_checks`, `blocked_by`, `next_allowed`,
  `failure_class`.
- O validador recusa SHA inexistente, `output_ref` que não descende de `input_ref`, check obrigatório não
  `passed`, transição indevida, `attempt` > 3 (`MAX_ATTEMPTS = 3`; falha na terceira escala para humano) e
  aprovação cujo `output_ref` não é mais o `HEAD`. Review e QA nunca alteram `output_ref`.

### 7. Graph engineering — Recomendado

- `docs/agents/graph-engineering.md`. Grafo compra largura, não julgamento. Teste da aresta falsa: em cada "e
  depois", o passo seguinte lê a saída do anterior? Não lê → paralelo. Sem duas caixas sem seta entre elas, é
  loop, e loop está certo.
- Padrões: diamante (fan-out → reduce em código → verificação → síntese); roteador (modelo devolve rótulo enum,
  código escolhe o caminho); verificador na borda (contexto limpo, lentes diferentes, voto ≥ 2/3 dos válidos, sem
  quórum = `unverified`); ciclo convergente (até 2 rodadas secas, dedupe contra tudo já visto, inclusive
  refutados).
- Regras: saída com schema; fan-in conta e nomeia `deadNodes`; pipeline por padrão, barreira só quando o próximo
  passo precisa do conjunto inteiro; término com rodadas secas + teto de rodadas + teto de agentes juntos; no
  máximo 1 retry por nó, com o motivo, decidido por código; nó que escreve roda na própria worktree; gate humano
  em publicar, merge, deploy e migration; saída de nó entra no próximo cercada como dado; comece com teto baixo.
- Memória: `.agents/graphs/<grafo>.constraints.md`, uma linha datada por correção humana que vai se repetir. Nós
  leem antes de trabalhar; agente só propõe o diff.
- `scripts/graph-reduce.mjs` com teste, CLI por stdin:
  - `merge {expected, results:{nó: saída|null}, listField, key:[campos], seen?}` →
    `{items (com key e reportedBy), fresh, seen, deadNodes}`
  - `vote {quorum, items:[{...achado, votes:[{real}|null]}]}` → `{confirmed, refuted, unverified}`
- Grafos como skills `.agents/skills/graph-*` (seções Grafo / Nós com tier e schema / Encanamento / Execução):
  - `graph-review`: nó `fast` mede o diff e o código roteia; pequeno → uma passada; grande ou sensível → 5 lentes
    (standards, spec, security, perf, docs), merge, 3 céticos `balanced` por blocker/major, veredito em código;
    indica as specs e2e que o diff justifica.
  - `graph-bug-sweep`: buscadores por classe (logic, concurrency, authz, errors, input), dedupe contra tudo já
    visto, 3 céticos por achado novo; para em 2 rodadas secas ou no teto.
  - `graph-docs-lint`: um agente por doc normativo procura afirmação contradita, velha ou faltante; cada doc
    segue em pipeline para 3 céticos.
- O que é do projeto fica em `.agents/graphs/config.json`: `gate.qa` (`gate.db` opcional), `review.base`,
  `review.guide`, `review.heavyWhen {lines, files, sensitivePrefixes}`, `review.lensHints`,
  `review.e2e {command, specDir, routes:[{prefixes, specs}]}`, `bugSweep.classHints`, `docsLint.dirs`.
- No Claude Code, cada grafo também em `.claude/workflows/<grafo>.js` se a versão suportar workflows (confirme a
  API antes); senão a skill com subagentes basta.

### 8. Roteamento de modelos — Recomendado

- `docs/agents/model-routing.md` + `.agents/model-routing.yaml`. Skills, wrappers e nós declaram tier: `fast`
  (mecânico, saída curta com schema), `balanced` (lente, cético, buscador), `strong` (implementar, corrigir,
  testar, sintetizar), `frontier` (épico, invariante, arquitetura).
- Menor tier que dá saída verificável; um tier acima no retry; verificador de outro fornecedor quando houver;
  tier alto onde há um nó só.
- YAML por ferramenta que o dono usa, com modelos do seletor ou do `models` da ferramenta, nunca de memória, e
  `checked_at`.

### 9. Âncoras de arquitetura — Essencial

- Check de arquitetura: `AGENTS.md` dentro de um orçamento de linhas e com os ponteiros obrigatórios; pastas
  proibidas ausentes.
- Check de skills: frontmatter válido; espelho idêntico à fonte canônica; todo `requires` existe; todo wrapper
  aponta para skill existente.
- Gate `qa` composto só de comandos que já existem mais esses checks.
- Scripts em Node (`.mjs`) se o repositório já tem Node; senão na linguagem de script que ele já usa.

### 10. Agentes concorrentes — Opcional

- `docs/technical/concurrent-agents.md`: cada agente que escreve tem worktree, branch e dono próprios; um
  coordenador atribui as tarefas; preservar mudanças alheias; integrar em sequência e validar o resultado
  combinado.