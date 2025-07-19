import React, { Suspense } from 'react'
import NewRequestPage from './new-request'

import NewRequestSkeleton from '@/components/new-request-skelleton'
import { getCompanySellers, getLoggedInUser } from '@/lib/data/buyer'



export default async function Page() {
   

    const loggedInUser = await getLoggedInUser()
    if (!loggedInUser) {
        return <div>Unauthorized</div>
    }
 
    const companySellers = await getCompanySellers(loggedInUser?.companyId)

    const mappedSellers = companySellers.map(seller => ({
        id: seller.id,
        name: seller.lastname ? `${seller.firstname} ${seller.lastname}` : seller.firstname,
        email: seller.email,
        company: typeof seller.company === 'object' && seller.company !== null ? seller.company.name : '' // Ensure company is an object and not null
    }));

    return (
        <Suspense fallback={<NewRequestSkeleton/>}> 
   <NewRequestPage sellers={mappedSellers} />
        </Suspense>
     
    )
}
