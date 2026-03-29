import Link from 'next/link'
import { FaAngleRight } from 'react-icons/fa'

interface Props {
  id: string
  name: string
  title: string
}

export default function Category({ name, title }: Props) {
  const urlName = name || title

  return (
    <Link
      className='text-white p-4 bg-[#222] hover:bg-black flex items-center justify-start rounded-md cursor-pointer'
      href={`/tools/${encodeURIComponent(urlName)}`}
    >
      <FaAngleRight className='h-5 w-5 mr-3 text-white' />
      <span className='flex-grow text-left text-white'>{title}</span>
    </Link>
  )
}
