-- 27 candidates from the Raindrop audit (2026-11-19).
-- Run after tool_access_models.sql. Idempotent by URL and case-insensitive name.
-- KodeKloud / High Scalability retain UNVERIFIED until an admin reviews them.
WITH candidate(name, link, description, category_name, access_model, source_url) AS (
  VALUES
    ('Memos', 'https://www.usememos.com/', 'Anotações privadas e auto-hospedadas, com interface web e API.', 'Documentation & Content', 'OPEN_SOURCE', 'https://github.com/usememos/memos'),
    ('Canine', 'https://canine.sh/', 'PaaS auto-hospedável para implantar aplicações com experiência semelhante à Heroku.', 'DevOps & Infrastructure', 'OPEN_SOURCE', 'https://github.com/CanineHQ/canine'),
    ('CheckCle', 'https://github.com/operacle/checkcle', 'Monitoramento self-hosted de uptime, certificados e serviços.', 'DevOps & Infrastructure', 'OPEN_SOURCE', 'https://github.com/operacle/checkcle'),
    ('Coolify', 'https://coolify.io/', 'Alternativa auto-hospedada a plataformas de deploy gerenciado.', 'DevOps & Infrastructure', 'OPEN_SOURCE', 'https://coolify.io/self-hosted'),
    ('Medusa', 'https://medusajs.com/', 'Framework modular open source para comércio eletrônico e APIs.', 'APIs & Backend', 'OPEN_SOURCE', 'https://github.com/medusajs/medusa'),
    ('Anyquery', 'https://anyquery.dev/', 'Consulte APIs, arquivos e serviços com SQL via conectores.', 'Databases & Data Visualization', 'OPEN_SOURCE', 'https://github.com/julien040/anyquery'),
    ('PEV2 / Dalibo EXPLAIN', 'https://explain.dalibo.com/', 'Visualizador de planos EXPLAIN do PostgreSQL para análise de consultas.', 'Databases & Data Visualization', 'OPEN_SOURCE', 'https://github.com/dalibo/pev2'),
    ('Ratatui', 'https://ratatui.rs/', 'Biblioteca Rust para interfaces de terminal e aplicações TUI.', 'Developer Tools & Utilities', 'OPEN_SOURCE', 'https://github.com/ratatui/ratatui'),
    ('OverType', 'https://overtype.dev/', 'Editor Markdown leve com experiência direta de edição em textarea.', 'Documentation & Content', 'OPEN_SOURCE', 'https://github.com/panphora/overtype'),
    ('Usertour', 'https://www.usertour.io/', 'Crie onboarding, tours e experiências guiadas dentro de aplicações.', 'Developer Tools & Utilities', 'OPEN_SOURCE', 'https://github.com/usertour/usertour'),
    ('PostHog', 'https://posthog.com/', 'Analytics de produto, session replay, feature flags e experimentação.', 'Developer Tools & Utilities', 'FREEMIUM', 'https://posthog.com/pricing'),
    ('useAnimations', 'https://useanimations.com/', 'Ícones animados reutilizáveis em Lottie e animações de interface.', 'Animation & 3D', 'OPEN_SOURCE', 'https://github.com/useAnimations/useAnimations'),
    ('Evil Charts', 'https://evilcharts.com/', 'Componentes de gráficos animados e personalizáveis para interfaces.', 'UI Components & Design Systems', 'OPEN_SOURCE', 'https://github.com/evilcharts/evilcharts'),
    ('AnimateIcons', 'https://animateicons.in/', 'Biblioteca de ícones React animados para interfaces modernas.', 'Icons & Avatars', 'OPEN_SOURCE', 'https://animateicons.in/'),
    ('DSA — Craft Code Club', 'https://dsa.craftcodeclub.io/', 'Guia visual em português para algoritmos e estruturas de dados.', 'Learning & Tutorials', 'FREE', 'https://dsa.craftcodeclub.io/'),
    ('Data Structure Visualizations', 'https://www.cs.usfca.edu/~galles/visualization/Algorithms.html', 'Visualizações interativas de algoritmos e estruturas de dados.', 'Learning & Tutorials', 'FREE', 'https://www.cs.usfca.edu/~galles/visualization/Algorithms.html'),
    ('Big-O Cheat Sheet', 'https://www.bigocheatsheet.com/', 'Referência rápida de complexidade de tempo e espaço em algoritmos.', 'Learning & Tutorials', 'FREE', 'https://www.bigocheatsheet.com/'),
    ('Odyc.js', 'https://odyc.dev/', 'Biblioteca JavaScript para criar jogos pixel-art de forma declarativa.', 'Frontend Frameworks & Libraries', 'OPEN_SOURCE', 'https://github.com/odycjs/odyc'),
    ('Rill', 'https://www.rilldata.com/', 'Painéis e exploração analítica com projeto open source auto-hospedável.', 'Databases & Data Visualization', 'OPEN_SOURCE', 'https://github.com/rilldata/rill'),
    ('FileFlows', 'https://fileflows.com/', 'Automatiza pipelines de conversão e processamento de arquivos e mídia.', 'Developer Tools & Utilities', 'FREEMIUM', 'https://fileflows.com/pricing'),
    ('Awesome Docker Compose', 'https://awesome-docker-compose.com/', 'Diretório para descobrir serviços e stacks auto-hospedáveis.', 'Communities & Curated Lists', 'FREE', 'https://awesome-docker-compose.com/'),
    ('OpenAlternative', 'https://openalternative.co/', 'Diretório de alternativas de código aberto para softwares populares.', 'Communities & Curated Lists', 'FREE', 'https://openalternative.co/'),
    ('USACO Guide', 'https://usaco.guide/', 'Trilhas gratuitas de algoritmos e programação competitiva.', 'Learning & Tutorials', 'FREE', 'https://usaco.guide/'),
    ('Refactoring.Guru', 'https://refactoring.guru/pt-br', 'Explicações práticas de padrões de projeto e refatoração de código.', 'Learning & Tutorials', 'FREEMIUM', 'https://refactoring.guru/pt-br'),
    ('Algolia', 'https://www.algolia.com/', 'Busca hospedada, ranking e APIs de pesquisa para aplicações.', 'APIs & Backend', 'FREEMIUM', 'https://www.algolia.com/pricing'),
    ('KodeKloud', 'https://kodekloud.com/', 'Cursos e laboratórios práticos de Linux, cloud e DevOps.', 'Learning & Tutorials', 'UNVERIFIED', NULL),
    ('High Scalability', 'https://highscalability.com/', 'Estudos de arquitetura e escalabilidade de sistemas de grande porte.', 'Learning & Tutorials', 'UNVERIFIED', NULL)
)
INSERT INTO public.tools(name, link, description, category_id, access_model, access_source_url, access_reviewed_at)
SELECT c.name, c.link, c.description, cat.id, c.access_model, c.source_url,
       CASE WHEN c.access_model = 'UNVERIFIED' THEN NULL ELSE now() END
FROM candidate c
JOIN public.categories cat ON cat.name = c.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.tools t
  WHERE lower(t.name) = lower(c.name)
     OR lower(trim(trailing '/' FROM t.link)) = lower(trim(trailing '/' FROM c.link))
)
ON CONFLICT (link) DO NOTHING;