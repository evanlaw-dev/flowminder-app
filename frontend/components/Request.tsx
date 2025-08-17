import React from 'react'

function Request({ text, count }: { text: string; count?: number }) {
  return (
    <div className="w-[50%] bg-green-900/85 text-white p-4 mt-3 rounded-lg shadow-md">
      <h2 className="text-md font-semibold mb-2">{text}</h2>
      <h1 className='text-2xl font-bold text-center'>{count}</h1>
      </div>
  )
}

export default Request
