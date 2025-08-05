import React from 'react'

function BtnNudge({ text }: { text: string }) {
  return (
    <button className="w-full bg-stone-300/95 text-white text-wrap py-4 rounded-lg shadow-md cursor-pointer"
    >{text}</button>
  )
}

export default BtnNudge