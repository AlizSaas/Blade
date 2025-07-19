import { validateAuthRequest } from '@/lib/auth'


import BikeRequestSingle from './buyer-req-ui'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{
    id: string
  }>
}

const getBikeRequest = cache(async (id: string, userId: string) => {
 const request = await prisma.bikeRequest.findFirst({
      where: {
        id: id,
      buyer:{
        clerkId: userId
      },
     
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


  if (!request ) {
    notFound()
  }
  return request
    
})
export default async function page({ params }: Props) {
   const {id} = await params
   const user = await validateAuthRequest()

  if(!user) {
    return <div>Unauthorized</div>
  }

 

 const request = await getBikeRequest(id, user.id)

 if(request.buyer.clerkId !== user.id) { 
    return <div>Unauthorized</div>
 }
 


  return (
    <BikeRequestSingle request={request} />
  )
  
}
