import { Suspense } from 'react'
import Payment from './payment'

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading payment status...</div>}>
      <Payment />
    </Suspense>
  )
}
