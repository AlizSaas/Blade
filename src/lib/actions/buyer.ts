"use server";

import { validateAuthRequest } from "../auth";
import { prisma } from "../prisma";

interface CreateBikeRequestData {
  sellerId: string; // This should be the database ID, not clerkId
  bikeModel: string;
  reason: string;
  url: string;
}

export async function createBikeRequest(data: CreateBikeRequestData) {
  try {
    const user = await validateAuthRequest();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the authenticated user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      throw new Error("User not found in database");
    }

    // Validate that the seller exists and is actually a seller
    const seller = await prisma.user.findUnique({
      where: { 
        id: data.sellerId, // Use database ID, not clerkId
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!seller) {
      throw new Error("Seller not found in database");
    }

    if (seller.role !== "SELLER") {
      throw new Error("Selected user is not a seller");
    }

    // Create the bike request
    const bikeRequest = await prisma.bikeRequest.create({
      data: {
        bikeModel: data.bikeModel,
        reason: data.reason,
        url: data.url,
        buyerId: dbUser.id,
        sellerId: data.sellerId, // This is now the correct database ID
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
