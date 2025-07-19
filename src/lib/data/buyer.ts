'use server'

import { cache } from "react";
import { validateAuthRequest } from "../auth";
import { prisma } from "../prisma";


 export const getBuyerUser = cache(async () => {
      const user = await validateAuthRequest()
            if (!user) {
                throw new Error("Unauthorized")
            }
     
    return await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    });
  });

 export const getLoggedInUser = cache(async () => {
      const user = await validateAuthRequest()
      if (!user) {
          throw new Error("Unauthorized")
      }

      return prisma.user.findUnique({
          where: { clerkId: user.id },
          select: { companyId: true }
      })
      
  })

 export const getCompanySellers = cache(async (companyId: string) => {
      const user = await validateAuthRequest()
      if (!user) {
          throw new Error("Unauthorized")
      }

      return prisma.user.findMany({
          where: {
              companyId,
              role: "SELLER"
          },
          select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              company: true,
          }
      })
  })