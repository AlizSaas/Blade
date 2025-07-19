import {prisma} from '@/lib/prisma'
import {validateAuthRequest} from '@/lib/auth'
import { NextRequest } from 'next/server';


export async function GET(req:NextRequest) {
     const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

          const pageSize = 4

        const loggedInUser = await validateAuthRequest()

          if( !loggedInUser ) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const bikeRequestData = await prisma.bikeRequest.findMany({
            where:{
                buyer:{
                    clerkId: loggedInUser.id,
                }
            },
            include:{
                buyer:true,
                seller:{
                    select:{
                        firstname: true,
                        lastname: true,
                        email: true,
                    }
                }
                
            },
            orderBy:{
                createdAt: 'desc' // Sort by createdAt in descending order
            },
            take: pageSize + 1,
            cursor: cursor ? {id: cursor} : undefined,
        })

        if(!bikeRequestData) {
            return Response.json({ error: "Not Found" }, { status: 404 });
        }

     

        const nextCursor = bikeRequestData.length > pageSize ? bikeRequestData[pageSize].id : null;

        const data= {
            bikeRequests: bikeRequestData.slice(0,pageSize),
            nextCursor,
        }
        
        return Response.json(data, { status: 200 });
    
}