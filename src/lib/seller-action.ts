"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "./prisma"





export async function generateInvitationCode() {
  try {
 const {userId} = await auth()


if (!userId) {
  throw new Error("Unauthorized: User not authenticated")
}

const user = await prisma.user.findUnique({
  where:{
    clerkId: userId
  },
  select:{
    role: true,
    companyId: true,
    id: true,

  }
})



if(!user || user.role !== 'SELLER'  ) {
  throw new Error("Unauthorized: User does not have permission to generate codes")
}

   let code = generateRandomCode()
   let existingCode = await prisma.code.findUnique({
    where:{
      code: code
    }
   })

   while (existingCode) {
    code = generateRandomCode()
    existingCode = await prisma.code.findUnique({
      where: {
        code: code
      }
    })

   } // Ensure unique code

   const newCode = await prisma.code.create({
     data: {
       code: code,
       companyId:user.companyId,
       used: false,
       
       
      
     
     }
   })
  


return newCode
  } catch (error) {
    console.error("Error generating invitation code:", error)
    throw new Error("Failed to generate invitation code")
  }
}


export async function deleteInvitationCode(codeId: string) {
  try {
    const user = await auth()
    if (!user || !user.userId) { 
     throw new Error("Unauthorized: User not authenticated")
    }

const dbUser = await prisma.user.findUnique({
  where: { clerkId: user.userId },
  select: { role: true },
});

if (!dbUser || dbUser.role !== 'SELLER') {
  throw new Error("Unauthorized: Only SELLERS can delete codes");
}


 
  
 const deletedCode = await prisma.code.delete({
  where:{id: codeId},
  
})

if (!deletedCode) {
  throw new Error("Code not found or already deleted")
}

console.log("Deleted code:", deletedCode)
return deletedCode
    
    

    
  } catch (error) {
    console.error("Error deleting invitation code:", error)

  }
}


// Helper function to generate random 6-digit code
 const generateRandomCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random 6-digit code
    };