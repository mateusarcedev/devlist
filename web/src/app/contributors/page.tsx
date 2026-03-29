import CardsContributors from '@/components/CardsContributors'
import getContributors from '@/utils/getContributors'
import { type Metadata } from 'next'
import { BiErrorCircle } from 'react-icons/bi'

export const metadata: Metadata = {
  title: 'Project Contributors - Tools4.tech',
}

export default async function Contributors() {
  const data = await getContributors('mateusarcedev', 'tools4.tech')

  if (!data) {
    return (
      <div className='bg-[#111] text-gray-300 h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <BiErrorCircle className='text-4xl mx-auto' />
          <h1 className='text-2xl font-bold text-white'>Contributors Not Found</h1>
          <p className='text-gray-400'>
            We couldn&apos;t find any contributors for this repository. Please check
            the repository name or try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-[#111] text-gray-300'>
      <main className='container mx-auto px-4 py-12'>
        <section className='space-y-8'>
          <div className='text-center space-y-4'>
            <h1 className='text-4xl font-bold text-white'>Project Contributors</h1>
            <p className='text-gray-400 max-w-2xl mx-auto'>
              Thank you to all the amazing contributors who have helped make this
              project possible.
            </p>
          </div>

          <CardsContributors data={data} />
        </section>
      </main>
    </div>
  )
}
