import React from 'react'
import Request from './Request'

{/* TODO make a call function to server to get count of requests */}

function RequestsWrapper() {
  return (
    <div className='w-[87%] flex flex-row gap-2 p-4 pt-0 text-center'>
      {/* Display number of requests here */}
      <Request text="Requests for extra time" count={3} /> 
      <Request text="Requests to move along" count={5} />
    </div>
  )
}

export default RequestsWrapper
