import Card from '@/components/Card'
import type { Tool } from '@/types'
import { type Metadata } from 'next'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${decodeURIComponent(slug)} tools`,
    description: `Discover developer tools in the ${decodeURIComponent(slug)} category on Tools4.tech.`,
  }
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
  const nameCategory = decodeURIComponent((await params).slug)
  const tools = await getToolsByCategory(nameCategory)

  return (
    <div className='w-4/5 mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-6 text-center'>
        {nameCategory}
      </h1>
      {tools?.length > 0 ? (
        <div className='flex flex-wrap items-center justify-center gap-6'>
          {tools.map(tool => (
            <Card key={tool.name} tool={tool} />
          ))}
        </div>
      ) : (
        <p className='text-center'>No tools found for this category.</p>
      )}
    </div>
  )
}
