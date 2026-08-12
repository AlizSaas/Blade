import 'server-only'
import { cache } from 'react'
import { getSellerUserContext } from '../auth'



export interface SellerContext {
    userId: string,
    clerkId: string,
    companyId: string,
    email: string,
    name: string,

}

export const getSellerMcpContext = cache(async (): Promise<SellerContext> => {
    const sellerUser = await getSellerUserContext();
    console.log('seller companyId', sellerUser.companyId)

    return {
        userId: sellerUser.id,
        clerkId: sellerUser.clerkId,
        companyId: sellerUser.companyId,
        email: sellerUser.email,
        name: sellerUser.firstname,
    }
  
})