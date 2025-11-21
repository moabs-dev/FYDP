import React from 'react'
import Lottie from 'lottie-react'
import animation from './notfound.json'
function Notfound() {
  return (
    <div className=' flex  justify-between items-center  sm:flex-row'>
        <Lottie className='w-[60%] ' animationData={animation}/>
        <h1 className=' w-[30%] text-2xl font-bold '>Page Not Found!!!!</h1>
    </div>
  )
}

export default Notfound