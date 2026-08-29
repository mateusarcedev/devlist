import Card from '@/components/Card'
import type { Tool } from '@/types'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tools - Tools4.tech',
}

const getToolsByCategory = async (nameCategory: string): Promise<Tool[]> => {
  const response = await fetch(
    `${process.env.URL_API}/tools/category/${nameCategory}`,
    { method: 'GET' },
  )

  const data: Tool[] = await response.json()
  return data
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ToolsPage({ params }: PageProps) {
  const nameCategory = (await params).slug
  const tools = await getToolsByCategory(nameCategory)

  return (
    <div className='w-4/5 mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-6 text-center'>
        {nameCategory.replace('|', '|')}
      </h1>
      {tools?.length > 0 ? (
        <div className='flex flex-wrap items-center justify-center gap-6'>
          {tools.map(tool => (
            <Card key={tool.name} tool={tool} />
          ))}
        </div>
      ) : (
        <p className='text-center'>Nenhuma ferramenta encontrada para esta categoria.</p>
      )}
    </div>
  )
}
