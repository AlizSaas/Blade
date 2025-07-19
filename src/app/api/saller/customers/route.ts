import {prisma} from '@/lib/prisma'
import {validateAuthRequest} from '@/lib/auth'
import { NextRequest } from 'next/server';
import { UsersResponse } from '@/lib/types';

export async function GET(req:NextRequest) {

     const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

          const pageSize = 3

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
             
            }
        })

        if(!user || !user.companyId) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }
    const users = await prisma.user.findMany({
        where:{
            companyId:user.companyId,
            role:'BUYER', // Only fetch buyers
        },
        orderBy:{
            lastname: 'asc' // Sort by last name in ascending order
        },
        take:pageSize + 1,
        cursor: cursor ? {id: cursor} : undefined,
    })
if(!users) {
    return Response.json({ error: "Not Found" }, { status: 404 });
}

const nextCursor = users.length > pageSize ? users[pageSize].id : null;
const data:UsersResponse = {
    users: users.slice(0, pageSize),
    nextCursor,
}

return Response.json(data, { status: 200 });




}