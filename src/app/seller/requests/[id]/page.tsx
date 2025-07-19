import { validateAuthRequest } from '@/lib/auth'

import BikeRequestDetailPage from './request-ui'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

// Cache the bikeRequest query
const getBikeRequest = cache(async (id: string, userId: string) => {
 const request = await prisma.bikeRequest.findFirst({
      where: {
        id: id,
        seller:{
          clerkId: userId
        }
      },
      include: {
        buyer: {
          include: {
            company: true,
          },
        },
        seller: true,
      },
    });

  if (!request) {
    notFound()
  }
  return request
    
})

// Cache the user/company query
// const getUserWithCompany = cache(async (userId: string) => {
  
//   return prisma.user.findUnique({
//     where: { id: userId },
//     include: { company: true, },
//   })
// })

export default async function page({ params }: Props) {
  const { id } = await params
  const user = await validateAuthRequest()

  if (!user) {
    return <div>Unauthorized</div>
  }

  const request = await getBikeRequest(id,user.id)

  

 



  // const buyer = await getUserWithCompany(user.id)

  // if (!buyer?.company) {
  //   return <div>You are not authorized to view this request</div>
  // }

  return (
    <BikeRequestDetailPage request={request} />
  )
}
