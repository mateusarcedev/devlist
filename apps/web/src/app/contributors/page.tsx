import CardsContributors from '@/components/CardsContributors'
import getContributors from '@/utils/getContributors'
import { type Metadata } from 'next'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contributors',
}

export default async function Contributors() {
  const data = await getContributors('mateusarcedev', 'devlist')

  if (!data) {
    return (
      <main className='dl-page'>
        <div className='px-4 py-24 text-center'>
          <AlertCircle className='mx-auto mb-4 h-7 w-7 text-subtle' />
          <h1 className='text-xl font-semibold text-white'>
            Contributors unavailable
          </h1>
          <p className='mx-auto mt-2 max-w-[420px] text-sm leading-6 text-subtle'>
            We couldn&apos;t load the repository contributors right now. Please try
            again later.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className='mx-auto w-full max-w-[1120px] px-[clamp(16px,4vw,24px)] pb-24 pt-[clamp(32px,6vw,56px)]'>
      <h1 className='text-[26px] font-semibold tracking-[-0.02em] text-white'>
        Contributors
      </h1>
      <p className='mb-7 mt-2 text-sm text-subtle'>
        {data.length} people have contributed to Devlist
      </p>

      <CardsContributors data={data} />
    </main>
  )
}
