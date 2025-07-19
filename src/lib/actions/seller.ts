'use server'
import { prisma } from '../prisma';
import { validateAuthRequest } from '../auth';

export default async function updateRequestBikeStatus({requestId,status,notes}:{
      requestId: string;
  status: "APPROVED" | "REJECTED";
  notes?: string;
}) {
    try {
        const {id} = await validateAuthRequest();
        if(!id) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where:{
                clerkId: id, // The clerkId of the logged-in user
            },
            select:{
                id: true,
                role: true,
                companyId: true,
            }
        })

            if (!user) {
      throw new Error("User not found in database");
    }

    if (user.role !== "SELLER") {
      throw new Error("Unauthorized");
    }

    const request = await prisma.bikeRequest.findUnique({
        where:{
            id: requestId,
        },
        include:{
            buyer:true,
        }
    })

     if (!request) {
      throw new Error("Time off request not found in database");
    }

    if(request.buyer.companyId !== user.companyId) {
        throw new Error("You are not authorized to update this request");
    }

    const updatedRequest = await prisma.bikeRequest.update({
        where:{
            id: requestId,
        },
        data:{
            status: status,
           notes:notes,
            sellerId: user.id,
            updatedAt: new Date(),
        }
    })

    return {
      success: true,
      message: `Request ${status} successfully!`,
      request: updatedRequest,
    };
    
        
    } catch (error) {
        console.error("Error updating request bike status:", error);
        return {
            error: "Failed to update request bike status. Please try again later.",
           
        };
        
    }
}