import Link from 'next/link'
import { FaGithub } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className='border-t border-border px-[clamp(16px,4vw,24px)] py-5'>
      <div className='mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-faint'>
        <span>Community-curated developer tools</span>
        <Link
          href='https://github.com/mateusarcedev/devlist'
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-1.5 text-subtle transition-colors hover:text-text'
        >
          <FaGithub className='h-3.5 w-3.5' />
          GitHub
        </Link>
        <Link
          href='/contributors'
          className='text-subtle transition-colors hover:text-text'
        >
          Contributors
        </Link>
        <Link
          href='https://www.mateusarce.dev/'
          target='_blank'
          rel='noopener noreferrer'
          className='text-subtle transition-colors hover:text-text'
        >
          Built by Mateus Arce
        </Link>
      </div>
    </footer>
  )
}
