import {  currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { prisma } from "./prisma";






export const validateAuthRequest = cache(async () => {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
});

export class SubscriptionRequiredError extends Error {
  constructor() {
    super("Upgrade your plan to use the AI assistant");
    this.name = "SubscriptionRequiredError";
  }
}

export const getSellerUserContext = cache(async () => {
  const user = await validateAuthRequest();

  const sellerUser = await prisma.user.findUnique({
    where: {
      clerkId: user.id,
      role: "SELLER",
      companyId: user.publicMetadata.companyId!,
    },
    // Needed to gate on plan below. If you don't already select this
    // elsewhere, add it here rather than doing a second query.
    include: { subscription: true },
  });

  if (!sellerUser) {
    throw new Error("Unauthorized: User not found or not a seller");
  }

  // Same rule the OpenAI chatbot route already enforces
  // (`user.subscription?.plan === 'FREE'`) - kept here so both assistants
  // share one source of truth instead of drifting apart.
  if (sellerUser.subscription?.plan === "FREE") {
    throw new SubscriptionRequiredError();
  }

  return sellerUser;
});