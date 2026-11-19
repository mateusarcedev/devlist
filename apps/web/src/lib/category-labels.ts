import type { Locale } from '@/contexts/i18n-context'

/** Display translations, not database mutations: category IDs stay stable. */
const names: Record<string, string> = {
  'AI & Machine Learning': 'IA & Machine Learning',
  'Animation & 3D': 'Animação & 3D',
  'APIs & Backend': 'APIs & Backend',
  'Career & Interviews': 'Carreira & Entrevistas',
  'Colors & Gradients': 'Cores & Gradientes',
  'Communities & Curated Lists': 'Comunidades & Listas',
  'Databases & Data Visualization': 'Bancos de dados & Data viz',
  'Design Inspiration & Portfolios': 'Inspiração & Portfólios',
  'Developer Tools & Utilities': 'Dev tools & Utilitários',
  'DevOps & Infrastructure': 'DevOps & Infra',
  'Documentation & Content': 'Documentação & Conteúdo',
  'Fonts & Typography': 'Fontes & Tipografia',
  'Frontend Frameworks & Libraries': 'Frameworks & Libs frontend',
  'Hardware & IoT': 'Hardware & IoT',
  'Icons & Avatars': 'Ícones & Avatares',
  'Illustrations & Images': 'Ilustrações & Imagens',
  'Learning & Tutorials': 'Aprendizado & Tutoriais',
  'Templates & Starters': 'Templates & Starters',
  'UI Components & Design Systems': 'UI components & Design systems',
}

export function getCategoryLabel(categoryName: string, locale: Locale): string {
  return locale === 'pt-BR' ? names[categoryName] ?? categoryName : categoryName
}
