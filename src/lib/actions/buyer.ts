"use server";

import { validateAuthRequest } from "../auth";
import { prisma } from "../prisma";
import { bikeRequestSchema } from "../validation";

interface CreateBikeRequestData {
  sellerId: string; // This should be the database ID, not clerkId
  bikeModel: string;
  reason: string;
  url: string;
}

export async function createBikeRequest(data: CreateBikeRequestData) {
  try {
    const user = await validateAuthRequest();
    const parsedData = bikeRequestSchema.parse(data)

    // Get the authenticated user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: {
        id: true,
        role: true,
        companyId: true,
      },
    });

    if (!dbUser) {
      throw new Error("User not found in database");
    }

    if (dbUser.role !== "BUYER") {
      throw new Error("Only buyers can submit bike requests");
    }

    // Validate that the seller exists and is actually a seller
    const seller = await prisma.user.findUnique({
      where: { 
        id: parsedData.sellerId,
      },
      select: {
        id: true,
        role: true,
        companyId: true,
      },
    });

    if (!seller) {
      throw new Error("Seller not found in database");
    }

    if (seller.role !== "SELLER") {
      throw new Error("Selected user is not a seller");
    }

    if (seller.companyId !== dbUser.companyId) {
      throw new Error("You can only submit requests to sellers in your company");
    }

    // Create the bike request
    const bikeRequest = await prisma.bikeRequest.create({
      data: {
        bikeModel: parsedData.bikeModel,
        reason: parsedData.reason,
        url: parsedData.url || "",
        buyerId: dbUser.id,
        sellerId: parsedData.sellerId,
      },
    });

    return {
      success: true,
      bikeRequest: bikeRequest,
    };
  } catch (error) {
    console.error("Error creating bike request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create bike request",
    };
  }
}
