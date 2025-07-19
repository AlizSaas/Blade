import {prisma} from '@/lib/prisma'
import {validateAuthRequest} from '@/lib/auth'
import { NextRequest } from 'next/server';
import { CodesResponse } from '@/lib/types';


export async function GET(req:NextRequest) {

    try {
          const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

          const pageSize = 5

        const loggedInUser = await validateAuthRequest()
        
       
   

        if( !loggedInUser ) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where:{
                clerkId: loggedInUser.id,
                
               
                
            },
            select:{
                companyId:true,
                role:true,

            }
        })

        if(!user ) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const codes = await prisma.code.findMany({
            where:{
                companyId: user.companyId
            },
            orderBy:{
                createdAt: 'desc' // Sort by most recent first
            },
            take:pageSize + 1,
            cursor: cursor ? {id: cursor} : undefined,
        })

        const nextCursor = codes.length > pageSize ? codes[pageSize].id : null;


        const data:CodesResponse = {
            codes: codes.slice(0, pageSize),
            nextCursor,
        };
        return Response.json(data, { status: 200 });
    } catch (error) {
           console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
    }
    
}