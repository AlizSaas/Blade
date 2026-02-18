import { validateAuthRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const fileRouter = {
  bikeRequestImage: f({
    image: { 
      maxFileSize: "4MB", 
      
    },
  })
    .middleware(async ({ req }) => {
      try {
        // Validate user authentication
        const user = await validateAuthRequest();
        
        if (!user) {
          throw new UploadThingError("Unauthorized");
        }

        // Get user from database
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: user.id },
          select: { id: true, role: true }
        });

        if (!dbUser) {
          throw new UploadThingError("User not found");
        }

        // Return metadata - ensure all values are serializable
        return { 
          userId: dbUser.id,
          userRole: dbUser.role,
        };
      } catch (error) {
        console.error("Middleware error:", error);
        throw new UploadThingError("Authentication failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // THIS IS CRITICAL: The return value must be a simple object
      // that can be JSON serialized without issues
      
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.ufsUrl);
      console.log("File key:", file.key);
 
      
      // Optional: Save file info to database
      try {
        await prisma.bikeRequest.update({
          where: { id: metadata.userId },
          data: {
           url: file.ufsUrl, // Use the file URL directly
          }
        });
      } catch (dbError) {
        console.error("Database save error:", dbError);
        // Continue execution even if DB save fails
      }
      
      // Return simple, serializable object
      // This is what will be available in onClientUploadComplete
      return { 
        url: file.ufsUrl,
        key: file.key,
        
      };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;