'use server';

import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "../prisma";





export async function createSeller(companyName:string, companyWebsite:string | undefined, companyLogo:string  | undefined, clerkId:string) {


    try {
           const user = await (await clerkClient()).users.getUser(clerkId) // get user by clerkId

           if(!user || !user.firstName) {
            throw new Error("User not found or first name is missing");
           }

           const company = await prisma.company.create({
            data:{
                name: companyName,
                website: companyWebsite,
                logo: companyLogo,

            }
           })
           
        await (await clerkClient()).users.updateUserMetadata(user.id, {
            publicMetadata: {
                onboardingCompleted: true,
                role: 'SELLER',
                companyId: company.id,

               
               
            }
        }) // update user metadata with onboardingCompleted and role

        await prisma.user.create({
            data:{
                clerkId: user.id,
                firstname: user.firstName,
                lastname: user.lastName,
                email: user.emailAddresses[0]?.emailAddress,
                role: 'SELLER',
                companyId: company.id,
                createdAt: new Date(), // set createdAt to current date
                updatedAt: new Date(), // set updatedAt to current date
                subscription:{
                    create:{}
                }
                
               
            }
        })

       

        // create a new seller in the database
    
        // redirect to seller dashboard after successful creation
     return {
        success: true,
     }

       


    } catch (error) {
        
        console.error("Error creating seller:", error);
    
        return { 
            error: "Failed to create seller. Please try again later."
        }
}
}


export async function createBuyer(clerkId:string, invitationCode:string) {




    try {
         const clerk = await clerkClient(); // initialize Clerk client
        const user = await clerk.users.getUser(clerkId); // get user by clerkId
        if(!user || !user.firstName || !user.lastName) {
            throw new Error("User not found")
        }

        const code = await prisma.code.findFirst({
            where:{
                code: invitationCode,
                used: false,
            }
        })
           if(!code) {
            throw new Error("Invalid invitation code")
        }

             await (await clerkClient()).users.updateUserMetadata(user.id, {
            publicMetadata: {
                onboardingCompleted: true,
                role: 'BUYER',
                companyId: code.companyId,
                


            }

        })

        if(!code.companyId) {
            throw new Error("Company ID not found in invitation code")
        }


        await prisma.user.create({
            data:{
                clerkId:user.id,
                firstname: user.firstName,
                lastname: user.lastName,
                email: user.emailAddresses[0]?.emailAddress,
                role:'BUYER',
                companyId: code.companyId,
                createdAt: new Date(), // set createdAt to current date
                updatedAt: new Date(), // set updatedAt to current date

            }
        })

        await prisma.code.update({
            where:{
                id:code.id,
                
            },
            data:{
                used: true, // mark code as used
            }
        })

       

     return {
        success: true,
     } // redirect to buyer dashboard after successful creation
    } catch (error) {
         console.error(error)
      

        return {
         
            error: "Failed to create buyer. Please try again later."
        };
    }
}
