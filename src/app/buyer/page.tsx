import React from 'react'
import BuyerDashboard from './buyer-ui'

import { redirect } from 'next/navigation'

import { getBuyerUser } from '@/lib/data/buyer'


export default async function page() {





  const buyerUser = await getBuyerUser();

  if (!buyerUser || buyerUser.role !== 'BUYER') {
    return redirect('/seller');
  }



 
 
  

  
  
  return (
  <BuyerDashboard />
  )
}

