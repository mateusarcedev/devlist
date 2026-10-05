import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const categories = [
  'Algorithms',
  'Frontend',
  'Backend',
  'Databases',
  'DevOps',
  'Testing',
  'Design',
  'AI',
];

const tools = [
  {
    category: 'Algorithms',
    name: 'VisuAlgo',
    link: 'https://visualgo.net/en',
    description: 'Interactive visualizations for algorithms and data structures.',
  },
  {
    category: 'Algorithms',
    name: 'Tech Interview Handbook',
    link: 'https://www.techinterviewhandbook.org/',
    description: 'Free guides for coding interviews, algorithms, and software engineering careers.',
  },
  {
    category: 'Algorithms',
    name: 'Beecrowd',
    link: 'https://judge.beecrowd.com/',
    description: 'Programming challenges for practicing algorithms and problem solving.',
  },
  {
    category: 'Frontend',
    name: 'Next.js',
    link: 'https://nextjs.org/',
    description: 'React framework for production web applications.',
  },
  {
    category: 'Frontend',
    name: 'React',
    link: 'https://react.dev/',
    description: 'Library for building component-based user interfaces.',
  },
  {
    category: 'Frontend',
    name: 'Tailwind CSS',
    link: 'https://tailwindcss.com/',
    description: 'Utility-first CSS framework for rapidly building custom interfaces.',
  },
  {
    category: 'Backend',
    name: 'NestJS',
    link: 'https://nestjs.com/',
    description: 'Progressive Node.js framework for scalable server-side applications.',
  },
  {
    category: 'Backend',
    name: 'Node.js',
    link: 'https://nodejs.org/',
    description: 'JavaScript runtime for building servers, tooling, and backend applications.',
  },
  {
    category: 'Backend',
    name: 'Express',
    link: 'https://expressjs.com/',
    description: 'Minimal and flexible web framework for Node.js.',
  },
  {
    category: 'Databases',
    name: 'PostgreSQL',
    link: 'https://www.postgresql.org/',
    description: 'Open source relational database focused on reliability and extensibility.',
  },
  {
    category: 'Databases',
    name: 'Prisma ORM',
    link: 'https://www.prisma.io/',
    description: 'Type-safe ORM and database toolkit for TypeScript and Node.js.',
  },
  {
    category: 'Databases',
    name: 'Redis',
    link: 'https://redis.io/',
    description: 'In-memory data store commonly used for caching, queues, and realtime workloads.',
  },
  {
    category: 'DevOps',
    name: 'Docker',
    link: 'https://www.docker.com/',
    description: 'Platform for packaging and running applications in containers.',
  },
  {
    category: 'DevOps',
    name: 'GitHub Actions',
    link: 'https://github.com/features/actions',
    description: 'CI/CD automation integrated with GitHub repositories.',
  },
  {
    category: 'DevOps',
    name: 'Traefik',
    link: 'https://traefik.io/traefik/',
    description: 'Cloud-native reverse proxy and application proxy for modern infrastructure.',
  },
  {
    category: 'Testing',
    name: 'Jest',
    link: 'https://jestjs.io/',
    description: 'JavaScript and TypeScript testing framework with an integrated test runner.',
  },
  {
    category: 'Testing',
    name: 'Playwright',
    link: 'https://playwright.dev/',
    description: 'End-to-end browser automation and testing framework.',
  },
  {
    category: 'Testing',
    name: 'Vitest',
    link: 'https://vitest.dev/',
    description: 'Fast Vite-native test framework for modern JavaScript projects.',
  },
  {
    category: 'Design',
    name: 'Figma',
    link: 'https://www.figma.com/',
    description: 'Collaborative interface design and prototyping platform.',
  },
  {
    category: 'Design',
    name: 'Lucide',
    link: 'https://lucide.dev/',
    description: 'Open source icon toolkit designed for consistent product interfaces.',
  },
  {
    category: 'Design',
    name: 'Heroicons',
    link: 'https://heroicons.com/',
    description: 'Hand-crafted SVG icons designed for modern web interfaces.',
  },
  {
    category: 'AI',
    name: 'OpenAI',
    link: 'https://openai.com/',
    description: 'AI platform and developer tools for building intelligent applications.',
  },
  {
    category: 'AI',
    name: 'Claude',
    link: 'https://www.anthropic.com/claude',
    description: 'AI assistant and developer platform from Anthropic.',
  },
  {
    category: 'AI',
    name: 'Gemini',
    link: 'https://gemini.google.com/',
    description: 'Google AI assistant and model ecosystem.',
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run the demo seed.');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const categoryByName = new Map<string, { id: string; name: string }>();

    for (const name of categories) {
      const category = await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });

      categoryByName.set(name, category);
    }

    const data = tools.map((tool) => {
      const category = categoryByName.get(tool.category);

      if (!category) {
        throw new Error(`Missing category for seeded tool: ${tool.name}`);
      }

      return {
        name: tool.name,
        link: tool.link,
        description: tool.description,
        categoryId: category.id,
      };
    });

    const result = await prisma.tool.createMany({
      data,
      skipDuplicates: true,
    });

    const [categoryCount, toolCount] = await Promise.all([
      prisma.category.count(),
      prisma.tool.count(),
    ]);

    console.log(
      `Demo seed complete: ${categories.length} categories ensured, ${result.count} tools created, ${categoryCount} categories and ${toolCount} tools total.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Demo seed failed:', error);
  process.exit(1);
});
