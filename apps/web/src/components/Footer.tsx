import Link from 'next/link'

export default function Footer() {
  return (
    <div className='flex align-center justify-center text-white text-2xl mb-6'>
      <Link href='https://www.mateusarce.dev/' target='_blank'>
        Criado por{' '}
        <strong className='text-blue-500 hover:text-blue-600'>
          Mateus Arce
        </strong>
      </Link>
    </div>
  )
}
