import {prisma} from '@/lib/prisma'
import {validateAuthRequest} from '@/lib/auth'
import { NextRequest } from 'next/server';


export async function GET(req:NextRequest) {
      const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

        const pageSize = 5

        const loggedInUser = await validateAuthRequest()

          if( !loggedInUser ) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const bikeRequestedByBuyers = await prisma.bikeRequest.findMany({
            where:{
                seller:{
                    clerkId: loggedInUser.id, // The clerkId of the logged-in user
                }
            },
            include:{
                buyer:true, // Include buyer details
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

if(!bikeRequestedByBuyers) {
    return Response.json({ error: "No bike requests found" }, { status: 404 });
}

    const nextCursor = bikeRequestedByBuyers.length > pageSize ? bikeRequestedByBuyers[pageSize].id : null;
    const data = {
        bikeRequests: bikeRequestedByBuyers.slice(0, pageSize),
        nextCursor,
    };
    return Response.json(data, { status: 200 });
}

