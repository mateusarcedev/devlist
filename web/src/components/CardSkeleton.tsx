export default function CardSkeleton() {
  return (
    <div className='w-64 max-w-sm'>
      <div className='bg-white rounded-lg p-6 shadow-md h-[290px] flex flex-col'>
        <div className='flex justify-between items-center w-full'>
          <div className='h-8 w-32 bg-gray-200 rounded-sm animate-pulse' />
          <div className='h-9 w-9 bg-gray-200 rounded-full animate-pulse' />
        </div>

        <div className='mt-6 space-y-3 grow'>
          <div className='h-4 bg-gray-200 rounded-sm w-full animate-pulse' />
          <div className='h-4 bg-gray-200 rounded-sm w-11/12 animate-pulse' />
          <div className='h-4 bg-gray-200 rounded-sm w-4/5 animate-pulse' />
        </div>
      </div>
    </div>
  )
}
